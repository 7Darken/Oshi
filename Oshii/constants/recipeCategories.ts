
const flagUrl = (code: string) => `https://flagcdn.com/w40/${code}.png`;

export const CUISINE_ORIGINS = [
  { value: 'japonaise', label: 'Japonaise', countryCode: 'jp', flag: flagUrl('jp') },
  { value: 'chinoise', label: 'Chinoise', countryCode: 'cn', flag: flagUrl('cn') },
  { value: 'coréenne', label: 'Coréenne', countryCode: 'kr', flag: flagUrl('kr') },
  { value: 'thaïlandaise', label: 'Thaïlandaise', countryCode: 'th', flag: flagUrl('th') },
  { value: 'vietnamienne', label: 'Vietnamienne', countryCode: 'vn', flag: flagUrl('vn') },
  { value: 'indienne', label: 'Indienne', countryCode: 'in', flag: flagUrl('in') },
  { value: 'italienne', label: 'Italienne', countryCode: 'it', flag: flagUrl('it') },
  { value: 'française', label: 'Française', countryCode: 'fr', flag: flagUrl('fr') },
  { value: 'espagnole', label: 'Espagnole', countryCode: 'es', flag: flagUrl('es') },
  { value: 'mexicaine', label: 'Mexicaine', countryCode: 'mx', flag: flagUrl('mx') },
  { value: 'américaine', label: 'Américaine', countryCode: 'us', flag: flagUrl('us') },
  { value: 'libanaise', label: 'Libanaise', countryCode: 'lb', flag: flagUrl('lb') },
  { value: 'marocaine', label: 'Marocaine', countryCode: 'ma', flag: flagUrl('ma') },
  { value: 'turque', label: 'Turque', countryCode: 'tr', flag: flagUrl('tr') },
  { value: 'grecque', label: 'Grecque', countryCode: 'gr', flag: flagUrl('gr') },
  { value: 'brésilienne', label: 'Brésilienne', countryCode: 'br', flag: flagUrl('br') },
  { value: 'portugaise', label: 'Portugaise', countryCode: 'pt', flag: flagUrl('pt') },
  { value: 'allemande', label: 'Allemande', countryCode: 'de', flag: flagUrl('de') },
  { value: 'britannique', label: 'Britannique', countryCode: 'gb', flag: flagUrl('gb') },
  { value: 'africaine', label: 'Africaine', countryCode: 'za', flag: flagUrl('za') },
  { value: 'fusion', label: 'Cuisine fusion', countryCode: 'un', flag: flagUrl('un') },
] as const;

// Types de repas avec icônes
export const MEAL_TYPES_CONFIG = [
  {
    value: 'petit-déjeuner',
    value_en: 'breakfast',
    label: 'Petit-déjeuner',
    label_en: 'Breakfast',
    icon: require('@/assets/MealType/breakfast.png'),
  },
  {
    value: 'déjeuner',
    value_en: 'lunch',
    label: 'Déjeuner',
    label_en: 'Lunch',
    icon: require('@/assets/MealType/lunch.png'),
  },
  {
    value: 'collation',
    value_en: 'snack',
    label: 'Collation',
    label_en: 'Snack',
    icon: require('@/assets/MealType/collation.png'),
  },
  {
    value: 'dessert',
    value_en: 'dessert',
    label: 'Dessert',
    label_en: 'Dessert',
    icon: require('@/assets/MealType/dessert.png'),
  },
  {
    value: 'dîner',
    value_en: 'dinner',
    label: 'Dîner',
    label_en: 'Dinner',
    icon: require('@/assets/MealType/diner.png'),
  },
  {
    value: 'entrée',
    value_en: 'starter',
    label: 'Entrée',
    label_en: 'Starter',
    icon: require('@/assets/MealType/entree.png'),
  },
] as const;

// Types de régime avec icônes
export const DIET_TYPES_CONFIG = [
  {
    value: 'végétarien',
    value_en: 'vegetarian',
    label: 'Végétarien',
    label_en: 'Vegetarian',
    icon: require('@/assets/DietType/vegetarian2.png'),
  },
  {
    value: 'protéiné',
    value_en: 'high protein',
    label: 'Protéiné',
    label_en: 'High protein',
    icon: require('@/assets/DietType/proteine.png'),
  },
  {
    value: 'vegan',
    value_en: 'vegan',
    label: 'Vegan',
    label_en: 'Vegan',
    icon: require('@/assets/DietType/vegan.png'),
  },
  {
    value: 'sans gluten',
    value_en: 'gluten free',
    label: 'Sans gluten',
    label_en: 'Gluten free',
    icon: require('@/assets/DietType/noGluten.png'),
  },
  {
    value: 'sans lactose',
    value_en: 'lactose free',
    label: 'Sans lactose',
    label_en: 'Lactose free',
    icon: require('@/assets/DietType/noLactose.png'),
  },
  {
    value: 'sans viande',
    value_en: 'meat free',
    label: 'Sans viande',
    label_en: 'Meat free',
    icon: require('@/assets/DietType/NoMeat.png'),
  },
  {
    value: 'faible en calories',
    value_en: 'low calorie',
    label: 'Faible en calories',
    label_en: 'Low calorie',
    icon: require('@/assets/DietType/Faiblecalories.png'),
  },
  {
    value: 'faible en glucides',
    value_en: 'low carb',
    label: 'Faible en glucides',
    label_en: 'Low carb',
    icon: require('@/assets/DietType/FaibleEnGlucides.png'),
  },
  {
    value: 'sans sucre',
    value_en: 'sugar free',
    label: 'Sans sucre',
    label_en: 'Sugar free',
    icon: require('@/assets/DietType/sugarFree.png'),
  },
] as const;

// Types extraits pour compatibilité
export const MEAL_TYPES = MEAL_TYPES_CONFIG.map(item => item.value);
export const DIET_TYPES = DIET_TYPES_CONFIG.map(item => item.value);
export const CUISINE_ORIGIN_VALUES = CUISINE_ORIGINS.map(item => item.value);
export const MEAL_TYPES_EN = MEAL_TYPES_CONFIG.map(item => item.value_en);
export const DIET_TYPES_EN = DIET_TYPES_CONFIG.map(item => item.value_en);

export type CuisineOriginOption = (typeof CUISINE_ORIGINS)[number];
export type CuisineOrigin = CuisineOriginOption['value'];
export type MealType = typeof MEAL_TYPES_CONFIG[number]['value'];
export type DietType = typeof DIET_TYPES_CONFIG[number]['value'];
export type MealTypeEn = typeof MEAL_TYPES_CONFIG[number]['value_en'];
export type DietTypeEn = typeof DIET_TYPES_CONFIG[number]['value_en'];

export const RECIPE_FILTER_CATEGORIES = {
  cuisineOrigins: CUISINE_ORIGIN_VALUES,
  mealTypes: MEAL_TYPES,
  dietTypes: DIET_TYPES,
} as const;

