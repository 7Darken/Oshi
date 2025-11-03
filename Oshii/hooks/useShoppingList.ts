/**
 * Hook pour gérer la liste de courses
 * Récupération et gestion via Supabase
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';

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

export interface UseShoppingListReturn {
  items: ShoppingListItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  toggleItem: (itemId: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  deleteAllCheckedItems: () => Promise<void>;
  addItem: (ingredient: { name: string; quantity?: string; unit?: string }) => Promise<void>;
  addFoodItems: (foodItems: Array<{ id: string; name: string }>) => Promise<void>;
}

/**
 * Hook pour récupérer et gérer la liste de courses de l'utilisateur
 * @returns Objet contenant les items, l'état de chargement et les méthodes
 */
export function useShoppingList(): UseShoppingListReturn {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShoppingList = useCallback(async () => {
    console.log('🛒 [ShoppingList] Récupération de la liste de courses...');
    setIsLoading(true);
    setError(null);

    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select('*')
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
  }, []);

  const toggleItem = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    console.log('🔄 [ShoppingList] Toggle item:', item.ingredient_name);
    
    try {
      const { error: updateError } = await supabase
        .from('shopping_list_items')
        .update({ checked: !item.checked })
        .eq('id', itemId);

      if (updateError) {
        console.error('❌ [ShoppingList] Erreur lors de la mise à jour:', updateError);
        throw new Error(updateError.message);
      }

      console.log('✅ [ShoppingList] Item mis à jour');
      await fetchShoppingList();
    } catch (err: any) {
      console.error('❌ [ShoppingList] Erreur:', err);
    }
  }, [items, fetchShoppingList]);

  const deleteItem = useCallback(async (itemId: string) => {
    console.log('🗑️ [ShoppingList] Suppression item:', itemId);

    try {
      const { error: deleteError } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) {
        console.error('❌ [ShoppingList] Erreur lors de la suppression:', deleteError);
        throw new Error(deleteError.message);
      }

      console.log('✅ [ShoppingList] Item supprimé');
      await fetchShoppingList();
    } catch (err: any) {
      console.error('❌ [ShoppingList] Erreur:', err);
    }
  }, [fetchShoppingList]);

  const deleteAllCheckedItems = useCallback(async () => {
    console.log('🗑️ [ShoppingList] Suppression de tous les items cochés');

    try {
      const { error: deleteError } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('checked', true);

      if (deleteError) {
        console.error('❌ [ShoppingList] Erreur lors de la suppression:', deleteError);
        throw new Error(deleteError.message);
      }

      console.log('✅ [ShoppingList] Tous les items cochés supprimés');
      await fetchShoppingList();
    } catch (err: any) {
      console.error('❌ [ShoppingList] Erreur:', err);
      throw err;
    }
  }, [fetchShoppingList]);

  const addItem = useCallback(async (ingredient: { name: string; quantity?: string; unit?: string }) => {
    console.log('➕ [ShoppingList] Ajout item:', ingredient.name);

    try {
      const { error: insertError } = await supabase
        .from('shopping_list_items')
        .insert({
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
      await fetchShoppingList();
    } catch (err: any) {
      console.error('❌ [ShoppingList] Erreur:', err);
    }
  }, [fetchShoppingList]);

  const addFoodItems = useCallback(async (foodItems: Array<{ id: string; name: string }>) => {
    console.log('➕ [ShoppingList] Ajout de', foodItems.length, 'food_items');

    try {
      // 1. Récupérer l'utilisateur actuel
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ [ShoppingList] Erreur lors de la récupération de l\'utilisateur:', userError);
        throw new Error('Utilisateur non authentifié');
      }

      // 2. Récupérer la liste actuelle de courses (unchecked)
      const { data: currentItems, error: fetchError } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('checked', false);

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
            user_id: user.id,
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
      await fetchShoppingList();
    } catch (err: any) {
      console.error('❌ [ShoppingList] Erreur:', err);
      throw err;
    }
  }, [fetchShoppingList]);

  useEffect(() => {
    fetchShoppingList();
  }, [fetchShoppingList]);

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

