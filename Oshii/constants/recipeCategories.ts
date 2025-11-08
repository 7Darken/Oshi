export const CUISINE_ORIGINS = [
  'japonaise',
  'chinoise',
  'coréenne',
  'thaïlandaise',
  'vietnamienne',
  'indienne',
  'italienne',
  'française',
  'espagnole',
  'mexicaine',
  'américaine',
  'méditerranéenne',
  'libanaise',
  'marocaine',
  'turque',
  'grecque',
  'brésilienne',
  'portugaise',
  'allemande',
  'britannique',
  'scandinave',
  'africaine',
  'fusion',
] as const;

export const MEAL_TYPES = [
  'petit-déjeuner',
  'déjeuner',
  'dîner',
  'collation',
  'dessert',
  'boisson',
  'entrée',
] as const;

export const DIET_TYPES = [
  'omnivore',
  'végétarien',
  'sans gluten',
  'sans lactose',
  'keto',
  'low carb',
  'protéiné',
  'faible en calories',
  'régime anti-inflammatoire',
  'riche en glucides',
  'sans sucre',
] as const;

export type CuisineOrigin = (typeof CUISINE_ORIGINS)[number];
export type MealType = (typeof MEAL_TYPES)[number];
export type DietType = (typeof DIET_TYPES)[number];

export const RECIPE_FILTER_CATEGORIES = {
  cuisineOrigins: CUISINE_ORIGINS,
  mealTypes: MEAL_TYPES,
  dietTypes: DIET_TYPES,
} as const;

