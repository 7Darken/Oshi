/**
 * Système de conversion d'ingrédients pour utilisateurs sans balance
 * Convertit les grammes/ml en cuillères à soupe/café selon la catégorie
 */

// Types
export type IngredientCategory = 'liquide' | 'solide_fin' | 'dense' | 'pateux';
export type SpoonType = 'c. à soupe' | 'c. à café';

export interface ConversionResult {
  value: number;
  unit: string;
  isConverted: boolean;
  isApproximate: boolean;
}

// Configuration des densités moyennes par catégorie (en grammes/ml par cuillère à soupe)
const DENSITIES: Record<IngredientCategory, number> = {
  liquide: 15,        // eau, lait, huile
  solide_fin: 10,     // farine, sucre glace, cacao
  dense: 14,          // sucre, sel, riz
  pateux: 20,         // beurre, miel, pâte
};

// Conversion: 1 c. à soupe = 3 c. à café
const TABLESPOON_TO_TEASPOON = 3;

// Patterns de détection par catégorie
const CATEGORY_PATTERNS: Record<IngredientCategory, RegExp[]> = {
  liquide: [
    /\b(eau|lait|crème|huile|bouillon|jus|vin|vinaigre|sauce\s+soja|liquide)\b/i,
    /\b(water|milk|cream|oil|broth|juice|wine|vinegar|liquid)\b/i,
  ],
  solide_fin: [
    /\b(farine|sucre\s+glace|cacao|maïzena|levure|bicarbonate|poudre)\b/i,
    /\b(flour|icing\s+sugar|cocoa|cornstarch|baking\s+powder|powder)\b/i,
  ],
  dense: [
    /\b(sucre|sel|riz|quinoa|lentilles|pois\s+chiches|semoule|graines)\b/i,
    /\b(sugar|salt|rice|quinoa|lentils|chickpeas|semolina|seeds)\b/i,
  ],
  pateux: [
    /\b(beurre|miel|yaourt|fromage\s+blanc|pâte|purée|crème\s+fraîche|tahini)\b/i,
    /\b(butter|honey|yogurt|cream\s+cheese|paste|puree|tahini)\b/i,
  ],
};

/**
 * Détecte la catégorie d'un ingrédient à partir de son nom
 * @param ingredientName - Nom de l'ingrédient
 * @returns Catégorie détectée ou 'dense' par défaut
 */
export function detectCategory(ingredientName: string): IngredientCategory {
  const lowerName = ingredientName.toLowerCase();

  // Tester chaque catégorie
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerName)) {
        return category as IngredientCategory;
      }
    }
  }

  // Par défaut, considérer comme dense (le plus courant)
  return 'dense';
}

/**
 * Parse une quantité string en nombre
 * Gère les formats : "250", "1/2", "1.5", "2,5"
 */
function parseQuantity(quantityStr: string): number | null {
  if (!quantityStr || quantityStr.trim() === '') return null;

  // Remplacer virgule par point
  let cleaned = quantityStr.replace(',', '.').trim();

  // Gérer les fractions (ex: "1/2")
  const fractionMatch = cleaned.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseFloat(fractionMatch[1]);
    const denominator = parseFloat(fractionMatch[2]);
    return numerator / denominator;
  }

  // Parser normalement
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Normalise l'unité (gère les variations g/gr/gram, ml/millilitre, etc.)
 */
function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim();

  // Grammes
  if (/^(g|gr|gram|gramme|grammes)$/i.test(lower)) return 'g';

  // Millilitres
  if (/^(ml|millilitre|millilitres)$/i.test(lower)) return 'ml';

  // Kilogrammes
  if (/^(kg|kilo|kilogramme|kilogrammes)$/i.test(lower)) return 'kg';

  // Litres
  if (/^(l|litre|litres)$/i.test(lower)) return 'l';

  return lower;
}

/**
 * Convertit une quantité en grammes/ml vers cuillères (soupe ou café)
 * @param value - Valeur numérique
 * @param unit - Unité (g, ml, etc.)
 * @param category - Catégorie de l'ingrédient
 * @returns Résultat formaté avec cuillères
 */
function convertToSpoons(
  value: number,
  unit: string,
  category: IngredientCategory
): { value: number; unit: SpoonType } | null {
  const normalized = normalizeUnit(unit);

  // Conversion seulement pour g et ml
  if (normalized !== 'g' && normalized !== 'ml') {
    return null;
  }

  // Convertir kg et L en g et ml
  let adjustedValue = value;
  if (normalized === 'kg') {
    adjustedValue = value * 1000;
  } else if (normalized === 'l') {
    adjustedValue = value * 1000;
  }

  // Obtenir la densité pour cette catégorie
  const densityPerTablespoon = DENSITIES[category];

  // Calculer le nombre de cuillères à soupe
  const tablespoons = adjustedValue / densityPerTablespoon;

  // Si < 1 c. à soupe, convertir en c. à café
  if (tablespoons < 1) {
    const teaspoons = tablespoons * TABLESPOON_TO_TEASPOON;
    return {
      value: Math.round(teaspoons), // Arrondir sans décimale
      unit: 'c. à café',
    };
  }

  return {
    value: Math.round(tablespoons), // Arrondir sans décimale
    unit: 'c. à soupe',
  };
}

/**
 * Formate un résultat de conversion en chaîne lisible
 */
function formatConversionResult(result: ConversionResult): string {
  if (!result.isConverted) {
    return result.value ? `${result.value} ${result.unit}` : result.unit || '';
  }

  const approx = result.isApproximate ? ' (approx.)' : '';
  return `${result.value} ${result.unit}${approx}`;
}

/**
 * Fonction principale de conversion
 * @param ingredientName - Nom de l'ingrédient
 * @param quantity - Quantité (string ou number)
 * @param unit - Unité
 * @returns Résultat de conversion
 */
export function convertIngredient(
  ingredientName: string,
  quantity: string | number | null | undefined,
  unit: string | null | undefined
): ConversionResult {
  // Cas où pas de quantité ou d'unité
  if (!quantity || !unit) {
    return {
      value: 0,
      unit: unit || '',
      isConverted: false,
      isApproximate: false,
    };
  }

  // Parser la quantité
  const numericValue =
    typeof quantity === 'number' ? quantity : parseQuantity(quantity);

  if (numericValue === null) {
    return {
      value: 0,
      unit: unit,
      isConverted: false,
      isApproximate: false,
    };
  }

  // Détecter la catégorie
  const category = detectCategory(ingredientName);

  // Tenter la conversion
  const converted = convertToSpoons(numericValue, unit, category);

  if (!converted) {
    // Pas de conversion possible, retourner l'original
    return {
      value: numericValue,
      unit: unit,
      isConverted: false,
      isApproximate: false,
    };
  }

  // Conversion réussie
  return {
    value: converted.value,
    unit: converted.unit,
    isConverted: true,
    isApproximate: true,
  };
}

/**
 * Convertit un ingrédient et retourne la chaîne formatée
 * Fonction helper pour l'UI
 */
export function convertIngredientToString(
  ingredientName: string,
  quantity: string | number | null | undefined,
  unit: string | null | undefined
): string {
  const result = convertIngredient(ingredientName, quantity, unit);
  return formatConversionResult(result);
}

/**
 * Vérifie si un ingrédient peut être converti
 */
export function canConvertIngredient(unit: string | null | undefined): boolean {
  if (!unit) return false;
  const normalized = normalizeUnit(unit);
  return normalized === 'g' || normalized === 'ml' || normalized === 'kg' || normalized === 'l';
}
