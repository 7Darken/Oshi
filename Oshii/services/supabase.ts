/**
 * Service Supabase pour l'authentification
 * Connexion sécurisée et simple à Supabase Auth avec stockage sécurisé
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Récupération des variables d'environnement depuis expo-constants
const { SUPABASE_URL, SUPABASE_ANON_KEY } = Constants.expoConfig?.extra || {};

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables Supabase manquantes dans le .env');
  throw new Error('SUPABASE_URL et SUPABASE_ANON_KEY doivent être définies');
}

// Créer le client Supabase avec stockage sécurisé
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key: string) => {
        console.log('🔐 [Auth] Récupération depuis le stockage sécurisé:', key);
        return SecureStore.getItemAsync(key);
      },
      setItem: (key: string, value: string) => {
        console.log('🔐 [Auth] Sauvegarde dans le stockage sécurisé:', key);
        return SecureStore.setItemAsync(key, value);
      },
      removeItem: (key: string) => {
        console.log('🔐 [Auth] Suppression du stockage sécurisé:', key);
        return SecureStore.deleteItemAsync(key);
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types pour l'authentification
export interface AuthResponse {
  user: any | null;
  session: any | null;
  error: any | null;
}

export interface SignUpCredentials {
  email: string;
  password: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Inscrire un nouvel utilisateur avec email et mot de passe
 * @param credentials - Email et mot de passe
 * @returns Promise<AuthResponse> - Utilisateur, session et erreurs
 */
export async function signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
  console.log('🔐 [Auth] Inscription en cours...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('❌ [Auth] Erreur lors de l\'inscription:', error.message);
      return { user: null, session: null, error };
    }

    console.log('✅ [Auth] Inscription réussie:', data.user?.email);
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('❌ [Auth] Erreur inattendue:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Connecter un utilisateur avec email et mot de passe
 * @param credentials - Email et mot de passe
 * @returns Promise<AuthResponse> - Utilisateur, session et erreurs
 */
export async function signIn(credentials: SignInCredentials): Promise<AuthResponse> {
  console.log('🔐 [Auth] Connexion en cours...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('❌ [Auth] Erreur lors de la connexion:', error.message);
      return { user: null, session: null, error };
    }

    console.log('✅ [Auth] Connexion réussie:', data.user?.email);
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('❌ [Auth] Erreur inattendue:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Déconnecter l'utilisateur actuel
 * @returns Promise<{ error: any | null }> - Erreurs éventuelles
 */
export async function signOut(): Promise<{ error: any | null }> {
  console.log('🔐 [Auth] Déconnexion en cours...');
  
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ [Auth] Erreur lors de la déconnexion:', error.message);
      return { error };
    }

    console.log('✅ [Auth] Déconnexion réussie');
    return { error: null };
  } catch (error) {
    console.error('❌ [Auth] Erreur inattendue:', error);
    return { error };
  }
}

/**
 * Récupérer la session actuelle
 * @returns Promise<any> - Session actuelle ou null
 */
export async function getCurrentSession(): Promise<any> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('❌ [Auth] Erreur lors de la récupération de la session:', error);
    return null;
  }
}

/**
 * Récupérer l'utilisateur actuel
 * @returns Promise<any> - Utilisateur actuel ou null
 */
export async function getCurrentUser(): Promise<any> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('❌ [Auth] Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

/**
 * Envoyer un email de réinitialisation de mot de passe
 * @param email - Email de l'utilisateur
 * @returns Promise<{ error: any | null }> - Erreurs éventuelles
 */
export async function resetPassword(email: string): Promise<{ error: any | null }> {
  console.log('🔐 [Auth] Envoi de l\'email de réinitialisation...');
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'oshii://reset-password',
    });

    if (error) {
      console.error('❌ [Auth] Erreur lors de l\'envoi de l\'email:', error.message);
      return { error };
    }

    console.log('✅ [Auth] Email de réinitialisation envoyé');
    return { error: null };
  } catch (error) {
    console.error('❌ [Auth] Erreur inattendue:', error);
    return { error };
  }
}

/**
 * Réinitialiser la session après authentification OAuth
 * Utile pour mettre à jour l'état après Google/Apple sign in
 * @returns Promise<{ user: any | null; session: any | null; error: any | null }>
 */
export async function refreshAuthSession(): Promise<{ user: any | null; session: any | null; error: any | null }> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return { user: null, session: null, error };
    }

    if (session) {
      const { data: { user } } = await supabase.auth.getUser();
      return { user, session, error: null };
    }

    return { user: null, session: null, error: null };
  } catch (error: any) {
    return { user: null, session: null, error };
  }
}

/**
 * Supprimer le compte utilisateur via le backend
 * @returns Promise<{ error: any | null }> - Erreurs éventuelles
 */
export async function deleteAccount(): Promise<{ error: any | null }> {
  console.log('🔐 [Auth] Suppression du compte en cours...');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Aucune session active');
    }

    // Appeler le backend pour supprimer le compte
    const { BACKEND_URL } = Constants.expoConfig?.extra || {};
    if (!BACKEND_URL) {
      throw new Error('BACKEND_URL non configuré');
    }

    // Nettoyer l'URL en enlevant les trailing slashes
    const cleanBackendUrl = BACKEND_URL.replace(/\/+$/, '');

    const response = await fetch(`${cleanBackendUrl}/account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur lors de la suppression du compte');
    }

    // Déconnexion locale après suppression réussie
    await supabase.auth.signOut();

    console.log('✅ [Auth] Compte supprimé avec succès');
    return { error: null };
  } catch (error: any) {
    console.error('❌ [Auth] Erreur lors de la suppression:', error);
    return { error: error.message || error };
  }
}

