/**
 * Composant ProfileTypeIcon - Affiche l'icône correspondant au type de profil
 */

import React from 'react';
import { Image as ExpoImage } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';

type ProfileType = 'survivaliste' | 'cuisinier' | 'sportif';

interface ProfileTypeIconProps {
  profileType: ProfileType;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

// Mapping des images de profil
const profileImages: Record<ProfileType, any> = {
  survivaliste: require('@/assets/ProfileType/survivaliste.png'),
  cuisinier: require('@/assets/ProfileType/cuisinier.png'),
  sportif: require('@/assets/ProfileType/sportif.png'),
};

export function ProfileTypeIcon({ profileType, size = 48, style }: ProfileTypeIconProps) {
  return (
    <ExpoImage
      source={profileImages[profileType]}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      transition={200}
    />
  );
}
