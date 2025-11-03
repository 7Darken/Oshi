/**
 * Composant SelectRecipesSheet - Sheet de sélection multiple de recettes
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
import { X, Clock, Users, CheckCircle } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useOrphanRecipes } from '@/hooks/useOrphanRecipes';

interface SelectRecipesSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (recipeIds: string[]) => Promise<void>;
  isUpdating?: boolean;
}

export function SelectRecipesSheet({
  visible,
  onClose,
  onConfirm,
  isUpdating = false,
}: SelectRecipesSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { recipes, isLoading, error } = useOrphanRecipes();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelection = (recipeId: string) => {
    setSelectedIds((prev) =>
      prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
    );
  };

  const handleConfirm = async () => {
    if (selectedIds.length > 0) {
      await onConfirm(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleClose = () => {
    setSelectedIds([]);
    onClose();
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
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Sélectionner des recettes
          </Text>
          <Pressable
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.text} />
          </Pressable>
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
                Aucune recette disponible
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                Toutes vos recettes sont déjà classées dans des dossiers
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.selectionInfo, { color: colors.icon }]}>
                {selectedIds.length}{' '}
                {selectedIds.length === 1 ? 'recette sélectionnée' : 'recettes sélectionnées'}
              </Text>
              {recipes.map((recipe) => {
                const isSelected = selectedIds.includes(recipe.id);
                return (
                  <TouchableOpacity
                    key={recipe.id}
                    onPress={() => handleToggleSelection(recipe.id)}
                    activeOpacity={0.8}
                  >
                    <Card
                      style={[
                        styles.recipeCard,
                        isSelected && { borderColor: colors.primary, borderWidth: 2 },
                      ]}
                    >
                      {isSelected && (
                        <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                          <CheckCircle size={20} color="#FFFFFF" />
                        </View>
                      )}
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
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>

        {/* Footer with Confirm Button */}
        {selectedIds.length > 0 && (
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
            <Button
              title={`Ajouter ${selectedIds.length} ${selectedIds.length === 1 ? 'recette' : 'recettes'}`}
              onPress={handleConfirm}
              loading={isUpdating}
              disabled={isUpdating}
            />
          </View>
        )}
      </View>
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
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  selectionInfo: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.md,
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
    position: 'relative',
  },
  checkmark: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    borderRadius: BorderRadius.full,
    zIndex: 10,
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
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});

