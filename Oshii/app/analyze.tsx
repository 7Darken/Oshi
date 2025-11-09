/**
 * Écran d'analyse (AnalyzeScreen)
 * Affiche un skeleton moderne pendant l'analyse avec animations et gestion d'erreurs
 * 
 * Gestion du mode Premium / Deep Links :
 * - Appelé depuis AnalyzeSheet OU depuis un deep link (partage TikTok)
 * - Vérifie automatiquement les générations gratuites via useAnalyzeLink
 * - Si limite atteinte et non-premium : redirection immédiate vers /subscription
 * - Fonctionne de manière transparente quelle que soit la source (sheet ou deep link)
 */

import { ErrorState } from '@/components/ErrorState';
import { AnalyzeStage, RecipeAnalyzeSkeleton } from '@/components/RecipeAnalyzeSkeleton';
import { useAnalyzeLink } from '@/hooks/useAnalyzeLink';
import { useMinimumDisplayDelay } from '@/hooks/useMinimumDisplayDelay';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet } from 'react-native';

export default function AnalyzeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string }>();
  const { analyzeLink, cancelAnalysis } = useAnalyzeLink();
  const { isLoading, error, currentRecipe, clearRecipe } = useRecipeStore();
  const [currentStage, setCurrentStage] = useState<AnalyzeStage>('download');
  const [analysisPromise, setAnalysisPromise] = useState<Promise<void> | null>(null);

  // Debug: Logger les changements d'état du store
  useEffect(() => {
    console.log('🔍 [Analyze Screen] État du store:', {
      hasRecipe: !!currentRecipe,
      recipeId: currentRecipe?.id,
      isLoading,
      hasError: !!error,
    });
  }, [currentRecipe, isLoading, error]);

  // Utiliser le hook pour garantir un affichage minimum de 1200ms
  // On convertit la promesse void en promesse boolean pour le hook
  const promiseWrapper = analysisPromise
    ? analysisPromise.then(() => true)
    : null;
  const [isMinimumDelay, , delayError] = useMinimumDisplayDelay(
    promiseWrapper,
    1200
  );

  // Gérer l'erreur PREMIUM_REQUIRED pour ouvrir le paywall
  // Cela fonctionne aussi pour les deep links (partage depuis TikTok)
  useEffect(() => {
    if (error === 'PREMIUM_REQUIRED') {
      console.log('💎 [Analyze] Limite de générations atteinte');
      console.log('🔄 [Analyze] Source: ' + (params.url?.includes('oshii://') ? 'Deep Link' : 'Sheet'));
      console.log('🚀 [Analyze] Redirection immédiate vers le paywall');
      AccessibilityInfo.announceForAccessibility('Limite de générations gratuites atteinte');
      
      // Redirection immédiate vers le paywall
      router.replace('/subscription');
    }
  }, [error, router, params.url]);

  // Gérer l'erreur NOT_RECIPE pour afficher l'écran dédié
  useEffect(() => {
    console.log('🔍 [Analyze] Vérification error:', error);
    
    if (error === 'NOT_RECIPE') {
      console.log('⚠️ [Analyze] Contenu non-culinaire détecté');
      console.log('🔄 [Analyze] Redirection vers l\'écran not-recipe...');
      AccessibilityInfo.announceForAccessibility('Ce contenu ne contient pas de recette');
      
      // Petit délai pour s'assurer que le state est bien propagé
      setTimeout(() => {
        console.log('🚀 [Analyze] Exécution de la redirection');
        router.replace('/not-recipe');
      }, 100);
    }
  }, [error, router]);

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
  // NE PAS dépendre de isMinimumDelay pour la redirection (cause des bugs)
  useEffect(() => {
    console.log('🔍 [Analyze] useEffect redirection - État:', { 
      hasRecipe: !!currentRecipe, 
      isLoading, 
      isMinimumDelay,
      recipeId: currentRecipe?.id,
      recipeTitle: currentRecipe?.title,
    });
    
    if (currentRecipe && !isLoading) {
      console.log('✅ [Analyze] Recette prête, préparation de la redirection...');
      console.log('📊 [Analyze] Détails recette:', {
        id: currentRecipe.id,
        title: currentRecipe.title,
        hasIngredients: !!currentRecipe.ingredients?.length,
        hasSteps: !!currentRecipe.steps?.length,
      });

      // Attendre un minimum pour montrer la finalisation
      // Mais toujours rediriger même si isMinimumDelay est true
      const minimumDelay = isMinimumDelay ? 600 : 400;
      console.log('⏱️  [Analyze] Délai avant redirection:', minimumDelay, 'ms');
      
      const timer = setTimeout(() => {
        console.log('🚀 [Analyze] Exécution de la redirection vers /result...');
        AccessibilityInfo.announceForAccessibility('Recette analysée avec succès');
        router.replace('/result');
      }, minimumDelay);

      return () => {
        console.log('🧹 [Analyze] Nettoyage du timer de redirection');
        clearTimeout(timer);
      };
    } else {
      console.log('⏳ [Analyze] Redirection non déclenchée:', {
        hasRecipe: !!currentRecipe,
        isLoading,
        reason: !currentRecipe ? 'Pas de recette' : isLoading ? 'En chargement' : 'Inconnu',
      });
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
    setCurrentStage('transcription');

    const promise = analyzeLink(url, {
      onProgress: (stage: AnalyzeStage) => {
        setCurrentStage(stage);
        AccessibilityInfo.announceForAccessibility(`Étape: ${stage}`);
      },
    });

    setAnalysisPromise(promise);
  }, [params.url, analyzeLink, clearRecipe, router]);

  // Afficher l'erreur si elle existe et que le délai minimum est écoulé
  // SAUF si c'est une erreur NOT_RECIPE ou PREMIUM_REQUIRED (gérées par redirection)
  const displayError = (error || delayError) && 
                       !isMinimumDelay && 
                       !isLoading && 
                       error !== 'NOT_RECIPE' && 
                       error !== 'PREMIUM_REQUIRED';

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
