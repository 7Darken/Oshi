/**
 * Contexte d'authentification global
 * Fournit l'état utilisateur et les méthodes d'authentification dans toute l'app
 */

import { useAuth as useAuthHook } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNetworkContext } from './NetworkContext';

export interface UserProfile {
  username: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  profile_type: 'survivaliste' | 'cuisinier' | 'sportif' | null;
  // Infos premium
  is_premium: boolean;
  premium_since: string | null;
  premium_expiry: string | null;
  subscription_name: string | null;
  // Compteur de générations gratuites
  free_generations_remaining: number;
}

interface AuthContextType {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  isPremium: boolean; // Helper pour vérifier facilement le statut premium
  canGenerateRecipe: boolean; // Helper pour vérifier si l'utilisateur peut générer une recette
  isOffline: boolean;
  signUp: (credentials: { email: string; password: string }) => Promise<void>;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any | null; user?: any; session?: any; profileData?: any }>;
  signInWithApple: () => Promise<{ error: any | null; user?: any; session?: any; needsOnboarding?: boolean; profileData?: any }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshFreeGenerations: (silent?: boolean) => Promise<void>;
  decrementFreeGenerations: () => Promise<void>;
  token: string | null;
  userName: string | null;
  safeFetchProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthHook();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { isOffline } = useNetworkContext();
  const profileRef = useRef<UserProfile | null>(null);

  // Extraire le token et le nom d'utilisateur
  const token = auth.session?.access_token || null;
  const userName = auth.user?.email || auth.user?.user_metadata?.name || profile?.username || null;

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);
  // Profil fallback minimal basé sur la session locale
  const buildFallbackProfile = useCallback((): UserProfile | null => {
    if (!auth.user) {
      return null;
    }

    const metadata = auth.user.user_metadata ?? {};
    const email = auth.user.email as string | null;

    return {
      username: metadata.name || email || null,
      avatar_url: metadata.avatar_url ?? null,
      onboarding_completed: metadata.onboarding_completed ?? true,
      profile_type: metadata.profile_type ?? null,
      is_premium: metadata.is_premium ?? false,
      premium_since: metadata.premium_since ?? null,
      premium_expiry: metadata.premium_expiry ?? null,
      subscription_name: metadata.subscription_name ?? null,
      free_generations_remaining: typeof metadata.free_generations_remaining === 'number'
        ? metadata.free_generations_remaining
        : 2,
    };
  }, [auth.user]);

  const safeFetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!auth.user?.id) {
      setProfile(null);
      profileRef.current = null;
      return null;
    }

    if (isOffline) {
      if (profileRef.current) {
        return profileRef.current;
      }

      const fallback = buildFallbackProfile();
      if (fallback) {
        setProfile(fallback);
        profileRef.current = fallback;
      }
      return fallback;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, onboarding_completed, profile_type, is_premium, premium_since, premium_expiry, subscription_name, free_generations_remaining')
        .eq('id', auth.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [AuthContext] Erreur lors de la récupération du profil:', error);
        return profileRef.current ?? buildFallbackProfile();
      }

      let nextProfile: UserProfile;

      if (data) {
        nextProfile = {
          username: data.username || null,
          avatar_url: data.avatar_url || null,
          onboarding_completed: data.onboarding_completed ?? true,
          profile_type: data.profile_type || null,
          is_premium: data.is_premium ?? false,
          premium_since: data.premium_since || null,
          premium_expiry: data.premium_expiry || null,
          subscription_name: data.subscription_name || null,
          free_generations_remaining: data.free_generations_remaining ?? 2,
        };
      } else {
        nextProfile = {
          username: null,
          avatar_url: null,
          onboarding_completed: true,
          profile_type: null,
          is_premium: false,
          premium_since: null,
          premium_expiry: null,
          subscription_name: null,
          free_generations_remaining: 2,
        };
      }

      setProfile(nextProfile);
      profileRef.current = nextProfile;
      return nextProfile;
    } catch (err) {
      console.error('❌ [AuthContext] Erreur lors de la récupération du profil:', err);
      const fallback = profileRef.current ?? buildFallbackProfile();
      if (!profileRef.current && fallback) {
        setProfile(fallback);
        profileRef.current = fallback;
      }
      return fallback;
    }
  }, [auth.user?.id, isOffline, buildFallbackProfile]);

  // Récupérer le profil quand l'utilisateur change
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id) {
      void safeFetchProfile();
    } else {
      setProfile(null);
      profileRef.current = null;
    }
  }, [auth.isAuthenticated, auth.user?.id, safeFetchProfile]);

  // Re-synchroniser lors du retour en ligne
  useEffect(() => {
    if (!isOffline && auth.isAuthenticated && auth.user?.id) {
      void safeFetchProfile();
    }
  }, [isOffline, auth.isAuthenticated, auth.user?.id, safeFetchProfile]);

  // Fonction pour rafraîchir le profil manuellement
  const refreshProfile = useCallback(async () => {
    await safeFetchProfile();
  }, [safeFetchProfile]);

  // Fonction optimisée pour récupérer uniquement free_generations_remaining (pour les non-premium)
  const refreshFreeGenerations = useCallback(async (silent: boolean = true) => {
    if (!auth.user?.id) {
      // Pas d'utilisateur, ne rien faire
      return;
    }

    // Vérifier si l'utilisateur est premium via le profil actuel
    // Si le profil n'est pas encore chargé, on fera la requête quand même (sera filtré côté serveur si premium)
    try {
      if (isOffline) {
        if (!silent) {
          console.warn('⚠️ [AuthContext] Impossible de rafraîchir les crédits gratuits hors ligne.');
        }
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('free_generations_remaining, is_premium')
        .eq('id', auth.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        if (!silent) {
          console.error('❌ [AuthContext] Erreur lors de la récupération de free_generations_remaining:', error);
        }
        return;
      }

      // Si l'utilisateur est premium, ne rien faire
      if (data?.is_premium) {
        return;
      }

      if (data) {
        // Mettre à jour uniquement free_generations_remaining sans recharger tout le profil
        setProfile((prev) => {
          if (!prev) {
            return prev;
          }
          const updated = {
            ...prev,
            free_generations_remaining: data.free_generations_remaining ?? 2,
          };
          profileRef.current = updated;
          return updated;
        });
        
        if (!silent) {
          console.log('✅ [AuthContext] free_generations_remaining mis à jour:', data.free_generations_remaining);
        }
      }
    } catch (err) {
      if (!silent) {
        console.error('❌ [AuthContext] Erreur lors de la récupération de free_generations_remaining:', err);
      }
    }
  }, [auth.user?.id, isOffline]);

  // Fonction pour décrémenter le compteur de générations gratuites
  const decrementFreeGenerations = useCallback(async () => {
    if (!auth.user?.id) {
      console.error('❌ [AuthContext] Impossible de décrémenter: utilisateur non connecté');
      return;
    }

    // Si l'utilisateur est premium, ne rien faire
    if (profile?.is_premium) {
      console.log('ℹ️ [AuthContext] Utilisateur premium, pas de décrémentation');
      return;
    }

    try {
      if (isOffline) {
        console.warn('⚠️ [AuthContext] Impossible de décrémenter hors ligne.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          free_generations_remaining: Math.max(0, (profile?.free_generations_remaining ?? 0) - 1)
        })
        .eq('id', auth.user.id);

      if (error) {
        console.error('❌ [AuthContext] Erreur lors de la décrémentation:', error);
        throw error;
      }

      console.log('✅ [AuthContext] Génération gratuite décrémentée');
      
      // Rafraîchir le profil pour avoir le nouveau compteur
      await refreshProfile();
    } catch (err) {
      console.error('❌ [AuthContext] Erreur lors de la décrémentation:', err);
      throw err;
    }
  }, [auth.user?.id, profile?.is_premium, profile?.free_generations_remaining, refreshProfile, isOffline]);

  // Helper pour vérifier facilement si l'utilisateur est premium
  const isPremium = profile?.is_premium ?? false;

  // Helper pour vérifier si l'utilisateur peut générer une recette
  const canGenerateRecipe = isPremium || (profile?.free_generations_remaining ?? 0) > 0;

  const value: AuthContextType = {
    ...auth,
    profile,
    isPremium,
    canGenerateRecipe,
    isOffline,
    token,
    userName,
    refreshProfile,
    refreshSession: auth.refreshSession,
    refreshFreeGenerations,
    decrementFreeGenerations,
    deleteAccount: auth.deleteAccount, // Exposer explicitement deleteAccount
    safeFetchProfile,
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

