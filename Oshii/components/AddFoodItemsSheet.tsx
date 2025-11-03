/**
 * Composant AddFoodItemsSheet - Sheet pour sélectionner des food_items et les ajouter à la liste de courses
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { FoodItem } from '@/stores/useFoodItemsStore';
import { useFoodItems } from '@/hooks/useFoodItems';

interface AddFoodItemsSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedFoodItems: FoodItem[]) => Promise<void>;
  isAdding?: boolean;
}

function capitalizeName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function AddFoodItemsSheet({
  visible,
  onClose,
  onConfirm,
  isAdding = false,
}: AddFoodItemsSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
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
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Ajouter des ingrédients
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Rechercher un ingrédient..."
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
                {searchQuery ? 'Aucun ingrédient trouvé' : 'Aucun ingrédient disponible'}
              </Text>
            </View>
          ) : (
            filteredFoodItems.map((foodItem) => {
              const isSelected = selectedFoodItemIds.has(foodItem.id);
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
                    {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
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
                    {capitalizeName(foodItem.name)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            title={
              isAdding
                ? 'Ajout en cours...'
                : selectedFoodItemIds.size > 0
                ? `Ajouter (${selectedFoodItemIds.size})`
                : 'Ajouter'
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
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  foodItemImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  foodItemImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  foodItemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
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

