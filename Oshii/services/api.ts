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
}

/**
 * Analyse une recette TikTok via le backend
 * @param tiktokUrl - URL TikTok de la vidéo
 * @param options - Options incluant signal d'annulation et token
 * @returns Promise<Recipe> - Recette extraite et structurée
 */
export async function analyzeRecipe(tiktokUrl: string, options?: AnalyzeOptions): Promise<Recipe> {
  console.log('🚀 [API] Appel au backend pour analyser la recette');
  console.log('📹 [API] URL TikTok:', tiktokUrl);

  if (!BACKEND_URL && !API_BASE_URL) {
    throw new Error('BACKEND_URL non définie dans le fichier .env');
  }

  const signal = options?.signal;
  const token = options?.token;

  // Préparer les en-têtes
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Ajouter le token JWT si fourni
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 [API] Token JWT inclus dans la requête');
  } else {
    console.warn('⚠️ [API] Aucun token JWT fourni - la requête sera probablement rejetée par le backend');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: tiktokUrl,
      }),
      signal,
    });

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `Erreur API: ${response.status}`);
    }

    if (!data.success || !data.recipe) {
      throw new Error('Aucune recette retournée par le backend');
    }

    console.log('✅ [API] Recette reçue:', data.recipe.title);
    return data.recipe;
  } catch (error) {
    console.error('❌ [API] Erreur lors de l\'appel au backend:', error);
    throw error;
  }
}

