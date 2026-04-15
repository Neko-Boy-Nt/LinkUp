import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { Profile } from '../types';

type AuthContextType = {
  session: Session | null;
  user: any;
  profile: Profile | null;
  loading: boolean;
  isStudent: boolean | null;
  needsOnboarding: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const isStudent = profile?.is_student ?? null;
  const needsOnboarding = !profile?.has_completed_onboarding || profile?.is_student === null;
  
  // Use ref to avoid stale closure in auth state listener
  const needsOnboardingRef = useRef(needsOnboarding);
  useEffect(() => {
    needsOnboardingRef.current = needsOnboarding;
  }, [needsOnboarding]);

  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Écouter les changements de session (connexion, déconnexion, confirmation email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      setSession(session);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }

      if (session) {
        // Si connecté et qu'on est sur une page auth → rediriger
        if (segments[0] === '(auth)') {
          // Check if onboarding needed
          if (needsOnboarding) {
            router.replace('/onboarding');
          } else {
            router.replace('/(tabs)/home');
          }
        }
      } else {
        // Si déconnecté et qu'on est dans l'app → rediriger vers login
        if (segments[0] === '(tabs)' || segments[0] === 'onboarding') {
          router.replace('/(auth)/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [segments, needsOnboarding]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!session?.user?.id) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id);

    if (!error) {
      await refreshProfile();
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user: session?.user ?? null, 
      profile,
      loading, 
      isStudent,
      needsOnboarding,
      signOut,
      refreshProfile,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};