/**
 * Composant OshiiLogo - Logo de l'application Oshii avec différentes tailles
 */

import React from 'react';
import { ImageStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

interface OshiiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ImageStyle;
}

const SIZES = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 120,
};

export function OshiiLogo({ size = 'md', style }: OshiiLogoProps) {
  const sizeValue = SIZES[size];

  return (
    <ExpoImage
      source={require('@/assets/logo/OshiiAppLogo.png')}
      style={[{ width: sizeValue, height: sizeValue }, style]}
      contentFit="cover"
      transition={200}
    />
  );
}
