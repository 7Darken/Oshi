/**
 * Store Zustand pour la gestion de l'état global des recettes
 * Gère la recette actuelle, l'état de chargement et les erreurs
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import {
  Recipe,
  RecipeStore,
  FullRecipe,
  DatabaseIngredient,
  DatabaseStep,
} from '@/types/recipe';

async function fetchRecipesFromSupabase() {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      ingredients(*),
      steps(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const recipes: FullRecipe[] = (data || []).map((recipe: any) => ({
    ...recipe,
    ingredients: ((recipe.ingredients || []) as DatabaseIngredient[]).sort((a, b) =>
      (a.name || '').localeCompare(b.name || ''),
    ),
    steps: ((recipe.steps || []) as DatabaseStep[]).sort((a, b) => (a.order || 0) - (b.order || 0)),
  }));

  return recipes;
}

function normalizeRecipe(recipe: Recipe | FullRecipe): FullRecipe | null {
  if (!recipe.id) {
    console.warn('⚠️ [Store] Impossible d\'ajouter une recette sans identifiant.');
    return null;
  }

  const normalizedIngredients: DatabaseIngredient[] = (recipe.ingredients || []).map(
    (ingredient: any) => ({
      id: ingredient.id ?? undefined,
      recipe_id: ingredient.recipe_id ?? undefined,
      name: ingredient.name,
      quantity: ingredient.quantity ?? null,
      unit: ingredient.unit ?? null,
      food_item_id: ingredient.food_item_id ?? null,
    })
  );

  const normalizedSteps: DatabaseStep[] = (recipe.steps || []).map((step: any) => ({
    id: step.id ?? undefined,
    recipe_id: step.recipe_id ?? undefined,
    order: step.order,
    text: step.text,
    duration: step.duration ?? null,
    temperature: step.temperature ?? null,
  }));

  const normalizedRecipe: FullRecipe = {
    id: recipe.id,
    user_id: recipe.user_id ?? '',
    folder_id: recipe.folder_id ?? null,
    title: recipe.title,
    servings: recipe.servings ?? null,
    prep_time: recipe.prep_time ?? null,
    cook_time: recipe.cook_time ?? null,
    total_time: recipe.total_time ?? null,
    source_url: recipe.source_url ?? null,
    image_url: recipe.image_url ?? null,
    created_at: recipe.created_at ?? new Date().toISOString(),
    calories: recipe.calories ?? null,
    proteins: recipe.proteins ?? null,
    carbs: recipe.carbs ?? null,
    fats: recipe.fats ?? null,
    ingredients: normalizedIngredients,
    steps: normalizedSteps,
  };

  if ('nutrition' in recipe && (recipe as Recipe).nutrition) {
    (normalizedRecipe as Recipe).nutrition = (recipe as Recipe).nutrition;
  }

  if ('equipment' in recipe && (recipe as Recipe).equipment) {
    (normalizedRecipe as Recipe).equipment = (recipe as Recipe).equipment;
  }

  return normalizedRecipe;
}

interface ExtendedRecipeStore extends RecipeStore {
  showAnalyzeSheet: boolean;
  openAnalyzeSheet: () => void;
  closeAnalyzeSheet: () => void;
}

export const useRecipeStore = create<ExtendedRecipeStore>()(
  persist((set, get) => ({
  // État initial
  currentRecipe: null,
  isLoading: false,
  error: null,
  analyzedUrl: null,
  showAnalyzeSheet: false,
  recipes: [],
  recipesLoading: false,
  recipesError: null,
  recipesLastUpdatedAt: null,
  hasFetchedRecipes: false,

  // Actions
  setRecipe: (recipe: Recipe, url: string) => {
    console.log('📦 [Store] setRecipe appelé');
    console.log('📦 [Store] Recipe ID:', recipe.id);
    console.log('📦 [Store] URL:', url);
    set({
      currentRecipe: recipe,
      analyzedUrl: url,
      isLoading: false,
      error: null,
    });
    console.log('📦 [Store] État mis à jour: isLoading=false, currentRecipe=', recipe.title);
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading, error: null });
  },

  setError: (error: string | null) => {
    set({ error, isLoading: false });
  },

  clearRecipe: () => {
    set({
      currentRecipe: null,
      analyzedUrl: null,
      isLoading: false,
      error: null,
    });
  },

  openAnalyzeSheet: () => {
    set({ showAnalyzeSheet: true });
  },

  closeAnalyzeSheet: () => {
    set({ showAnalyzeSheet: false });
  },

  setRecipes: (recipes: FullRecipe[]) => {
    set({
      recipes,
      recipesLoading: false,
      recipesError: null,
      recipesLastUpdatedAt: Date.now(),
      hasFetchedRecipes: true,
    });
  },

  setRecipesLoading: (loading: boolean) => {
    set({ recipesLoading: loading });
  },

  setRecipesError: (recipesError: string | null) => {
    set({ recipesError });
  },

  markRecipesFetched: () => {
    if (!get().hasFetchedRecipes) {
      set({ hasFetchedRecipes: true });
    }
  },

  addRecipe: (recipeInput) => {
    const normalized = normalizeRecipe(recipeInput);

    if (!normalized) {
      return false;
    }

    let didInsert = false;

    set((state) => {
      const exists = state.recipes.some((r) => r.id === normalized.id);
      const updatedRecipes = exists
        ? state.recipes.map((r) => (r.id === normalized.id ? { ...r, ...normalized } : r))
        : [normalized, ...state.recipes];

      didInsert = !exists;

      return {
        recipes: updatedRecipes,
        recipesLastUpdatedAt: Date.now(),
        hasFetchedRecipes: updatedRecipes.length > 0 || state.hasFetchedRecipes,
      };
    });

    return didInsert;
  },

  refreshRecipes: async ({ silent = false } = {}) => {
    const { setRecipesLoading, setRecipesError, setRecipes, markRecipesFetched } = get();

    if (!silent) {
      setRecipesLoading(true);
      setRecipesError(null);
    }

    try {
      const recipes = await fetchRecipesFromSupabase();
      setRecipes(recipes);
      markRecipesFetched();
    } catch (err: any) {
      console.error('❌ [Store] Erreur lors du refresh des recettes:', err);
      const message = err?.message || 'Une erreur est survenue';
      setRecipesError(message);
      if (!silent) {
        throw err;
      }
    } finally {
      if (!silent) {
        setRecipesLoading(false);
      }
    }
  },
  }), {
    name: 'oshii-recipes-cache',
    version: 1,
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({
      recipes: state.recipes,
      recipesLastUpdatedAt: state.recipesLastUpdatedAt,
      hasFetchedRecipes: state.hasFetchedRecipes,
    }),
  })
);

