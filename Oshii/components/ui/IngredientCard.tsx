/**
 * Composant IngredientCard - Carte d'ingrédient verticale avec illustration
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ingredient } from '@/types/recipe';

interface IngredientCardProps {
  ingredient: Ingredient;
  imageUrl?: string | null;
}

export function IngredientCard({
  ingredient,
  imageUrl,
}: IngredientCardProps) {
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
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Image de l'ingrédient si disponible */}
      {imageUrl ? (
        <View style={styles.imageContainer}>
          <ExpoImage
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="contain"
            transition={200}
          />
        </View>
      ) : (
        <View style={[styles.imageContainer, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.placeholderEmoji, { color: colors.icon }]}>🥘</Text>
        </View>
      )}
      
      {/* Nom et quantité */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {capitalizeName(ingredient.name)}
        </Text>
        {displayQuantity() && (
          <Text style={[styles.quantity, { color: colors.text }]}>
            {displayQuantity()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderEmoji: {
    fontSize: 24,
  },
  content: {
    alignItems: 'center',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    minHeight: 32,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

