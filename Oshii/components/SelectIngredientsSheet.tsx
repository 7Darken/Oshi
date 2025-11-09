/**
 * Composant SelectIngredientsSheet - Sheet pour sélectionner des ingrédients
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRecipeTranslation } from '@/hooks/useI18n';

export interface IngredientItem {
  name: string;
  quantity?: string;
  unit?: string;
  imageUrl?: string | null;
}

interface SelectIngredientsSheetProps {
  visible: boolean;
  onClose: () => void;
  ingredients: IngredientItem[];
  onConfirm: (selectedIndices: number[]) => Promise<void>;
  isAdding?: boolean;
}

export function SelectIngredientsSheet({
  visible,
  onClose,
  ingredients,
  onConfirm,
  isAdding = false,
}: SelectIngredientsSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useRecipeTranslation();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const toggleIngredient = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const handleConfirm = async () => {
    if (selectedIndices.size > 0) {
      await onConfirm(Array.from(selectedIndices));
    }
    setSelectedIndices(new Set());
  };

  // Capitaliser la première lettre du nom
  const capitalizeName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const displayQuantity = (ingredient: IngredientItem) => {
    if (ingredient.quantity && ingredient.unit) {
      return `${ingredient.quantity} ${ingredient.unit}`;
    }
    if (ingredient.quantity) {
      return ingredient.quantity;
    }
    return null;
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('recipe.selectIngredients.title')}
          </Text>
          <Pressable
            onPress={onClose}
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
          {ingredients.map((ingredient, index) => {
            const isSelected = selectedIndices.has(index);
            return (
              <TouchableOpacity
                key={index}
                onPress={() => toggleIngredient(index)}
                activeOpacity={0.8}
              >
                <View style={styles.ingredientRow}>
                  {/* Image ou icône par défaut */}
                  <View style={styles.imageContainer}>
                    {ingredient.imageUrl ? (
                      <ExpoImage
                        source={{ uri: ingredient.imageUrl }}
                        style={styles.image}
                        contentFit="contain"
                        transition={200}
                      />
                    ) : (
                      <View style={[styles.placeholderContainer, { backgroundColor: colors.secondary }]}>
                        <Text style={styles.placeholderEmoji}>🥘</Text>
                      </View>
                    )}
                  </View>

                  {/* Nom et quantité */}
                  <View style={styles.ingredientInfo}>
                    <Text style={[styles.ingredientName, { color: colors.text }]}>
                      {capitalizeName(ingredient.name)}
                    </Text>
                    {displayQuantity(ingredient) && (
                      <Text style={[styles.ingredientQuantity, { color: colors.icon }]}>
                        {displayQuantity(ingredient)}
                      </Text>
                    )}
                  </View>

                  {/* Checkbox */}
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && { 
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    {isSelected && <Check size={20} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer avec bouton */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={selectedIndices.size === 0 || isAdding}
            style={[
              styles.confirmButton,
              {
                backgroundColor: selectedIndices.size === 0 ? colors.secondary : colors.primary,
                opacity: selectedIndices.size === 0 || isAdding ? 0.5 : 1,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>
              {isAdding
                ? t('recipe.selectIngredients.adding')
                : t('recipe.selectIngredients.addButton', { count: selectedIndices.size })
              }
            </Text>
          </TouchableOpacity>
        </View>
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
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'transparent',
  },
  imageContainer: {
    width: 40,
    height: 40,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 20,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  ingredientQuantity: {
    fontSize: 14,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.light.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  confirmButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

