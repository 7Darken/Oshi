/**
 * Service API pour communiquer avec le backend Oshii
 * Appel simple et propre vers le backend Express
 */

import Constants from 'expo-constants';
import { Recipe } from '@/types/recipe';

// Récupération de l'URL du backend depuis expo-constants
const { BACKEND_URL } = Constants.expoConfig?.extra || {};

// Nettoyer l'URL en enlevant les trailing slashes
const cleanUrl = (url: string) => url.replace(/\/+$/, '');

const API_BASE_URL = cleanUrl(BACKEND_URL || 'http://localhost:3000');
console.log('API_BASE_URL:', API_BASE_URL);
export interface AnalyzeOptions {
  signal?: AbortSignal;
  timeout?: number;
  token?: string; // Token JWT optionnel
}

export interface ApiResponse {
  success: boolean;
  recipe?: Recipe;
  error?: string;
  message?: string;
  userMessage?: string;
}

/**
 * Classe d'erreur personnalisée pour les cas où le contenu n'est pas une recette
 */
export class NotRecipeError extends Error {
  code: string;
  userMessage: string;

  constructor(message: string, userMessage?: string) {
    super(message);
    this.name = 'NotRecipeError';
    this.code = 'NOT_RECIPE';
    this.userMessage = userMessage || message;
  }
}

/**
 * Récupère un token JWT valide en rafraîchissant la session si nécessaire
 * @param getToken - Fonction pour obtenir le token actuel
 * @param refreshSession - Fonction pour rafraîchir la session
 * @returns Promise<string | null> - Token JWT valide ou null
 */
async function getValidToken(
  getToken: () => string | null,
  refreshSession?: () => Promise<void>
): Promise<string | null> {
  let token = getToken();
  
  // Si pas de token, essayer de rafraîchir la session
  if (!token && refreshSession) {
    console.log('🔄 [API] Token manquant, rafraîchissement de la session...');
    try {
      await refreshSession();
      token = getToken();
      if (token) {
        console.log('✅ [API] Session rafraîchie, nouveau token obtenu');
      }
    } catch (error) {
      console.error('❌ [API] Erreur lors du rafraîchissement de la session:', error);
    }
  }
  
  return token;
}

/**
 * Analyse une recette TikTok via le backend
 * @param tiktokUrl - URL TikTok de la vidéo
 * @param options - Options incluant signal d'annulation, token et fonctions de refresh
 * @returns Promise<Recipe> - Recette extraite et structurée
 */
export async function analyzeRecipe(
  tiktokUrl: string, 
  options?: AnalyzeOptions & { 
    getToken?: () => string | null;
    refreshSession?: () => Promise<void>;
  }
): Promise<Recipe> {
  console.log('🚀 [API] Appel au backend pour analyser la recette');
  console.log('📹 [API] URL TikTok:', tiktokUrl);

  if (!BACKEND_URL && !API_BASE_URL) {
    throw new Error('BACKEND_URL non définie dans le fichier .env');
  }

  const signal = options?.signal;
  
  // Récupérer un token valide (avec refresh automatique si nécessaire)
  let token = options?.token;
  if (!token && options?.getToken && options?.refreshSession) {
    const validToken = await getValidToken(options.getToken, options.refreshSession);
    token = validToken || undefined;
  }

  // Préparer les en-têtes
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Ajouter le token JWT si disponible
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 [API] Token JWT inclus dans la requête');
  } else {
    console.warn('⚠️ [API] Aucun token JWT disponible - la requête sera probablement rejetée par le backend');
  }

  try {
    console.log('📡 [API] Appel au backend en cours...');
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: tiktokUrl,
      }),
      signal,
    });

    console.log('📥 [API] Réponse reçue du backend:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    // Si 401 (Unauthorized), essayer de rafraîchir le token et réessayer
    if (response.status === 401 && options?.getToken && options?.refreshSession && token) {
      console.log('🔄 [API] Token expiré (401), rafraîchissement de la session...');
      try {
        await options.refreshSession();
        const newToken = await getValidToken(options.getToken);
        
        if (newToken && newToken !== token) {
          console.log('✅ [API] Nouveau token obtenu, nouvelle tentative...');
          // Réessayer avec le nouveau token
          headers['Authorization'] = `Bearer ${newToken}`;
          
          const retryResponse = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              url: tiktokUrl,
            }),
            signal,
          });
          
          if (retryResponse.ok) {
            const retryData: ApiResponse = await retryResponse.json();
            if (retryData.success && retryData.recipe) {
              console.log('✅ [API] Requête réussie après rafraîchissement du token');
              return retryData.recipe;
            }
          }
        }
      } catch (refreshError) {
        console.error('❌ [API] Erreur lors du rafraîchissement du token:', refreshError);
      }
    }

    const data: ApiResponse = await response.json();
    console.log('📦 [API] Données parsées:', {
      success: data.success,
      hasRecipe: !!data.recipe,
      alreadyExists: (data as any).alreadyExists,
      recipeId: data.recipe?.id,
    });

    if (!response.ok) {
      // Cas spécial : Le contenu n'est pas une recette
      if (data.error === 'NOT_RECIPE') {
        console.warn('⚠️ [API] Contenu TikTok non-culinaire détecté');
        throw new NotRecipeError(
          data.message || 'Ce lien TikTok ne contient pas de recette ou n\'est pas une vidéo culinaire.',
          data.userMessage
        );
      }

      // Erreur d'authentification
      if (response.status === 401) {
        throw new Error('Token manquant ou expiré. Veuillez vous reconnecter.');
      }

      // Autres erreurs
      throw new Error(data.error || data.message || `Erreur API: ${response.status}`);
    }

    if (!data.success || !data.recipe) {
      console.error('❌ [API] Réponse invalide du backend:', {
        success: data.success,
        hasRecipe: !!data.recipe,
        data,
      });
      throw new Error('Aucune recette retournée par le backend');
    }

    console.log('✅ [API] Recette reçue du backend');
    console.log('📦 [API] Détails recette:', {
      id: data.recipe.id,
      title: data.recipe.title,
      hasIngredients: !!data.recipe.ingredients?.length,
      hasSteps: !!data.recipe.steps?.length,
      alreadyExists: (data as any).alreadyExists || false,
    });
    
    return data.recipe;
  } catch (error) {
    // Si c'est une NotRecipeError, la relancer telle quelle
    if (error instanceof NotRecipeError) {
      throw error;
    }
    
    console.error('❌ [API] Erreur lors de l\'appel au backend:', error);
    throw error;
  }
}

