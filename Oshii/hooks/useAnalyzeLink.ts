/**
 * Hook personnalisé pour analyser un lien TikTok via le backend API
 * Appel simple et propre vers le backend Express
 */

import { useCallback, useRef } from 'react';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { analyzeRecipe } from '@/services/api';
import { AnalyzeStage } from '@/components/RecipeAnalyzeSkeleton';
import { useAuthContext } from '@/contexts/AuthContext';

export interface AnalyzeLinkOptions {
  onProgress?: (stage: AnalyzeStage) => void;
}

export function useAnalyzeLink() {
  const { setLoading, setError, setRecipe } = useRecipeStore();
  const { token } = useAuthContext();
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzeLink = useCallback(
    async (url: string, options?: AnalyzeLinkOptions): Promise<void> => {
      console.log('🔗 [Hook] Appel au backend pour analyser:', url);

      if (!url || url.trim().length === 0) {
        console.error('❌ [Hook] URL invalide ou vide');
        setError('Veuillez fournir une URL valide');
        return;
      }

      // Annuler la requête précédente si elle existe
      if (abortControllerRef.current) {
        console.log('⚠️ [Hook] Annulation de la requête précédente');
        abortControllerRef.current.abort();
      }

      // Créer un nouveau controller d'annulation
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      console.log('🔄 [Hook] Démarrage de l\'analyse...');
      setLoading(true);
      setError(null);

      // Simuler la progression pour l'UI
      const stages: AnalyzeStage[] = ['Téléchargement', 'Transcription', 'Extraction', 'Finalisation'];
      let stageIndex = 0;

      const progressInterval = setInterval(() => {
        if (stageIndex < stages.length - 1) {
          stageIndex++;
          options?.onProgress?.(stages[stageIndex]);
        }
      }, 3000); // Changer de stage toutes les 3 secondes

      try {
        // Appeler le backend API avec le token JWT
        const recipe = await analyzeRecipe(url.trim(), {
          signal: abortController.signal,
          token: token || undefined,
        });

        clearInterval(progressInterval);

        // Finalisation
        console.log('✨ [Hook] Analyse terminée avec succès');
        options?.onProgress?.('Finalisation');

        // Petit délai pour montrer la finalisation
        await new Promise((resolve) => setTimeout(resolve, 400));

        if (!abortController.signal.aborted) {
          console.log('💾 [Hook] Sauvegarde de la recette dans le store');
          setRecipe(recipe, url.trim());
        } else {
          console.warn('⚠️ [Hook] Requête annulée, recette non sauvegardée');
        }
      } catch (error) {
        clearInterval(progressInterval);
        console.error('❌ [Hook] Erreur capturée:', error);
        
        // Ne pas traiter les erreurs si la requête a été annulée
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('⚠️ [Hook] Erreur ignorée (annulation utilisateur)');
          return;
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue lors de l\'analyse de la recette';
        console.error('💥 [Hook] Erreur finale:', errorMessage);
        setError(errorMessage);
      } finally {
        console.log('🏁 [Hook] Nettoyage terminé');
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [setLoading, setError, setRecipe, token]
  );

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      console.log('🚫 [Hook] Annulation de l\'analyse');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { analyzeLink, cancelAnalysis };
}

