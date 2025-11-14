/**
 * Écran de résultat (ResultScreen)
 * Affiche la recette complète avec ingrédients, étapes, métadonnées et lien TikTok
 */

import { ConfirmDeleteSheet } from '@/components/ConfirmDeleteSheet';
import { FolderSelectorSheet } from '@/components/FolderSelectorSheet';
import RecipeCardPreviewComponent, { PreviewIngredient, PreviewMacros } from '@/components/RecipeCardPreview';
import { SelectIngredientsSheet } from '@/components/SelectIngredientsSheet';
import { ShareOptionsSheet } from '@/components/recipe/ShareOptionsSheet';
import { ShareToFriendSheet } from '@/components/recipe/ShareToFriendSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IngredientCard } from '@/components/ui/IngredientCard';
import { MacroCircle } from '@/components/ui/MacroCircle';
import { StepRow } from '@/components/ui/StepRow';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNetworkContext } from '@/contexts/NetworkContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFoodItems } from '@/hooks/useFoodItems';
import { useRecipeTranslation } from '@/hooks/useI18n';
import { supabase } from '@/services/supabase';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { FullRecipe } from '@/types/recipe';
import { convertIngredient } from '@/utils/ingredientConverter';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ArrowLeft, Bookmark, Clock, Flame, Folder, Minus, Play, Plus, Scale, Share2, ShoppingCart, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Linking,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

const HERO_IMAGE_HEIGHT = 400;

export default function ResultScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ recipeId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useRecipeTranslation();
  const { currentRecipe, addRecipe } = useRecipeStore();
  const recipesCache = useRecipeStore((state) => state.recipes);
  const { user, isPremium } = useAuthContext();
  const { isOffline } = useNetworkContext();
  const { getFoodItemImage } = useFoodItems();
  const previewRef = useRef<View | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

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
  const [useSpoonConversion, setUseSpoonConversion] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showShareToFriend, setShowShareToFriend] = useState(false);
  const [isSharingToFriend, setIsSharingToFriend] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const heroTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-150, 0, 150],
        outputRange: [-30, 0, -20],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const inactiveFooterButtonBackground =
    colorScheme === 'dark' ? 'rgba(30, 30, 30, 0.6)' : 'rgba(255, 255, 255, 0.95)';
  const inactiveFooterButtonBorder =
    colorScheme === 'dark' ? colors.primary : 'rgba(239, 68, 68, 0.35)';

  const heroScale = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-150, 0, 150],
        outputRange: [1.05, 1, 0.97],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const cachedRecipe = useMemo<FullRecipe | null>(() => {
    if (!params.recipeId) {
      return null;
    }

    return recipesCache.find((recipe) => recipe.id === params.recipeId) ?? null;
  }, [params.recipeId, recipesCache]);

  useEffect(() => {
    if (!params.recipeId || !isOffline) {
      return;
    }

    if (cachedRecipe) {
      console.log('📖 [Result] Mode hors ligne — utilisation du cache local');
      setDbRecipe(cachedRecipe);
      setCurrentFolder((prev) => {
        if (!cachedRecipe.folder_id) {
          return null;
        }

        if (prev?.id === cachedRecipe.folder_id) {
          return prev;
        }

        return prev ?? null;
      });
      setError(null);
    } else {
      console.warn('⚠️ [Result] Recette introuvable dans le cache hors ligne');
      setDbRecipe(null);
      setCurrentFolder(null);
      setError(t('recipe.offlineUnavailable'));
    }

    setIsLoading(false);
  }, [isOffline, params.recipeId, cachedRecipe, t]);

  // Charger la recette depuis le cache ou Supabase si recipeId est fourni
  useEffect(() => {
    if (!params.recipeId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadRecipe = async () => {
      // Optimisation: Vérifier le cache en premier (chargement instantané)
      if (cachedRecipe) {
        console.log('⚡ [Result] Recette trouvée dans le cache - chargement instantané');
        setDbRecipe(cachedRecipe);

        // Charger le dossier si nécessaire
        if (cachedRecipe.folder_id && !isOffline) {
          const { data: folderData } = await supabase
            .from('folders')
            .select('id, name')
            .eq('id', cachedRecipe.folder_id)
            .single();

          if (!cancelled && folderData) {
            setCurrentFolder({ id: folderData.id, name: folderData.name });
          }
        } else {
          setCurrentFolder(null);
        }

        setIsLoading(false);
        setError(null);
        return;
      }

      // Si pas dans le cache et offline, erreur
      if (isOffline) {
        console.warn('⚠️ [Result] Recette non disponible hors ligne');
        setError(t('recipe.offlineUnavailable'));
        setIsLoading(false);
        return;
      }

      // Sinon, charger depuis Supabase (réseau)
      console.log('🌐 [Result] Chargement depuis Supabase...');
      setIsLoading(true);
      setError(null);

      try {
        const { data: recipe, error: recipeError } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', params.recipeId)
          .single();

        if (recipeError) {
          console.error('❌ [Result] Erreur lors de la récupération:', recipeError);
          throw new Error(`Recette introuvable: ${recipeError.message}`);
        }

        const { data: ingredients } = await supabase
          .from('ingredients')
          .select('*')
          .eq('recipe_id', params.recipeId)
          .order('name');

        const { data: steps } = await supabase
          .from('steps')
          .select('*')
          .eq('recipe_id', params.recipeId)
          .order('order');

        const fullRecipe: FullRecipe = {
          ...recipe,
          ingredients: (ingredients || []).map((ingredient) => ({
            ...ingredient,
            quantity: ingredient.quantity ?? null,
            unit: ingredient.unit ?? null,
            food_item_id: ingredient.food_item_id ?? null,
          })),
          steps: (steps || []).map((step) => ({
            ...step,
            duration: step.duration ?? null,
            temperature: step.temperature ?? null,
          })),
        };

        console.log('✅ [Result] Recette chargée avec succès depuis Supabase');

        if (recipe.folder_id) {
          const { data: folderData } = await supabase
            .from('folders')
            .select('id, name')
            .eq('id', recipe.folder_id)
            .single();

          if (!cancelled) {
            if (folderData) {
              setCurrentFolder({ id: folderData.id, name: folderData.name });
            } else {
              setCurrentFolder(null);
            }
          }
        } else if (!cancelled) {
          setCurrentFolder(null);
        }

        const didInsert = addRecipe(fullRecipe);

        if (!cancelled) {
          if (didInsert && Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
              /* noop */
            });
          }

          setDbRecipe(fullRecipe);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('❌ [Result] Erreur:', err);
          setError(err.message || t('recipe.error'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadRecipe();

    return () => {
      cancelled = true;
    };
  }, [params.recipeId, isOffline, addRecipe, cachedRecipe, t]);

  // Déterminer quelle recette afficher
  const recipe = params.recipeId ? dbRecipe : currentRecipe;

  // Vérifier si l'image est une thumbnail YouTube (avec letterboxing)
  const isYoutubeThumbnail = useMemo(() => {
    if (!recipe) return false;
    return recipe.platform === 'YouTube';
  }, [recipe]);

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
        return { ...ingredient, isConverted: false };
      }

      // Parser la quantité
      const numMatch = ingredient.quantity.match(/^(\d+(?:[.,]\d+)?)/);
      if (!numMatch) {
        return { ...ingredient, isConverted: false };
      }

      const originalValue = parseFloat(numMatch[1].replace(',', '.'));
      const adjustedValue = originalValue * ratio;

      // Formater le résultat (max 2 décimales)
      let formattedValue = adjustedValue.toString();
      if (adjustedValue % 1 !== 0) {
        formattedValue = adjustedValue.toFixed(2).replace(/\.?0+$/, '');
      }

      const adjustedQuantity = ingredient.quantity.replace(/^(\d+(?:[.,]\d+)?)/, formattedValue);

      // Si conversion en cuillères activée, tenter la conversion
      if (useSpoonConversion) {
        const conversionResult = convertIngredient(
          ingredient.name,
          adjustedQuantity,
          ingredient.unit
        );

        if (conversionResult.isConverted) {
          return {
            ...ingredient,
            quantity: conversionResult.value.toString(),
            unit: conversionResult.unit,
            isConverted: true,
          };
        }
      }

      return {
        ...ingredient,
        quantity: adjustedQuantity,
        isConverted: false,
      };
    });
  }, [recipe?.ingredients, recipe?.servings, currentPortions, useSpoonConversion]);

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

  const previewIngredients = useMemo<PreviewIngredient[]>(() => {
    if (!adjustedIngredients) {
      return [];
    }

    return adjustedIngredients.map((item) => ({
      name: item.name,
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
    }));
  }, [adjustedIngredients]);

  const previewMacros = useMemo<PreviewMacros | null>(() => {
    if (!adjustedMacros) {
      return null;
    }

    return {
      proteins: adjustedMacros.proteins,
      carbs: adjustedMacros.carbs,
      fats: adjustedMacros.fats,
      proteinPercent: adjustedMacros.proteinPercent,
      carbPercent: adjustedMacros.carbPercent,
      fatPercent: adjustedMacros.fatPercent,
    };
  }, [adjustedMacros]);

  const handleExportRecipePreview = useCallback(() => {
    if (!isPremium) {
      router.push('/subscription');
      return;
    }

    // Ouvrir le sheet d'options de partage
    setShowShareOptions(true);
  }, [isPremium, router]);

  const handleExportImage = useCallback(async () => {
    if (!previewRef.current || !recipe) {
      return;
    }

    try {
      setIsGeneratingPreview(true);
      const uri = await captureRef(previewRef.current, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (!uri) {
        throw new Error('Capture échouée');
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: `Partager ${recipe.title}`,
          mimeType: 'image/png',
        });
      } else {
        Alert.alert(t('recipe.share.unavailable'), t('recipe.share.unavailableMessage'));
      }
    } catch (err: any) {
      console.error('❌ [Result] Export preview error:', err);
      Alert.alert(t('recipe.share.error'), t('recipe.share.errorGenerating'));
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [recipe, t]);

  const handleShareToFriendOpen = useCallback(() => {
    setShowShareToFriend(true);
  }, []);

  const handleShareToFriend = useCallback(async (friendId: string, message?: string) => {
    if (!recipe || !user) {
      return;
    }

    try {
      setIsSharingToFriend(true);

      // Récupérer l'ID du vrai ami (user_id) depuis le friendship
      const { data: friendship, error: friendshipError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2')
        .eq('id', friendId)
        .single();

      if (friendshipError || !friendship) {
        throw new Error('Ami introuvable');
      }

      // Déterminer l'ID de l'ami (celui qui n'est pas l'utilisateur actuel)
      const friendUserId = friendship.user_id_1 === user.id
        ? friendship.user_id_2
        : friendship.user_id_1;

      // Partager la recette via la table shared_recipes
      const { error: shareError } = await supabase
        .from('shared_recipes')
        .insert({
          recipe_id: recipe.id,
          shared_by_user_id: user.id,
          shared_with_user_id: friendUserId,
          message: message || null,
        });

      if (shareError) {
        console.error('❌ [Result] Share error:', shareError);
        throw shareError;
      }

      Alert.alert(t('recipe.share.sharedSuccess'), t('recipe.share.sharedSuccessMessage'));
      setShowShareToFriend(false);
    } catch (err: any) {
      console.error('❌ [Result] Share to friend error:', err);
      Alert.alert(t('recipe.share.error'), t('recipe.share.errorSharing'));
    } finally {
      setIsSharingToFriend(false);
    }
  }, [recipe, user, t]);

  const handleStartCooking = useCallback(() => {
    if (!recipe || !recipe.steps || recipe.steps.length === 0) {
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {
        /* noop */
      });
    }

    const recipeId = params.recipeId || recipe.id || currentRecipe?.id;

    if (recipeId) {
      router.push(`/steps?recipeId=${recipeId}` as any);
    } else {
      router.push('/steps' as any);
    }
  }, [recipe, params.recipeId, currentRecipe?.id, router]);

  // Ne rien afficher si en chargement
  if (isLoading || !recipe) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>
          {t('recipe.loading')}
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
            title={t('recipe.back')}
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

      // Vider toute la stack de navigation et revenir à la home
      // Cela empêche l'utilisateur de revenir en arrière vers la page folder ou result supprimée
      console.log('🔄 [Result] Reset complet de la navigation vers home');

      // Utiliser React Navigation pour réinitialiser complètement la stack
      // Cela garantit qu'il n'y a plus de pages folder/result dans l'historique
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: '(tabs)' }],
        })
      );
    } catch (err: any) {
      console.error('❌ [Result] Erreur:', err);
      Alert.alert(t('recipe.deleteError'), t('recipe.deleteErrorMessage'));
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.heroContainer,
          { transform: [{ translateY: heroTranslateY }, { scale: heroScale }] },
        ]}
      >
        <ExpoImage
          source={
            'image_url' in recipe && recipe.image_url
              ? { uri: recipe.image_url }
              : require('@/assets/images/default_recipe.png')
          }
          style={[
            styles.recipeImage,
            isYoutubeThumbnail && styles.youtubeImageZoom,
          ]}
          contentFit="cover"
          placeholder={require('@/assets/images/default_recipe.png')}
          transition={200}
        />
      </Animated.View>

      {/* Boutons header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleExportRecipePreview}
          style={[styles.shareButton, isGeneratingPreview && { opacity: 0.6 }]}
          disabled={isGeneratingPreview}
          activeOpacity={0.8}
        >
          {isGeneratingPreview ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Share2 size={28} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HERO_IMAGE_HEIGHT }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Container avec tout le contenu */}
        <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
          {/* Logo Platform (Instagram, TikTok, YouTube) */}
          {'source_url' in recipe && recipe.source_url && (
            <TouchableOpacity
              style={styles.tiktokLogoContainer}
              onPress={handleOpenSource}
              activeOpacity={0.7}
            >
              <ExpoImage
                source={
                  'platform' in recipe && recipe.platform === 'Instagram'
                    ? require('@/assets/logo/InstagramLogo.png')
                    : 'platform' in recipe && recipe.platform === 'YouTube'
                    ? require('@/assets/logo/YoutubeLogo.png')
                    : require('@/assets/logo/Tiktoklogo.jpg')
                }
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
                    {currentFolder ? currentFolder.name : t('recipe.unclassified')}
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
                    {recipe.servings} {recipe.servings === 1 ? t('recipe.portion') : t('recipe.portions')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Section Macros */}
          {adjustedMacros && (
            <View style={styles.macroSection}>
              <Card style={styles.macroCard}>
                {recipe?.calories && (
                  <View style={styles.macrosHeadlineRow}>
                    <Flame size={18} color={colors.primary} />
                    <Text style={[styles.macrosHeadline, { color: colors.icon }]}>
                      {Math.round(recipe.calories * (currentPortions / (recipe.servings || currentPortions)))} kcal
                    </Text>
                  </View>
                )}
                <View style={styles.macroContainer}>
                  <MacroCircle
                    value={Math.round(adjustedMacros.carbs)}
                    label={t('recipe.macros.carbs')}
                    color="#54C1F9"
                    percentage={adjustedMacros.carbPercent}
                    size={88}
                    textColor={colors.text}
                  />
                  <MacroCircle
                    value={Math.round(adjustedMacros.proteins)}
                    label={t('recipe.macros.proteins')}
                    color="#FF6B9D"
                    percentage={adjustedMacros.proteinPercent}
                    size={88}
                    textColor={colors.text}
                  />
                  <MacroCircle
                    value={Math.round(adjustedMacros.fats)}
                    label={t('recipe.macros.fats')}
                    color="#FFB84D"
                    percentage={adjustedMacros.fatPercent}
                    size={88}
                    textColor={colors.text}
                  />
                </View>
                {!isPremium && (
                  <BlurView
                    intensity={40}
                    tint={colorScheme === 'dark' ? 'dark' : 'light'}
                    style={styles.macroBlurOverlay}
                  >
                    <View style={styles.macroBlurContent}>
                      <Text style={[styles.macroBlurTitle, { color: colors.text }]}>
                        {t('recipe.macros.premiumTitle')}
                      </Text>
                      <Text style={[styles.macroBlurSubtitle, { color: colors.icon }]}>
                        {t('recipe.macros.premiumDescription')}
                      </Text>
                      <TouchableOpacity
                        style={[styles.macroBlurButton, { backgroundColor: colors.primary }]}
                        activeOpacity={0.8}
                        onPress={() => router.push('/subscription')}
                      >
                        <Text style={styles.macroBlurButtonText}>{t('recipe.macros.seeOffers')}</Text>
                      </TouchableOpacity>
                    </View>
                  </BlurView>
                )}
              </Card>
            </View>
          )}

          {/* Section Équipement */}
          {(() => {
            console.log('🔧 [Equipment Debug]', {
              hasRecipe: !!recipe,
              hasEquipmentKey: recipe && 'equipment' in recipe,
              equipmentValue: recipe && 'equipment' in recipe ? recipe.equipment : 'N/A',
              isArray: recipe && 'equipment' in recipe ? Array.isArray(recipe.equipment) : false,
              length: recipe && 'equipment' in recipe && Array.isArray(recipe.equipment) ? recipe.equipment.length : 0,
            });
            return null;
          })()}
          {recipe && 'equipment' in recipe && Array.isArray(recipe.equipment) && recipe.equipment.length > 0 && (
            <View style={styles.equipmentSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recipe.equipment')}</Text>
              <View style={styles.equipmentGrid}>
                {recipe.equipment.map((item: string, index: number) => {
                  const equipmentMap: { [key: string]: { name: string; icon: any } } = {
                    'four': { name: 'Four', icon: require('@/assets/Equipment/four.png') },
                    'micro-ondes': { name: 'Micro-ondes', icon: require('@/assets/Equipment/micro-ondes.png') },
                    'air fryer': { name: 'Air Fryer', icon: require('@/assets/Equipment/air-fryer.png') },
                    'mixeur': { name: 'Mixeur', icon: require('@/assets/Equipment/mixeur.png') },
                    'poêle': { name: 'Poêle', icon: require('@/assets/Equipment/poele.png') },
                    'poele': { name: 'Poêle', icon: require('@/assets/Equipment/poele.png') },
                  };

                  const equipment = equipmentMap[item.toLowerCase()];
                  if (!equipment) return null;

                  return (
                    <View key={index} style={[styles.equipmentItem]}>
                      <View style={[styles.equipmentIconContainer, { backgroundColor: `${colors.primary}05` }]}>
                        <ExpoImage
                          source={equipment.icon}
                          style={styles.equipmentIcon}
                          contentFit="contain"
                        />
                      </View>
                      <Text style={[styles.equipmentName, { color: colors.text }]}>
                        {equipment.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Section Ingrédients */}
          <View style={styles.ingredientsSection}>
            <View style={styles.ingredientsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('recipe.ingredients')}
              </Text>
            </View>
 {/* Portion selector */}
 {recipe && recipe.servings && (
              <View style={styles.portionSelectorRow}>
                <View style={styles.portionLabelContainer}>
                  <Users size={18} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.portionLabel, { color: colors.text }]}>
                    {t('recipe.portionsLabel')}
                  </Text>
                </View>
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
              </View>
            )}
            {/* Toggle "Pas de balance" avec Switch natif */}
            <View style={styles.conversionToggleContainer}>
              <View style={styles.conversionToggleLabelContainer}>
                <Scale size={18} color="#EF4444" strokeWidth={2} />
                <Text style={[styles.conversionToggleLabel, { color: colors.text }]}>
                  {t('recipe.noScale')}
                </Text>
              </View>
              <Switch
                value={useSpoonConversion}
                onValueChange={setUseSpoonConversion}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor='#FFFFFF'
              />
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
                            isConverted={(item as any).isConverted || false}
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
                        {t('recipe.showAll')}
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
                          isConverted={(item as any).isConverted || false}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                {t('recipe.noIngredients')}
              </Text>
            )}
          </View>

          {/* Section Étapes */}
          <View style={styles.section}>
            <Card style={styles.stepsCard}>
              {recipe.steps && recipe.steps.length > 0 && (
                <TouchableOpacity
                  onPress={handleStartCooking}
                  style={[
                    styles.stepsFloatingButton,
                    {
                      backgroundColor:
                        colorScheme === 'dark'
                          ? 'rgba(249, 64, 60, 0.28)'
                          : 'rgba(249, 92, 89, 0.16)',
                      borderColor: colors.primary,
                    },
                  ]}
                  activeOpacity={0.85}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('recipe.cook')}
                >
                  <Play size={18} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
                </TouchableOpacity>
              )}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('recipe.steps')}
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
                  {t('recipe.noSteps')}
                </Text>
              )}
            </Card>
          </View>

        </View>

        {/* Bouton supprimer */}
        {params.recipeId && (
          <View style={styles.deleteSection}>
            <Button
              title={t('recipe.deleteRecipe')}
              onPress={() => setShowDeleteConfirm(true)}
              variant="primary"
              style={{ backgroundColor: colors.destructive }}
            />
          </View>
        )}

        {/* Espacement en bas */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* Prévisualisation hors-écran pour export image */}
      <View style={styles.previewCapture} pointerEvents="none">
        <View ref={previewRef} collapsable={false} style={styles.previewContent}>
          <RecipeCardPreviewComponent
            recipe={recipe as FullRecipe}
            ingredients={previewIngredients}
            macros={previewMacros}
            portions={currentPortions}
          />
        </View>
      </View>

      {/* Footer avec boutons */}
      {recipe && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.footerContent}>
            {/* Bouton Play pour ouvrir les étapes - À gauche */}
            {recipe.steps && recipe.steps.length > 0 && (
              <TouchableOpacity
                onPress={handleStartCooking}
                style={[
                  styles.playButton,
                  {
                    backgroundColor: colors.primary,
                  }
                ]}
                activeOpacity={0.8}
              >
                <Play size={20} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
                <Text style={styles.playButtonText}>{t('recipe.cook')}</Text>
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
                      backgroundColor: inactiveFooterButtonBackground,
                      borderWidth: 1.5,
                      borderColor: inactiveFooterButtonBorder,
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
                        backgroundColor: inactiveFooterButtonBackground,
                        borderWidth: 1.5,
                        borderColor: inactiveFooterButtonBorder,
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

      {/* Sheet d'options de partage */}
      <ShareOptionsSheet
        visible={showShareOptions}
        onClose={() => setShowShareOptions(false)}
        onExportImage={handleExportImage}
        onShareToFriend={handleShareToFriendOpen}
      />

      {/* Sheet de partage à un ami */}
      <ShareToFriendSheet
        visible={showShareToFriend}
        onClose={() => setShowShareToFriend(false)}
        onShare={handleShareToFriend}
        isSharing={isSharingToFriend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
    paddingBottom: Spacing.xxl,
  },
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_IMAGE_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  contentContainer: {
    marginTop: -Spacing.xxl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    position: 'relative',
    paddingBottom: Spacing.xxl,
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
  youtubeImageZoom: {
    transform: [{ scale: 1.70 }],
  },
  header: {
    position: 'absolute',
    top: Spacing.xxl + Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    zIndex: 1,
  },
  backButton: {
    width: 56,
    height: 56,
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
    width: 56,
    height: 56,
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
  macroCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  macroBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  macroBlurContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  macroBlurTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  macroBlurSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
  macroBlurButton: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  macroBlurButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  equipmentSection: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  equipmentItem: {
    alignItems: 'center',

    borderRadius: BorderRadius.lg,
    width: (100 / 3 - Spacing.md),
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  equipmentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  equipmentIcon: {
    width: 40,
    height: 40,
  },
  equipmentName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  macrosHeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  macrosHeadline: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  stepsCard: {
    position: 'relative',
    paddingTop: Spacing.lg,
  },
  stepsFloatingButton: {
    position: 'absolute',
    top: -Spacing.xl,
    right: -5,
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.md,
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
  previewCapture: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    opacity: 0,
  },
  previewContent: {
    width: 1080,
    maxWidth: 1080,
    backgroundColor: '#F5F7FA',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  conversionToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  conversionToggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  conversionToggleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  portionSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  portionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  portionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
