/**
 * Hook pour afficher les recettes partagées (reçues)
 * Les recettes partagées n'ont pas de folder_id (NULL)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { FullRecipe } from '@/types/recipe';

export interface SharedRecipeWithSender extends FullRecipe {
  shared_id: string; // ID de shared_recipes
  shared_by_username: string;
  shared_by_avatar_url: string | null;
  shared_message: string | null;
  shared_is_read: boolean;
  shared_created_at: string;
}

export function useSharedRecipesView() {
  const { user } = useAuthContext();
  const [sharedRecipes, setSharedRecipes] = useState<SharedRecipeWithSender[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // RÉCUPÉRER LES RECETTES PARTAGÉES AVEC MOI
  // =====================================================
  const getSharedRecipes = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Récupérer via la vue créée dans la migration
      const { data: sharedData, error: err } = await supabase
        .from('shared_recipes_with_details')
        .select('*')
        .eq('shared_with_user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;

      // Pour chaque recette partagée, récupérer les ingrédients et étapes
      const recipesWithDetails = await Promise.all(
        (sharedData || []).map(async (shared) => {
          // Récupérer la recette complète
          const { data: recipe } = await supabase
            .from('recipes')
            .select('*')
            .eq('id', shared.recipe_id)
            .single();

          // Récupérer les ingrédients
          const { data: ingredients } = await supabase
            .from('ingredients')
            .select('*')
            .eq('recipe_id', shared.recipe_id);

          // Récupérer les étapes
          const { data: steps } = await supabase
            .from('steps')
            .select('*')
            .eq('recipe_id', shared.recipe_id)
            .order('order', { ascending: true });

          return {
            ...recipe,
            ingredients: ingredients || [],
            steps: steps || [],
            shared_id: shared.id,
            shared_by_username: shared.shared_by_username,
            shared_by_avatar_url: shared.shared_by_avatar_url,
            shared_message: shared.message,
            shared_is_read: shared.is_read,
            shared_created_at: shared.created_at,
          } as SharedRecipeWithSender;
        })
      );

      setSharedRecipes(recipesWithDetails);

      // Compter les non lus
      const unread = recipesWithDetails.filter((r) => !r.shared_is_read).length;
      setUnreadCount(unread);
    } catch (err: any) {
      console.error('❌ [useSharedRecipesView] Erreur getSharedRecipes:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // MARQUER COMME LU
  // =====================================================
  const markAsRead = async (sharedId: string) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    try {
      const { error: err } = await supabase
        .from('shared_recipes')
        .update({ is_read: true })
        .eq('id', sharedId)
        .eq('shared_with_user_id', user.id);

      if (err) throw err;

      // Rafraîchir
      await getSharedRecipes();

      return { success: true };
    } catch (err: any) {
      console.error('❌ [useSharedRecipesView] Erreur markAsRead:', err);
      return { success: false, error: err.message };
    }
  };

  // =====================================================
  // DÉPLACER VERS UN DOSSIER
  // =====================================================
  const moveToFolder = async (recipeId: string, folderId: string) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    try {
      const { error: err } = await supabase
        .from('recipes')
        .update({ folder_id: folderId })
        .eq('id', recipeId)
        .eq('user_id', user.id);

      if (err) throw err;

      console.log('✅ [useSharedRecipesView] Recette déplacée vers le dossier');

      // Rafraîchir
      await getSharedRecipes();

      return { success: true };
    } catch (err: any) {
      console.error('❌ [useSharedRecipesView] Erreur moveToFolder:', err);
      return { success: false, error: err.message };
    }
  };

  // =====================================================
  // SUPPRIMER UNE RECETTE PARTAGÉE
  // =====================================================
  const deleteSharedRecipe = async (recipeId: string) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    try {
      // Supprimer la recette (cascade supprimera aussi shared_recipes)
      const { error: err } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', user.id);

      if (err) throw err;

      console.log('✅ [useSharedRecipesView] Recette supprimée');

      // Rafraîchir
      await getSharedRecipes();

      return { success: true };
    } catch (err: any) {
      console.error('❌ [useSharedRecipesView] Erreur deleteSharedRecipe:', err);
      return { success: false, error: err.message };
    }
  };

  // Charger automatiquement au montage
  useEffect(() => {
    if (user) {
      getSharedRecipes();
    }
  }, [user]);

  return {
    // État
    sharedRecipes,
    unreadCount,
    isLoading,
    error,

    // Actions
    getSharedRecipes,
    markAsRead,
    moveToFolder,
    deleteSharedRecipe,
  };
}
