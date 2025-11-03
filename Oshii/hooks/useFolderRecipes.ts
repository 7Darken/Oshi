/**
 * Hook pour gérer les recettes d'un dossier spécifique
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { FullRecipe } from './useRecipes';

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

  const fetchFolderRecipes = useCallback(async (silent: boolean = false) => {
    if (!silent) {
      console.log('📖 [FolderRecipes] Récupération des recettes, folderId:', folderId);
      setIsLoading(true);
      setError(null);
    }

    try {
      // 1. Récupérer les recettes du dossier ou les recettes orphelines si folderId est null
      let recipesData;
      let recipesError;

      if (folderId === null) {
        // Récupérer les recettes orphelines (sans folder_id)
        const result = await supabase
          .from('recipes')
          .select('*')
          .is('folder_id', null)
          .order('created_at', { ascending: false });
        recipesData = result.data;
        recipesError = result.error;
        if (!silent) {
          console.log('📖 [FolderRecipes] Récupération des recettes orphelines');
        }
      } else {
        // Récupérer les recettes d'un dossier spécifique
        const result = await supabase
          .from('recipes')
          .select('*')
          .eq('folder_id', folderId)
          .order('created_at', { ascending: false });
        recipesData = result.data;
        recipesError = result.error;
        if (!silent) {
          console.log('📖 [FolderRecipes] Récupération des recettes du dossier:', folderId);
        }
      }

      if (recipesError) {
        console.error('❌ [FolderRecipes] Erreur lors de la récupération:', recipesError);
        if (!silent) {
          throw new Error(`Erreur lors de la récupération: ${recipesError.message}`);
        }
        return;
      }

      if (!recipesData || recipesData.length === 0) {
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
        console.log('✅ [FolderRecipes] Recettes complètes récupérées avec succès');
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
      console.error('❌ [FolderRecipes] Erreur:', err);
      if (!silent) {
        setError(err.message || 'Une erreur est survenue');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [folderId]);

  useEffect(() => {
    fetchFolderRecipes(false); // Chargement initial avec loading
  }, [fetchFolderRecipes]);

  const refresh = useCallback(() => {
    return fetchFolderRecipes(true); // Refresh silencieux sans loading
  }, [fetchFolderRecipes]);

  return {
    recipes,
    isLoading,
    error,
    refresh,
  };
}

