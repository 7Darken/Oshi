/**
 * Composant IconSelectorSheet - Sheet minimaliste pour sélectionner une icône de cuisine
 */

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as LucideIcons from 'lucide-react-native';
import { X } from 'lucide-react-native';
import React from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface IconSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string) => void;
  selectedIcon?: string;
}

// Liste des icônes de cuisine disponibles
const KITCHEN_ICONS = [
  'cooking-pot',
  'chef-hat',
  'cookie',
  'cake',
  'ice-cream-bowl',
  'coffee',
  'wine',
  'utensils-crossed',
  'salad',
  'drumstick',
  'fish',
  'apple',
  'carrot',
  'cherry',
  'leaf',
  'sparkles',
  'star',
  'heart',
  'folder',
  'cup-soda',
  'egg',
  'pizza',
  'sandwich',
  'soup',
];

// Palette de couleurs pour les icônes
const ICON_COLORS = [
  '#FF8B7A',

];

// Fonction pour obtenir l'icône dynamiquement
const getIconComponent = (iconName: string) => {
  const pascalName = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  const IconComponent = (LucideIcons as any)[pascalName] || LucideIcons.Folder;
  return IconComponent;
};

export function IconSelectorSheet({
  visible,
  onClose,
  onSelectIcon,
  selectedIcon,
}: IconSelectorSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSelectIcon = (iconName: string) => {
    onSelectIcon(iconName);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Choisir une icône
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Icons Grid */}
        <ScrollView
          contentContainerStyle={styles.iconsContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconsGrid}>
            {KITCHEN_ICONS.map((iconName) => {
              const IconComponent = getIconComponent(iconName);
              const isSelected = selectedIcon === iconName;
              const colorIndex = KITCHEN_ICONS.indexOf(iconName) % ICON_COLORS.length;
              const iconColor = ICON_COLORS[colorIndex];
              
              return (
                <TouchableOpacity
                  key={iconName}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor: isSelected ? iconColor : colors.card,
                      borderColor: isSelected ? iconColor : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleSelectIcon(iconName)}
                  activeOpacity={0.7}
                >
                  <IconComponent
                    size={24}
                    color={isSelected ? '#FFFFFF' : colors.icon}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  iconsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  iconOption: {
    width: 64,
    height: 68,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
