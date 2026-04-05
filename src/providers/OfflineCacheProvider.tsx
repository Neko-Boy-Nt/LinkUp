import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';

interface OfflineCacheContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingMessages: PendingMessage[];
  cacheData: <T>(key: string, data: T) => Promise<void>;
  getCachedData: <T>(key: string) => Promise<T | null>;
  queueMessage: (message: Omit<PendingMessage, 'id' | 'timestamp' | 'attempts'>) => Promise<void>;
  removePendingMessage: (id: string) => Promise<void>;
  syncPendingMessages: () => Promise<void>;
  clearCache: () => Promise<void>;
}

interface PendingMessage {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  replyToId?: string;
  timestamp: number;
  attempts: number;
}

const CACHE_PREFIX = 'linkup_cache_';
const MAX_RETRY_ATTEMPTS = 3;

// In-memory storage for Expo Go compatibility (replaces AsyncStorage)
const memoryCache = new Map<string, string>();

const OfflineCacheContext = createContext<OfflineCacheContextType | undefined>(undefined);

export function OfflineCacheProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });

    // Initial check
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingMessages.length > 0) {
      syncPendingMessages();
    }
  }, [isOnline, pendingMessages.length]);

  const cacheData = useCallback(async <T,>(key: string, data: T) => {
    try {
      memoryCache.set(CACHE_PREFIX + key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }, []);

  const getCachedData = useCallback(async <T,>(key: string): Promise<T | null> => {
    try {
      const stored = memoryCache.get(CACHE_PREFIX + key);
      if (stored) {
        const { data } = JSON.parse(stored);
        return data as T;
      }
      return null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }, []);

  const queueMessage = useCallback(async (message: Omit<PendingMessage, 'id' | 'timestamp' | 'attempts'>) => {
    const newMessage: PendingMessage = {
      ...message,
      id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      attempts: 0,
    };

    setPendingMessages(prev => [...prev, newMessage]);
  }, []);

  const removePendingMessage = useCallback(async (id: string) => {
    setPendingMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const syncPendingMessages = useCallback(async () => {
    if (!isOnline || isSyncing || pendingMessages.length === 0) return;

    setIsSyncing(true);

    for (const message of pendingMessages) {
      if (message.attempts >= MAX_RETRY_ATTEMPTS) {
        console.warn(`Message ${message.id} exceeded max retry attempts`);
        continue;
      }

      try {
        const { error } = await supabase.from('messages').insert({
          conversation_id: message.conversationId,
          sender_id: message.senderId,
          content: message.content,
          reply_to_id: message.replyToId,
        });

        if (error) throw error;

        // Remove from queue on success
        await removePendingMessage(message.id);
      } catch (error) {
        console.error(`Failed to sync message ${message.id}:`, error);
        
        // Increment attempts
        setPendingMessages(prev => 
          prev.map(m => 
            m.id === message.id 
              ? { ...m, attempts: m.attempts + 1 }
              : m
          )
        );
      }
    }

    setIsSyncing(false);
  }, [isOnline, isSyncing, pendingMessages]);

  const clearCache = useCallback(async () => {
    try {
      // Clear memory cache
      memoryCache.clear();
      setPendingMessages([]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  return (
    <OfflineCacheContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingMessages,
        cacheData,
        getCachedData,
        queueMessage,
        removePendingMessage,
        syncPendingMessages,
        clearCache,
      }}
    >
      {children}
    </OfflineCacheContext.Provider>
  );
}

export function useOfflineCache() {
  const context = useContext(OfflineCacheContext);
  if (context === undefined) {
    throw new Error('useOfflineCache must be used within an OfflineCacheProvider');
  }
  return context;
}

// Hook for caching specific data types
export function useCachedQuery<T>(key: string, fetcher: () => Promise<T>, staleTime = 5 * 60 * 1000) {
  const { isOnline, cacheData, getCachedData } = useOfflineCache();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get fresh data if online
      if (isOnline) {
        const fresh = await fetcher();
        await cacheData(key, fresh);
        setData(fresh);
      } else {
        // Fallback to cache
        const cached = await getCachedData<T>(key);
        if (cached) {
          setData(cached);
        } else {
          setError(new Error('No cached data available'));
        }
      }
    } catch (err) {
      // On error, try cache
      const cached = await getCachedData<T>(key);
      if (cached) {
        setData(cached);
      } else {
        setError(err as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, isOnline, cacheData, getCachedData]);

  useEffect(() => {
    const load = async () => {
      // First try cache for instant UI
      const cached = await getCachedData<T>(key);
      if (cached) {
        setData(cached);
        setIsLoading(false);
      }

      // Then fetch fresh data
      if (isOnline) {
        refetch();
      }
    };

    load();
  }, [key]);

  return { data, isLoading, error, refetch };
}
