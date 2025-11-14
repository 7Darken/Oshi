/**
 * Composant de recherche avec autocomplétion et tags pour food_items
 */

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFoodItems } from '@/hooks/useFoodItems';
import { useI18n } from '@/hooks/useI18n';
import { FoodItem } from '@/stores/useFoodItemsStore';
import { Image as ExpoImage } from 'expo-image';
import { Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollView as ScrollViewType } from 'react-native';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface SearchBarWithTagsProps {
  selectedFoodItems: FoodItem[];
  onFoodItemsChange: (foodItems: FoodItem[]) => void;
  placeholder?: string;
}

const TAGS_MAX_HEIGHT = 136;

export function SearchBarWithTags({
  selectedFoodItems,
  onFoodItemsChange,
  placeholder = 'Rechercher un ingrédient...',
}: SearchBarWithTagsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { searchFoodItems, isInitialized } = useFoodItems();
  const { language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const tagsScrollRef = useRef<ScrollViewType | null>(null);
  const hasSelectedItems = selectedFoodItems.length > 0;

  const scrollTagsToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      tagsScrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleChangeText = (value: string) => {
    setSearchQuery(value);
  };

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

  useEffect(() => {
    if (selectedFoodItems.length === 0) {
      return;
    }
    scrollTagsToEnd();
  }, [selectedFoodItems.length, scrollTagsToEnd]);

  const handleSelectFoodItem = (foodItem: FoodItem) => {
    // Ajouter le food_item sélectionné
    onFoodItemsChange([...selectedFoodItems, foodItem]);
    setSearchQuery('');
    setShowSuggestions(false);
    inputRef.current?.blur();
    scrollTagsToEnd();
  };

  const handleRemoveFoodItem = (foodItemId: string) => {
    onFoodItemsChange(selectedFoodItems.filter((item) => item.id !== foodItemId));
    setSearchQuery('');
  };

  const getDisplayName = (foodItem: FoodItem) =>
    language === 'en' && foodItem.name_en ? foodItem.name_en : foodItem.name;

  const renderTag = (foodItem: FoodItem) => (
    <View
      key={foodItem.id}
      style={[styles.tag, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {foodItem.image_url && (
        <ExpoImage
          source={{ uri: foodItem.image_url }}
          style={styles.tagImage}
          contentFit="cover"
        />
      )}
      <Text style={[styles.tagText, { color: colors.text }]} numberOfLines={1}>
        {getDisplayName(foodItem)}
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
        {getDisplayName(item)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        {/* Barre de recherche */}
        <View
          style={[styles.searchBarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Search size={18} color={colors.icon} style={styles.searchIcon} />
          <View style={styles.inputContentWrapper}>
            <ScrollView
              ref={tagsScrollRef}
              style={styles.tagsScroll}
              contentContainerStyle={styles.searchBarContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              {selectedFoodItems.map(renderTag)}
              <TextInput
                ref={inputRef}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={hasSelectedItems ? '' : placeholder}
                placeholderTextColor={colors.icon}
                value={searchQuery}
                onChangeText={handleChangeText}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                  scrollTagsToEnd();
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
            </ScrollView>
          </View>
        </View>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <View
            style={[styles.suggestionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
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

  },
  searchWrapper: {
    position: 'relative',
  },
  inputContentWrapper: {
    flex: 1,
    position: 'relative',
  },
  tagsScroll: {
    flex: 1,
    minHeight: 44,
    maxHeight: TAGS_MAX_HEIGHT,
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
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
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
    alignItems: 'flex-start',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 50,
  },
  searchInput: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 120,
    fontSize: 16,
    paddingVertical: Spacing.xs,
    alignSelf: 'center',
    textAlignVertical: 'center',
  },
  searchIcon: {
    marginRight: Spacing.sm,
    alignSelf: 'center',
  },
  searchBarContent: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingBottom: Spacing.xs,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 20,
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

