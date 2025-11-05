/**
 * Onglet Shopping List - Liste de courses de l'utilisateur
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { ShoppingCart, Check, Plus } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { AddFoodItemsSheet } from '@/components/AddFoodItemsSheet';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useFoodItems } from '@/hooks/useFoodItems';
import { FoodItem } from '@/stores/useFoodItemsStore';

export default function ShoppingScreen() {
  const [showAddSheet, setShowAddSheet] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { items, isLoading, error, refresh, toggleItem, deleteItem, deleteAllCheckedItems, addFoodItems } = useShoppingList();
  const { getFoodItemImage } = useFoodItems();

  const handleToggle = async (itemId: string) => {
    await toggleItem(itemId);
  };

  const handleDelete = (itemId: string) => {
    Alert.alert(
      'Supprimer l\'article',
      'Êtes-vous sûr de vouloir supprimer cet article de votre liste de courses ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => await deleteItem(itemId),
        },
      ]
    );
  };

  const handleAddFoodItems = async (selectedFoodItems: FoodItem[]) => {
    setIsAdding(true);
    try {
      await addFoodItems(selectedFoodItems.map(item => ({ id: item.id, name: item.name })));
      setShowAddSheet(false);
    } catch (err: any) {
      Alert.alert('Erreur', 'Impossible d\'ajouter les ingrédients à la liste de courses');
      console.error('❌ [Shopping] Erreur lors de l\'ajout:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteAllChecked = () => {
    Alert.alert(
      'Effacer tout',
      `Êtes-vous sûr de vouloir supprimer les ${checkedItems.length} article(s) déjà acheté(s) ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllCheckedItems();
            } catch (err: any) {
              Alert.alert('Erreur', 'Impossible de supprimer les articles');
              console.error('❌ [Shopping] Erreur lors de la suppression:', err);
            }
          },
        },
      ]
    );
  };

  // Séparer les items cochés et non cochés
  const uncheckedItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

  return (
    <>
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Liste de courses</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddSheet(true)}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {isLoading && items.length === 0 && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>
            Chargement de votre liste...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.icon }]}>{error}</Text>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <View style={styles.centerContainer}>
          <ShoppingCart size={64} color={colors.icon} strokeWidth={1} />
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            Votre liste est vide
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.icon }]}>
            Ajoutez des ingrédients depuis vos recettes
          </Text>
        </View>
      )}

      {/* Items non cochés - Affiché si il y a des items OU si "Déjà acheté" est visible */}
      {(uncheckedItems.length > 0 || checkedItems.length > 0) && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderFirst}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              À acheter ({uncheckedItems.length})
            </Text>
          </View>
          {uncheckedItems.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={[styles.emptySectionText, { color: colors.icon }]}>
                Aucun article à acheter
              </Text>
            </View>
          ) : (
            uncheckedItems.map((item) => {
            const foodItemImage = item.food_item_id ? getFoodItemImage(item.food_item_id) : null;
            return (
              <SwipeableRow key={item.id} onDelete={() => handleDelete(item.id)}>
                <Card style={styles.itemCard}>
                  <View style={styles.itemContent}>
                    <TouchableOpacity
                      onPress={() => handleToggle(item.id)}
                      style={styles.checkbox}
                      activeOpacity={0.7}
                    >
                      {item.checked ? (
                        <View style={[styles.checkboxChecked, { backgroundColor: colors.primary }]}>
                          <Check size={16} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : (
                        <View style={[styles.checkboxUnchecked, { borderColor: colors.border }]} />
                      )}
                    </TouchableOpacity>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: colors.text }]}>
                        {item.ingredient_name.charAt(0).toUpperCase() + item.ingredient_name.slice(1)}
                      </Text>
                      {(item.quantity || item.unit) && (
                        <Text style={[styles.itemQuantity, { color: colors.icon }]}>
                          {item.quantity && item.unit
                            ? `${item.quantity} ${item.unit}`
                            : item.quantity || item.unit}
                        </Text>
                      )}
                    </View>
                    {/* Image de l'ingrédient si disponible */}
                    {foodItemImage && (
                      <View style={styles.imageContainer}>
                        <ExpoImage
                          source={{ uri: foodItemImage }}
                          style={styles.image}
                          contentFit="contain"
                          transition={200}
                        />
                      </View>
                    )}
                  </View>
                </Card>
              </SwipeableRow>
            );
            })
          )}
        </View>
      )}

      {/* Items cochés */}
      {checkedItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>
              Déjà acheté ({checkedItems.length})
            </Text>
            <TouchableOpacity
              onPress={handleDeleteAllChecked}
              style={[styles.clearAllButton, { backgroundColor: colors.primary + '30' }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.clearAllText, { color: colors.primary }]}>
                Effacer tout
              </Text>
            </TouchableOpacity>
          </View>
          {checkedItems.map((item) => {
            const foodItemImage = item.food_item_id ? getFoodItemImage(item.food_item_id) : null;
            return (
              <SwipeableRow key={item.id} onDelete={() => handleDelete(item.id)}>
                <Card style={[styles.itemCard, { opacity: 0.5 }]}>
                  <View style={styles.itemContent}>
                    <TouchableOpacity
                      onPress={() => handleToggle(item.id)}
                      style={styles.checkbox}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkboxChecked, { backgroundColor: colors.primary }]}>
                        <Check size={16} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    </TouchableOpacity>
                    <View style={styles.itemInfo}>
                      <Text
                        style={[
                          styles.itemName,
                          { color: colors.text, textDecorationLine: 'line-through' },
                        ]}
                      >
                        {item.ingredient_name.charAt(0).toUpperCase() + item.ingredient_name.slice(1)}
                      </Text>
                      {(item.quantity || item.unit) && (
                        <Text style={[styles.itemQuantity, { color: colors.icon }]}>
                          {item.quantity && item.unit
                            ? `${item.quantity} ${item.unit}`
                            : item.quantity || item.unit}
                        </Text>
                      )}
                    </View>
                    {/* Image de l'ingrédient si disponible */}
                    {foodItemImage && (
                      <View style={styles.imageContainer}>
                        <ExpoImage
                          source={{ uri: foodItemImage }}
                          style={styles.image}
                          contentFit="contain"
                          transition={200}
                        />
                      </View>
                    )}
                  </View>
                </Card>
              </SwipeableRow>
            );
          })}
        </View>
      )}

      {/* Espacement en bas */}
      <View style={styles.bottomSpacer} />
    </ScrollView>

    {/* Sheet pour ajouter des food_items */}
    <AddFoodItemsSheet
      visible={showAddSheet}
      onClose={() => setShowAddSheet(false)}
      onConfirm={handleAddFoodItems}
      isAdding={isAdding}
    />
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionHeaderFirst: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md + Spacing.xs,
    paddingTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  clearAllButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
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
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  emptySection: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySectionText: {
    fontSize: 14,
    fontWeight: '400',
  },
  itemCard: {
    marginBottom: 0,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: Spacing.md,
  },
  checkboxUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  imageContainer: {
    width: 35,
    height: 35,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
    marginRight: Spacing.xs,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});

