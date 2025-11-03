/**
 * Hook pour gérer les recettes non associées à un dossier (orphan recipes)
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { FullRecipe } from './useRecipes';

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

  const fetchOrphanRecipes = useCallback(async () => {
    console.log('📖 [OrphanRecipes] Récupération des recettes orphelines...');
    setIsLoading(true);
    setError(null);

    try {
      // 1. Récupérer les recettes sans dossier (folder_id est null)
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
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

      // 2. Pour chaque recette, récupérer les ingrédients et étapes
      const fullRecipes = await Promise.all(
        recipesData.map(async (recipe) => {
          // Récupérer les ingrédients
          const { data: ingredients } = await supabase
            .from('ingredients')
            .select('*')
            .eq('recipe_id', recipe.id)
            .order('name');

          // Récupérer les étapes
          const { data: steps } = await supabase
            .from('steps')
            .select('*')
            .eq('recipe_id', recipe.id)
            .order('order');

          return {
            ...recipe,
            ingredients: ingredients || [],
            steps: steps || [],
          };
        })
      );

      console.log('✅ [OrphanRecipes] Recettes complètes récupérées avec succès');
      setRecipes(fullRecipes);
    } catch (err: any) {
      console.error('❌ [OrphanRecipes] Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

