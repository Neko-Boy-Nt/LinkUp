import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface TypingIndicator {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: number;
}

const TYPING_TIMEOUT = 3000; // 3 seconds
const TYPING_CHANNEL = 'typing-indicators';

export function useTypingIndicator(
  conversationId: string,
  userId: string,
  onTypingChange: (typingUsers: string[]) => void
) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`${TYPING_CHANNEL}:${conversationId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    const typingUsers = new Map<string, number>();

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId: typingUserId, isTyping } = payload.payload as TypingIndicator;

        if (isTyping) {
          typingUsers.set(typingUserId, Date.now());
        } else {
          typingUsers.delete(typingUserId);
        }

        // Clean up old entries
        const now = Date.now();
        typingUsers.forEach((timestamp, uid) => {
          if (now - timestamp > TYPING_TIMEOUT) {
            typingUsers.delete(uid);
          }
        });

        onTypingChange(Array.from(typingUsers.keys()));
      })
      .subscribe();

    // Cleanup old typing indicators periodically
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      
      typingUsers.forEach((timestamp, uid) => {
        if (now - timestamp > TYPING_TIMEOUT) {
          typingUsers.delete(uid);
          changed = true;
        }
      });

      if (changed) {
        onTypingChange(Array.from(typingUsers.keys()));
      }
    }, 1000);

    return () => {
      channel.unsubscribe();
      clearInterval(cleanupInterval);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !conversationId || !userId) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        conversationId,
        isTyping,
        timestamp: Date.now(),
      },
    });

    // Auto-stop typing after timeout
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId,
            conversationId,
            isTyping: false,
            timestamp: Date.now(),
          },
        });
      }, TYPING_TIMEOUT);
    }
  }, [conversationId, userId]);

  return { sendTypingIndicator };
}

// Hook for group typing (multiple users in group chat)
export function useGroupTypingIndicator(
  groupId: string,
  userId: string,
  onTypingChange: (typingUsers: { userId: string; username?: string }[]) => void
) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingUsersRef = useRef<Map<string, { timestamp: number; username?: string }>>(new Map());

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase.channel(`group-typing:${groupId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId: typingUserId, isTyping, username } = payload.payload;

        if (isTyping) {
          typingUsersRef.current.set(typingUserId, { timestamp: Date.now(), username });
        } else {
          typingUsersRef.current.delete(typingUserId);
        }

        updateTypingList();
      })
      .subscribe();

    // Cleanup interval
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      
      typingUsersRef.current.forEach((data, uid) => {
        if (now - data.timestamp > TYPING_TIMEOUT) {
          typingUsersRef.current.delete(uid);
          changed = true;
        }
      });

      if (changed) {
        updateTypingList();
      }
    }, 1000);

    return () => {
      channel.unsubscribe();
      clearInterval(cleanupInterval);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [groupId]);

  const updateTypingList = () => {
    const users = Array.from(typingUsersRef.current.entries()).map(([userId, data]) => ({
      userId,
      username: data.username,
    }));
    onTypingChange(users);
  };

  const sendTypingIndicator = useCallback((isTyping: boolean, username?: string) => {
    if (!channelRef.current || !groupId || !userId) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        isTyping,
        username,
        timestamp: Date.now(),
      },
    });

    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId,
            isTyping: false,
            username,
            timestamp: Date.now(),
          },
        });
      }, TYPING_TIMEOUT);
    }
  }, [groupId, userId]);

  return { sendTypingIndicator };
}
