/**
 * Hook personnalisé pour analyser un lien TikTok via le backend API
 * Appel simple et propre vers le backend Express
 * 
 * Gestion du mode Premium :
 * - Vérifie les générations gratuites avant l'analyse
 * - Bloque si la limite est atteinte et l'utilisateur n'est pas premium
 * - Fonctionne aussi pour les deep links (partage depuis TikTok)
 * - Redirige automatiquement vers le paywall si nécessaire
 */

import { useCallback, useRef, useEffect } from 'react';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { analyzeRecipe, NotRecipeError } from '@/services/api';
import { AnalyzeStage } from '@/components/RecipeAnalyzeSkeleton';
import { useAuthContext } from '@/contexts/AuthContext';

export interface AnalyzeLinkOptions {
  onProgress?: (stage: AnalyzeStage) => void;
}

export function useAnalyzeLink() {
  const { setLoading, setError, setRecipe } = useRecipeStore();
  const authContext = useAuthContext();
  const { token, canGenerateRecipe, refreshSession } = authContext;
  const abortControllerRef = useRef<AbortController | null>(null);
  // Ref pour accéder au token actuel après refresh
  const tokenRef = useRef<string | null>(token);

  // Mettre à jour le ref quand le token change
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const analyzeLink = useCallback(
    async (url: string, options?: AnalyzeLinkOptions): Promise<void> => {
      console.log('🔗 [Hook] Appel au backend pour analyser:', url);

      if (!url || url.trim().length === 0) {
        console.error('❌ [Hook] URL invalide ou vide');
        setError('Veuillez fournir une URL valide');
        return;
      }

      // Vérifier si l'utilisateur peut générer une recette (fonctionne aussi pour les deep links)
      if (!canGenerateRecipe) {
        console.warn('⚠️ [Hook] Limite de générations gratuites atteinte');
        console.log('📊 [Hook] Tentative de génération bloquée - Redirection vers le paywall');
        setError('PREMIUM_REQUIRED'); // Erreur spéciale pour déclencher le paywall
        setLoading(false); // Important: arrêter le loading pour éviter le skeleton
        return;
      }

      console.log('✅ [Hook] Vérification des générations OK - Démarrage de l\'analyse');

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
      const stages: AnalyzeStage[] = ['download', 'transcription', 'extraction', 'finalization'];
      let stageIndex = 0;

      const progressInterval = setInterval(() => {
        if (stageIndex < stages.length - 1) {
          stageIndex++;
          options?.onProgress?.(stages[stageIndex]);
        }
      }, 3000); // Changer de stage toutes les 3 secondes

      try {
        // Appeler le backend API avec le token JWT et les fonctions de refresh
        const recipe = await analyzeRecipe(url.trim(), {
          signal: abortController.signal,
          token: token || undefined,
          getToken: () => {
            // Récupérer le token depuis le ref (sera mis à jour après refresh)
            return tokenRef.current;
          },
          refreshSession: async () => {
            // Rafraîchir la session via Supabase et mettre à jour le ref
            await refreshSession();
            // Attendre un peu pour que le contexte se mette à jour
            await new Promise(resolve => setTimeout(resolve, 100));
            // Mettre à jour le ref avec le nouveau token
            tokenRef.current = authContext.token;
          },
        });

        clearInterval(progressInterval);

        // Finalisation
        console.log('✨ [Hook] Analyse terminée avec succès');
        console.log('📦 [Hook] Recette reçue du backend:', {
          id: recipe.id,
          title: recipe.title,
          hasIngredients: !!recipe.ingredients?.length,
          hasSteps: !!recipe.steps?.length,
        });

        options?.onProgress?.('finalization');

        // Petit délai pour montrer la finalisation
        await new Promise((resolve) => setTimeout(resolve, 400));

        if (!abortController.signal.aborted) {
          console.log('💾 [Hook] Sauvegarde de la recette dans le store');
          console.log('📝 [Hook] Recette ID:', recipe.id);
          console.log('📝 [Hook] Recette titre:', recipe.title);
          
          // Sauvegarder la recette dans le store
          setRecipe(recipe, url.trim());
          console.log('✅ [Hook] setRecipe() appelé avec succès');
          
          // ⚠️  IMPORTANT : Mettre isLoading à false pour permettre la redirection
          setLoading(false);
          console.log('✅ [Hook] setLoading(false) appelé');
          
          // ⚠️  NOTE : La décrémentation du compteur se fait UNIQUEMENT côté backend
          // Ne pas décrémenter ici pour éviter une double décrémentation
        } else {
          console.warn('⚠️ [Hook] Requête annulée, recette non sauvegardée');
          setLoading(false);
        }
      } catch (error) {
        clearInterval(progressInterval);
        
        // Ne pas traiter les erreurs si la requête a été annulée
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('⚠️ [Hook] Requête annulée par l\'utilisateur');
          setLoading(false);
          abortControllerRef.current = null;
          return;
        }

        // Cas spécial : Le contenu TikTok n'est pas une recette
        if (error instanceof NotRecipeError) {
          console.warn('⚠️ [Hook] Contenu non-culinaire détecté');
          console.log('📝 [Hook] Message:', error.userMessage);
          setLoading(false);
          setError('NOT_RECIPE'); // Code spécial pour déclencher la redirection
          abortControllerRef.current = null;
          return;
        }

        // Autres erreurs
        console.error('❌ [Hook] Erreur lors de l\'analyse:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue lors de l\'analyse de la recette';
        console.error('💥 [Hook] Erreur finale:', errorMessage);
        setLoading(false);
        setError(errorMessage);
        abortControllerRef.current = null;
      } finally {
        console.log('🏁 [Hook] Nettoyage terminé');
      }
    },
    [setLoading, setError, setRecipe, token, canGenerateRecipe, refreshSession, authContext]
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

