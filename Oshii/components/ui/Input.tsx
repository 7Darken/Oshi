/**
 * Composant Input - Champ de texte stylisé selon le design Oshii
 */

import React from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? '#FF6B6B' : colors.border,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.icon}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 50,
  },
  error: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: Spacing.xs,
  },
});

