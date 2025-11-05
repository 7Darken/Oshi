/**
 * Écran des étapes de recette en grand format
 * Affichage horizontal scrollable des étapes
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Thermometer } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { supabase } from '@/services/supabase';
import { FullRecipe } from '@/hooks/useRecipes';
import { Ingredient } from '@/types/recipe';
import { Step as StepType } from '@/types/recipe';
import { useFoodItems } from '@/hooks/useFoodItems';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - (Spacing.lg * 2);
const CARD_PADDING = Spacing.lg;

interface StepWithIngredients extends StepType {
  id: string;
  matchedIngredients?: Ingredient[];
}

export default function StepsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recipeId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { currentRecipe } = useRecipeStore();
  const { getFoodItemImage } = useFoodItems();
  
  const [recipe, setRecipe] = React.useState<FullRecipe | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Charger la recette avec ingrédients et étapes
  React.useEffect(() => {
    const loadRecipe = async () => {
      if (!params.recipeId) {
        // Utiliser currentRecipe du store
        if (currentRecipe) {
          setRecipe(currentRecipe);
        }
        setIsLoading(false);
        return;
      }

      try {
        // Récupérer la recette depuis Supabase
        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', params.recipeId)
          .single();

        if (recipeError) {
          console.error('❌ [Steps] Erreur lors de la récupération:', recipeError);
          setIsLoading(false);
          return;
        }

        // Récupérer les ingrédients
        const { data: ingredients } = await supabase
          .from('ingredients')
          .select('*')
          .eq('recipe_id', params.recipeId)
          .order('name');

        // Récupérer les étapes avec ingredients_used
        const { data: steps } = await supabase
          .from('steps')
          .select('*')
          .eq('recipe_id', params.recipeId)
          .order('order');

        setRecipe({
          ...recipeData,
          ingredients: ingredients || [],
          steps: steps || [],
        } as FullRecipe);
      } catch (error) {
        console.error('❌ [Steps] Erreur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipe();
  }, [params.recipeId, currentRecipe]);

  // Fonction pour normaliser les noms d'ingrédients (insensible à la casse, accents, etc.)
  const normalizeIngredientName = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .trim();
  }, []);

  // Matcher les ingrédients utilisés avec les ingrédients de la recette
  const matchIngredients = useCallback(
    (ingredientNames: string[], allIngredients: Ingredient[]): Ingredient[] => {
      if (!ingredientNames || ingredientNames.length === 0 || !allIngredients) {
        return [];
      }

      const matched: Ingredient[] = [];
      const normalizedRecipeIngredients = allIngredients.map((ing) => ({
        ...ing,
        normalizedName: normalizeIngredientName(ing.name),
      }));

      ingredientNames.forEach((usedName) => {
        const normalizedUsedName = normalizeIngredientName(usedName);
        
        // Chercher une correspondance exacte
        const exactMatch = normalizedRecipeIngredients.find(
          (ing) => ing.normalizedName === normalizedUsedName
        );

        if (exactMatch) {
          // Éviter les doublons
          if (!matched.find((m) => m.id === exactMatch.id)) {
            matched.push({
              id: exactMatch.id,
              name: exactMatch.name,
              quantity: exactMatch.quantity,
              unit: exactMatch.unit,
              food_item_id: exactMatch.food_item_id,
            });
          }
        } else {
          // Chercher une correspondance partielle (le nom utilisé contient le nom de l'ingrédient ou vice versa)
          const partialMatch = normalizedRecipeIngredients.find(
            (ing) =>
              ing.normalizedName.includes(normalizedUsedName) ||
              normalizedUsedName.includes(ing.normalizedName)
          );

          if (partialMatch && !matched.find((m) => m.id === partialMatch.id)) {
            matched.push({
              id: partialMatch.id,
              name: partialMatch.name,
              quantity: partialMatch.quantity,
              unit: partialMatch.unit,
              food_item_id: partialMatch.food_item_id,
            });
          }
        }
      });

      return matched;
    },
    [normalizeIngredientName]
  );

  // Trier les étapes par ordre et ajouter les ingrédients correspondants
  const sortedStepsWithIngredients = useMemo(() => {
    if (!recipe?.steps || !recipe?.ingredients) return [];

    return [...recipe.steps]
      .sort((a, b) => a.order - b.order)
      .map((step) => {
        const matchedIngredients = step.ingredients_used
          ? matchIngredients(step.ingredients_used, recipe.ingredients)
          : [];

        return {
          ...step,
          matchedIngredients,
        } as StepWithIngredients;
      });
  }, [recipe?.steps, recipe?.ingredients, matchIngredients]);

  const renderStep = useCallback(
    ({ item, index }: { item: StepWithIngredients; index: number }) => {
      const hasIngredients = item.matchedIngredients && item.matchedIngredients.length > 0;
      const hasMetadata = item.duration || item.temperature;

      return (
        <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
          {/* Numéro de l'étape */}
          <View style={[styles.stepNumberContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepNumber}>{item.order}</Text>
          </View>

          {/* Titre de l'étape */}
          <Text style={[styles.stepTitle, { color: colors.text }]}>
            Étape {item.order}
          </Text>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={[styles.stepText, { color: colors.text }]}>
              {item.text}
            </Text>
          </View>

          {/* Métadonnées (durée, température) */}
          {hasMetadata && (
            <View style={[styles.stepMetadata, { borderTopColor: colors.border }]}>
              {item.duration && (
                <View style={styles.metadataItem}>
                  <Clock size={16} color={colors.icon} />
                  <Text style={[styles.metadataText, { color: colors.icon }]}>
                    {item.duration}
                  </Text>
                </View>
              )}
              {item.temperature && (
                <View style={styles.metadataItem}>
                  <Thermometer size={16} color={colors.icon} />
                  <Text style={[styles.metadataText, { color: colors.icon }]}>
                    {item.temperature}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Ingrédients utilisés - Container fixé en bas */}
          {hasIngredients && (
            <View style={[styles.ingredientsContainer, { borderTopColor: colors.border }]}>
              <Text style={[styles.ingredientsTitle, { color: colors.text }]}>
                Ingrédients utilisés
              </Text>
              <ScrollView
                style={styles.ingredientsScrollView}
                contentContainerStyle={styles.ingredientsTags}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {item.matchedIngredients!.map((ingredient, ingIndex) => {
                  const foodItemImage = ingredient.food_item_id
                    ? getFoodItemImage(ingredient.food_item_id)
                    : null;
                  
                  const displayQuantity = () => {
                    if (ingredient.quantity && ingredient.unit) {
                      return `${ingredient.quantity} ${ingredient.unit}`;
                    }
                    if (ingredient.quantity) {
                      return ingredient.quantity;
                    }
                    return null;
                  };

                  // Capitaliser la première lettre du nom
                  const capitalizeName = (name: string) => {
                    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                  };

                  return (
                    <View
                      key={ingredient.id || `ing-${ingIndex}`}
                      style={[
                        styles.ingredientTag,
                        {
                          backgroundColor: colorScheme === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                          borderColor: colors.border,
                        }
                      ]}
                    >
                      {/* Icône */}
                      {foodItemImage ? (
                        <View style={styles.tagIconContainer}>
                          <ExpoImage
                            source={{ uri: foodItemImage }}
                            style={styles.tagIcon}
                            contentFit="contain"
                            transition={200}
                          />
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.tagIconContainer,
                            { backgroundColor: colors.secondary }
                          ]}
                        >
                          <Text style={styles.tagIconPlaceholder}>🥘</Text>
                        </View>
                      )}
                      
                      {/* Nom et quantité */}
                      <View style={styles.tagContent}>
                        <Text style={[styles.tagName, { color: colors.text }]}>
                          {capitalizeName(ingredient.name)}
                        </Text>
                        {displayQuantity() && (
                          <Text style={[styles.tagQuantity, { color: colors.icon }]}>
                            {displayQuantity()}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Indicateur de progression */}
          {index < sortedStepsWithIngredients.length - 1 && (
            <View style={styles.progressIndicator}>
              <View style={[styles.progressLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.nextStepText, { color: colors.icon }]}>
                Étape {item.order + 1} →
              </Text>
            </View>
          )}
        </View>
      );
    },
    [sortedStepsWithIngredients.length, colors]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: CARD_WIDTH + Spacing.md,
      offset: (CARD_WIDTH + Spacing.md) * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback(
    (item: StepWithIngredients) => item.id || `step-${item.order}`,
    []
  );

  if (isLoading || !recipe) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!sortedStepsWithIngredients || sortedStepsWithIngredients.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Aucune étape disponible
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {recipe.title}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Liste des étapes */}
      <FlatList
        data={sortedStepsWithIngredients}
        renderItem={renderStep}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + Spacing.md}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
      />

      {/* Indicateur de page */}
      <View style={styles.pageIndicator}>
        <Text style={[styles.pageIndicatorText, { color: colors.icon }]}>
          {sortedStepsWithIngredients.length} étape{sortedStepsWithIngredients.length > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xxl + Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  stepCard: {
    width: CARD_WIDTH,
    marginRight: Spacing.md,
    padding: CARD_PADDING,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flex: 1,
    justifyContent: 'flex-start',
  },
  stepNumberContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  descriptionContainer: {
    flex: 1,
    minHeight: 0, // Permet au container de se rétrécir
    marginBottom: Spacing.lg,
  },
  stepText: {
    fontSize: 18,
    lineHeight: 28,
  },
  ingredientsContainer: {
    marginTop: 'auto', // Pousser le container vers le bas
    marginBottom: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    maxHeight: 200, // Hauteur maximale pour éviter l'agrandissement
    minHeight: 0, // Permet au container de se rétrécir si nécessaire
    flexShrink: 0, // Empêche le container de se rétrécir
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  ingredientsScrollView: {
    maxHeight: 160, // Hauteur maximale pour le scroll (200 - 40 pour le titre et padding)
  },
  ingredientsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  ingredientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  tagIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tagIcon: {
    width: '100%',
    height: '100%',
  },
  tagIconPlaceholder: {
    fontSize: 14,
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tagName: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagQuantity: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepMetadata: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metadataText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressIndicator: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  progressLine: {
    width: 2,
    height: 40,
    marginBottom: Spacing.xs,
  },
  nextStepText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  pageIndicator: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  pageIndicatorText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
