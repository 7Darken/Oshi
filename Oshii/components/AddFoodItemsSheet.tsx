/**
 * Composant AddFoodItemsSheet - Sheet pour sélectionner des food_items et les ajouter à la liste de courses
 */

import { Button } from '@/components/ui/Button';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFoodItems } from '@/hooks/useFoodItems';
import { useI18n, useShoppingTranslation } from '@/hooks/useI18n';
import { FoodItem } from '@/stores/useFoodItemsStore';
import { Image as ExpoImage } from 'expo-image';
import { Check, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface AddFoodItemsSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedFoodItems: FoodItem[]) => Promise<void>;
  isAdding?: boolean;
}

function capitalizeName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function normalizeCategoryName(category: string): string {
  // Remplacer les underscores par des espaces
  const normalized = category.replace(/_/g, ' ');
  // Capitaliser chaque mot
  return normalized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function AddFoodItemsSheet({
  visible,
  onClose,
  onConfirm,
  isAdding = false,
}: AddFoodItemsSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useShoppingTranslation();
  const { language } = useI18n();
  const { foodItems, searchFoodItems } = useFoodItems();
  const [selectedFoodItemIds, setSelectedFoodItemIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les food_items selon la recherche
  const filteredFoodItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return foodItems;
    }
    return searchFoodItems(searchQuery);
  }, [foodItems, searchQuery, searchFoodItems]);

  // Grouper les food_items par catégorie et trier
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, FoodItem[]> = {};

    filteredFoodItems.forEach((item) => {
      const category = item.category || t('shopping.addSheet.otherCategory');
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    // Trier chaque catégorie par nom d'ingrédient
    Object.keys(groups).forEach((category) => {
      groups[category].sort((a, b) => {
        const nameA = language === 'en' && a.name_en ? a.name_en : a.name;
        const nameB = language === 'en' && b.name_en ? b.name_en : b.name;
        return nameA.localeCompare(nameB);
      });
    });

    // Trier les catégories alphabétiquement
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredFoodItems, t, language]);

  const toggleFoodItem = (foodItemId: string) => {
    const newSelected = new Set(selectedFoodItemIds);
    if (newSelected.has(foodItemId)) {
      newSelected.delete(foodItemId);
    } else {
      newSelected.add(foodItemId);
    }
    setSelectedFoodItemIds(newSelected);
  };

  const handleConfirm = async () => {
    const selectedFoodItems = foodItems.filter((item) => selectedFoodItemIds.has(item.id));
    if (selectedFoodItems.length === 0) return;

    await onConfirm(selectedFoodItems);
    setSelectedFoodItemIds(new Set());
    setSearchQuery('');
  };

  const handleClose = () => {
    setSelectedFoodItemIds(new Set());
    setSearchQuery('');
    onClose();
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
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('shopping.addSheet.title')}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder={t('shopping.addSheet.searchPlaceholder')}
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredFoodItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                {searchQuery ? t('shopping.addSheet.noResults') : t('shopping.addSheet.noIngredients')}
              </Text>
            </View>
          ) : (
            groupedByCategory.map(([category, items]) => (
              <View key={category} style={styles.categorySection}>
                {/* Titre de catégorie */}
                <Text style={[styles.categoryTitle, { color: colors.icon }]}>
                  {normalizeCategoryName(category)}
                </Text>
                
                {/* Items de la catégorie */}
                <View style={styles.categoryItemsContainer}>
                  {items.map((foodItem) => {
                    const isSelected = selectedFoodItemIds.has(foodItem.id);
                    const displayName =
                      language === 'en' && foodItem.name_en ? foodItem.name_en : foodItem.name;

                    return (
                      <TouchableOpacity
                        key={foodItem.id}
                        style={[
                          styles.foodItemCard,
                          {
                            backgroundColor: isSelected ? `${colors.primary}10` : colors.card,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => toggleFoodItem(foodItem.id)}
                        activeOpacity={0.7}
                      >
                        {/* Checkbox en haut à droite */}
                        <View
                          style={[
                            styles.checkbox,
                            { borderColor: colors.border, backgroundColor: colors.card },
                            isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                        >
                          {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={2.5} />}
                        </View>

                        {/* Image */}
                        {foodItem.image_url ? (
                          <ExpoImage
                            source={{ uri: foodItem.image_url }}
                            style={styles.foodItemImage}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.foodItemImagePlaceholder, { backgroundColor: colors.secondary }]} />
                        )}

                        {/* Name */}
                        <Text style={[styles.foodItemName, { color: colors.text }]} numberOfLines={2}>
                          {capitalizeName(displayName)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            title={
              isAdding
                ? t('shopping.addSheet.adding')
                : selectedFoodItemIds.size > 0
                ? t('shopping.addSheet.addButton', { count: selectedFoodItemIds.size })
                : t('shopping.addSheet.addButtonEmpty')
            }
            onPress={handleConfirm}
            disabled={selectedFoodItemIds.size === 0 || isAdding}
            loading={isAdding}
          />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchInput: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  categoryItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  foodItemCard: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    width: '31.5%',
    aspectRatio: 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    justifyContent: 'center',
  },
  checkbox: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodItemImage: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  foodItemImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  foodItemName: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});

