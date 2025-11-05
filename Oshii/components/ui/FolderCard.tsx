/**
 * Composant FolderCard - Carte de dossier avec design moderne
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { MoreVertical } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FolderCardProps {
  name: string;
  recipeCount: number;
  iconName?: string;
  onPress?: () => void;
  onOptionsPress?: () => void;
}

// Palette de couleurs pour les icônes de dossiers (basée sur le nom pour la cohérence)
const FOLDER_COLORS = [
  '#FF8B7A',
  '#E8D5B7',
  '#B8E0D2',
  '#D4C5E8',
  '#FFD4A3',
  '#B3D9E8',
];

// Fonction pour obtenir une couleur basée sur le nom
const getFolderColor = (name: string): string => {
  const index = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % FOLDER_COLORS.length;
  return FOLDER_COLORS[index];
};

// Fonction pour obtenir l'icône dynamiquement
const getIconComponent = (iconName: string = 'cooking-pot') => {
  // Convertir le nom de l'icône en PascalCase (ex: 'cooking-pot' -> 'CookingPot')
  const pascalName = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  // Récupérer l'icône depuis lucide-react-native
  const IconComponent = (LucideIcons as any)[pascalName] || LucideIcons.Folder;
  return IconComponent;
};

export function FolderCard({
  name,
  recipeCount,
  iconName = 'cooking-pot',
  onPress,
  onOptionsPress,
}: FolderCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const folderColor = getFolderColor(name);
  const IconComponent = getIconComponent(iconName);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icône du dossier avec couleur personnalisée */}
      <View style={styles.iconContainer}>
        <View style={[styles.iconBackground, { backgroundColor: `${folderColor}15` }]}>
          <IconComponent size={28} color={folderColor} strokeWidth={1.5} />
        </View>
      </View>

      {/* Menu options */}
      {onOptionsPress && (
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={onOptionsPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreVertical size={20} color={colors.icon} />
        </TouchableOpacity>
      )}

      {/* Nom du dossier */}
      <Text style={[styles.folderName, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>

      {/* Nombre de recettes */}
      <Text style={[styles.recipeCount, { color: colors.icon }]}>
        {recipeCount} {recipeCount === 1 ? 'recette' : 'recettes'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textAlign: 'left',
  },
  recipeCount: {
    fontSize: 14,
    textAlign: 'left',
  },
});

