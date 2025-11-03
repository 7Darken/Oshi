/**
 * Thème Oshii - Design minimaliste inspiré de la sobriété japonaise
 * Palette : beige clair, blanc cassé, corail doux, gris doux
 * Typographie : Inter ou Poppins
 */

import { Platform } from 'react-native';

// Palette de couleurs Oshii
export const OshiiColors = {
  // Couleur principale de l'app
  primary: '#f9403c',
  
  beige: {
    light: '#F5F1E8',
    medium: '#E8E0D3',
  },
  white: {
    offWhite: '#FAFAF8',
    pure: '#FFFFFF',
  },
  coral: {
    soft: '#FF8B7A', // Rouge rose original (gardé pour compatibilité)
    light: '#FFB3A8',
    dark: '#E87466',
  },
  gray: {
    soft: '#E5E5E5',
    medium: '#9B9B9B',
    dark: '#4A4A4A',
  },
  text: {
    primary: '#2C2C2C',
    secondary: '#6B6B6B',
    light: '#9B9B9B',
  },
};

export const Colors = {
  light: {
    text: OshiiColors.text.primary,
    background: OshiiColors.white.offWhite,
    tint: OshiiColors.primary,
    icon: OshiiColors.gray.medium,
    tabIconDefault: OshiiColors.gray.medium,
    tabIconSelected: OshiiColors.primary,
    card: OshiiColors.white.pure,
    border: OshiiColors.gray.soft,
    primary: OshiiColors.primary,
    secondary: OshiiColors.beige.light,
    destructive: '#DC2626',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: OshiiColors.primary,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: OshiiColors.primary,
    card: '#1E1E1E',
    border: '#2E2E2E',
    primary: OshiiColors.primary,
    secondary: OshiiColors.beige.medium,
    destructive: '#EF4444',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** Inter ou Poppins pour iOS */
    sans: 'Inter',
    sansFallback: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Inter',
    sansFallback: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "Inter, 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    sansFallback: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Espacements généreux (padding)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius pour coins arrondis
export const BorderRadius = {
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
};
