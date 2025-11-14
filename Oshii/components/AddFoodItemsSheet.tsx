/**
 * Composant AddFoodItemsSheet - Sheet pour sélectionner des food_items et les ajouter à la liste de courses
 */

import { Button } from '@/components/ui/Button';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n, useShoppingTranslation } from '@/hooks/useI18n';
import { useFoodItems } from '@/hooks/useFoodItems';
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

  // Grouper les food_items par catégorie
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, FoodItem[]> = {};
    
    filteredFoodItems.forEach((item) => {
      const category = item.category || t('shopping.addSheet.otherCategory');
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    // Trier les catégories alphabétiquement
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredFoodItems, t]);

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
                {items.map((foodItem) => {
                  const isSelected = selectedFoodItemIds.has(foodItem.id);
                  const displayName =
                    language === 'en' && foodItem.name_en ? foodItem.name_en : foodItem.name;

                  return (
                    <TouchableOpacity
                      key={foodItem.id}
                      style={[
                        styles.foodItemCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        isSelected && { borderColor: colors.primary, borderWidth: 2 },
                      ]}
                      onPress={() => toggleFoodItem(foodItem.id)}
                      activeOpacity={0.7}
                    >
                      {/* Checkbox */}
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: colors.border },
                          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                      >
                        {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
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
  foodItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  foodItemImage: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  foodItemImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  foodItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    opacity: 0.7,
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

