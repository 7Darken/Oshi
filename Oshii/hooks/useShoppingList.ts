/**
 * Hook pour gérer la liste de courses
 * Récupération et gestion via Supabase
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import * as Haptics from 'expo-haptics';
import { useNetworkContext } from '@/contexts/NetworkContext';
import { useAuthContext } from '@/contexts/AuthContext';

export interface ShoppingListItem {
  id: string;
  user_id: string;
  ingredient_name: string;
  quantity: string | null;
  unit: string | null;
  checked: boolean;
  created_at: string;
  updated_at: string;
  food_item_id: string | null;
}

type FetchOptions = {
  silent?: boolean;
};

export interface UseShoppingListReturn {
  items: ShoppingListItem[];
  isLoading: boolean;
  error: string | null;
  refresh: (options?: FetchOptions) => Promise<void>;
  toggleItem: (itemId: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  deleteAllCheckedItems: () => Promise<void>;
  addItem: (ingredient: { name: string; quantity?: string; unit?: string }) => Promise<void>;
  addFoodItems: (foodItems: { id: string; name: string }[]) => Promise<void>;
}

/**
 * Hook pour récupérer et gérer la liste de courses de l'utilisateur
 * @returns Objet contenant les items, l'état de chargement et les méthodes
 */
export function useShoppingList(): UseShoppingListReturn {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const hasAttemptedInitialFetch = useRef(false);
  const { isOffline } = useNetworkContext();
  const { user, session } = useAuthContext();

  const ensureUserId = useCallback(async () => {
    if (userIdRef.current) {
      return userIdRef.current;
    }

    if (user?.id) {
      userIdRef.current = user.id;
      return user.id;
    }

    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data?.user?.id) {
      console.error('❌ [ShoppingList] Impossible de récupérer l\'utilisateur:', userError);
      throw new Error('Utilisateur non authentifié');
    }

    userIdRef.current = data.user.id;
    return data.user.id;
  }, [user?.id]);

  const fetchShoppingList = useCallback(async (options: FetchOptions = {}) => {
    if (isOffline) {
      if (!options.silent) {
        setIsLoading(false);
      }
      setError(null);
      return;
    }

    console.log('🛒 [ShoppingList] Récupération de la liste de courses...');
    if (!options.silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const userId = await ensureUserId();
      const { data: itemsData, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select('id, user_id, ingredient_name, quantity, unit, checked, created_at, updated_at, food_item_id')
        .eq('user_id', userId)
        .order('checked', { ascending: true })
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('❌ [ShoppingList] Erreur lors de la récupération:', itemsError);
        throw new Error(`Erreur lors de la récupération: ${itemsError.message}`);
      }

      console.log('✅ [ShoppingList]', itemsData?.length || 0, 'items trouvés');
      setItems(itemsData || []);
    } catch (err: any) {
      console.error('❌ [ShoppingList] Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [ensureUserId, isOffline]);

  const toggleItem = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    console.log('🔄 [ShoppingList] Toggle item:', item.ingredient_name);
    
    try {
      const userId = await ensureUserId();
      const { error: updateError } = await supabase
        .from('shopping_list_items')
        .update({ checked: !item.checked })
        .eq('id', itemId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ [ShoppingList] Erreur lors de la mise à jour:', updateError);
        throw new Error(updateError.message);
      }

      console.log('✅ [ShoppingList] Item mis à jour');
      if (!item.checked && Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await fetchShoppingList({ silent: true });
    } catch (err: any) {
      console.error('❌ [ShoppingList] Erreur:', err);
    }
  }, [ensureUserId, items, fetchShoppingList]);

  const deleteItem = useCallback(async (itemId: string) => {
    console.log('🗑️ [ShoppingList] Suppression item:', itemId);

    try {
      const userId = await ensureUserId();
      const { error: deleteError } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ [ShoppingList] Erreur lors de la suppression:', deleteError);
        throw new Error(deleteError.message);
      }

      console.log('✅ [ShoppingList] Item supprimé');
      await fetchShoppingList({ silent: true });
    } catch (err: any) {
      console.error('❌ [ShoppingList] Erreur:', err);
    }
  }, [ensureUserId, fetchShoppingList]);

  const deleteAllCheckedItems = useCallback(async () => {
    console.log('🗑️ [ShoppingList] Suppression de tous les items cochés');

    try {
      const userId = await ensureUserId();
      const { error: deleteError } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('checked', true)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ [ShoppingList] Erreur lors de la suppression:', deleteError);
        throw new Error(deleteError.message);
      }

      console.log('✅ [ShoppingList] Tous les items cochés supprimés');
      await fetchShoppingList({ silent: true });
    } catch (err: any) {
      console.error('❌ [ShoppingList] Erreur:', err);
      throw err;
    }
  }, [ensureUserId, fetchShoppingList]);

  const addItem = useCallback(async (ingredient: { name: string; quantity?: string; unit?: string }) => {
    console.log('➕ [ShoppingList] Ajout item:', ingredient.name);

    try {
      const userId = await ensureUserId();
      const { error: insertError } = await supabase
        .from('shopping_list_items')
        .insert({
          user_id: userId,
          ingredient_name: ingredient.name,
          quantity: ingredient.quantity || null,
          unit: ingredient.unit || null,
          checked: false,
        });

      if (insertError) {
        console.error('❌ [ShoppingList] Erreur lors de l\'ajout:', insertError);
        throw new Error(insertError.message);
      }

      console.log('✅ [ShoppingList] Item ajouté');
      await fetchShoppingList({ silent: true });
    } catch (err: any) {
      console.error('❌ [ShoppingList] Erreur:', err);
    }
  }, [ensureUserId, fetchShoppingList]);

  const addFoodItems = useCallback(async (foodItems: { id: string; name: string }[]) => {
    console.log('➕ [ShoppingList] Ajout de', foodItems.length, 'food_items');

    try {
      const userId = await ensureUserId();

      // 2. Récupérer la liste actuelle de courses (unchecked)
      const { data: currentItems, error: fetchError } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('checked', false)
        .eq('user_id', userId);

      if (fetchError) {
        console.error('❌ [ShoppingList] Erreur lors de la récupération:', fetchError);
        throw new Error(fetchError.message);
      }

      // 3. Filtrer les food_items qui n'existent pas déjà
      const itemsToInsert: any[] = [];

      for (const foodItem of foodItems) {
        // Chercher si un item avec le même food_item_id existe déjà
        const existingItem = currentItems?.find(
          (item) => item.food_item_id === foodItem.id && foodItem.id !== null
        );

        // Ne pas ajouter si l'item existe déjà
        if (!existingItem) {
          itemsToInsert.push({
            user_id: userId,
            ingredient_name: foodItem.name,
            food_item_id: foodItem.id,
            checked: false,
          });
        }
      }

      // 4. Insérer uniquement les nouveaux items
      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('shopping_list_items')
          .insert(itemsToInsert);

        if (insertError) {
          console.error('❌ [ShoppingList] Erreur lors de l\'insertion:', insertError);
          throw new Error(insertError.message);
        }
      }

      console.log('✅ [ShoppingList]', itemsToInsert.length, 'items ajoutés');
      await fetchShoppingList({ silent: true });
    } catch (err: any) {
      console.error('❌ [ShoppingList] Erreur:', err);
      throw err;
    }
  }, [ensureUserId, fetchShoppingList]);

  useEffect(() => {
    if (!hasAttemptedInitialFetch.current) {
      fetchShoppingList();
      hasAttemptedInitialFetch.current = true;
    }
  }, [fetchShoppingList]);

  useEffect(() => {
    if (!isOffline && session && user?.id) {
      void fetchShoppingList({ silent: true });
    }
  }, [isOffline, fetchShoppingList, session, user?.id]);

  return {
    items,
    isLoading,
    error,
    refresh: fetchShoppingList,
    toggleItem,
    deleteItem,
    deleteAllCheckedItems,
    addItem,
    addFoodItems,
  };
}

