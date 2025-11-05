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
import { signInWithApple as signInWithAppleService } from '@/services/appleAuth';

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
  signInWithApple: () => Promise<{ error: any | null; needsOnboarding?: boolean; profileData?: any }>;
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
      console.log('🔍 [Auth] Vérification de la session depuis SecureStore...');
      
      // Récupérer la session depuis Supabase (qui utilise SecureStore via notre custom storage)
      const currentSession = await getCurrentSession();
      
      if (currentSession) {
        console.log('✅ [Auth] Session trouvée dans SecureStore:', {
          userId: currentSession.user?.id,
          email: currentSession.user?.email,
          expiresAt: currentSession.expires_at,
          hasAccessToken: !!currentSession.access_token,
        });
        
        // Vérifier si la session est toujours valide
        const now = Math.floor(Date.now() / 1000);
        if (currentSession.expires_at && currentSession.expires_at < now) {
          console.warn('⚠️ [Auth] Session expirée, tentative de rafraîchissement...');
          // Essayer de rafraîchir la session
          try {
            const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              throw refreshError;
            }
            if (refreshedSession.session) {
              setSession(refreshedSession.session);
              setUser(refreshedSession.session.user || null);
              setIsAuthenticated(!!refreshedSession.session.user);
              console.log('✅ [Auth] Session rafraîchie avec succès');
              return;
            }
          } catch (refreshError) {
            console.error('❌ [Auth] Erreur lors du rafraîchissement:', refreshError);
            // Session invalide, nettoyer
            setSession(null);
            setUser(null);
            setIsAuthenticated(false);
            return;
          }
        }
        
        // Session valide, récupérer l'utilisateur
        const currentUser = await getCurrentUser();
        
        setSession(currentSession);
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);
        
        console.log('✅ [Auth] Session restaurée avec succès');
      } else {
        console.log('ℹ️ [Auth] Aucune session trouvée dans SecureStore');
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ [Auth] Erreur lors de la vérification de la session:', error);
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      // Ne pas arrêter le loading ici car onAuthStateChange le fera
      // setIsLoading(false);
    }
  }, []);

  // Vérifier la session au chargement et écouter les changements
  useEffect(() => {
    let hasReceivedInitialSession = false;
    
    // Timeout de sécurité : arrêter le loading après 3 secondes max si INITIAL_SESSION ne se déclenche pas
    const loadingTimeout = setTimeout(() => {
      if (!hasReceivedInitialSession) {
        console.warn('⚠️ [Auth] INITIAL_SESSION non reçu après 3s, arrêt du loading');
        setIsLoading(false);
      }
    }, 3000);

    // Vérifier la session immédiatement au démarrage
    checkSession();

    // Écouter les changements d'authentification en temps réel
    // IMPORTANT: onAuthStateChange est appelé automatiquement au démarrage avec INITIAL_SESSION
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [Auth] Événement de changement:', event);
      console.log('📦 [Auth] Session reçue:', session ? 'Oui' : 'Non');
      
      // Gérer tous les événements qui indiquent une session active
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        hasReceivedInitialSession = true;
        clearTimeout(loadingTimeout);
        
        // Mettre à jour l'état avec la session restaurée/nouvelle
        if (session) {
          setSession(session);
          setUser(session.user || null);
          setIsAuthenticated(!!session.user);
          console.log('✅ [Auth] Session restaurée/mise à jour:', {
            event,
            userId: session.user?.id,
            email: session.user?.email,
            hasAccessToken: !!session.access_token,
          });
        } else {
          // Pas de session, nettoyer l'état
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
          console.log('⚠️ [Auth] Aucune session trouvée lors de l\'événement:', event);
        }
      } else if (event === 'SIGNED_OUT') {
        hasReceivedInitialSession = true;
        clearTimeout(loadingTimeout);
        
        // Nettoyer l'état
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        console.log('👋 [Auth] Utilisateur déconnecté');
      } else {
        // Pour les autres événements, mettre à jour seulement si session fournie
        if (session) {
          setSession(session);
          setUser(session.user || null);
          setIsAuthenticated(!!session.user);
        }
      }
      
      // Arrêter le loading après le premier événement INITIAL_SESSION
      if (event === 'INITIAL_SESSION') {
        setIsLoading(false);
      }
    });

    // Nettoyer l'abonnement au démontage
    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
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
    } catch (error: any) {
      // Ne pas logger les erreurs d'inscription attendues (email déjà utilisé, etc.)
      const errorMessage = error?.message?.toLowerCase() || '';
      if (!errorMessage.includes('user already registered') && 
          !errorMessage.includes('email already exists') &&
          !errorMessage.includes('already in use') &&
          !errorMessage.includes('invalid email') &&
          !errorMessage.includes('weak password')) {
        console.error('❌ [Auth] Erreur lors de l\'inscription:', error);
      }
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
    } catch (error: any) {
      // Ne pas logger les erreurs d'authentification attendues (identifiants incorrects)
      const errorMessage = error?.message?.toLowerCase() || '';
      if (!errorMessage.includes('invalid login credentials') && 
          !errorMessage.includes('invalid_credentials') &&
          !errorMessage.includes('email not confirmed')) {
        console.error('❌ [Auth] Erreur lors de la connexion:', error);
      }
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

  const handleSignInWithApple = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await signInWithAppleService();
      
      // Si l'utilisateur a annulé
      if (result.error === 'CANCELED') {
        return {
          error: null, // Ne pas traiter comme une erreur
        };
      }

      if (result.error) {
        throw new Error(typeof result.error === 'string' ? result.error : result.error.message || 'Erreur inconnue');
      }

      if (result.user && result.session) {
        // Mettre à jour l'état local
        setSession(result.session);
        setUser(result.user);
        setIsAuthenticated(true);
        console.log('✅ [Auth] Connexion Apple réussie');
        
        return {
          error: null,
          user: result.user,
          session: result.session,
          needsOnboarding: result.needsOnboarding,
          profileData: result.profileData,
        };
      }

      throw new Error('Authentification Apple échouée');
    } catch (error: any) {
      console.error('❌ [Auth] Erreur lors de la connexion Apple:', error);
      return {
        error: error.message || error,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 [Auth] Rafraîchissement de la session...');
      // Utiliser Supabase pour rafraîchir la session
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ [Auth] Erreur lors du rafraîchissement:', error);
        throw error;
      }
      
      if (session) {
        setSession(session);
        setUser(session.user);
        setIsAuthenticated(!!session.user);
        console.log('✅ [Auth] Session rafraîchie avec succès');
      } else {
        console.warn('⚠️ [Auth] Aucune session après rafraîchissement');
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ [Auth] Erreur lors du rafraîchissement de la session:', error);
      // En cas d'erreur, essayer de récupérer la session actuelle
      await checkSession();
    }
  }, [checkSession]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithApple: handleSignInWithApple,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    deleteAccount: handleDeleteAccount,
    refreshSession,
  };
}

