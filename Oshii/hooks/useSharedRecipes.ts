/**
 * Hook pour gérer le partage de recettes avec les amis
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { SharedRecipe, SharedRecipeWithDetails } from '@/types/friends';
import { FullRecipe } from '@/types/recipe';

export function useSharedRecipes() {
  const { user } = useAuthContext();
  const [sharedWithMe, setSharedWithMe] = useState<SharedRecipeWithDetails[]>([]);
  const [sharedByMe, setSharedByMe] = useState<SharedRecipeWithDetails[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // RÉCUPÉRER LES RECETTES PARTAGÉES AVEC MOI
  // =====================================================
  const getSharedWithMe = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('shared_recipes')
        .select(`
          id,
          recipe_id,
          shared_by_user_id,
          shared_with_user_id,
          message,
          is_read,
          created_at
        `)
        .eq('shared_with_user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;

      // Récupérer les profils de ceux qui ont partagé
      const sharesWithProfiles = await Promise.all(
        (data || []).map(async (share) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', share.shared_by_user_id)
            .single();

          return {
            ...share,
            shared_by: profile || undefined,
          };
        })
      );

      setSharedWithMe(sharesWithProfiles);

      // Compter les non lus
      const unread = sharesWithProfiles.filter((s) => !s.is_read).length;
      setUnreadCount(unread);
    } catch (err: any) {
      console.error('❌ [useSharedRecipes] Erreur getSharedWithMe:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // RÉCUPÉRER LES RECETTES QUE J'AI PARTAGÉES
  // =====================================================
  const getSharedByMe = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('shared_recipes')
        .select(`
          id,
          recipe_id,
          shared_by_user_id,
          shared_with_user_id,
          message,
          is_read,
          created_at
        `)
        .eq('shared_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;

      // Récupérer les profils des destinataires
      const sharesWithProfiles = await Promise.all(
        (data || []).map(async (share) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', share.shared_with_user_id)
            .single();

          return {
            ...share,
            shared_by: profile || undefined, // Ici c'est le destinataire
          };
        })
      );

      setSharedByMe(sharesWithProfiles);
    } catch (err: any) {
      console.error('❌ [useSharedRecipes] Erreur getSharedByMe:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // PARTAGER UNE RECETTE AVEC UN AMI
  // =====================================================
  const shareRecipe = async (
    recipeId: string,
    friendId: string,
    message?: string
  ) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    try {
      setError(null);

      // Vérifier que c'est bien un ami
      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .or(
          `and(user_id_1.eq.${Math.min(user.id, friendId)},user_id_2.eq.${Math.max(user.id, friendId)})`
        )
        .single();

      if (!friendship) {
        throw new Error('Vous devez être ami avec cette personne pour partager une recette');
      }

      // Partager la recette (le trigger créera automatiquement la copie)
      const { error: err } = await supabase
        .from('shared_recipes')
        .insert({
          recipe_id: recipeId,
          shared_by_user_id: user.id,
          shared_with_user_id: friendId,
          message: message || null,
        });

      if (err) throw err;

      console.log('✅ [useSharedRecipes] Recette partagée avec succès');

      // Rafraîchir la liste
      await getSharedByMe();

      return { success: true };
    } catch (err: any) {
      console.error('❌ [useSharedRecipes] Erreur shareRecipe:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // =====================================================
  // MARQUER UNE RECETTE PARTAGÉE COMME LUE
  // =====================================================
  const markAsRead = async (sharedRecipeId: string) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    try {
      setError(null);

      const { error: err } = await supabase
        .from('shared_recipes')
        .update({ is_read: true })
        .eq('id', sharedRecipeId)
        .eq('shared_with_user_id', user.id);

      if (err) throw err;

      // Rafraîchir
      await getSharedWithMe();

      return { success: true };
    } catch (err: any) {
      console.error('❌ [useSharedRecipes] Erreur markAsRead:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // =====================================================
  // DÉPLACER UNE RECETTE PARTAGÉE VERS UN AUTRE DOSSIER
  // =====================================================
  const moveSharedRecipeToFolder = async (
    recipeId: string,
    newFolderId: string
  ) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    try {
      setError(null);

      const { error: err } = await supabase
        .from('recipes')
        .update({ folder_id: newFolderId })
        .eq('id', recipeId)
        .eq('user_id', user.id); // Sécurité

      if (err) throw err;

      console.log('✅ [useSharedRecipes] Recette déplacée vers le dossier');

      return { success: true };
    } catch (err: any) {
      console.error('❌ [useSharedRecipes] Erreur moveSharedRecipeToFolder:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // =====================================================
  // SUPPRIMER UNE RECETTE PARTAGÉE
  // =====================================================
  const deleteSharedRecipe = async (sharedRecipeId: string) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    try {
      setError(null);

      const { error: err } = await supabase
        .from('shared_recipes')
        .delete()
        .eq('id', sharedRecipeId);

      if (err) throw err;

      console.log('✅ [useSharedRecipes] Recette partagée supprimée');
      await getSharedWithMe();
      await getSharedByMe();

      return { success: true };
    } catch (err: any) {
      console.error('❌ [useSharedRecipes] Erreur deleteSharedRecipe:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Charger automatiquement au montage
  useEffect(() => {
    if (user) {
      getSharedWithMe();
      getSharedByMe();
    }
  }, [user]);

  return {
    // État
    sharedWithMe,
    sharedByMe,
    unreadCount,
    isLoading,
    error,

    // Actions
    getSharedWithMe,
    getSharedByMe,
    shareRecipe,
    markAsRead,
    moveSharedRecipeToFolder,
    deleteSharedRecipe,
  };
}
