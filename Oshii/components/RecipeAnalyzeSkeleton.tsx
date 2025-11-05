/**
 * Composant RecipeAnalyzeSkeleton
 * Affiche un skeleton moderne avec animations shimmer pendant l'analyse de la recette
 */

import { OshiiLogo } from '@/components/ui/OshiiLogo';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export type AnalyzeStage =
  | 'Téléchargement'
  | 'Transcription'
  | 'Extraction'
  | 'Normalisation'
  | 'Finalisation';

interface RecipeAnalyzeSkeletonProps {
  url?: string;
  onCancel: () => void;
  stage?: AnalyzeStage;
  estimatedTime?: number; // en secondes
}

const STAGES: AnalyzeStage[] = [
  'Téléchargement',
  'Transcription',
  'Extraction',
  'Normalisation',
  'Finalisation',
];

export function RecipeAnalyzeSkeleton({
  url,
  onCancel,
  stage = 'Téléchargement',
  estimatedTime = 30,
}: RecipeAnalyzeSkeletonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation shimmer
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation shimmer continue
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();

    // Animation pulse pour le chip actif
    return () => {
      shimmerLoop.stop();
    };
  }, [shimmerAnim]);

  // Animation shimmer : interpolation pour un effet de vague
  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  const activeStageIndex = STAGES.indexOf(stage);
  const progressAnim = useRef(new Animated.Value(activeStageIndex + 1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: activeStageIndex + 1,
      duration: 1000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [activeStageIndex, progressAnim]);

  const renderShimmer = (width: string | number = '100%') => {
    return (
      <Animated.View
        style={[
          styles.shimmerContainer,
          { width: width as any, backgroundColor: colors.border },
          {
            opacity: shimmerOpacity,
          },
        ]}
      />
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      accessible
      accessibilityLabel="Analyse de la recette en cours"
    >
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <OshiiLogo size="lg" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          On analyse la recette…
        </Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          {stage === 'Téléchargement' 
            ? 'Téléchargement de la vidéo en cours...'
            : stage === 'Transcription'
            ? 'Transcription audio en cours...'
            : 'Analyse de la recette en cours...'}
        </Text>
      </View>

      {/* Thumbnail placeholder circulaire */}
      <View style={styles.thumbnailContainer}>
        <Animated.View
          style={[
            styles.thumbnail,
            { backgroundColor: colors.border },
            {
              opacity: shimmerOpacity,
            },
          ]}
        />
      </View>

      {/* Card skeleton */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Titre skeleton */}
        {renderShimmer('70%')}
        <View style={{ height: Spacing.md }} />

        {/* Ingrédients skeleton */}
        <View style={styles.ingredientsContainer}>
          {[1, 2, 3].map((index) => (
            <View key={index} style={styles.ingredientRow}>
              <View
                style={[
                  styles.ingredientIcon,
                  { backgroundColor: colors.border },
                ]}
              />
              {renderShimmer(Math.random() * 40 + 50 + '%')}
            </View>
          ))}
        </View>

        <View style={{ height: Spacing.lg }} />

        {/* Étapes skeleton */}
        <View style={styles.stepsContainer}>
          {[1, 2, 3].map((index) => (
            <View key={index} style={styles.stepRow}>
              <View
                style={[
                  styles.stepNumber,
                  { backgroundColor: colors.border },
                ]}
              />
              {renderShimmer('100%')}
            </View>
          ))}
        </View>
      </View>

      {/* Barre de progression - Chips */}
      <View style={styles.progressContainer}>
        {STAGES.map((stageName, index) => {
          const fill = Animated.subtract(progressAnim, index).interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
            extrapolate: 'clamp',
          });

          return (
            <View
              key={stageName}
              style={[
                styles.progressSegment,
                { backgroundColor: colors.border },
                index === 0 && styles.firstSegment,
                index === STAGES.length - 1 && styles.lastSegment,
              ]}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: fill,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      {/* Indicateur temporel */}
      <Text style={[styles.timeIndicator, { color: colors.icon }]}>
        Temps estimé : ~{estimatedTime}s
      </Text>

      {/* Boutons d'action */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.cancelButton,
            {
              backgroundColor:
                colorScheme === 'dark'
                  ? 'rgba(255, 255, 255, 0.06)'
                  : colors.secondary,
              borderColor:
                colorScheme === 'dark'
                  ? '#2E2E2E'
                  : colors.border,
            },
          ]}
          onPress={onCancel}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Annuler l'analyse"
        >
          <X
            size={18}
            color={colorScheme === 'dark' ? '#ECEDEE' : colors.text}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.cancelButtonText,
              { color: colorScheme === 'dark' ? '#ECEDEE' : colors.text },
            ]}
          >
            Annuler
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
  },
  thumbnailContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shimmerContainer: {
    height: 16,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  ingredientsContainer: {
    gap: Spacing.md,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ingredientIcon: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsContainer: {
    gap: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  firstSegment: {
    marginLeft: 0,
  },
  lastSegment: {
    marginRight: 0,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  timeIndicator: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  actionsContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 140,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

