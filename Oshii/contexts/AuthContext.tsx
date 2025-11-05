/**
 * Contexte d'authentification global
 * Fournit l'état utilisateur et les méthodes d'authentification dans toute l'app
 */

import { useAuth as useAuthHook } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthHook();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Extraire le token et le nom d'utilisateur
  const token = auth.session?.access_token || null;
  const userName = auth.user?.email || auth.user?.user_metadata?.name || profile?.username || null;
console.log(isPremium)
  // Fonction pour récupérer le profil utilisateur depuis Supabase
  const fetchProfile = useCallback(async () => {
    if (!auth.user?.id) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, onboarding_completed, profile_type, is_premium, premium_since, premium_expiry, subscription_name, free_generations_remaining')
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
          profile_type: data.profile_type || null,
          is_premium: data.is_premium ?? false,
          premium_since: data.premium_since || null,
          premium_expiry: data.premium_expiry || null,
          subscription_name: data.subscription_name || null,
          free_generations_remaining: data.free_generations_remaining ?? 2,
        });
      } else {
        // Profil n'existe pas encore
        setProfile({
          username: null,
          avatar_url: null,
          onboarding_completed: false,
          profile_type: null,
          is_premium: false,
          premium_since: null,
          premium_expiry: null,
          subscription_name: null,
          free_generations_remaining: 2,
        });
      }
    } catch (err) {
      console.error('❌ [AuthContext] Erreur lors de la récupération du profil:', err);
      setProfile(null);
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

  // Fonction optimisée pour récupérer uniquement free_generations_remaining (pour les non-premium)
  const refreshFreeGenerations = useCallback(async (silent: boolean = true) => {
    if (!auth.user?.id) {
      // Pas d'utilisateur, ne rien faire
      return;
    }

    // Vérifier si l'utilisateur est premium via le profil actuel
    // Si le profil n'est pas encore chargé, on fera la requête quand même (sera filtré côté serveur si premium)
    try {
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
          if (!prev) return prev;
          return {
            ...prev,
            free_generations_remaining: data.free_generations_remaining ?? 2,
          };
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
  }, [auth.user?.id]);

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
  }, [auth.user?.id, profile?.is_premium, profile?.free_generations_remaining, refreshProfile]);

  // Helper pour vérifier facilement si l'utilisateur est premium
  const isPremium = profile?.is_premium ?? false;

  // Helper pour vérifier si l'utilisateur peut générer une recette
  const canGenerateRecipe = isPremium || (profile?.free_generations_remaining ?? 0) > 0;

  const value: AuthContextType = {
    ...auth,
    profile,
    isPremium,
    canGenerateRecipe,
    token,
    userName,
    refreshProfile,
    refreshSession: auth.refreshSession,
    refreshFreeGenerations,
    decrementFreeGenerations,
    deleteAccount: auth.deleteAccount, // Exposer explicitement deleteAccount
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

