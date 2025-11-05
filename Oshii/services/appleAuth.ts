/**
 * Service d'authentification Apple OAuth via Supabase
 * Gère la connexion/inscription avec Apple et la récupération des données utilisateur
 */

import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import Constants from 'expo-constants';

// Configurer WebBrowser pour gérer correctement les redirects OAuth
WebBrowser.maybeCompleteAuthSession();

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
    // Construire l'URL de redirection vers la route de callback
    const redirectUrl = Constants.expoConfig?.scheme 
      ? `${Constants.expoConfig.scheme}://auth-callback`
      : 'oshii://auth-callback';

    console.log('🔗 [Apple Auth] Redirect URL:', redirectUrl);

    // Démarrer le flux OAuth avec Apple via Supabase
    // Supabase utilise automatiquement le provider_id (sub d'Apple) pour identifier l'utilisateur
    // même si l'email change ou n'est pas partagé, donc le même compte sera réutilisé
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
        // Ne pas utiliser prompt: 'consent' car cela force toujours la demande de consentement
        // Supabase gère automatiquement la réutilisation des comptes via le provider_id
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

    // Ouvrir le navigateur pour l'authentification Apple
    console.log('🔗 [Apple Auth] Ouverture du navigateur pour l\'authentification...');
    console.log('🔗 [Apple Auth] OAuth URL:', data.url);
    
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    console.log('📱 [Apple Auth] Résultat du navigateur:', result.type);

    if (result.type === 'success') {
      console.log('✅ [Apple Auth] Callback URL reçue:', result.url);
      
      // Extraire les tokens depuis l'URL de callback
      const callbackUrl = result.url;
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      let type: string | null = null;

      try {
        // Parser l'URL de callback
        const url = new URL(callbackUrl);
        
        // Chercher dans les query params
        accessToken = url.searchParams.get('access_token');
        refreshToken = url.searchParams.get('refresh_token');
        type = url.searchParams.get('type');

        // Si pas trouvé dans les query params, chercher dans le hash
        if (!accessToken && url.hash) {
          const hashParams = new URLSearchParams(url.hash.substring(1));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
          type = hashParams.get('type');
        }

        console.log('🔑 [Apple Auth] Tokens extraits:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
        });

        if (!accessToken || !refreshToken) {
          console.error('❌ [Apple Auth] Tokens manquants dans l\'URL de callback');
          return {
            user: null,
            session: null,
            error: { message: 'Tokens non trouvés dans l\'URL de callback' },
          };
        }

        // Créer la session avec les tokens
        console.log('🔐 [Apple Auth] Création de la session avec les tokens...');
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error('❌ [Apple Auth] Erreur lors de la création de la session:', sessionError);
          return {
            user: null,
            session: null,
            error: sessionError,
          };
        }

        if (!sessionData.session || !sessionData.user) {
          console.error('❌ [Apple Auth] Session ou utilisateur non disponible après setSession');
          return {
            user: null,
            session: null,
            error: { message: 'Session non créée correctement' },
          };
        }

        console.log('✅ [Apple Auth] Session créée avec succès');
        console.log('👤 [Apple Auth] Utilisateur:', sessionData.user.email);
        console.log('🆔 [Apple Auth] User ID:', sessionData.user.id);
        console.log('🔗 [Apple Auth] Identités:', JSON.stringify(sessionData.user.identities, null, 2));

        // Vérifier les identités Apple pour comprendre le compte
        const appleIdentity = sessionData.user.identities?.find((id: any) => id.provider === 'apple');
        if (appleIdentity) {
          console.log('🍎 [Apple Auth] Identité Apple trouvée:', {
            provider: appleIdentity.provider,
            provider_id: appleIdentity.id,
            created_at: appleIdentity.created_at,
          });
        }

        // Récupérer les données de profil Apple
        console.log('📋 [Apple Auth] Extraction des données de profil...');
        const profileData = await extractAppleProfileData(sessionData.user);

        // Créer ou mettre à jour le profil dans Supabase
        // Note: Supabase utilise le provider_id (sub d'Apple) pour identifier l'utilisateur
        // même si l'email change, donc le même compte sera réutilisé
        console.log('💾 [Apple Auth] Mise à jour du profil...');
        const needsOnboarding = await updateUserProfile(sessionData.user, profileData);

        console.log('✅ [Apple Auth] Authentification Apple complétée avec succès');

        return {
          user: sessionData.user,
          session: sessionData.session,
          error: null,
          needsOnboarding,
          profileData,
        };
      } catch (parseError: any) {
        console.error('❌ [Apple Auth] Erreur lors du parsing de l\'URL:', parseError);
        console.error('❌ [Apple Auth] URL complète:', callbackUrl);
        return {
          user: null,
          session: null,
          error: { message: `Erreur de parsing: ${parseError.message}` },
        };
      }
    } else if (result.type === 'cancel') {
      console.log('ℹ️ [Apple Auth] Authentification annulée par l\'utilisateur');
      return {
        user: null,
        session: null,
        error: 'CANCELED', // Spécial pour ne pas afficher d'erreur
      };
    } else {
      console.log('⚠️ [Apple Auth] Type de résultat inattendu:', result.type);
      return {
        user: null,
        session: null,
        error: { message: 'Échec de l\'authentification' },
      };
    }
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

    console.log('📋 [Apple Auth] Données de profil extraites:', { name, email });

    return {
      name,
      email,
    };
  } catch (error) {
    console.error('❌ [Apple Auth] Erreur lors de l\'extraction du profil:', error);
    return {
      name: null,
      email: null,
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
  profileData: { name: string | null; email: string | null }
): Promise<boolean> {
  try {
    if (!user?.id) {
      console.warn('⚠️ [Apple Auth] ID utilisateur manquant pour la mise à jour du profil');
      return false;
    }

    // Vérifier si le profil existe déjà
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, onboarding_completed')
      .eq('id', user.id)
      .single();

    const isNewUser = !existingProfile || (fetchError as any)?.code === 'PGRST116';

    const profileUpdate: {
      id: string;
      username?: string;
      onboarding_completed?: boolean;
      profile_type?: null;
    } = {
      id: user.id,
    };

    // Mettre à jour le username si disponible et pas déjà défini
    if (profileData.name && (!existingProfile?.username || existingProfile.username === user.email?.split('@')[0])) {
      profileUpdate.username = profileData.name;
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
