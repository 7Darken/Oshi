/**
 * Écran de résultat (ResultScreen)
 * Affiche la recette complète avec ingrédients, étapes, métadonnées et lien TikTok
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Clock, Users, ArrowLeft, Share2, Folder, ShoppingCart, Minus, Plus, Bookmark, Play } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IngredientCard } from '@/components/ui/IngredientCard';
import { StepRow } from '@/components/ui/StepRow';
import { MacroCircle } from '@/components/ui/MacroCircle';
import { FolderSelectorSheet } from '@/components/FolderSelectorSheet';
import { SelectIngredientsSheet } from '@/components/SelectIngredientsSheet';
import { ConfirmDeleteSheet } from '@/components/ConfirmDeleteSheet';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { FullRecipe } from '@/hooks/useRecipes';
import { useFoodItems } from '@/hooks/useFoodItems';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recipeId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { currentRecipe } = useRecipeStore();
  const { user } = useAuthContext();
  const { getFoodItemImage } = useFoodItems();
  
  const [dbRecipe, setDbRecipe] = useState<FullRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Commencer en loading si recipeId
  const [error, setError] = useState<string | null>(null);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [isUpdatingFolder, setIsUpdatingFolder] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string } | null>(null);
  const [showSelectIngredients, setShowSelectIngredients] = useState(false);
  const [isAddingIngredients, setIsAddingIngredients] = useState(false);
  const [currentPortions, setCurrentPortions] = useState(1);
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Charger la recette depuis Supabase si recipeId est fourni
  useEffect(() => {
    const loadRecipe = async () => {
      if (!params.recipeId) {
        // Pas de recipeId, utiliser currentRecipe du store
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Récupérer la recette
        const { data: recipe, error: recipeError } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', params.recipeId)
          .single();

        if (recipeError) {
          console.error('❌ [Result] Erreur lors de la récupération:', recipeError);
          throw new Error(`Recette introuvable: ${recipeError.message}`);
        }

        // 2. Récupérer les ingrédients
        const { data: ingredients } = await supabase
          .from('ingredients')
          .select('*')
          .eq('recipe_id', params.recipeId)
          .order('name');

        // 3. Récupérer les étapes
        const { data: steps } = await supabase
          .from('steps')
          .select('*')
          .eq('recipe_id', params.recipeId)
          .order('order');

        const fullRecipe: FullRecipe = {
          ...recipe,
          ingredients: ingredients || [],
          steps: steps || [],
        };

        console.log('✅ [Result] Recette chargée avec succès');

        // Charger le dossier associé si folder_id existe
        if (recipe.folder_id) {
          const { data: folderData } = await supabase
            .from('folders')
            .select('id, name')
            .eq('id', recipe.folder_id)
            .single();

          if (folderData) {
            setCurrentFolder({ id: folderData.id, name: folderData.name });
          }
        } else {
          setCurrentFolder(null);
        }

        // Les food_items sont maintenant chargés dans le cache global

        setDbRecipe(fullRecipe);
      } catch (err: any) {
        console.error('❌ [Result] Erreur:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipe();
  }, [params.recipeId]);

  // Déterminer quelle recette afficher
  const recipe = params.recipeId ? dbRecipe : currentRecipe;

  // Initialiser le nombre de portions quand la recette charge
  useEffect(() => {
    if (recipe?.servings) {
      setCurrentPortions(recipe.servings);
    }
  }, [recipe?.servings]);

  // Les food_items sont maintenant chargés dans le cache global

  // Calculer les ingrédients ajustés selon les portions (memoized pour performance)
  const adjustedIngredients = useMemo(() => {
    if (!recipe?.ingredients || !recipe.servings || recipe.servings === 0) {
      return recipe?.ingredients || [];
    }

    const ratio = currentPortions / recipe.servings;

    return recipe.ingredients.map((ingredient) => {
      if (!ingredient.quantity || ingredient.quantity.trim() === '') {
        return { ...ingredient };
      }

      // Parser la quantité
      const numMatch = ingredient.quantity.match(/^(\d+(?:[.,]\d+)?)/);
      if (!numMatch) {
        return { ...ingredient };
      }

      const originalValue = parseFloat(numMatch[1].replace(',', '.'));
      const adjustedValue = originalValue * ratio;

      // Formater le résultat (max 2 décimales)
      let formattedValue = adjustedValue.toString();
      if (adjustedValue % 1 !== 0) {
        formattedValue = adjustedValue.toFixed(2).replace(/\.?0+$/, '');
      }

      return {
        ...ingredient,
        quantity: ingredient.quantity.replace(/^(\d+(?:[.,]\d+)?)/, formattedValue),
      };
    });
  }, [recipe?.ingredients, recipe?.servings, currentPortions]);

  // Calculer les macros ajustées selon les portions (memoized pour performance)
  const adjustedMacros = useMemo(() => {
    const recipeWithMacros = recipe as FullRecipe;
    if (!recipeWithMacros?.proteins || !recipeWithMacros?.carbs || !recipeWithMacros?.fats || !recipeWithMacros?.servings) {
      return null;
    }

    const ratio = currentPortions / recipeWithMacros.servings;
    const adjustedProteins = recipeWithMacros.proteins * ratio;
    const adjustedCarbs = recipeWithMacros.carbs * ratio;
    const adjustedFats = recipeWithMacros.fats * ratio;

    // Calculer les pourcentages
    const proteinCalories = adjustedProteins * 4;
    const carbCalories = adjustedCarbs * 4;
    const fatCalories = adjustedFats * 9;

    const totalCalculatedCalories = proteinCalories + carbCalories + fatCalories;

    if (totalCalculatedCalories === 0) {
      return null;
    }

    const proteinPercent = (proteinCalories / totalCalculatedCalories) * 100;
    const carbPercent = (carbCalories / totalCalculatedCalories) * 100;
    const fatPercent = (fatCalories / totalCalculatedCalories) * 100;

    return { 
      proteins: adjustedProteins,
      carbs: adjustedCarbs,
      fats: adjustedFats,
      proteinPercent, 
      carbPercent, 
      fatPercent 
    };
  }, [recipe, currentPortions]);

  // Handlers pour le sélecteur de portions (memoized pour éviter les re-renders)
  const handleDecreasePortions = useCallback(() => {
    setCurrentPortions((prev) => Math.max(1, prev - 1));
  }, []);

  const handleIncreasePortions = useCallback(() => {
    setCurrentPortions((prev) => Math.min(15, prev + 1));
  }, []);

  // Ne rien afficher si en chargement
  if (isLoading || !recipe) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>
          Chargement de la recette...
        </Text>
      </View>
    );
  }

  // Afficher l'erreur
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.icon }]}>{error}</Text>
          <Button
            title="Retour"
            onPress={() => router.replace('/(tabs)')}
            variant="secondary"
            style={{ marginTop: Spacing.md }}
          />
        </View>
      </View>
    );
  }

  const handleConfirmIngredientsSelection = async (selectedIndices: number[]) => {
    if (!user || !recipe) {
      console.error('❌ [ShoppingList] Utilisateur non connecté ou recette manquante');
      return;
    }

    setIsAddingIngredients(true);

    try {
      // 1. Récupérer la liste actuelle de courses
      const { data: currentItems, error: fetchError } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('checked', false);

      if (fetchError) {
        console.error('❌ [ShoppingList] Erreur lors de la récupération:', fetchError);
        throw new Error(fetchError.message);
      }

      // 2. Traiter chaque ingrédient sélectionné
      for (const index of selectedIndices) {
        const ingredient = recipe.ingredients[index];
        const dbIngredient = 'food_item_id' in ingredient ? ingredient as any : null;
        const foodItemId = dbIngredient?.food_item_id;

        // Chercher si un item avec le même food_item_id existe déjà
        const existingItem = currentItems?.find(item => 
          item.food_item_id === foodItemId && foodItemId !== null
        );

        if (existingItem) {
          // Incrémenter la quantité existante
          const currentQty = parseFloat(existingItem.quantity?.replace(',', '.') || '0');
          const newQty = parseFloat(ingredient.quantity?.replace(',', '.') || '0');
          const combinedQty = currentQty + newQty;
          
          const { error: updateError } = await supabase
            .from('shopping_list_items')
            .update({ 
              quantity: combinedQty.toString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingItem.id);

          if (updateError) {
            console.error('❌ [ShoppingList] Erreur lors de la mise à jour:', updateError);
            throw new Error(updateError.message);
          }

          console.log(`✅ [ShoppingList] Quantité mise à jour: ${ingredient.name} (${combinedQty}${ingredient.unit || ''})`);
        } else {
          // Ajouter un nouvel item
          const { error: insertError } = await supabase
            .from('shopping_list_items')
            .insert({
              user_id: user.id,
              ingredient_name: ingredient.name,
              quantity: ingredient.quantity || null,
              unit: ingredient.unit || null,
              checked: false,
              food_item_id: foodItemId || null,
            });

          if (insertError) {
            console.error('❌ [ShoppingList] Erreur lors de l\'ajout:', insertError);
            throw new Error(insertError.message);
          }

          console.log(`✅ [ShoppingList] Nouvel item ajouté: ${ingredient.name}`);
        }
      }

      console.log('✅ [ShoppingList]', selectedIndices.length, 'ingrédient(s) traité(s)');
      setShowSelectIngredients(false);
    } catch (err: any) {
      console.error('❌ [ShoppingList] Erreur:', err);
    } finally {
      setIsAddingIngredients(false);
    }
  };

  const handleOpenSource = async () => {
    const url = 'source_url' in recipe ? recipe.source_url : null;
    if (url) {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error('❌ Impossible d\'ouvrir l\'URL:', url);
      }
    }
  };

  const handleShare = async () => {
    // TODO: Implémenter le partage
    console.log('Partager la recette:', recipe.title);
  };

  const handleBack = () => {
    router.back();
  };

  const handleDeleteRecipe = async () => {
    if (!params.recipeId) {
      console.log('⚠️ [Result] Pas de recipeId, impossible de supprimer');
      return;
    }

    setIsDeleting(true);

    try {
      // Supprimer la recette (les ingrédients et étapes seront supprimés automatiquement via CASCADE)
      const { error: deleteError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', params.recipeId);

      if (deleteError) {
        console.error('❌ [Result] Erreur lors de la suppression:', deleteError);
        throw new Error(deleteError.message);
      }

      console.log('✅ [Result] Recette supprimée avec succès');
      setShowDeleteConfirm(false);
      
      // Rediriger vers la home
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('❌ [Result] Erreur:', err);
      // TODO: Afficher une alerte d'erreur
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectFolder = async (folderId: string | null) => {
    if (!params.recipeId) {
      console.log('⚠️ [Result] Pas de recipeId, impossible de modifier le dossier');
      setShowFolderSelector(false);
      return;
    }

    setIsUpdatingFolder(true);

    try {
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ folder_id: folderId })
        .eq('id', params.recipeId);

      if (updateError) {
        console.error('❌ [Result] Erreur lors de la mise à jour:', updateError);
        throw new Error(updateError.message);
      }

      console.log('✅ [Result] Dossier mis à jour avec succès');

      // Mettre à jour le dossier actuel
      if (folderId) {
        const { data: folderData } = await supabase
          .from('folders')
          .select('id, name')
          .eq('id', folderId)
          .single();

        if (folderData) {
          setCurrentFolder({ id: folderData.id, name: folderData.name });
        }
      } else {
        setCurrentFolder(null);
      }

      setShowFolderSelector(false);
    } catch (err: any) {
      console.error('❌ [Result] Erreur:', err);
    } finally {
      setIsUpdatingFolder(false);
    }
  };
console.log(recipe.steps);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image de la recette */}
        <View style={styles.imageContainer}>
          <ExpoImage
            source={
              'image_url' in recipe && recipe.image_url
                ? { uri: recipe.image_url }
                : require('@/assets/images/icon.png')
            }
            style={styles.recipeImage}
            contentFit="cover"
            placeholder={require('@/assets/images/icon.png')}
            transition={200}
          />
          
          {/* Boutons header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Share2 size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Container avec tout le contenu */}
        <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
          {/* Logo TikTok */}
          {'source_url' in recipe && recipe.source_url && (
            <TouchableOpacity 
              style={styles.tiktokLogoContainer}
              onPress={handleOpenSource}
              activeOpacity={0.7}
            >
              <ExpoImage
                source={require('@/assets/logo/Tiktoklogo.jpg')}
                style={styles.tiktokLogo}
                contentFit="contain"
                transition={200}
              />
            </TouchableOpacity>
          )}
          
          {/* Titre et métadonnées */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text }]}>
              {recipe.title}
            </Text>
            <View style={styles.meta}>
              {params.recipeId && (
                <View
                  style={[
                    styles.folderBadge,
                    { 
                      borderColor: colors.primary, 
                      backgroundColor: currentFolder ? colors.card : colors.card,
                    },
                  ]}
                >
                  <Folder
                    size={16}
                    color={currentFolder ? colors.primary : colors.icon}
                  />
                  <Text
                    style={[
                      styles.folderText,
                      { color: currentFolder ? colors.primary : colors.icon },
                    ]}
                    numberOfLines={1}
                  >
                    {currentFolder ? currentFolder.name : 'Non classée'}
                  </Text>
                </View>
              )}
              {recipe.total_time && (
                <View style={styles.metaItem}>
                  <Clock size={18} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.icon }]}>
                    {recipe.total_time}
                  </Text>
                </View>
              )}
              {recipe.servings && (
                <View style={styles.metaItem}>
                  <Users size={18} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.icon }]}>
                    {recipe.servings} {recipe.servings === 1 ? 'portion' : 'portions'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Section Macros */}
          {adjustedMacros && (
            <View style={styles.macroSection}>
              <Card>
                <View style={styles.macroContainer}>
                  <MacroCircle
                    value={Math.round(adjustedMacros.carbs)}
                    label="Glucides"
                    color="#4A9EFF"
                    percentage={adjustedMacros.carbPercent}
                    size={88}
                    textColor={colors.text}
                  />
                  <MacroCircle
                    value={Math.round(adjustedMacros.proteins)}
                    label="Protéines"
                    color="#FF6B9D"
                    percentage={adjustedMacros.proteinPercent}
                    size={88}
                    textColor={colors.text}
                  />
                  <MacroCircle
                    value={Math.round(adjustedMacros.fats)}
                    label="Lipides"
                    color="#FFB84D"
                    percentage={adjustedMacros.fatPercent}
                    size={88}
                    textColor={colors.text}
                  />
                </View>
              </Card>
            </View>
          )}

          {/* Section Ingrédients */}
          <View style={styles.ingredientsSection}>
            <View style={styles.ingredientsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Ingrédients
              </Text>
              {recipe && recipe.servings && (
                <View style={[styles.portionSelectorCompact, { borderColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={handleDecreasePortions}
                    disabled={currentPortions <= 1}
                    style={[
                      styles.portionButtonCompact,
                      { opacity: currentPortions <= 1 ? 0.3 : 1 },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Minus size={16} color={colors.text} strokeWidth={2} />
                  </TouchableOpacity>
                  <Text style={[styles.portionValueCompact, { color: colors.text }]}>
                    {currentPortions}
                  </Text>
                  <TouchableOpacity
                    onPress={handleIncreasePortions}
                    disabled={currentPortions >= 15}
                    style={[
                      styles.portionButtonCompact,
                      { opacity: currentPortions >= 15 ? 0.3 : 1 },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color={colors.text} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {adjustedIngredients && adjustedIngredients.length > 0 ? (
              <View style={styles.ingredientsGridContainer}>
                {/* Affichage initial: 6 ingrédients max */}
                {!showAllIngredients && adjustedIngredients.length > 6 ? (
                  <View style={styles.ingredientsCompactWrapper}>
                    <View style={styles.ingredientsGridCompact}>
                      {adjustedIngredients.slice(0, 6).map((item, index) => {
                        const adaptedIngredient = {
                          name: item.name,
                          quantity: item.quantity || undefined,
                          unit: item.unit || undefined,
                        };
                        const foodItemImage = item.food_item_id ? getFoodItemImage(item.food_item_id) : null;
                        return (
                          <IngredientCard
                            key={item.id || index}
                            ingredient={adaptedIngredient}
                            imageUrl={foodItemImage}
                          />
                        );
                      })}
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowAllIngredients(true)}
                      style={[styles.showMoreButton, { backgroundColor: colors.card }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.showMoreText, { color: colors.text }]}>
                        Afficher tout
                      </Text>
                      <Text style={[styles.showMoreCount, { color: colors.icon }]}>
                        +{adjustedIngredients.length - 6}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Affichage complet: lignes de 3
                  <View style={styles.ingredientsGridFull}>
                    {adjustedIngredients.map((item, index) => {
                      const adaptedIngredient = {
                        name: item.name,
                        quantity: item.quantity || undefined,
                        unit: item.unit || undefined,
                      };
                      const foodItemImage = item.food_item_id ? getFoodItemImage(item.food_item_id) : null;
                      return (
                        <IngredientCard
                          key={item.id || index}
                          ingredient={adaptedIngredient}
                          imageUrl={foodItemImage}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                Aucun ingrédient disponible
              </Text>
            )}
          </View>

          {/* Section Étapes */}
          <View style={styles.section}>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Étapes
              </Text>
              {recipe.steps && recipe.steps.length > 0 ? (
                recipe.steps
                  .sort((a, b) => a.order - b.order)
                  .map((step, index) => {
                    const adaptedStep = {
                      order: step.order,
                      text: step.text,
                      duration: step.duration || undefined,
                      temperature: step.temperature || undefined,
                    };
                    return <StepRow key={step.id || index} step={adaptedStep} />;
                  })
              ) : (
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  Aucune étape disponible
                </Text>
              )}
            </Card>
          </View>

        </View>

        {/* Bouton supprimer */}
        {params.recipeId && (
          <View style={styles.deleteSection}>
            <Button
              title="Supprimer la recette"
              onPress={() => setShowDeleteConfirm(true)}
              variant="primary"
              style={{ backgroundColor: colors.destructive }}
            />
          </View>
        )}

        {/* Espacement en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer avec boutons */}
      {recipe && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.footerContent}>
            {/* Bouton Play pour ouvrir les étapes - À gauche */}
            {recipe.steps && recipe.steps.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  const recipeId = params.recipeId || (currentRecipe?.id as string);
                  if (recipeId) {
                    router.push(`/steps?recipeId=${recipeId}` as any);
                  } else {
                    // Si pas de recipeId, passer les données via le store temporairement
                    router.push('/steps' as any);
                  }
                }}
                style={[
                  styles.playButton,
                  {
                    backgroundColor: colors.primary,
                  }
                ]}
                activeOpacity={0.8}
              >
                <Play size={20} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
                <Text style={styles.playButtonText}>Cuisiner</Text>
              </TouchableOpacity>
            )}
            
            {/* Boutons course et bookmark - À droite */}
            <View style={styles.rightButtons}>
              {adjustedIngredients && adjustedIngredients.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowSelectIngredients(true)}
                  style={[
                    styles.addToCartButton,
                    {
                      backgroundColor: 'rgba(30, 30, 30, 0.6)',
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                    }
                  ]}
                  activeOpacity={0.8}
                >
                  <ShoppingCart
                    size={20}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                  <View style={styles.addToCartBadge}>
                    <Plus size={10} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setShowFolderSelector(true)}
                style={[
                  styles.saveButton,
                  !currentFolder
                    ? {
                        backgroundColor: 'rgba(30, 30, 30, 0.6)',
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                      }
                    : { backgroundColor: colors.primary },
                ]}
                activeOpacity={0.8}
              >
                <Bookmark
                  size={20}
                  color={!currentFolder ? colors.primary : '#FFFFFF'}
                  strokeWidth={2}
                  fill={!currentFolder ? colors.primary : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Sheet de sélection de dossier */}
      <FolderSelectorSheet
        visible={showFolderSelector}
        onClose={() => setShowFolderSelector(false)}
        currentFolderId={currentFolder?.id || null}
        onSelectFolder={handleSelectFolder}
        isUpdating={isUpdatingFolder}
      />

      {/* Sheet de sélection d'ingrédients */}
      {recipe && recipe.ingredients && (
        <SelectIngredientsSheet
          visible={showSelectIngredients}
          onClose={() => setShowSelectIngredients(false)}
          ingredients={recipe.ingredients.map((ing, index) => {
            const foodItemImage = ing.food_item_id ? getFoodItemImage(ing.food_item_id) : null;
            return {
              name: ing.name,
              quantity: ing.quantity || undefined,
              unit: ing.unit || undefined,
              imageUrl: foodItemImage,
            };
          })}
          onConfirm={handleConfirmIngredientsSelection}
          isAdding={isAddingIngredients}
        />
      )}

      {/* Sheet de confirmation de suppression */}
      {params.recipeId && (
        <ConfirmDeleteSheet
          visible={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteRecipe}
          isDeleting={isDeleting}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  scrollContent: {
    paddingTop: 0,
  },
  imageContainer: {
    width: '100%',
    height: 400,
    overflow: 'hidden',
  },
  contentContainer: {
    marginTop: -Spacing.xxl - 10,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    position: 'relative',
  },
  tiktokLogoContainer: {
    position: 'absolute',
    top: -40,
    right: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  tiktokLogo: {
    width: '100%',
    height: '100%',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: Spacing.xxl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    zIndex: 1,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  titleSection: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.md,
    lineHeight: 40,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.lg,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 16,
    fontWeight: '500',
  },
  macroSection: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: Spacing.md,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  folderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addToCartButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    position: 'relative',
  },
  addToCartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F9403C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
  footer: {
    borderTopWidth: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  deleteSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  ingredientsSection: {
    marginBottom: Spacing.lg,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  portionSelectorCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  portionButtonCompact: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionValueCompact: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: Spacing.sm,
    minWidth: 30,
    textAlign: 'center',
  },
  ingredientsGridContainer: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  ingredientsCompactWrapper: {},
  ingredientsGridCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    justifyContent: 'flex-start',
  },
  ingredientsGridFull: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    justifyContent: 'flex-start',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  showMoreText: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  showMoreCount: {
    fontSize: 15,
    fontWeight: '600',
  },
});
