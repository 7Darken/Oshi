/**
 * Onglet Recherche - Rechercher des recettes par ingrédient
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Clock, Users, FileText } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';
import { SearchBarWithTags } from '@/components/SearchBarWithTags';
import { supabase } from '@/services/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFoodItems } from '@/hooks/useFoodItems';
import { FoodItem } from '@/stores/useFoodItemsStore';

interface SearchRecipe {
  id: string;
  title: string;
  image_url: string | null;
  total_time: string | null;
  servings: number | null;
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

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuthContext();
  const { isInitialized: foodItemsReady } = useFoodItems();

  const [selectedFoodItems, setSelectedFoodItems] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<SearchRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const previousRecipeIdsRef = useRef<Set<string>>(new Set());
  const previousRecipesRef = useRef<SearchRecipe[]>([]);

  // Rechercher des recettes basées sur les food_items sélectionnés
  useEffect(() => {
    const searchRecipes = async () => {
      if (!user?.id || !foodItemsReady) return;

      // Ne rien faire si aucun food_item n'est sélectionné
      if (selectedFoodItems.length === 0) {
        setRecipes([]);
        previousRecipeIdsRef.current = new Set();
        previousRecipesRef.current = [];
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

        // Comparer avec les recettes précédentes pour éviter les re-renders inutiles
        const hasSameRecipes = 
          previousRecipeIdsRef.current.size === newRecipeIdsSet.size &&
          Array.from(previousRecipeIdsRef.current).every(id => newRecipeIdsSet.has(id));

        // Si ce sont les mêmes recettes, ne pas faire de requête
        if (hasSameRecipes && previousRecipesRef.current.length > 0) {
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
            .select('id, title, image_url, total_time, servings')
            .eq('user_id', user.id)
            .in('id', newRecipeIds)
            .order('created_at', { ascending: false });

          if (newRecipesError) {
            console.error('❌ Erreur lors de la récupération des nouvelles recettes:', newRecipesError);
          } else if (newRecipesData) {
            newRecipes = newRecipesData;
          }
        }

        // Construire la liste finale : garder les anciennes (même référence) + ajouter les nouvelles
        const finalRecipes = [...recipesToKeep, ...newRecipes];
        
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
      } catch (error) {
        console.error('❌ Erreur lors de la recherche:', error);
        setRecipes([]);
        previousRecipeIdsRef.current = new Set();
        previousRecipesRef.current = [];
      } finally {
        setIsLoading(false);
      }
    };

    searchRecipes();
  }, [selectedFoodItems, user?.id, foodItemsReady]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Rechercher
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          Trouvez une recette par ingrédient
        </Text>
      </View>

      {/* Search Bar with Tags */}
      <View style={styles.searchContainer}>
        <SearchBarWithTags
          selectedFoodItems={selectedFoodItems}
          onFoodItemsChange={setSelectedFoodItems}
          placeholder="Rechercher un ingrédient..."
        />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
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
  },
  recipeImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
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
});

