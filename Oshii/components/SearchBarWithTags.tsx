/**
 * Composant de recherche avec autocomplétion et tags pour food_items
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Search, X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFoodItems } from '@/hooks/useFoodItems';
import { FoodItem } from '@/stores/useFoodItemsStore';

interface SearchBarWithTagsProps {
  selectedFoodItems: FoodItem[];
  onFoodItemsChange: (foodItems: FoodItem[]) => void;
  placeholder?: string;
}

export function SearchBarWithTags({
  selectedFoodItems,
  onFoodItemsChange,
  placeholder = 'Rechercher un ingrédient...',
}: SearchBarWithTagsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { searchFoodItems, isInitialized } = useFoodItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Rechercher les suggestions quand la requête change
  useEffect(() => {
    if (!isInitialized) return;

    const query = searchQuery.trim().toLowerCase();
    if (query.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Rechercher les food_items correspondants
    const matchingFoodItems = searchFoodItems(query);

    // Filtrer ceux déjà sélectionnés
    const selectedIds = new Set(selectedFoodItems.map((item) => item.id));
    const filteredSuggestions = matchingFoodItems.filter(
      (item) => !selectedIds.has(item.id)
    );

    setSuggestions(filteredSuggestions.slice(0, 5)); // Limiter à 5 suggestions
    setShowSuggestions(filteredSuggestions.length > 0);
  }, [searchQuery, selectedFoodItems, searchFoodItems, isInitialized]);

  const handleSelectFoodItem = (foodItem: FoodItem) => {
    // Ajouter le food_item sélectionné
    onFoodItemsChange([...selectedFoodItems, foodItem]);
    setSearchQuery('');
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleRemoveFoodItem = (foodItemId: string) => {
    onFoodItemsChange(selectedFoodItems.filter((item) => item.id !== foodItemId));
  };

  const renderTag = (foodItem: FoodItem) => (
    <View key={foodItem.id} style={[styles.tag, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {foodItem.image_url && (
        <ExpoImage
          source={{ uri: foodItem.image_url }}
          style={styles.tagImage}
          contentFit="cover"
        />
      )}
      <Text style={[styles.tagText, { color: colors.text }]} numberOfLines={1}>
        {foodItem.name}
      </Text>
      <TouchableOpacity
        onPress={() => handleRemoveFoodItem(foodItem.id)}
        style={styles.tagRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={14} color={colors.icon} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );

  const renderSuggestion = ({ item, index }: { item: FoodItem; index: number }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        { backgroundColor: colors.card, borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth, borderTopColor: colors.border }
      ]}
      onPress={() => handleSelectFoodItem(item)}
      activeOpacity={0.7}
    >
      {item.image_url ? (
        <ExpoImage
          source={{ uri: item.image_url }}
          style={styles.suggestionImage}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.suggestionImagePlaceholder, { backgroundColor: colors.secondary }]} />
      )}
      <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={[styles.searchBarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search size={18} color={colors.icon} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View
        style={[
          styles.tagsWrapper,
          !(selectedFoodItems.length > 0 || (showSuggestions && suggestions.length > 0)) && { marginTop: 0 },
        ]}
      >
        {/* Tags des food_items sélectionnés */}
        {selectedFoodItems.length > 0 && (
          <View style={styles.tagsContainer}>
            {selectedFoodItems.map(renderTag)}
          </View>
        )}

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <View
            style={[
              styles.suggestionsContainer,
              styles.suggestionsOverlay,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {suggestions.map((item, index) => (
                <React.Fragment key={item.id}>
                  {renderSuggestion({ item, index })}
                </React.Fragment>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  tagsWrapper: {
    position: 'relative',
    marginTop: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    maxWidth: '100%',
  },
  tagImage: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: Spacing.xs,
    maxWidth: 120,
  },
  tagRemove: {
    padding: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  suggestionsContainer: {
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    marginTop: 0,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  suggestionImage: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  suggestionImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
});

