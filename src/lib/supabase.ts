import { createClient } from '@supabase/supabase-js';
import { Linking } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Simple in-memory storage for Expo Go compatibility
const memoryStorage = {
  getItem: (key: string) => {
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string) => {
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    return Promise.resolve();
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: memoryStorage,
    autoRefreshToken: true,
    persistSession: false, // Disable session persistence for Expo Go
    detectSessionInUrl: true,
  },
});

// Optionnel : écouteur pour les liens de confirmation email
Linking.addEventListener('url', async (event) => {
  if (event.url.includes('access_token') || event.url.includes('refresh_token')) {
    const { data, error } = await supabase.auth.getSession();
    if (data.session) {
      console.log('✅ Email confirmé avec succès !');
    }
  }
});