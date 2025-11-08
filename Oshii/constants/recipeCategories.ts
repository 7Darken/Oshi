
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

// Types de repas avec icônes
export const MEAL_TYPES_CONFIG = [
  { value: 'petit-déjeuner', label: 'Petit-déjeuner', icon: require('@/assets/MealType/breakfast.png') },
  { value: 'déjeuner', label: 'Déjeuner', icon: require('@/assets/MealType/lunch.png') },
  { value: 'dîner', label: 'Dîner', icon: require('@/assets/MealType/diner.png') },
  { value: 'collation', label: 'Collation', icon: require('@/assets/MealType/collation.png') },
  { value: 'dessert', label: 'Dessert', icon: require('@/assets/MealType/dessert.png') },
  { value: 'entrée', label: 'Entrée', icon: require('@/assets/MealType/entree.png') },
] as const;

// Types de régime avec icônes
export const DIET_TYPES_CONFIG = [
  { value: 'végétarien', label: 'Végétarien', icon: require('@/assets/DietType/vegetarian2.png') },
  { value: 'protéiné', label: 'Protéiné', icon: require('@/assets/DietType/proteine.png') },
{ value: 'vegan', label: 'Vegan', icon: require('@/assets/DietType/vegan.png') },
  
  { value: 'sans gluten', label: 'Sans gluten', icon: require('@/assets/DietType/noGluten.png') },
  { value: 'sans lactose', label: 'Sans lactose', icon: require('@/assets/DietType/noLactose.png') },
  { value: 'sans viande', label: 'Sans viande', icon: require('@/assets/DietType/NoMeat.png') },
    { value: 'faible en calories', label: 'Faible en calories', icon: require('@/assets/DietType/Faiblecalories.png') },
  { value: 'faible en glucides', label: 'Faible en glucides', icon: require('@/assets/DietType/FaibleEnGlucides.png') },
  { value: 'sans sucre', label: 'Sans sucre', icon: require('@/assets/DietType/sugarFree.png') },
] as const;

// Types extraits pour compatibilité
export const MEAL_TYPES = MEAL_TYPES_CONFIG.map(item => item.value);
export const DIET_TYPES = DIET_TYPES_CONFIG.map(item => item.value);

export type CuisineOrigin = (typeof CUISINE_ORIGINS)[number];
export type MealType = typeof MEAL_TYPES_CONFIG[number]['value'];
export type DietType = typeof DIET_TYPES_CONFIG[number]['value'];

export const RECIPE_FILTER_CATEGORIES = {
  cuisineOrigins: CUISINE_ORIGINS,
  mealTypes: MEAL_TYPES,
  dietTypes: DIET_TYPES,
} as const;

