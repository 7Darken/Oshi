/**
 * Hook pour gérer les recettes d'un dossier spécifique
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { FullRecipe } from '@/types/recipe';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { useNetworkContext } from '@/contexts/NetworkContext';

export interface UseFolderRecipesReturn {
  recipes: FullRecipe[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer les recettes d'un dossier spécifique
 * @param folderId - ID du dossier
 * @returns Objet contenant les recettes, l'état de chargement et les erreurs
 */
export function useFolderRecipes(folderId: string | null): UseFolderRecipesReturn {
  const [recipes, setRecipes] = useState<FullRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const allRecipes = useRecipeStore((state) => state.recipes);
  const recipesLastUpdatedAt = useRecipeStore((state) => state.recipesLastUpdatedAt);
  const { isOffline } = useNetworkContext();
  const hasAttemptedInitialFetch = useRef(false);
  const lastFetchTimestamp = useRef<number>(0);

  const fetchFolderRecipes = useCallback(async (silent: boolean = false, forceRefresh: boolean = false) => {
    // Optimisation: Utiliser le cache si disponible et récent (< 2 secondes)
    const now = Date.now();
    const cacheAge = now - lastFetchTimestamp.current;
    const hasCachedRecipes = allRecipes.length > 0;

    if (!forceRefresh && hasCachedRecipes && cacheAge < 2000 && !isOffline) {
      if (!silent) {
        console.log('⚡ [FolderRecipes] Utilisation du cache récent (age:', cacheAge, 'ms)');
      }

      const filtered = allRecipes.filter((recipe) => {
        if (folderId === null) {
          return recipe.folder_id === null;
        }
        return recipe.folder_id === folderId;
      });

      setRecipes(filtered);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (isOffline) {
      if (!silent) {
        console.log('📖 [FolderRecipes] Mode hors ligne — utilisation du cache local');
        setIsLoading(false);
        setError(null);
      }

      const filtered = allRecipes.filter((recipe) => {
        if (folderId === null) {
          return recipe.folder_id === null;
        }
        return recipe.folder_id === folderId;
      });

      setRecipes(filtered);
      return;
    }

    if (!silent) {
      console.log('🌐 [FolderRecipes] Récupération depuis Supabase, folderId:', folderId);
      setIsLoading(true);
      setError(null);
    }

    try {
      // Récupérer les recettes avec leurs ingrédients et étapes en une seule requête (optimisé)
      let result;
      
      if (folderId === null) {
        // Récupérer les recettes orphelines (sans folder_id) avec jointures
        result = await supabase
          .from('recipes')
          .select(`
            *,
            ingredients(*),
            steps(*)
          `)
          .is('folder_id', null)
          .order('created_at', { ascending: false });
        if (!silent) {
          console.log('📖 [FolderRecipes] Récupération des recettes orphelines');
        }
      } else {
        // Récupérer les recettes d'un dossier spécifique avec jointures
        result = await supabase
          .from('recipes')
          .select(`
            *,
            ingredients(*),
            steps(*)
          `)
          .eq('folder_id', folderId)
          .order('created_at', { ascending: false });
        if (!silent) {
          console.log('📖 [FolderRecipes] Récupération des recettes du dossier:', folderId);
        }
      }

      if (result.error) {
        console.error('❌ [FolderRecipes] Erreur lors de la récupération:', result.error);
        if (!silent) {
          throw new Error(`Erreur lors de la récupération: ${result.error.message}`);
        }
        return;
      }

      const recipesData = result.data || [];

      if (recipesData.length === 0) {
        if (silent) {
          console.log('🔄 [FolderRecipes] Refresh silencieux - Aucune recette trouvée');
          setRecipes([]);
        } else {
          console.log('✅ [FolderRecipes] Aucune recette trouvée dans ce dossier');
          setRecipes([]);
          setIsLoading(false);
        }
        return;
      }

      if (silent) {
        console.log('🔄 [FolderRecipes] Refresh silencieux des recettes...');
      } else {
        console.log('✅ [FolderRecipes]', recipesData.length, 'recettes trouvées');
      }

      // Transformer les données pour correspondre au format attendu
      // Les jointures Supabase retournent ingredients et steps comme arrays
      const fullRecipes = recipesData.map((recipe: any) => ({
        ...recipe,
        ingredients: (recipe.ingredients || []).sort((a: any, b: any) => 
          (a.name || '').localeCompare(b.name || '')
        ),
        steps: (recipe.steps || []).sort((a: any, b: any) => 
          (a.order || 0) - (b.order || 0)
        ),
      }));

      if (!silent) {
        console.log('✅ [FolderRecipes] Recettes complètes récupérées avec succès');
      }

      // Mettre à jour le timestamp du dernier fetch
      lastFetchTimestamp.current = Date.now();

      // Vérifier si les données ont vraiment changé avant de mettre à jour l'état
      setRecipes(prevRecipes => {
        const prevIds = new Set(prevRecipes.map(r => r.id));
        const newIds = new Set(fullRecipes.map(r => r.id));

        // Vérifier si les IDs sont identiques
        if (prevIds.size === newIds.size && [...prevIds].every(id => newIds.has(id))) {
          // Vérifier si les données des recettes ont changé (folder_id, etc.)
          const hasChanges = fullRecipes.some(newRecipe => {
            const prevRecipe = prevRecipes.find(r => r.id === newRecipe.id);
            return !prevRecipe ||
                   prevRecipe.folder_id !== newRecipe.folder_id ||
                   prevRecipe.title !== newRecipe.title;
          });

          if (!hasChanges) {
            // Aucun changement, retourner les références précédentes
            return prevRecipes;
          }
        }

        // Il y a des changements, mettre à jour
        return fullRecipes;
      });
    } catch (err: any) {
      console.error('❌ [FolderRecipes] Erreur:', err);
      if (!silent) {
        setError(err.message || 'Une erreur est survenue');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [folderId, isOffline, allRecipes]);

  // Chargement initial au montage du composant
  useEffect(() => {
    if (!hasAttemptedInitialFetch.current) {
      void fetchFolderRecipes(false, false); // Chargement initial sans forceRefresh
      hasAttemptedInitialFetch.current = true;
    }
  }, [fetchFolderRecipes]);

  // Rafraîchir automatiquement quand les recettes globales changent (nouvelle recette ajoutée, etc.)
  useEffect(() => {
    if (hasAttemptedInitialFetch.current && recipesLastUpdatedAt) {
      console.log('🔄 [FolderRecipes] Détection de changement dans les recettes globales');
      void fetchFolderRecipes(true, true); // Refresh silencieux avec forceRefresh
    }
  }, [recipesLastUpdatedAt, fetchFolderRecipes]);

  const refresh = useCallback(() => {
    return fetchFolderRecipes(true, true); // Refresh silencieux avec forceRefresh
  }, [fetchFolderRecipes]);

  return {
    recipes,
    isLoading,
    error,
    refresh,
  };
}

