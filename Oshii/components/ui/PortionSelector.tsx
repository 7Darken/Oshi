/**
 * Composant PortionSelector - Sélecteur de portions avec boutons +/-
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PortionSelectorProps {
  portions: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
}

export function PortionSelector({
  portions,
  onDecrease,
  onIncrease,
  disabled = false,
}: PortionSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Portions</Text>
      <View style={[styles.selector, { borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={onDecrease}
          disabled={disabled || portions <= 1}
          style={[
            styles.button,
            { opacity: disabled || portions <= 1 ? 0.3 : 1 },
          ]}
          activeOpacity={0.7}
        >
          <Minus size={20} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.value, { color: colors.text }]}>{portions}</Text>
        <TouchableOpacity
          onPress={onIncrease}
          disabled={disabled || portions >= 15}
          style={[
            styles.button,
            { opacity: disabled || portions >= 15 ? 0.3 : 1 },
          ]}
          activeOpacity={0.7}
        >
          <Plus size={20} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  button: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: Spacing.lg,
    minWidth: 40,
    textAlign: 'center',
  },
});

