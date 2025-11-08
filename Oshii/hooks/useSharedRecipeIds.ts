/**
 * Hook pour récupérer les IDs des recettes partagées avec l'utilisateur
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNetworkContext } from '@/contexts/NetworkContext';

export interface UseSharedRecipeIdsReturn {
  sharedRecipeIds: string[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer les IDs des recettes partagées avec l'utilisateur
 * @returns Objet contenant les IDs des recettes partagées et l'état de chargement
 */
export function useSharedRecipeIds(): UseSharedRecipeIdsReturn {
  const { user } = useAuthContext();
  const { isOffline } = useNetworkContext();
  const [sharedRecipeIds, setSharedRecipeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSharedRecipeIds = useCallback(async () => {
    if (!user?.id || isOffline) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('shared_recipes')
        .select('recipe_id')
        .eq('shared_with_user_id', user.id);

      if (fetchError) {
        console.error('❌ [SharedRecipeIds] Erreur lors de la récupération:', fetchError);
        throw new Error(fetchError.message);
      }

      const ids = data?.map(sr => sr.recipe_id) || [];
      setSharedRecipeIds(ids);
    } catch (err: any) {
      console.error('❌ [SharedRecipeIds] Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isOffline]);

  useEffect(() => {
    fetchSharedRecipeIds();
  }, [fetchSharedRecipeIds]);

  const refresh = useCallback(() => {
    return fetchSharedRecipeIds();
  }, [fetchSharedRecipeIds]);

  return {
    sharedRecipeIds,
    isLoading,
    error,
    refresh,
  };
}
