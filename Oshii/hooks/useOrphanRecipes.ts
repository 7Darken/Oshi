/**
 * Hook pour gérer les recettes non associées à un dossier (orphan recipes)
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { FullRecipe } from '@/types/recipe';
import { useNetworkContext } from '@/contexts/NetworkContext';
import { useRecipeStore } from '@/stores/useRecipeStore';

export interface UseOrphanRecipesReturn {
  recipes: FullRecipe[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer les recettes non associées à un dossier
 * @returns Objet contenant les recettes, l'état de chargement et les erreurs
 */
export function useOrphanRecipes(): UseOrphanRecipesReturn {
  const [recipes, setRecipes] = useState<FullRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOffline } = useNetworkContext();
  const cachedRecipes = useRecipeStore((state) => state.recipes);

  const fetchOrphanRecipes = useCallback(async () => {
    if (isOffline) {
      console.log('📖 [OrphanRecipes] Mode hors ligne — utilisation du cache local');
      const orphanRecipes = cachedRecipes.filter((recipe) => !recipe.folder_id);
      setRecipes(orphanRecipes);
      setIsLoading(false);
      setError(null);
      return;
    }

    console.log('📖 [OrphanRecipes] Récupération des recettes orphelines...');
    setIsLoading(true);
    setError(null);

    try {
      // Optimisation: Récupérer les recettes avec leurs ingrédients et étapes en une seule requête
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select(`
          *,
          ingredients(*),
          steps(*)
        `)
        .is('folder_id', null)
        .order('created_at', { ascending: false });

      if (recipesError) {
        console.error('❌ [OrphanRecipes] Erreur lors de la récupération:', recipesError);
        throw new Error(`Erreur lors de la récupération: ${recipesError.message}`);
      }

      if (!recipesData || recipesData.length === 0) {
        console.log('✅ [OrphanRecipes] Aucune recette orpheline trouvée');
        setRecipes([]);
        setIsLoading(false);
        return;
      }

      console.log('✅ [OrphanRecipes]', recipesData.length, 'recettes orphelines trouvées');

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

      console.log('✅ [OrphanRecipes] Recettes complètes récupérées avec succès (1 requête au lieu de', recipesData.length * 2 + 1, ')');
      setRecipes(fullRecipes);
    } catch (err: any) {
      console.error('❌ [OrphanRecipes] Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [cachedRecipes, isOffline]);

  useEffect(() => {
    fetchOrphanRecipes();
  }, [fetchOrphanRecipes]);

  return {
    recipes,
    isLoading,
    error,
    refresh: fetchOrphanRecipes,
  };
}

