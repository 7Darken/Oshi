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

export interface DatabaseRecipe {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  servings: number | null;
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  source_url: string | null;
  image_url: string | null;
  created_at: string;
  calories: number | null;
  proteins: number | null;
  carbs: number | null;
  fats: number | null;
}

export interface DatabaseIngredient {
  id?: string;
  recipe_id?: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  food_item_id: string | null;
}

export interface DatabaseStep {
  id?: string;
  recipe_id?: string;
  order: number;
  text: string;
  duration: string | null;
  temperature: string | null;
}

export interface FullRecipe extends DatabaseRecipe {
  ingredients: DatabaseIngredient[];
  steps: DatabaseStep[];
}

export interface RecipeState {
  currentRecipe: Recipe | null;
  isLoading: boolean;
  error: string | null;
  analyzedUrl: string | null;
}

export interface RecipeListState {
  recipes: FullRecipe[];
  recipesLoading: boolean;
  recipesError: string | null;
  recipesLastUpdatedAt: number | null;
  hasFetchedRecipes: boolean;
}

export interface RecipeStore extends RecipeState, RecipeListState {
  setRecipe: (recipe: Recipe, url: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearRecipe: () => void;
  addRecipe: (recipe: Recipe | FullRecipe) => boolean;
  refreshRecipes: (options?: { silent?: boolean }) => Promise<void>;
  setRecipes: (recipes: FullRecipe[]) => void;
  setRecipesError: (error: string | null) => void;
  setRecipesLoading: (loading: boolean) => void;
  markRecipesFetched: () => void;
}

