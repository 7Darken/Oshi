/**
 * Hook personnalisé pour gérer l'authentification
 * Utilise le store Zustand pour gérer l'état utilisateur
 */

import { useEffect, useState, useCallback } from 'react';
import {
  signUp,
  signIn,
  signOut,
  getCurrentSession,
  getCurrentUser,
  resetPassword,
  deleteAccount,
  AuthResponse,
  SignUpCredentials,
  SignInCredentials,
  supabase,
} from '@/services/supabase';
import { signInWithGoogle as signInWithGoogleService } from '@/services/googleAuth';

export interface AuthState {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthStore extends AuthState {
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any | null; profileData?: any }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * Hook pour gérer l'authentification
 * @returns Objet avec les états et méthodes d'authentification
 */
export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const currentSession = await getCurrentSession();
      const currentUser = await getCurrentUser();

      setSession(currentSession);
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
    } catch (error) {
      console.error('❌ [Auth] Erreur lors de la vérification de la session:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Vérifier la session au chargement
  useEffect(() => {
    checkSession();

    // Écouter les changements d'authentification en temps réel
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [Auth] Événement de changement:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Mettre à jour l'état avec la nouvelle session
        setSession(session);
        setUser(session?.user || null);
        setIsAuthenticated(!!session?.user);
        console.log('✅ [Auth] Session restaurée/mise à jour:', session?.user?.email);
      } else if (event === 'SIGNED_OUT') {
        // Nettoyer l'état
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        console.log('👋 [Auth] Utilisateur déconnecté');
      }
    });

    // Nettoyer l'abonnement au démontage
    return () => {
      subscription.unsubscribe();
    };
  }, [checkSession]);

  const handleSignUp = useCallback(async (credentials: SignUpCredentials) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await signUp(credentials);
      setUser(response.user);
      setSession(response.session);
      setIsAuthenticated(!!response.user);

      if (response.error) {
        throw response.error;
      }
    } catch (error) {
      console.error('❌ [Auth] Erreur lors de l\'inscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignIn = useCallback(async (credentials: SignInCredentials) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await signIn(credentials);
      setUser(response.user);
      setSession(response.session);
      setIsAuthenticated(!!response.user);

      if (response.error) {
        throw response.error;
      }
    } catch (error) {
      console.error('❌ [Auth] Erreur lors de la connexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await signOut();
      
      if (error) {
        throw error;
      }

      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('❌ [Auth] Erreur lors de la déconnexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await resetPassword(email);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('❌ [Auth] Erreur lors de la réinitialisation:', error);
      throw error;
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    try {
      const { error } = await deleteAccount();
      if (error) {
        throw error;
      }
      // Nettoyer l'état local après suppression réussie
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('❌ [Auth] Erreur lors de la suppression:', error);
      throw error;
    }
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogleService();
      
      if (result.error) {
        throw result.error;
      }

      if (result.user && result.session) {
        // Mettre à jour l'état local
        setSession(result.session);
        setUser(result.user);
        setIsAuthenticated(true);
        console.log('✅ [Auth] Connexion Google réussie');
        
        return {
          error: null,
          user: result.user,
          session: result.session,
          profileData: result.profileData,
        };
      }

      throw new Error('Authentification Google échouée');
    } catch (error: any) {
      console.error('❌ [Auth] Erreur lors de la connexion Google:', error);
      return {
        error: error.message || error,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signInWithGoogle: handleSignInWithGoogle,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    deleteAccount: handleDeleteAccount,
    refreshSession,
  };
}

