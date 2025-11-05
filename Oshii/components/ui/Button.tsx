/**
 * Composant Button - Bouton stylisé selon le design Oshii
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const buttonStyle = [
    styles.button,
    variant === 'primary' && [styles.primaryButton, { backgroundColor: colors.primary }],
    variant === 'secondary' && [
      styles.secondaryButton,
      { backgroundColor: colors.secondary },
    ],
    variant === 'outline' && [
      styles.outlineButton,
      { borderColor: colors.primary, borderWidth: 2 },
    ],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textColor =
    variant === 'outline'
      ? colors.primary
      : variant === 'secondary'
        ? colors.text
        : '#FFFFFF';

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButton: {
    // backgroundColor défini dynamiquement
  },
  secondaryButton: {
    // backgroundColor défini dynamiquement
  },
  outlineButton: {
    backgroundColor: 'transparent',
    // border défini dynamiquement
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

