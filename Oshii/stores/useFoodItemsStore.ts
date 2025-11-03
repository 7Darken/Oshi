/**
 * Store Zustand pour le cache global des food_items
 * Charge une fois au démarrage et utilise le cache ensuite
 */

import { create } from 'zustand';
import { supabase } from '@/services/supabase';

export interface FoodItem {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

interface FoodItemsStore {
  foodItems: FoodItem[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  loadFoodItems: () => Promise<void>;
  getFoodItemById: (id: string) => FoodItem | null;
  getFoodItemsByIds: (ids: string[]) => FoodItem[];
  searchFoodItems: (query: string) => FoodItem[];
  getFoodItemImage: (id: string) => string | null;
}

export const useFoodItemsStore = create<FoodItemsStore>((set, get) => ({
  foodItems: [],
  isLoading: false,
  error: null,
  isInitialized: false,

  loadFoodItems: async () => {
    const { isInitialized } = get();
    
    // Ne charger qu'une seule fois
    if (isInitialized) {
      console.log('📦 [FoodItems] Cache déjà initialisé, utilisation du cache');
      return;
    }

    console.log('📦 [FoodItems] Chargement initial des food_items...');
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ [FoodItems] Erreur lors du chargement:', error);
        throw new Error(`Erreur lors du chargement: ${error.message}`);
      }

      console.log('✅ [FoodItems]', data?.length || 0, 'food_items chargés et mis en cache');
      set({
        foodItems: data || [],
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (err: any) {
      console.error('❌ [FoodItems] Erreur:', err);
      set({
        error: err.message || 'Une erreur est survenue',
        isLoading: false,
        isInitialized: true, // Marquer comme initialisé même en cas d'erreur pour éviter les rechargements
      });
    }
  },

  getFoodItemById: (id: string) => {
    const { foodItems } = get();
    return foodItems.find((item) => item.id === id) || null;
  },

  getFoodItemsByIds: (ids: string[]) => {
    const { foodItems } = get();
    return foodItems.filter((item) => ids.includes(item.id));
  },

  searchFoodItems: (query: string) => {
    const { foodItems } = get();
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      return [];
    }

    return foodItems.filter((item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      (item.category && item.category.toLowerCase().includes(lowerQuery))
    );
  },

  getFoodItemImage: (id: string) => {
    const item = get().getFoodItemById(id);
    return item?.image_url || null;
  },
}));

