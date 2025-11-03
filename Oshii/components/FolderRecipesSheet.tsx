/**
 * Composant FolderRecipesSheet - Sheet native pour afficher les recettes d'un dossier
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { X, Clock, Users, Plus } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';
import { useFolderRecipes } from '@/hooks/useFolderRecipes';
import { SelectRecipesSheet } from '@/components/SelectRecipesSheet';
import { supabase } from '@/services/supabase';

interface FolderRecipesSheetProps {
  visible: boolean;
  onClose: () => void;
  folderId: string | null;
  folderName: string;
  onRecipePress: (recipeId: string) => void;
  onRecipesAdded?: () => void;
}

export function FolderRecipesSheet({
  visible,
  onClose,
  folderId,
  folderName,
  onRecipePress,
  onRecipesAdded,
}: FolderRecipesSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { recipes, isLoading, error, refresh } = useFolderRecipes(folderId);
  const [showSelectSheet, setShowSelectSheet] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirmSelection = async (recipeIds: string[]) => {
    if (!folderId || recipeIds.length === 0) return;

    console.log('📁 [FolderRecipes] Ajout de', recipeIds.length, 'recettes au dossier');
    setIsUpdating(true);

    try {
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ folder_id: folderId })
        .in('id', recipeIds);

      if (updateError) {
        console.error('❌ [FolderRecipes] Erreur:', updateError);
        throw new Error(updateError.message);
      }

      console.log('✅ [FolderRecipes] Recettes ajoutées avec succès');
      await refresh();
      onRecipesAdded?.();
      setShowSelectSheet(false);
    } catch (err: any) {
      console.error('❌ [FolderRecipes] Erreur:', err);
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{folderName}</Text>
          <View style={styles.headerActions}>
            {folderId !== null && (
              <Pressable
                onPress={() => setShowSelectSheet(true)}
                style={styles.addButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Plus size={24} color={colors.primary} />
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
                Ce dossier est vide
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                Ajoutez des recettes à ce dossier pour les voir ici
              </Text>
            </View>
          ) : (
            recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                onPress={() => onRecipePress(recipe.id)}
                activeOpacity={0.8}
              >
                <Card style={styles.recipeCard}>
                  <View style={styles.recipeHeader}>
                    <Text style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={2}>
                      {recipe.title}
                    </Text>
                    <Text style={[styles.recipeDate, { color: colors.icon }]}>
                      {formatDate(recipe.created_at)}
                    </Text>
                  </View>

                  <View style={styles.recipeInfos}>
                    {recipe.servings && (
                      <View style={styles.infoItem}>
                        <Users size={16} color={colors.icon} />
                        <Text style={[styles.infoText, { color: colors.icon }]}>
                          {recipe.servings} {recipe.servings === 1 ? 'portion' : 'portions'}
                        </Text>
                      </View>
                    )}
                    {recipe.total_time && (
                      <View style={styles.infoItem}>
                        <Clock size={16} color={colors.icon} />
                        <Text style={[styles.infoText, { color: colors.icon }]}>
                          {recipe.total_time}
                        </Text>
                      </View>
                    )}
                  </View>

                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <View style={styles.recipeDetails}>
                      <Text style={[styles.detailsText, { color: colors.icon }]}>
                        {recipe.ingredients.length}{' '}
                        {recipe.ingredients.length === 1 ? 'ingrédient' : 'ingrédients'}
                      </Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* Sheet de sélection des recettes */}
      <SelectRecipesSheet
        visible={showSelectSheet}
        onClose={() => setShowSelectSheet(false)}
        onConfirm={handleConfirmSelection}
        isUpdating={isUpdating}
      />
    </Modal>
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
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addButton: {
    padding: Spacing.xs,
  },
  closeButton: {
    padding: Spacing.xs,
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
  recipeCard: {
    marginBottom: Spacing.md,
  },
  recipeHeader: {
    marginBottom: Spacing.md,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  recipeDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  recipeInfos: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recipeDetails: {
    marginTop: Spacing.xs,
  },
  detailsText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

