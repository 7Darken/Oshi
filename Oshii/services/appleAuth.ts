/**
 * Service d'authentification Apple OAuth via Supabase
 * Gère la connexion/inscription avec Apple et la récupération des données utilisateur
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

const OAUTH_ERROR_CANCELLED = 'CANCELED';

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
    console.warn('⚠️ [Apple Auth] Impossible d\'extraire le paramètre state:', error);
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
    console.error('❌ [Apple Auth] Erreur lors du parsing de l\'URL de callback:', error);
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
 * Interface pour la réponse de l'authentification Apple
 */
export interface AppleAuthResponse {
  user: any | null;
  session: any | null;
  error: any | null;
  needsOnboarding?: boolean;
  profileData?: {
    name: string | null;
    email: string | null;
  };
}

/**
 * Authentification avec Apple OAuth via Supabase
 * Utilise le flux OAuth Web qui garantit le bon Service ID
 * 
 * @returns Promise<AppleAuthResponse> - Utilisateur, session, erreur et données de profil
 */
export async function signInWithApple(): Promise<AppleAuthResponse> {
  console.log('🍎 [Apple Auth] Démarrage de l\'authentification Apple OAuth...');

  try {
    const redirectUrl = getRedirectUrl();

    console.log('🔗 [Apple Auth] Redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('❌ [Apple Auth] Erreur lors de l\'initialisation OAuth:', error);
      return {
        user: null,
        session: null,
        error,
      };
    }

    if (!data?.url) {
      console.error('❌ [Apple Auth] URL OAuth non reçue');
      return {
        user: null,
        session: null,
        error: { message: 'URL OAuth non disponible' },
      };
    }

    const expectedState = extractStateParameter(data.url);

    console.log('🔗 [Apple Auth] Ouverture du navigateur pour l\'authentification...');
    console.log('🔗 [Apple Auth] OAuth URL:', data.url);

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    console.log('📱 [Apple Auth] Résultat du navigateur:', result.type);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      console.log('ℹ️ [Apple Auth] Authentification annulée par l\'utilisateur');
      return {
        user: null,
        session: null,
        error: OAUTH_ERROR_CANCELLED,
      };
    }

    if (result.type !== 'success' || !result.url) {
      console.log('⚠️ [Apple Auth] Type de résultat inattendu:', result.type);
      return {
        user: null,
        session: null,
        error: { message: 'Échec de l\'authentification' },
      };
    }

    console.log('✅ [Apple Auth] Callback URL reçue:', result.url);

    const callbackParams = parseOAuthCallback(result.url);

    if (callbackParams.error) {
      console.error('❌ [Apple Auth] Erreur retournée par Apple:', callbackParams.error);
      return {
        user: null,
        session: null,
        error: { message: callbackParams.error },
      };
    }

    if (expectedState && callbackParams.state && expectedState !== callbackParams.state) {
      console.error('❌ [Apple Auth] Mismatch du paramètre state (attaque CSRF potentielle)');
      return {
        user: null,
        session: null,
        error: { message: 'state_mismatch' },
      };
    }

    if (callbackParams.authCode) {
      console.log('🔐 [Apple Auth] Échange du code d\'autorisation pour une session...');
      const { data: exchangeData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(callbackParams.authCode);

      if (exchangeError) {
        console.error('❌ [Apple Auth] Erreur lors de l\'échange du code:', exchangeError);
        return {
          user: null,
          session: null,
          error: exchangeError,
        };
      }

      if (!exchangeData?.session || !exchangeData.session.user) {
        console.error('❌ [Apple Auth] Session non disponible après l\'échange du code');
        return {
          user: null,
          session: null,
          error: { message: 'session_not_found' },
        };
      }

      const user = exchangeData.session.user;
      console.log('✅ [Apple Auth] Session créée avec succès via PKCE');
      console.log('👤 [Apple Auth] Utilisateur:', user.email);
      console.log('🆔 [Apple Auth] User ID:', user.id);

      const appleIdentity = user.identities?.find((id: any) => id.provider === 'apple');
      if (appleIdentity) {
        console.log('🍎 [Apple Auth] Identité Apple trouvée:', {
          provider: appleIdentity.provider,
          provider_id: appleIdentity.id,
          created_at: appleIdentity.created_at,
        });
      }

      const profileData = await extractAppleProfileData(user);
      const needsOnboarding = await updateUserProfile(user, profileData);

      return {
        user,
        session: exchangeData.session,
        error: null,
        needsOnboarding,
        profileData,
      };
    }

    if (callbackParams.accessToken && callbackParams.refreshToken) {
      console.log('ℹ️ [Apple Auth] PKCE non disponible, fallback sur setSession (non recommandé)');
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: callbackParams.accessToken,
        refresh_token: callbackParams.refreshToken,
      });

      if (sessionError) {
        console.error('❌ [Apple Auth] Erreur lors de la création de la session (fallback):', sessionError);
        return {
          user: null,
          session: null,
          error: sessionError,
        };
      }

      if (!sessionData.session || !sessionData.user) {
        console.error('❌ [Apple Auth] Session ou utilisateur non disponible après setSession (fallback)');
        return {
          user: null,
          session: null,
          error: { message: 'session_not_found' },
        };
      }

      const profileData = await extractAppleProfileData(sessionData.user);
      const needsOnboarding = await updateUserProfile(sessionData.user, profileData);

      return {
        user: sessionData.user,
        session: sessionData.session,
        error: null,
        needsOnboarding,
        profileData,
      };
    }

    console.error('❌ [Apple Auth] Aucun code ou token disponible dans le callback');
    return {
      user: null,
      session: null,
      error: { message: 'missing_oauth_code' },
    };
  } catch (error: any) {
    console.error('❌ [Apple Auth] Erreur inattendue:', error);
    return {
      user: null,
      session: null,
      error: error.message || error,
    };
  }
}

/**
 * Extraire les données de profil depuis l'utilisateur Apple
 * 
 * @param user - Objet utilisateur de Supabase
 * @returns Données de profil (nom, email)
 */
async function extractAppleProfileData(user: any): Promise<{
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}> {
  try {
    // Les données Apple sont dans user_metadata
    const userMetadata = user.user_metadata || {};

    const name =
      userMetadata.full_name || 
      userMetadata.name ||
      `${userMetadata.first_name || ''} ${userMetadata.last_name || ''}`.trim() ||
      user.email?.split('@')[0] ||
      null;

    const email = user.email || null;
    const avatarUrl = userMetadata.picture || userMetadata.avatar_url || null;

    console.log('📋 [Apple Auth] Données de profil extraites:', { name, email });

    return {
      name,
      email,
      avatarUrl,
    };
  } catch (error) {
    console.error('❌ [Apple Auth] Erreur lors de l\'extraction du profil:', error);
    return {
      name: null,
      email: null,
      avatarUrl: null,
    };
  }
}

/**
 * Créer ou mettre à jour le profil utilisateur dans la table profiles
 * 
 * @param user - Objet utilisateur de Supabase
 * @param profileData - Données de profil à enregistrer
 * @returns boolean - needsOnboarding (true si nouveau compte)
 */
async function updateUserProfile(
  user: any,
  profileData: { name: string | null; email: string | null; avatarUrl: string | null }
): Promise<boolean> {
  try {
    if (!user?.id) {
      console.warn('⚠️ [Apple Auth] ID utilisateur manquant pour la mise à jour du profil');
      return false;
    }

    // Vérifier si le profil existe déjà
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, onboarding_completed, avatar_url')
      .eq('id', user.id)
      .single();

    const isNewUser = !existingProfile || (fetchError as any)?.code === 'PGRST116';

    const profileUpdate: {
      id: string;
      username?: string;
      onboarding_completed?: boolean;
      profile_type?: null;
      avatar_url?: string;
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

    // Si nouveau profil, définir onboarding_completed à false
    if (isNewUser) {
      profileUpdate.onboarding_completed = false;
      profileUpdate.profile_type = null;
      console.log('🆕 [Apple Auth] Création d\'un nouveau profil');
    }

    // Upsert le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileUpdate, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('❌ [Apple Auth] Erreur lors de la mise à jour du profil:', profileError);
      return false;
    } else {
      console.log('✅ [Apple Auth] Profil mis à jour avec succès');
    }

    // Retourner true si besoin d'onboarding (nouveau compte ou onboarding non complété)
    return isNewUser || !existingProfile?.onboarding_completed;
  } catch (error) {
    console.error('❌ [Apple Auth] Erreur lors de la mise à jour du profil:', error);
    return false;
  }
}

/**
 * Déconnecte l'utilisateur Apple
 * Note: Apple ne fournit pas de méthode de déconnexion native
 */
export async function signOutApple(): Promise<void> {
  try {
    await supabase.auth.signOut();
    console.log('✅ [Apple Auth] Déconnexion réussie');
  } catch (error) {
    console.error('❌ [Apple Auth] Erreur déconnexion:', error);
    throw error;
  }
}
