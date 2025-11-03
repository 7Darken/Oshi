/**
 * Écran d'analyse (AnalyzeScreen)
 * Affiche un skeleton moderne pendant l'analyse avec animations et gestion d'erreurs
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, AccessibilityInfo } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RecipeAnalyzeSkeleton, AnalyzeStage } from '@/components/RecipeAnalyzeSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { useAnalyzeLink } from '@/hooks/useAnalyzeLink';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { useMinimumDisplayDelay } from '@/hooks/useMinimumDisplayDelay';

export default function AnalyzeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string }>();
  const { analyzeLink, cancelAnalysis } = useAnalyzeLink();
  const { isLoading, error, currentRecipe, clearRecipe } = useRecipeStore();
  const [currentStage, setCurrentStage] = useState<AnalyzeStage>('Téléchargement');
  const [analysisPromise, setAnalysisPromise] = useState<Promise<void> | null>(null);

  // Utiliser le hook pour garantir un affichage minimum de 1200ms
  // On convertit la promesse void en promesse boolean pour le hook
  const promiseWrapper = analysisPromise
    ? analysisPromise.then(() => true)
    : null;
  const [isMinimumDelay, , delayError] = useMinimumDisplayDelay(
    promiseWrapper,
    1200
  );

  // Lancer l'analyse au montage
  useEffect(() => {
    const url = params.url;
    if (!url) {
      router.replace('/');
      return;
    }

    clearRecipe();

    // Créer la promesse d'analyse
    const promise = analyzeLink(url, {
      onProgress: (stage: AnalyzeStage) => {
        setCurrentStage(stage);
        // Annoncer l'étape pour l'accessibilité
        AccessibilityInfo.announceForAccessibility(`Étape: ${stage}`);
      },
    });

    setAnalysisPromise(promise);

    return () => {
      // Nettoyer si le composant est démonté
      cancelAnalysis();
    };
  }, [params.url, router, analyzeLink, cancelAnalysis, clearRecipe]);

  // Rediriger vers le résultat quand la recette est prête
  useEffect(() => {
    if (currentRecipe && !isLoading && !isMinimumDelay) {
      // Délai supplémentaire pour montrer la finalisation
      const timer = setTimeout(() => {
        AccessibilityInfo.announceForAccessibility('Recette analysée avec succès');
        router.replace('/result');
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [currentRecipe, isLoading, isMinimumDelay, router]);

  // Gestion de l'annulation
  const handleCancel = useCallback(() => {
    cancelAnalysis();
    clearRecipe();
    AccessibilityInfo.announceForAccessibility('Analyse annulée');
    router.replace('/');
  }, [cancelAnalysis, clearRecipe, router]);

  // Gestion du réessai
  const handleRetry = useCallback(() => {
    const url = params.url;
    if (!url) {
      router.replace('/');
      return;
    }

    clearRecipe();
    setCurrentStage('Transcription');

    const promise = analyzeLink(url, {
      onProgress: (stage: AnalyzeStage) => {
        setCurrentStage(stage);
        AccessibilityInfo.announceForAccessibility(`Étape: ${stage}`);
      },
    });

    setAnalysisPromise(promise);
  }, [params.url, analyzeLink, clearRecipe, router]);

  // Afficher l'erreur si elle existe et que le délai minimum est écoulé
  const displayError = (error || delayError) && !isMinimumDelay && !isLoading;

  if (displayError) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <ErrorState
          error={error || (delayError?.message ?? 'Une erreur est survenue')}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      </ScrollView>
    );
  }

  // Afficher le skeleton pendant l'analyse ou le délai minimum
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <RecipeAnalyzeSkeleton
        url={params.url}
        onCancel={handleCancel}
        stage={currentStage}
        estimatedTime={30}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
