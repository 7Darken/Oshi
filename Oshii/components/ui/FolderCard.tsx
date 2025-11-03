/**
 * Composant FolderCard - Carte de dossier avec design moderne
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Folder, MoreVertical } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FolderCardProps {
  name: string;
  recipeCount: number;
  color?: string;
  onPress?: () => void;
  onOptionsPress?: () => void;
}

// Palettes de couleurs pour les icônes de dossiers
const FOLDER_COLORS = [
  { main: '#FF8B7A', tab: '#FFB3A8' }, // Corail doux (couleur primaire)
  { main: '#E8D5B7', tab: '#F5E8D0' }, // Beige doré
  { main: '#B8E0D2', tab: '#D4F0E7' }, // Vert menthe
  { main: '#D4C5E8', tab: '#E8DDF2' }, // Violet doux
  { main: '#FFD4A3', tab: '#FFE5C6' }, // Pêche
  { main: '#B3D9E8', tab: '#D1E9F2' }, // Bleu ciel
];

export function FolderCard({
  name,
  recipeCount,
  color,
  onPress,
  onOptionsPress,
}: FolderCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Sélectionner une couleur aléatoire basée sur le nom pour la cohérence
  const folderColorIndex = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % FOLDER_COLORS.length;
  const selectedColor = FOLDER_COLORS[folderColorIndex];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icône du dossier avec couleur personnalisée */}
      <View style={styles.iconContainer}>
        <View style={[styles.folderIcon, { backgroundColor: selectedColor.main }]}>
          <View style={[styles.folderTab, { backgroundColor: selectedColor.tab }]} />
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
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    minHeight: 140,
    justifyContent: 'space-between',
    width: '47%',
  },
  iconContainer: {
    marginBottom: Spacing.sm,
  },
  folderIcon: {
    width: 48,
    height: 40,
    borderRadius: BorderRadius.sm,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderTab: {
    position: 'absolute',
    top: -6,
    left: 0,
    width: 24,
    height: 8,
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.xs,
  },
  optionsButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    padding: Spacing.xs,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  recipeCount: {
    fontSize: 14,
    fontWeight: '500',
  },
});

