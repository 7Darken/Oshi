/**
 * Composant IngredientRow - Ligne d'ingrédient avec checkbox
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ingredient } from '@/types/recipe';

interface IngredientRowProps {
  ingredient: Ingredient;
  imageUrl?: string | null;
}

export function IngredientRow({
  ingredient,
  imageUrl,
}: IngredientRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const displayQuantity = () => {
    if (ingredient.quantity && ingredient.unit) {
      return `${ingredient.quantity} ${ingredient.unit}`;
    }
    if (ingredient.quantity) {
      return ingredient.quantity;
    }
    return null;
  };

  // Capitaliser la première lettre du nom
  const capitalizeName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <View style={styles.container}>
      {/* Image de l'ingrédient si disponible */}
      {imageUrl && (
        <View style={styles.imageContainer}>
          <ExpoImage
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="contain"
            transition={200}
          />
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]}>
          {capitalizeName(ingredient.name)}
        </Text>
        {displayQuantity() && (
          <Text style={[styles.quantity, { color: colors.icon }]}>
            {displayQuantity()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  imageContainer: {
    width: 40,
    height: 40,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  quantity: {
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
});

