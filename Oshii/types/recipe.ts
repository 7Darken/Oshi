/**
 * Types TypeScript pour les recettes
 * Structure de données conforme aux spécifications du Requirements.md
 */

export interface Ingredient {
  id?: string;
  recipe_id?: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  food_item_id?: string | null;
}

export interface Step {
  id?: string;
  recipe_id?: string;
  order: number;
  text: string;
  duration?: string | null;
  temperature?: string | null;
  ingredients_used?: string[] | null;
}

export interface Recipe {
  id?: string;
  user_id?: string;
  folder_id?: string | null;
  title: string;
  ingredients: Ingredient[];
  steps: Step[];
  prep_time?: string | null;
  cook_time?: string | null;
  total_time?: string | null;
  source_url?: string | null;
  image_url?: string | null;
  servings?: number | null;
  proteins?: number | null;
  carbs?: number | null;
  fats?: number | null;
  calories?: number | null;
  equipment?: string[] | null;
  created_at?: string;
  nutrition?: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  };
}

export interface RecipeState {
  currentRecipe: Recipe | null;
  isLoading: boolean;
  error: string | null;
  analyzedUrl: string | null;
}

export interface RecipeStore extends RecipeState {
  setRecipe: (recipe: Recipe, url: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearRecipe: () => void;
}

