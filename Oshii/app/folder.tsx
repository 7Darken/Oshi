/**
 * Écran de détails du dossier - Affiche les recettes d'un dossier
 */

import { SelectRecipesSheet } from '@/components/SelectRecipesSheet';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { SYSTEM_FOLDERS, SYSTEM_FOLDER_NAMES, isSystemFolder } from '@/constants/systemFolders';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFolderRecipes } from '@/hooks/useFolderRecipes';
import { supabase } from '@/services/supabase';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, Plus, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = Spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - CARD_MARGIN) / 2;

export default function FolderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ folderId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const rawFolderId = params.folderId;
  const isSystemFolderReceived = rawFolderId === SYSTEM_FOLDERS.RECEIVED;
  const isOrphanFolder = rawFolderId === 'null';

  // Pour le dossier système "Envoyés", utiliser NULL pour récupérer les recettes partagées
  const folderId = isOrphanFolder || isSystemFolderReceived ? null : rawFolderId || null;

  // Nom initial du dossier
  const getInitialFolderName = () => {
    if (isSystemFolderReceived) {
      return SYSTEM_FOLDER_NAMES[SYSTEM_FOLDERS.RECEIVED];
    }
    if (isOrphanFolder) {
      return 'Non enregistrés';
    }
    return 'Dossier';
  };

  const [folderName, setFolderName] = useState(getInitialFolderName());

  const { recipes, isLoading, error, refresh } = useFolderRecipes(folderId, isSystemFolderReceived);
  const [showSelectSheet, setShowSelectSheet] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Récupérer le nom du dossier si ce n'est pas un dossier fictif/système
  useEffect(() => {
    const fetchFolderName = async () => {
      if (folderId && !isOrphanFolder && !isSystemFolderReceived) {
        const { data } = await supabase
          .from('folders')
          .select('name')
          .eq('id', folderId)
          .single();

        if (data) {
          setFolderName(data.name);
        }
      }
    };

    fetchFolderName();
  }, [folderId, isOrphanFolder, isSystemFolderReceived]);

  // Rafraîchir les recettes quand l'écran redevient actif (optimisé)
  useFocusEffect(
    useCallback(() => {
      // Rafraîchir silencieusement sans mettre en loading
      refresh().catch(err => {
        console.error('❌ [Folder] Erreur lors du refresh:', err);
      });
    }, [refresh])
  );

  const handleRecipePress = (recipeId: string) => {
    router.push(`/result?recipeId=${recipeId}` as any);
  };

  const handleConfirmSelection = async (recipeIds: string[]) => {
    if (!folderId || recipeIds.length === 0) return;

    console.log('📁 [Folder] Ajout de', recipeIds.length, 'recettes au dossier');
    setIsUpdating(true);

    try {
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ folder_id: folderId })
        .in('id', recipeIds);

      if (updateError) {
        console.error('❌ [Folder] Erreur lors de la mise à jour:', updateError);
        throw new Error(updateError.message);
      }

      console.log('✅ [Folder] Recettes ajoutées avec succès');
      await refresh();
      setShowSelectSheet(false);
    } catch (err: any) {
      console.error('❌ [Folder] Erreur:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {folderName}
        </Text>
        {folderId && (
          <TouchableOpacity
            onPress={() => setShowSelectSheet(true)}
            style={styles.addButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Plus size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.icon }]}>
              Chargement des recettes...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorText, { color: colors.icon }]}>{error}</Text>
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              {isSystemFolderReceived ? 'Aucune recette reçue' : 'Ce dossier est vide'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.icon }]}>
              {isSystemFolderReceived
                ? 'Les recettes partagées par vos amis apparaîtront ici'
                : folderId
                  ? 'Ajoutez des recettes à ce dossier pour les voir ici'
                  : 'Vos recettes non classées apparaîtront ici'}
            </Text>
          </View>
        ) : (
          <View style={styles.recipesGrid}>
            {recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                onPress={() => handleRecipePress(recipe.id)}
                activeOpacity={0.8}
                style={styles.recipeCardContainer}
              >
                <View style={[styles.recipeCard, { backgroundColor: colors.card }]}>
                  {/* Image de la recette */}
                  <View style={styles.imageContainer}>
                    <ExpoImage
                      source={
                        recipe.image_url
                          ? { uri: recipe.image_url }
                          : require('@/assets/images/default_recipe.png')
                      }
                      style={styles.recipeImage}
                      contentFit="cover"
                      placeholder={require('@/assets/images/default_recipe.png')}
                      transition={200}
                    />
                  </View>

                  {/* Informations */}
                  <View style={styles.recipeInfo}>
                    <Text style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={2}>
                      {recipe.title}
                    </Text>
                    <View style={styles.recipeMeta}>
                      {recipe.total_time && (
                        <View style={styles.infoItem}>
                          <Clock size={12} color={colors.icon} />
                          <Text style={[styles.infoText, { color: colors.icon }]} numberOfLines={1}>
                            {recipe.total_time}
                          </Text>
                        </View>
                      )}
                      {recipe.servings && (
                        <View style={styles.infoItem}>
                          <Users size={12} color={colors.icon} />
                          <Text style={[styles.infoText, { color: colors.icon }]} numberOfLines={1}>
                            {recipe.servings}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sheet de sélection des recettes */}
      {folderId && (
        <SelectRecipesSheet
          visible={showSelectSheet}
          onClose={() => setShowSelectSheet(false)}
          onConfirm={handleConfirmSelection}
          isUpdating={isUpdating}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  addButton: {
    padding: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_MARGIN,
  },
  recipeCardContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH + 100, // Hauteur fixe : image carrée + hauteur estimée du contenu texte
  },
  recipeCard: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  recipeInfo: {
    padding: Spacing.md,
    flex: 1,
    justifyContent: 'space-between',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});

