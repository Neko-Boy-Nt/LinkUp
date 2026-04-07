import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

// Notifications désactivées pour Expo Go SDK 53+
const isExpoGo = true;

export interface NotificationSettings {
  newMessages: boolean;
  newFollowers: boolean;
  postLikes: boolean;
  postComments: boolean;
  mentions: boolean;
  events: boolean;
  jobOffers: boolean;
}

type NotificationsContextType = {
  expoPushToken: string | null;
  notification: any | null;
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  requestPermissions: () => Promise<boolean>;
  hasPermission: boolean;
  scheduleLocalNotification: (title: string, body: string, data?: any) => Promise<string>;
  cancelAllNotifications: () => Promise<void>;
};

const defaultSettings: NotificationSettings = {
  newMessages: true,
  newFollowers: true,
  postLikes: false,
  postComments: true,
  mentions: true,
  events: true,
  jobOffers: true,
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expoPushToken] = useState<string | null>(null);
  const [notification] = useState<any>(null);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [hasPermission] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const loadSettings = async () => {
      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setSettings({
          newMessages: data.new_messages,
          newFollowers: data.new_followers,
          postLikes: data.post_likes,
          postComments: data.post_comments,
          mentions: data.mentions,
          events: data.events,
          jobOffers: data.job_offers,
        });
      }
    };
    
    loadSettings();
  }, [user]);

  useEffect(() => {
    if (isExpoGo) {
      console.log('📱 Expo Go - Notifications désactivées');
    }
  }, [user]);

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return;
    
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    await supabase.from('notification_settings').upsert({
      user_id: user.id,
      new_messages: updated.newMessages,
      new_followers: updated.newFollowers,
      post_likes: updated.postLikes,
      post_comments: updated.postComments,
      mentions: updated.mentions,
      events: updated.events,
      job_offers: updated.jobOffers,
    });
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (isExpoGo) {
      console.log('Notifications non disponibles dans Expo Go');
      return false;
    }
    return false;
  };

  const scheduleLocalNotification = async (): Promise<string> => {
    console.log('Notifications non disponibles dans Expo Go');
    return '';
  };

  const cancelAllNotifications = async () => {
    // No-op pour Expo Go
  };

  return (
    <NotificationsContext.Provider
      value={{
        expoPushToken,
        notification,
        settings,
        updateSettings,
        requestPermissions,
        hasPermission,
        scheduleLocalNotification,
        cancelAllNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
