import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

interface UsernameValidation {
  isValid: boolean;
  message: string;
  isAvailable?: boolean;
}

export function useUsername() {
  const { user, profile, refreshProfile } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [validation, setValidation] = useState<UsernameValidation | null>(null);

  // Validate username format
  const validateFormat = (username: string): UsernameValidation => {
    if (!username || username.length < 3) {
      return { isValid: false, message: 'Minimum 3 caractères' };
    }
    
    if (username.length > 20) {
      return { isValid: false, message: 'Maximum 20 caractères' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { isValid: false, message: 'Lettres, chiffres et underscores uniquement' };
    }

    if (username.startsWith('_') || username.endsWith('_')) {
      return { isValid: false, message: 'Ne peut pas commencer ou finir par _' };
    }

    return { isValid: true, message: 'Format valide' };
  };

  // Check if username is available
  const checkAvailability = useCallback(async (username: string): Promise<boolean> => {
    if (!username || username.length < 3) return false;

    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user?.id || '') // Exclude current user
        .maybeSingle();

      if (error) throw error;
      
      return !data; // Available if no result
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [user?.id]);

  // Validate and check availability
  const validateUsername = useCallback(async (username: string): Promise<UsernameValidation> => {
    const formatValidation = validateFormat(username);
    
    if (!formatValidation.isValid) {
      setValidation(formatValidation);
      return formatValidation;
    }

    const isAvailable = await checkAvailability(username);
    const result: UsernameValidation = {
      isValid: isAvailable,
      isAvailable,
      message: isAvailable ? 'Pseudo disponible !' : 'Ce pseudo est déjà pris',
    };
    
    setValidation(result);
    return result;
  }, [checkAvailability]);

  // Update username
  const updateUsername = useCallback(async (username: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Non connecté' };

    // Validate first
    const validation = await validateUsername(username);
    if (!validation.isValid) {
      return { success: false, error: validation.message };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase() })
        .eq('id', user.id);

      if (error) {
        if (error.code === '23505') { // Unique violation
          return { success: false, error: 'Ce pseudo est déjà pris' };
        }
        throw error;
      }

      await refreshProfile();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating username:', error);
      return { success: false, error: error.message || 'Erreur lors de la mise à jour' };
    }
  }, [user, validateUsername, refreshProfile]);

  // Suggest usernames based on name
  const suggestUsernames = useCallback((fullName?: string | null): string[] => {
    const suggestions: string[] = [];
    
    if (fullName) {
      const normalized = fullName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      
      suggestions.push(normalized);
      suggestions.push(`${normalized}_${Math.floor(Math.random() * 999)}`);
    }

    if (user?.email) {
      const emailUsername = user.email.split('@')[0];
      suggestions.push(emailUsername);
      suggestions.push(`${emailUsername}_${Math.floor(Math.random() * 999)}`);
    }

    // Random suggestions
    const adjectives = ['super', 'mega', 'hyper', 'ultra', 'hyper', 'cool', 'dark', 'light'];
    const nouns = ['student', 'learner', 'dev', 'coder', 'geek', 'nerd', 'star'];
    
    for (let i = 0; i < 3; i++) {
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      suggestions.push(`${adj}_${noun}_${Math.floor(Math.random() * 999)}`);
    }

    return suggestions.slice(0, 5);
  }, [user?.email, profile?.full_name]);

  return {
    currentUsername: profile?.username,
    isChecking,
    validation,
    validateUsername,
    updateUsername,
    suggestUsernames,
    checkAvailability,
  };
}

// Hook to check if username setup is needed
export function useUsernameSetup() {
  const { profile, loading } = useAuth();
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!loading && profile) {
      // Check if username is the default (email) or missing
      const isDefaultUsername = profile.username?.includes('@');
      const isMissingUsername = !profile.username;
      
      setNeedsSetup(isDefaultUsername || isMissingUsername);
    }
  }, [profile, loading]);

  return {
    needsSetup,
    isLoading: loading,
  };
}
