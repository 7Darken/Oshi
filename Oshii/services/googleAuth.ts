/**
 * Service d'authentification Google OAuth via Supabase
 * Gère la connexion/inscription avec Google et la récupération des données utilisateur
 */

import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Configurer WebBrowser pour gérer correctement les redirects OAuth
WebBrowser.maybeCompleteAuthSession();

interface OAuthCallbackParams {
  authCode: string | null;
  state: string | null;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

function getRedirectUrl() {
  return Constants.expoConfig?.scheme
    ? `${Constants.expoConfig.scheme}://auth-callback`
    : 'oshii://auth-callback';
}

function extractStateParameter(url: string | null): string | null {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url);
    const stateFromQuery = parsed.searchParams.get('state');
    if (stateFromQuery) {
      return stateFromQuery;
    }
    if (parsed.hash) {
      const hashParams = new URLSearchParams(parsed.hash.substring(1));
      return hashParams.get('state');
    }
  } catch (error) {
    console.warn('⚠️ [Google Auth] Impossible d\'extraire le paramètre state:', error);
  }
  return null;
}

function parseOAuthCallback(callbackUrl: string): OAuthCallbackParams {
  try {
    const parsed = new URL(callbackUrl);
    const hashParams = parsed.hash ? new URLSearchParams(parsed.hash.substring(1)) : null;
    const getParam = (key: string) =>
      parsed.searchParams.get(key) ?? hashParams?.get(key) ?? null;

    const error = getParam('error_description') ?? getParam('error');

    return {
      authCode: getParam('code'),
      state: getParam('state'),
      error,
      accessToken: getParam('access_token'),
      refreshToken: getParam('refresh_token'),
    };
  } catch (error) {
    console.error('❌ [Google Auth] Erreur lors du parsing de l\'URL de callback:', error);
    return {
      authCode: null,
      state: null,
      error: 'invalid_callback_url',
      accessToken: null,
      refreshToken: null,
    };
  }
}

/**
 * Interface pour la réponse de l'authentification Google
 */
export interface GoogleAuthResponse {
  user: any | null;
  session: any | null;
  error: any | null;
  profileData?: {
    name: string | null;
    avatarUrl: string | null;
    email: string | null;
  };
}

/**
 * Authentification avec Google OAuth
 * Fonctionne pour sign in et sign up automatiquement
 * 
 * @returns Promise<GoogleAuthResponse> - Utilisateur, session, erreur et données de profil
 */
export async function signInWithGoogle(): Promise<GoogleAuthResponse> {
  console.log('🔐 [Google Auth] Démarrage de l\'authentification Google...');

  try {
    const redirectUrl = getRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('❌ [Google Auth] Erreur lors de l\'initialisation OAuth:', error);
      return {
        user: null,
        session: null,
        error,
      };
    }

    if (!data?.url) {
      console.error('❌ [Google Auth] URL OAuth non reçue');
      return {
        user: null,
        session: null,
        error: { message: 'URL OAuth non disponible' },
      };
    }

    const expectedState = extractStateParameter(data.url);

    console.log('🔗 [Google Auth] Ouverture du navigateur pour l\'authentification...');
    console.log('🔗 [Google Auth] Redirect URL:', redirectUrl);
    console.log('🔗 [Google Auth] OAuth URL:', data.url);

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    console.log('📱 [Google Auth] Résultat du navigateur:', result.type);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      console.log('⚠️ [Google Auth] Authentification annulée par l\'utilisateur');
      return {
        user: null,
        session: null,
        error: { message: 'Authentification annulée' },
      };
    }

    if (result.type !== 'success' || !result.url) {
      console.log('⚠️ [Google Auth] Type de résultat inattendu:', result.type);
      return {
        user: null,
        session: null,
        error: { message: 'Échec de l\'authentification' },
      };
    }

    console.log('✅ [Google Auth] Callback URL reçue:', result.url);

    const callbackParams = parseOAuthCallback(result.url);

    if (callbackParams.error) {
      console.error('❌ [Google Auth] Erreur retournée par Google:', callbackParams.error);
      return {
        user: null,
        session: null,
        error: { message: callbackParams.error },
      };
    }

    if (expectedState && callbackParams.state && expectedState !== callbackParams.state) {
      console.error('❌ [Google Auth] Mismatch du paramètre state (attaque CSRF potentielle)');
      return {
        user: null,
        session: null,
        error: { message: 'state_mismatch' },
      };
    }

    // Préférence pour l'échange de code (PKCE) recommandé par Supabase
    if (callbackParams.authCode) {
      console.log('🔐 [Google Auth] Échange du code d\'autorisation pour une session...');
      const { data: exchangeData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(callbackParams.authCode);

      if (exchangeError) {
        console.error('❌ [Google Auth] Erreur lors de l\'échange du code:', exchangeError);
        return {
          user: null,
          session: null,
          error: exchangeError,
        };
      }

      if (!exchangeData?.session || !exchangeData.session.user) {
        console.error('❌ [Google Auth] Session non disponible après l\'échange du code');
        return {
          user: null,
          session: null,
          error: { message: 'session_not_found' },
        };
      }

      const user = exchangeData.session.user;
      console.log('✅ [Google Auth] Session créée avec succès via PKCE');
      console.log('👤 [Google Auth] Utilisateur:', user.email);

      const profileData = await extractGoogleProfileData(user);
      await updateUserProfile(user, profileData);

      return {
        user,
        session: exchangeData.session,
        error: null,
        profileData,
      };
    }

    // Fallback: si pas de code (ancien comportement), tenter avec les tokens présents
    if (callbackParams.accessToken && callbackParams.refreshToken) {
      console.log('ℹ️ [Google Auth] PKCE non disponible, fallback sur setSession (non recommandé)');
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: callbackParams.accessToken,
        refresh_token: callbackParams.refreshToken,
      });

      if (sessionError) {
        console.error('❌ [Google Auth] Erreur lors de la création de la session (fallback):', sessionError);
        return {
          user: null,
          session: null,
          error: sessionError,
        };
      }

      if (!sessionData.session || !sessionData.user) {
        console.error('❌ [Google Auth] Session ou utilisateur non disponible après setSession (fallback)');
        return {
          user: null,
          session: null,
          error: { message: 'session_not_found' },
        };
      }

      const profileData = await extractGoogleProfileData(sessionData.user);
      await updateUserProfile(sessionData.user, profileData);

      return {
        user: sessionData.user,
        session: sessionData.session,
        error: null,
        profileData,
      };
    }

    console.error('❌ [Google Auth] Aucun code ou token disponible dans le callback');
    return {
      user: null,
      session: null,
      error: { message: 'missing_oauth_code' },
    };
  } catch (error: any) {
    console.error('❌ [Google Auth] Erreur inattendue:', error);
    return {
      user: null,
      session: null,
      error: error.message || error,
    };
  }
}

/**
 * Extraire les données de profil depuis l'utilisateur Google
 * 
 * @param user - Objet utilisateur de Supabase
 * @returns Données de profil (nom, avatar, email)
 */
async function extractGoogleProfileData(user: any): Promise<{
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
}> {
  try {
    // Les données Google sont dans user_metadata ou app_metadata
    const userMetadata = user.user_metadata || {};

    const name = 
      userMetadata.full_name || 
      userMetadata.name ||
      `${userMetadata.first_name || ''} ${userMetadata.last_name || ''}`.trim() ||
      user.email?.split('@')[0] ||
      null;

    const avatarUrl = 
      userMetadata.avatar_url || 
      userMetadata.picture ||
      null;

    const email = user.email || null;

    console.log('📋 [Google Auth] Données de profil extraites:', { name, email, hasAvatar: !!avatarUrl });

    return {
      name,
      avatarUrl,
      email,
    };
  } catch (error) {
    console.error('❌ [Google Auth] Erreur lors de l\'extraction du profil:', error);
    return {
      name: null,
      avatarUrl: null,
      email: null,
    };
  }
}

/**
 * Créer ou mettre à jour le profil utilisateur dans la table profiles
 * 
 * @param user - Objet utilisateur de Supabase
 * @param profileData - Données de profil à enregistrer
 */
async function updateUserProfile(
  user: any,
  profileData: { name: string | null; avatarUrl: string | null; email: string | null }
): Promise<void> {
  try {
    if (!user?.id) {
      console.warn('⚠️ [Google Auth] ID utilisateur manquant pour la mise à jour du profil');
      return;
    }

    // Vérifier si le profil existe déjà
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const profileUpdate: {
      id: string;
      username?: string;
      avatar_url?: string;
      onboarding_completed?: boolean;
    } = {
      id: user.id,
    };

    // Mettre à jour le username si disponible et pas déjà défini
    if (profileData.name && (!existingProfile?.username || existingProfile.username === user.email?.split('@')[0])) {
      profileUpdate.username = profileData.name;
    }

    // Mettre à jour l'avatar uniquement s'il n'existe pas encore (préserver les avatars personnalisés)
    if (profileData.avatarUrl && !existingProfile?.avatar_url) {
      profileUpdate.avatar_url = profileData.avatarUrl;
    }

    // Si nouveau profil, onboarding_completed reste false
    // Si profil existant, conserver la valeur actuelle
    if (!existingProfile) {
      profileUpdate.onboarding_completed = false;
    }

    // Upsert le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileUpdate, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('❌ [Google Auth] Erreur lors de la mise à jour du profil:', profileError);
    } else {
      console.log('✅ [Google Auth] Profil mis à jour avec succès');
    }
  } catch (error) {
    console.error('❌ [Google Auth] Erreur lors de la mise à jour du profil:', error);
  }
}

