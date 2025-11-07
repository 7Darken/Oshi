/**
 * Hook pour gérer les recettes de l'utilisateur
 * Récupération et gestion via le store Zustand + Supabase
 */

import { useCallback, useEffect, useRef } from 'react';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { FullRecipe } from '@/types/recipe';
import { useNetworkContext } from '@/contexts/NetworkContext';

export interface UseRecipesReturn {
  recipes: FullRecipe[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer et gérer les recettes de l'utilisateur
 * @returns Objet contenant les recettes, l'état de chargement et les erreurs
 */
export function useRecipes(): UseRecipesReturn {
  const recipes = useRecipeStore((state) => state.recipes);
  const recipesLoading = useRecipeStore((state) => state.recipesLoading);
  const recipesError = useRecipeStore((state) => state.recipesError);
  const hasFetchedRecipes = useRecipeStore((state) => state.hasFetchedRecipes);
  const storeRefresh = useRecipeStore((state) => state.refreshRecipes);
  const setRecipesLoading = useRecipeStore((state) => state.setRecipesLoading);
  const markRecipesFetched = useRecipeStore((state) => state.markRecipesFetched);
  const { isOffline } = useNetworkContext();
  const wasOfflineRef = useRef(isOffline);

  useEffect(() => {
    if (isOffline) {
      if (!wasOfflineRef.current) {
        console.log('🌐 Offline mode — using cached recipes');
      }
      wasOfflineRef.current = true;

      if (recipesLoading) {
        setRecipesLoading(false);
      }

      if (!hasFetchedRecipes) {
        markRecipesFetched();
      }

      return;
    }

    const sync = async () => {
      if (wasOfflineRef.current) {
        console.log('✅ Back online, syncing recipes...');
      }

      try {
        await storeRefresh({ silent: wasOfflineRef.current || hasFetchedRecipes });
      } catch (err) {
        console.error('❌ [Recipes] Erreur lors de la synchronisation:', err);
      } finally {
        wasOfflineRef.current = false;
      }
    };

    void sync();
  }, [isOffline, hasFetchedRecipes, storeRefresh, recipesLoading, setRecipesLoading, markRecipesFetched]);

  const refresh = useCallback(() => {
    if (isOffline) {
      console.log('🌐 Offline mode — using cached recipes');
      return Promise.resolve();
    }

    return storeRefresh({ silent: false }).catch((err) => {
      console.error('❌ [Recipes] Erreur lors du refresh:', err);
      throw err;
    });
  }, [storeRefresh, isOffline]);

  return {
    recipes,
    isLoading: recipesLoading,
    error: recipesError,
    refresh,
  };
}

