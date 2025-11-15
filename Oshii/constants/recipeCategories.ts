
const flagUrl = (code: string) => `https://flagcdn.com/w40/${code}.png`;

export const CUISINE_ORIGINS = [
  { value: 'japonaise', value_en: 'japanese', label: 'Japonaise', label_en: 'Japanese', countryCode: 'jp', flag: flagUrl('jp') },
  { value: 'chinoise', value_en: 'chinese', label: 'Chinoise', label_en: 'Chinese', countryCode: 'cn', flag: flagUrl('cn') },
  { value: 'coréenne', value_en: 'korean', label: 'Coréenne', label_en: 'Korean', countryCode: 'kr', flag: flagUrl('kr') },
  { value: 'thaïlandaise', value_en: 'thai', label: 'Thaïlandaise', label_en: 'Thai', countryCode: 'th', flag: flagUrl('th') },
  { value: 'vietnamienne', value_en: 'vietnamese', label: 'Vietnamienne', label_en: 'Vietnamese', countryCode: 'vn', flag: flagUrl('vn') },
  { value: 'indienne', value_en: 'indian', label: 'Indienne', label_en: 'Indian', countryCode: 'in', flag: flagUrl('in') },
  { value: 'italienne', value_en: 'italian', label: 'Italienne', label_en: 'Italian', countryCode: 'it', flag: flagUrl('it') },
  { value: 'française', value_en: 'french', label: 'Française', label_en: 'French', countryCode: 'fr', flag: flagUrl('fr') },
  { value: 'espagnole', value_en: 'spanish', label: 'Espagnole', label_en: 'Spanish', countryCode: 'es', flag: flagUrl('es') },
  { value: 'mexicaine', value_en: 'mexican', label: 'Mexicaine', label_en: 'Mexican', countryCode: 'mx', flag: flagUrl('mx') },
  { value: 'américaine', value_en: 'american', label: 'Américaine', label_en: 'American', countryCode: 'us', flag: flagUrl('us') },
  { value: 'libanaise', value_en: 'lebanese', label: 'Libanaise', label_en: 'Lebanese', countryCode: 'lb', flag: flagUrl('lb') },
  { value: 'marocaine', value_en: 'moroccan', label: 'Marocaine', label_en: 'Moroccan', countryCode: 'ma', flag: flagUrl('ma') },
  { value: 'turque', value_en: 'turkish', label: 'Turque', label_en: 'Turkish', countryCode: 'tr', flag: flagUrl('tr') },
  { value: 'grecque', value_en: 'greek', label: 'Grecque', label_en: 'Greek', countryCode: 'gr', flag: flagUrl('gr') },
  { value: 'brésilienne', value_en: 'brazilian', label: 'Brésilienne', label_en: 'Brazilian', countryCode: 'br', flag: flagUrl('br') },
  { value: 'portugaise', value_en: 'portuguese', label: 'Portugaise', label_en: 'Portuguese', countryCode: 'pt', flag: flagUrl('pt') },
  { value: 'allemande', value_en: 'german', label: 'Allemande', label_en: 'German', countryCode: 'de', flag: flagUrl('de') },
  { value: 'britannique', value_en: 'british', label: 'Britannique', label_en: 'British', countryCode: 'gb', flag: flagUrl('gb') },
  { value: 'africaine', value_en: 'african', label: 'Africaine', label_en: 'African', countryCode: 'za', flag: flagUrl('za') },
  { value: 'fusion', value_en: 'fusion', label: 'Cuisine fusion', label_en: 'Fusion cuisine', countryCode: 'un', flag: flagUrl('un') },
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
export const CUISINE_ORIGIN_VALUES_EN = CUISINE_ORIGINS.map(item => item.value_en);

export type CuisineOriginOption = (typeof CUISINE_ORIGINS)[number];
export type CuisineOrigin = CuisineOriginOption['value'];
export type CuisineOriginEn = CuisineOriginOption['value_en'];
export type MealType = typeof MEAL_TYPES_CONFIG[number]['value'];
export type DietType = typeof DIET_TYPES_CONFIG[number]['value'];
export type MealTypeEn = typeof MEAL_TYPES_CONFIG[number]['value_en'];
export type DietTypeEn = typeof DIET_TYPES_CONFIG[number]['value_en'];

export const RECIPE_FILTER_CATEGORIES = {
  cuisineOrigins: CUISINE_ORIGIN_VALUES,
  mealTypes: MEAL_TYPES,
  dietTypes: DIET_TYPES,
} as const;

