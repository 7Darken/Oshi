/**
 * Composant ErrorState
 * Affiche un message d'erreur convivial avec options de réessai
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, RotateCw, X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRecipeTranslation } from '@/hooks/useI18n';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  onCancel: () => void;
}

export function ErrorState({ error, onRetry, onCancel }: ErrorStateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useRecipeTranslation();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      accessible
      accessibilityLabel={t('recipe.analysis.error.accessibilityLabel')}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: '#FFE5E5' },
          ]}
        >
          <AlertCircle size={48} color="#FF6B6B" strokeWidth={1.5} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {t('recipe.analysis.error.title')}
        </Text>

        <Text style={[styles.message, { color: colors.icon }]}>
          {error || t('recipe.analysis.error.defaultMessage')}
        </Text>

        <Text style={[styles.hint, { color: colors.icon }]}>
          {t('recipe.analysis.error.persistentHint')}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title={t('recipe.analysis.error.retry')}
          onPress={onRetry}
          variant="primary"
          style={styles.retryButton}
        />
        <Button
          title={t('recipe.analysis.error.cancel')}
          onPress={onCancel}
          variant="outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  retryButton: {
    marginBottom: Spacing.sm,
  },
});

