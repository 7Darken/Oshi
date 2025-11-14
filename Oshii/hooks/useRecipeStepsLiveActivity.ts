/**
 * Hook pour gérer la Live Activity des étapes de recette
 * Affiche l'étape actuelle sur l'écran verrouillé iOS
 */

import { useCallback, useEffect, useRef } from 'react';
import { NativeModules, Platform } from 'react-native';

const { RecipeStepsLiveActivity } = NativeModules;

interface StepData {
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  stepDuration?: string | null;
  stepTemperature?: string | null;
}

export function useRecipeStepsLiveActivity(recipeTitle: string) {
  const activityIdRef = useRef<string | null>(null);
  const isActiveRef = useRef(false);

  // Démarrer la Live Activity
  const start = useCallback(
    async (stepData: StepData) => {
      // Live Activity disponible uniquement sur iOS 16.1+
      if (Platform.OS !== 'ios' || !RecipeStepsLiveActivity) {
        console.warn('⚠️ Live Activity non disponible sur cette plateforme');
        return;
      }

      try {
        console.log('🚀 [LiveActivity] Démarrage...', stepData);

        const activityId = await RecipeStepsLiveActivity.start(
          recipeTitle,
          stepData.currentStep,
          stepData.totalSteps,
          stepData.stepDescription,
          stepData.stepDuration || null,
          stepData.stepTemperature || null
        );

        activityIdRef.current = activityId;
        isActiveRef.current = true;
        console.log('✅ [LiveActivity] Démarrée avec ID:', activityId);
      } catch (error: any) {
        console.error('❌ [LiveActivity] Erreur au démarrage:', error);

        if (error.code === 'PERMISSION_DENIED') {
          console.warn('⚠️ Live Activities désactivées dans les réglages');
        }
      }
    },
    [recipeTitle]
  );

  // Mettre à jour la Live Activity avec une nouvelle étape
  const update = useCallback(async (stepData: StepData) => {
    if (Platform.OS !== 'ios' || !RecipeStepsLiveActivity || !isActiveRef.current) {
      return;
    }

    try {
      console.log('🔄 [LiveActivity] Mise à jour...', stepData);

      await RecipeStepsLiveActivity.update(
        stepData.currentStep,
        stepData.totalSteps,
        stepData.stepDescription,
        stepData.stepDuration || null,
        stepData.stepTemperature || null
      );

      console.log('✅ [LiveActivity] Mise à jour réussie');
    } catch (error: any) {
      console.error('❌ [LiveActivity] Erreur lors de la mise à jour:', error);

      if (error.code === 'NO_ACTIVITY') {
        console.warn('⚠️ Aucune Live Activity active');
        isActiveRef.current = false;
      }
    }
  }, []);

  // Arrêter la Live Activity
  const stop = useCallback(async () => {
    if (Platform.OS !== 'ios' || !RecipeStepsLiveActivity || !isActiveRef.current) {
      return;
    }

    try {
      console.log('🛑 [LiveActivity] Arrêt...');

      await RecipeStepsLiveActivity.stop();

      activityIdRef.current = null;
      isActiveRef.current = false;
      console.log('✅ [LiveActivity] Arrêtée');
    } catch (error: any) {
      console.error('❌ [LiveActivity] Erreur lors de l\'arrêt:', error);
    }
  }, []);

  // Nettoyer automatiquement quand le composant est démonté
  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        console.log('🧹 [LiveActivity] Nettoyage automatique au démontage');
        stop();
      }
    };
  }, [stop]);

  return {
    start,
    update,
    stop,
    isActive: isActiveRef.current,
  };
}
