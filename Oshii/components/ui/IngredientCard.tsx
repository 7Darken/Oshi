/**
 * Composant IngredientCard - Carte d'ingrédient verticale avec illustration
 */

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
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
  const { width: windowWidth } = useWindowDimensions();

  // Détecter si on est sur tablette (iPad)
  const isTablet = windowWidth >= 768;
  
  // Adapter le nombre de cartes par ligne selon le type d'appareil
  const cardsPerRow = isTablet ? 5 : 3;
  
  // Calculer la largeur dynamique
  // Largeur disponible = windowWidth - (padding horizontal gauche + droit)
  const horizontalPadding = Spacing.lg * 2; // Padding gauche + droite du container
  const gapBetweenCards = Spacing.lg; // Gap entre les cartes
  const availableWidth = windowWidth - horizontalPadding;
  const cardWidth = (availableWidth - (gapBetweenCards * (cardsPerRow - 1))) / cardsPerRow;

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

  // Calculer les tailles proportionnelles basées sur la largeur de la carte
  const imageSize = Math.max(cardWidth * 0.5, 45); // 50% de la largeur, minimum 45px
  const fontSize = Math.max(cardWidth * 0.11, 11); // ~11% de la largeur, minimum 11px
  const quantityFontSize = Math.max(cardWidth * 0.15, 14); // ~15% de la largeur, minimum 14px

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.card, 
        borderColor: colors.border,
        width: cardWidth,
      }
    ]}>
      {/* Image de l'ingrédient si disponible */}
      {imageUrl ? (
        <View style={[styles.imageContainer, { width: imageSize, height: imageSize }]}>
          <ExpoImage
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="contain"
            transition={200}
          />
        </View>
      ) : (
        <View style={[
          styles.imageContainer, 
          { 
            backgroundColor: colors.secondary,
            width: imageSize, 
            height: imageSize 
          }
        ]}>
          <Text style={[styles.placeholderEmoji, { color: colors.icon, fontSize: imageSize * 0.4 }]}>
            🥘
          </Text>
        </View>
      )}
      
      {/* Nom et quantité */}
      <View style={styles.content}>
        <Text 
          style={[styles.name, { color: colors.text, fontSize }]} 
          numberOfLines={2}
        >
          {capitalizeName(ingredient.name)}
        </Text>
        {displayQuantity() && (
          <Text style={[styles.quantity, { color: colors.text, fontSize: quantityFontSize }]}>
            {displayQuantity()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // width calculée dynamiquement
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
    // width et height calculées dynamiquement
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
    // fontSize calculé dynamiquement
  },
  content: {
    alignItems: 'center',
    flex: 1,
  },
  name: {
    // fontSize calculé dynamiquement
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  quantity: {
    // fontSize calculé dynamiquement
    fontWeight: '700',
    textAlign: 'center',
  },
});

