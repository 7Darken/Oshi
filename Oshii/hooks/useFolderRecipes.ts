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

