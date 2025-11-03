/**
 * Hook pour utiliser le cache global des food_items
 * Utilise le store Zustand pour éviter les rechargements
 */

import { useEffect } from 'react';
import { useFoodItemsStore } from '@/stores/useFoodItemsStore';

/**
 * Hook pour utiliser le cache des food_items
 * Charge automatiquement au premier appel si pas encore initialisé
 */
export function useFoodItems() {
  const { 
    foodItems, 
    isLoading, 
    error, 
    isInitialized,
    loadFoodItems 
  } = useFoodItemsStore();

  useEffect(() => {
    // Charger si pas encore initialisé
    if (!isInitialized && !isLoading) {
      loadFoodItems();
    }
  }, [isInitialized, isLoading, loadFoodItems]);

  return {
    foodItems,
    isLoading,
    error,
    isInitialized,
    // Helpers
    getFoodItemById: useFoodItemsStore((state) => state.getFoodItemById),
    getFoodItemsByIds: useFoodItemsStore((state) => state.getFoodItemsByIds),
    searchFoodItems: useFoodItemsStore((state) => state.searchFoodItems),
    getFoodItemImage: useFoodItemsStore((state) => state.getFoodItemImage),
  };
}

