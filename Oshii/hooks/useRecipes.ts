/**
 * Hook pour gérer les recettes de l'utilisateur
 * Récupération et gestion via Supabase
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';

export interface DatabaseRecipe {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  servings: number | null;
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  source_url: string | null;
  image_url: string | null;
  created_at: string;
  calories: number | null;
  proteins: number | null;
  carbs: number | null;
  fats: number | null;
}

export interface DatabaseIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  food_item_id: string | null;
}

export interface DatabaseStep {
  id: string;
  recipe_id: string;
  order: number;
  text: string;
  duration: string | null;
  temperature: string | null;
}

export interface FullRecipe extends DatabaseRecipe {
  ingredients: DatabaseIngredient[];
  steps: DatabaseStep[];
}

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
  const [recipes, setRecipes] = useState<FullRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async (silent: boolean = false) => {
    if (!silent) {
      console.log('📖 [Recipes] Récupération des recettes...');
      setIsLoading(true);
      setError(null);
    }

    try {
      // 1. Récupérer les recettes de l'utilisateur
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (recipesError) {
        console.error('❌ [Recipes] Erreur lors de la récupération:', recipesError);
        if (!silent) {
          throw new Error(`Erreur lors de la récupération: ${recipesError.message}`);
        }
        return;
      }

      if (!recipesData || recipesData.length === 0) {
        if (silent) {
          console.log('🔄 [Recipes] Refresh silencieux - Aucune recette trouvée');
        } else {
          console.log('✅ [Recipes] Aucune recette trouvée');
          setRecipes([]);
          setIsLoading(false);
        }
        return;
      }

      if (silent) {
        console.log('🔄 [Recipes] Refresh silencieux des recettes...');
      } else {
        console.log('✅ [Recipes]', recipesData.length, 'recettes trouvées');
      }

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

      if (!silent) {
        console.log('✅ [Recipes] Recettes complètes récupérées avec succès');
      }

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
      console.error('❌ [Recipes] Erreur:', err);
      if (!silent) {
        setError(err.message || 'Une erreur est survenue');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchRecipes(false); // Chargement initial avec loading
  }, [fetchRecipes]);

  const refresh = useCallback(() => {
    return fetchRecipes(true); // Refresh silencieux sans loading
  }, [fetchRecipes]);

  return {
    recipes,
    isLoading,
    error,
    refresh,
  };
}

