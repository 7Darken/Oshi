/**
 * Store Zustand pour la gestion de l'état global des recettes
 * Gère la recette actuelle, l'état de chargement et les erreurs
 */

import { create } from 'zustand';
import { Recipe, RecipeStore } from '@/types/recipe';

interface ExtendedRecipeStore extends RecipeStore {
  showAnalyzeSheet: boolean;
  openAnalyzeSheet: () => void;
  closeAnalyzeSheet: () => void;
}

export const useRecipeStore = create<ExtendedRecipeStore>((set) => ({
  // État initial
  currentRecipe: null,
  isLoading: false,
  error: null,
  analyzedUrl: null,
  showAnalyzeSheet: false,

  // Actions
  setRecipe: (recipe: Recipe, url: string) => {
    set({
      currentRecipe: recipe,
      analyzedUrl: url,
      isLoading: false,
      error: null,
    });
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
}));

