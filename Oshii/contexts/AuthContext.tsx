/**
 * Contexte d'authentification global
 * Fournit l'état utilisateur et les méthodes d'authentification dans toute l'app
 */

import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useAuth as useAuthHook } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';

export interface UserProfile {
  username: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
}

interface AuthContextType {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  signUp: (credentials: { email: string; password: string }) => Promise<void>;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any | null; user?: any; session?: any; profileData?: any }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  token: string | null;
  userName: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthHook();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Extraire le token et le nom d'utilisateur
  const token = auth.session?.access_token || null;
  const userName = auth.user?.email || auth.user?.user_metadata?.name || profile?.username || null;

  // Fonction pour récupérer le profil utilisateur depuis Supabase
  const fetchProfile = useCallback(async () => {
    if (!auth.user?.id) {
      setProfile(null);
      return;
    }

    setIsProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, onboarding_completed')
        .eq('id', auth.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [AuthContext] Erreur lors de la récupération du profil:', error);
        setProfile(null);
      } else if (data) {
        setProfile({
          username: data.username || null,
          avatar_url: data.avatar_url || null,
          onboarding_completed: data.onboarding_completed ?? false,
        });
      } else {
        // Profil n'existe pas encore
        setProfile({
          username: null,
          avatar_url: null,
          onboarding_completed: false,
        });
      }
    } catch (err) {
      console.error('❌ [AuthContext] Erreur lors de la récupération du profil:', err);
      setProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  }, [auth.user?.id]);

  // Récupérer le profil quand l'utilisateur change
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [auth.isAuthenticated, auth.user?.id, fetchProfile]);

  // Fonction pour rafraîchir le profil manuellement
  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const value: AuthContextType = {
    ...auth,
    profile,
    token,
    userName,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

