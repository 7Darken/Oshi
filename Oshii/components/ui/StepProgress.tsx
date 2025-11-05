/**
 * Composant de progression par étapes pour l'onboarding
 * Affiche des barres qui se remplissent de gauche à droite avec une animation smooth
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StepProgressProps {
  /** Nombre total d'étapes */
  totalSteps: number;
  /** Étape actuelle (commence à 1) */
  currentStep: number;
}

export function StepProgress({ totalSteps, currentStep }: StepProgressProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <ProgressBar
            key={stepNumber}
            isCompleted={isCompleted}
            isActive={isActive}
            primaryColor={colors.primary}
            backgroundColor={colors.border}
          />
        );
      })}
    </View>
  );
}

interface ProgressBarProps {
  isCompleted: boolean;
  isActive: boolean;
  primaryColor: string;
  backgroundColor: string;
}

function ProgressBar({
  isCompleted,
  isActive,
  primaryColor,
  backgroundColor,
}: ProgressBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isCompleted) {
      // Étape complétée : 100%
      progress.value = withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else if (isActive) {
      // Étape active : animation de remplissage
      progress.value = withTiming(1, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      // Étape non atteinte : 0%
      progress.value = withTiming(0, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [isCompleted, isActive, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <View
      style={[
        styles.progressBar,
        { backgroundColor: backgroundColor },
      ]}
    >
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor: primaryColor },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

