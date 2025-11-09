/**
 * Bottom sheet pour les options de partage de recette
 * Uniquement pour les membres Premium
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Image, Users } from 'lucide-react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRecipeTranslation } from '@/hooks/useI18n';

interface ShareOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  onExportImage: () => void;
  onShareToFriend: () => void;
}

export function ShareOptionsSheet({
  visible,
  onClose,
  onExportImage,
  onShareToFriend,
}: ShareOptionsSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useRecipeTranslation();

  const handleExportImage = () => {
    onClose();
    onExportImage();
  };

  const handleShareToFriend = () => {
    onClose();
    onShareToFriend();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height="auto">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('recipe.share.options.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            {t('recipe.share.options.subtitle')}
          </Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {/* Option 1: Exporter en image */}
          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleExportImage}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Image size={24} color={colors.primary} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                {t('recipe.share.options.exportImage')}
              </Text>
              <Text style={[styles.optionDescription, { color: colors.icon }]}>
                {t('recipe.share.options.exportImageDescription')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option 2: Partager à un ami */}
          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleShareToFriend}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Users size={24} color={colors.primary} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                {t('recipe.share.options.shareToFriend')}
              </Text>
              <Text style={[styles.optionDescription, { color: colors.icon }]}>
                {t('recipe.share.options.shareToFriendDescription')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.lg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  options: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
});
