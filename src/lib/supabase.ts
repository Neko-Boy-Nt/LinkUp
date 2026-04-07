import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Optionnel : écouteur pour les liens de confirmation email
const linkingSubscription = Linking.addEventListener('url', async (event) => {
  if (event.url.includes('access_token') || event.url.includes('refresh_token')) {
    const { data, error } = await supabase.auth.getSession();
    if (data.session) {
      console.log('✅ Email confirmé avec succès !');
    }
  }
});

// Export for cleanup if needed
export const cleanupLinkingSubscription = () => {
  linkingSubscription.remove();
};