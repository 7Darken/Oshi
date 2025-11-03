/**
 * Composant StepRow - Ligne d'étape de recette avec numéro et durée
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Step } from '@/types/recipe';

interface StepRowProps {
  step: Step;
}

export function StepRow({ step }: StepRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.numberBadge,
          { backgroundColor: colors.primary },
        ]}
      >
        <Text style={styles.number}>{step.order}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.text, { color: colors.text }]}>
          {step.text}
        </Text>
        {step.duration && (
          <View style={styles.duration}>
            <Clock size={14} color={colors.icon} />
            <Text style={[styles.durationText, { color: colors.icon }]}>
              {step.duration}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  number: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  durationText: {
    fontSize: 14,
    marginLeft: Spacing.xs,
  },
});

