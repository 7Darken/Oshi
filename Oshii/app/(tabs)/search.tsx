/**
 * Onglet Recherche - Rechercher des recettes par ingrédient
 */

import { RecipeFilterSheet } from '@/components/RecipeFilterSheet';
import { SearchBarWithTags } from '@/components/SearchBarWithTags';
import { Card } from '@/components/ui/Card';
import type { DietType, MealType } from '@/constants/recipeCategories';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFoodItems } from '@/hooks/useFoodItems';
import { useSharedRecipeIds } from '@/hooks/useSharedRecipeIds';
import { supabase } from '@/services/supabase';
import { FoodItem } from '@/stores/useFoodItemsStore';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clock, FileText, Search, SlidersHorizontal, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatLabel = (value: string) =>
  value
    .split(' ')
    .map((segment) =>
      segment
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-'),
    )
    .join(' ');

interface SearchRecipe {
  id: string;
  title: string;
  image_url: string | null;
  total_time: string | null;
  servings: number | null;
  meal_type: MealType | null;
  diet_type: DietType[] | null;
}

// Composant de carte de recette mémorisé pour éviter les re-renders inutiles
const RecipeCard = React.memo(({ 
  item, 
  onPress
}: { 
  item: SearchRecipe; 
  onPress: (id: string) => void;
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.cardContainer}>
        {item.image_url ? (
          <ExpoImage
            source={{ uri: item.image_url }}
            style={styles.recipeImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.recipeImage, styles.noImageContainer, { backgroundColor: colors.secondary }]}>
            <FileText size={32} color={colors.icon} />
          </View>
        )}
        <View style={styles.recipeInfo}>
          <Text style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.recipeMeta}>
            {item.total_time && (
              <View style={styles.metaItem}>
                <Clock size={14} color={colors.icon} />
                <Text style={[styles.recipeMetaText, { color: colors.icon }]}>
                  {item.total_time}
                </Text>
              </View>
            )}
            {item.servings && (
              <View style={styles.metaItem}>
                <Users size={14} color={colors.icon} />
                <Text style={[styles.recipeMetaText, { color: colors.icon }]}>
                  {item.servings}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée : ne re-render que si l'item a changé
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.image_url === nextProps.item.image_url &&
    prevProps.item.total_time === nextProps.item.total_time &&
    prevProps.item.servings === nextProps.item.servings
  );
});

RecipeCard.displayName = 'RecipeCard';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuthContext();
  const { isInitialized: foodItemsReady } = useFoodItems();
  const { sharedRecipeIds } = useSharedRecipeIds();

  const [selectedFoodItems, setSelectedFoodItems] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<SearchRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([]);
  const [selectedDietTypes, setSelectedDietTypes] = useState<DietType[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<SearchRecipe[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const previousRecipeIdsRef = useRef<Set<string>>(new Set());
  const previousRecipesRef = useRef<SearchRecipe[]>([]);
  const previousFilterSignatureRef = useRef<string>('');
  const recentFetchInProgressRef = useRef(false);
  const recentRecipesRequestedRef = useRef(false);

  const hasActiveFilters = useMemo(
    () => selectedMealTypes.length > 0 || selectedDietTypes.length > 0,
    [selectedDietTypes.length, selectedMealTypes.length],
  );

  // Rechercher des recettes basées sur les food_items sélectionnés
  useEffect(() => {
    const searchRecipes = async () => {
      if (!user?.id || !foodItemsReady) return;

      // Ne rien faire si aucun food_item n'est sélectionné
      if (selectedFoodItems.length === 0) {
        setRecipes([]);
        previousRecipeIdsRef.current = new Set();
        previousRecipesRef.current = [];
        previousFilterSignatureRef.current = '';
        return;
      }

      setIsLoading(true);
      try {
        const foodItemIds = selectedFoodItems.map((item) => item.id);

        // Pour chaque food_item, récupérer les recipe_ids qui l'ont
        // On veut les recettes qui ont TOUS les food_items sélectionnés
        const recipeIdSets: Set<string>[] = [];

        for (const foodItemId of foodItemIds) {
          const { data: ingredients, error: ingredientsError } = await supabase
            .from('ingredients')
            .select('recipe_id')
            .eq('food_item_id', foodItemId);

          if (ingredientsError) {
            console.error('❌ Erreur lors de la recherche d\'ingrédients:', ingredientsError);
            setIsLoading(false);
            return;
          }

          const recipeIds = new Set(ingredients?.map(ing => ing.recipe_id) || []);
          recipeIdSets.push(recipeIds);
        }

        // Intersection de tous les sets (recettes qui ont tous les food_items)
        let intersection = recipeIdSets[0];
        for (let i = 1; i < recipeIdSets.length; i++) {
          intersection = new Set([...intersection].filter(id => recipeIdSets[i].has(id)));
        }

        const recipeIds = Array.from(intersection);
        const newRecipeIdsSet = new Set(recipeIds);
        const filterSignature = JSON.stringify({
          meal: [...selectedMealTypes].sort(),
          diet: [...selectedDietTypes].sort(),
        });

        // Comparer avec les recettes précédentes pour éviter les re-renders inutiles
        const hasSameRecipes = 
          previousRecipeIdsRef.current.size === newRecipeIdsSet.size &&
          Array.from(previousRecipeIdsRef.current).every(id => newRecipeIdsSet.has(id));

        // Si ce sont les mêmes recettes, ne pas faire de requête
        if (
          hasSameRecipes &&
          previousRecipesRef.current.length > 0 &&
          previousFilterSignatureRef.current === filterSignature
        ) {
          console.log('✅ [Search] Mêmes recettes, pas de re-render');
          setIsLoading(false);
          return;
        }

        if (recipeIds.length === 0) {
          setRecipes([]);
          previousRecipeIdsRef.current = new Set();
          previousRecipesRef.current = [];
          setIsLoading(false);
          return;
        }

        // Identifier les recettes à garder et les nouvelles à ajouter
        const recipesToKeep: SearchRecipe[] = [];
        const newRecipeIds = recipeIds.filter(id => !previousRecipeIdsRef.current.has(id));

        // Garder les recettes qui sont toujours présentes (même référence d'objet = pas de re-render)
        previousRecipesRef.current.forEach(recipe => {
          if (newRecipeIdsSet.has(recipe.id)) {
            recipesToKeep.push(recipe);
          }
        });

        // Récupérer uniquement les nouvelles recettes (celles qui n'étaient pas dans les précédentes)
        let newRecipes: SearchRecipe[] = [];

        if (newRecipeIds.length > 0) {
          const { data: newRecipesData, error: newRecipesError } = await supabase
            .from('recipes')
            .select('id, title, image_url, total_time, servings, meal_type, diet_type')
            .eq('user_id', user.id)
            .in('id', newRecipeIds)
            .order('created_at', { ascending: false });

          if (newRecipesError) {
            console.error('❌ Erreur lors de la récupération des nouvelles recettes:', newRecipesError);
          } else if (newRecipesData) {
            newRecipes = newRecipesData as SearchRecipe[];
          }
        }

        // Construire la liste finale : garder les anciennes (même référence) + ajouter les nouvelles
        const matchesFilters = (recipe: SearchRecipe) => {
          const mealMatch =
            selectedMealTypes.length === 0 ||
            (recipe.meal_type ? selectedMealTypes.includes(recipe.meal_type) : false);
          const dietMatch =
            selectedDietTypes.length === 0 ||
            (recipe.diet_type || []).some((value) =>
              selectedDietTypes.includes(value),
            );

          return mealMatch && dietMatch;
        };

        const filteredRecipesToKeep = recipesToKeep.filter(matchesFilters);
        const filteredNewRecipes = newRecipes.filter(matchesFilters);

        const finalRecipes = [...filteredRecipesToKeep, ...filteredNewRecipes];
        
        // Vérifier si le tableau a vraiment changé (par référence)
        const hasChanged = 
          finalRecipes.length !== previousRecipesRef.current.length ||
          finalRecipes.some((recipe, index) => recipe.id !== previousRecipesRef.current[index]?.id);

        // Mettre à jour seulement si nécessaire
        if (hasChanged) {
          setRecipes(finalRecipes);
          previousRecipesRef.current = finalRecipes;
        }
        
        previousRecipeIdsRef.current = newRecipeIdsSet;
        previousFilterSignatureRef.current = filterSignature;
      } catch (error) {
        console.error('❌ Erreur lors de la recherche:', error);
        setRecipes([]);
        previousRecipeIdsRef.current = new Set();
        previousRecipesRef.current = [];
        previousFilterSignatureRef.current = '';
      } finally {
        setIsLoading(false);
      }
    };

    searchRecipes();
  }, [
    selectedFoodItems,
    user?.id,
    foodItemsReady,
    selectedMealTypes,
    selectedDietTypes,
  ]);

  useEffect(() => {
    recentRecipesRequestedRef.current = false;
    recentFetchInProgressRef.current = false;
    setRecentRecipes([]);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !foodItemsReady) return;

    const hasNoSearchInput = selectedFoodItems.length === 0;
    const hasNoFilters = !hasActiveFilters;

    if (!hasNoSearchInput || !hasNoFilters) {
      return;
    }

    if (recentRecipesRequestedRef.current || recentFetchInProgressRef.current) {
      return;
    }

    let isActive = true;

    const fetchRecentRecipes = async () => {
      recentFetchInProgressRef.current = true;
      setIsLoadingRecent(true);

      try {
        let query = supabase
          .from('recipes')
          .select('id, title, image_url, total_time, servings, meal_type, diet_type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Exclure les recettes partagées
        if (sharedRecipeIds.length > 0) {
          query = query.not('id', 'in', `(${sharedRecipeIds.join(',')})`);
        }

        const { data, error } = await query.limit(4);

        if (!isActive) {
          return;
        }

        if (error) {
          console.error('❌ Erreur lors de la récupération des recettes récentes:', error);
          return;
        }

        setRecentRecipes((data ?? []) as SearchRecipe[]);
        recentRecipesRequestedRef.current = true;
      } catch (error) {
        if (!isActive) {
          return;
        }
        console.error('❌ Erreur inattendue lors de la récupération des recettes récentes:', error);
      } finally {
        recentFetchInProgressRef.current = false;
        if (isActive) {
          setIsLoadingRecent(false);
        }
      }
    };

    fetchRecentRecipes();

    return () => {
      isActive = false;
    };
  }, [
    user?.id,
    foodItemsReady,
    hasActiveFilters,
    selectedFoodItems.length,
    sharedRecipeIds,
  ]);

  const handleRecipePress = useCallback((recipeId: string) => {
    router.push(`/result?recipeId=${recipeId}` as any);
  }, [router]);

  const renderRecipeCard = useCallback(({ item }: { item: SearchRecipe }) => (
    <RecipeCard 
      item={item} 
      onPress={handleRecipePress}
    />
  ), [handleRecipePress]);

  // Mémoriser la liste des recettes pour éviter les recalculs
  const memoizedRecipes = useMemo(() => recipes, [recipes]);
  const memoizedRecentRecipes = useMemo(() => recentRecipes, [recentRecipes]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const toggleMealType = useCallback((value: MealType) => {
    setSelectedMealTypes((prev) => (prev.includes(value) ? [] : [value]));
  }, []);

  const toggleDietType = useCallback((value: DietType) => {
    setSelectedDietTypes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedMealTypes([]);
    setSelectedDietTypes([]);
  }, []);

  const activeFilterTagColors = useMemo(() => {
    const theme = Colors[colorScheme ?? 'light'];
    const isDarkMode = (colorScheme ?? 'light') === 'dark';

    return {
      background: isDarkMode ? theme.card : theme.secondary,
      border: theme.border,
      text: theme.text,
    };
  }, [colorScheme]);

  const shouldShowRecentRecipes = selectedFoodItems.length === 0 && !hasActiveFilters;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
          <View style={styles.headerTextWrapper}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Qu&apos;est ce qu&apos;on prépare ?
            </Text>
          </View>
        </View>

        {/* Search Bar with Filter Button */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputRow}>
            <View style={styles.searchInputWrapper}>
              <SearchBarWithTags
                selectedFoodItems={selectedFoodItems}
                onFoodItemsChange={setSelectedFoodItems}
                placeholder="Rechercher un ingrédient..."
              />
            </View>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => setIsFilterSheetVisible(true)}
              activeOpacity={0.7}
            >
              <SlidersHorizontal size={20} color={colors.primary} />
              {hasActiveFilters && (
                <View
                  style={[styles.filterBadge, { backgroundColor: colors.primary }]}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.icon }]}>
              Recherche en cours...
            </Text>
          </View>
        ) : memoizedRecipes.length > 0 ? (
          <FlatList
            data={memoizedRecipes}
            renderItem={renderRecipeCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.row}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={10}
            initialNumToRender={10}
          />
        ) : shouldShowRecentRecipes ? (
          isLoadingRecent ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.icon }]}>
                Chargement des recettes récentes...
              </Text>
            </View>
          ) : memoizedRecentRecipes.length > 0 ? (
            <FlatList
              data={memoizedRecentRecipes}
              renderItem={renderRecipeCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              numColumns={2}
              columnWrapperStyle={styles.row}
              removeClippedSubviews={true}
              maxToRenderPerBatch={4}
              updateCellsBatchingPeriod={50}
              windowSize={4}
              initialNumToRender={4}
              ListHeaderComponent={() => (
                <View style={styles.recentHeader}>
                  <Text style={[styles.recentTitle, { color: colors.text }]}>Dernières recettes</Text>
                  <Text style={[styles.recentSubtitle, { color: colors.icon }]}>Vos créations les plus récentes</Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.icon }]}>Aucune recette récente disponible</Text>
            </View>
          )
        ) : selectedFoodItems.length > 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              Aucune recette trouvée avec ces ingrédients
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Search size={48} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.icon }]}> 
              Recherchez une recette par ingrédient
            </Text>
          </View>
        )}

        <RecipeFilterSheet
          visible={isFilterSheetVisible}
          onClose={() => setIsFilterSheetVisible(false)}
          onApply={() => setIsFilterSheetVisible(false)}
          onReset={resetFilters}
          onToggleMealType={toggleMealType}
          onToggleDietType={toggleDietType}
          selectedMealTypes={selectedMealTypes}
          selectedDietTypes={selectedDietTypes}
        />
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTextWrapper: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentHeader: {
    width: '100%',

    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  recentSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
  },
  recipeCard: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  cardContainer: {
    padding: 0,
    overflow: 'hidden',
    height: 200, // Hauteur fixe : image (120px) + contenu texte (80px)
  },
  recipeImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.sm,
  },
  noImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 36,
  },
  recipeInfo: {
    padding: Spacing.md,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 80,
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    minHeight: 40,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  recipeMetaText: {
    fontSize: 12,
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
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  activeFiltersWrapper: {
    marginTop: Spacing.sm,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingLeft: Spacing.sm + 2,
    paddingRight: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  activeFilterIcon: {
    width: 18,
    height: 18,
  },
  activeFilterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  clearFiltersButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

