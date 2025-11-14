/**
 * Hook personnalisé pour gérer les deep links TikTok partagés
 * depuis l'application TikTok via la Share Extension iOS
 *
 * Corrections apportées :
 * - Queue system pour gérer les URLs pendant le chargement de l'auth
 * - Nettoyage des timeouts pour éviter les memory leaks
 * - Évite les réexécutions inutiles de handleInitialUrl
 * - Gestion du cas onboarding incomplet
 * - Meilleure gestion des listeners multiples
 */

import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Linking } from 'react-native';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
}

export function useDeepLinking() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { profile } = useAuthContext();
  const processingUrl = useRef<string | null>(null);
  const hasProcessedUrl = useRef<Set<string>>(new Set());
  const pendingUrl = useRef<string | null>(null);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialUrlBeenHandled = useRef(false);

  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = useCallback((title: string, message: string) => {
    setAlertState({
      visible: true,
      title,
      message,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState({
      visible: false,
      title: '',
      message: '',
    });
  }, []);

  // Fonction de validation et extraction de l'URL
  const validateAndExtractUrl = useCallback((deepLinkUrl: string): string | null => {
    // FILTRES : Ignorer les deep links qui ne sont PAS de la share extension

    // 1. Ignorer les liens de développement Expo
    if (deepLinkUrl.includes('expo-development-client')) {
      console.log('⏭️ [Deep Link] Lien de développement Expo ignoré');
      return null;
    }

    // 2. Ignorer les callbacks OAuth (Apple, Google, etc.)
    if (deepLinkUrl.includes('auth-callback')) {
      console.log('⏭️ [Deep Link] Callback OAuth ignoré');
      return null;
    }

    // 3. Ne traiter QUE les liens avec le format "oshii://?url=..." (share extension)
    if (!deepLinkUrl.startsWith('oshii://?url=')) {
      console.log('⏭️ [Deep Link] Format non supporté, ignoré');
      return null;
    }

    // Parser l'URL pour extraire le paramètre 'url'
    const urlParts = deepLinkUrl.split('?');
    const queryString = urlParts[1] || '';
    const params = new URLSearchParams(queryString);
    const sharedUrl = params.get('url');

    if (!sharedUrl) {
      console.log('⚠️ [Deep Link] Aucune URL trouvée dans le lien');
      return null;
    }

    // Vérifier que c'est bien une URL TikTok
    if (!sharedUrl.includes('tiktok.com')) {
      console.log('⚠️ [Deep Link] URL non TikTok ignorée:', sharedUrl);
      showAlert(
        'Lien incorrect',
        'Veuillez partager un lien TikTok valide pour analyser une recette.'
      );
      return null;
    }

    return sharedUrl;
  }, [showAlert]);

  // Fonction pour naviguer vers l'analyse
  const navigateToAnalyze = useCallback((sharedUrl: string) => {
    console.log('✅ [Deep Link] Lien TikTok valide reçu:', sharedUrl);

    // Marquer l'URL comme en cours de traitement
    processingUrl.current = sharedUrl;
    hasProcessedUrl.current.add(sharedUrl);

    try {
      // Encoder l'URL et naviguer vers l'écran d'analyse
      const encodedUrl = encodeURIComponent(sharedUrl);

      // Nettoyer le timeout précédent s'il existe
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }

      // Petit délai pour s'assurer que l'app est prête
      navigationTimeoutRef.current = setTimeout(() => {
        console.log('🚀 [Deep Link] Navigation vers l\'écran d\'analyse...');
        router.push(`/analyze?url=${encodedUrl}` as any);
        processingUrl.current = null;
        navigationTimeoutRef.current = null;
      }, 300);
    } catch (error) {
      console.error('❌ [Deep Link] Erreur lors du traitement:', error);
      processingUrl.current = null;
    }
  }, [router]);

  // Handler pour les liens entrants (app déjà ouverte) et URL initiale
  const handleDeepLink = useCallback((event: { url: string }) => {
    console.log('🔗 [Deep Link] URL reçue:', event.url);

    const sharedUrl = validateAndExtractUrl(event.url);
    if (!sharedUrl) {
      return;
    }

    // Si l'auth est en cours de chargement, mettre en queue
    if (isAuthLoading) {
      console.log('⏳ [Deep Link] Auth en cours, URL mise en queue:', sharedUrl);
      pendingUrl.current = sharedUrl;
      return;
    }

    // Vérifier que l'utilisateur est authentifié
    if (!user) {
      console.log('❌ [Deep Link] Utilisateur non authentifié, redirection vers login');
      // Sauvegarder l'URL pour après l'authentification
      pendingUrl.current = sharedUrl;
      router.replace('/welcome');
      return;
    }

    // Vérifier si l'onboarding est complété
    if (profile && !profile.onboarding_completed) {
      console.log('⚠️ [Deep Link] Onboarding incomplet, URL sauvegardée pour après');
      pendingUrl.current = sharedUrl;
      router.replace('/onboarding');
      return;
    }

    // Éviter de traiter deux fois la même URL
    if (hasProcessedUrl.current.has(sharedUrl)) {
      console.log('⏭️ [Deep Link] URL déjà traitée, ignorée');
      return;
    }

    // Éviter les traitements simultanés
    if (processingUrl.current === sharedUrl) {
      console.log('⏳ [Deep Link] URL en cours de traitement, ignorée');
      return;
    }

    navigateToAnalyze(sharedUrl);
  }, [isAuthLoading, user, profile, validateAndExtractUrl, navigateToAnalyze, router]);

  // Traiter l'URL en attente quand l'auth est prête
  useEffect(() => {
    if (!isAuthLoading && user && pendingUrl.current) {
      const url = pendingUrl.current;
      pendingUrl.current = null;

      console.log('✅ [Deep Link] Auth prête, traitement de l\'URL en attente:', url);

      // Vérifier l'onboarding avant de continuer
      if (profile && !profile.onboarding_completed) {
        console.log('⚠️ [Deep Link] Onboarding incomplet, attente de complétion');
        pendingUrl.current = url; // Remettre en queue
        return;
      }

      handleDeepLink({ url: `oshii://?url=${url}` });
    }
  }, [isAuthLoading, user, profile, handleDeepLink]);

  // Handler pour l'URL initiale (app fermée) - exécuté une seule fois
  useEffect(() => {
    if (hasInitialUrlBeenHandled.current || isAuthLoading) {
      return;
    }

    const handleInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (initialUrl) {
          console.log('🔗 [Deep Link] URL initiale détectée:', initialUrl);
          hasInitialUrlBeenHandled.current = true;
          handleDeepLink({ url: initialUrl });
        }
      } catch (error) {
        console.error('❌ [Deep Link] Erreur lors de la récupération de l\'URL initiale:', error);
      }
    };

    handleInitialUrl();
  }, [isAuthLoading, handleDeepLink]);

  // Écouter les événements de deep linking (app ouverte)
  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Nettoyage
    return () => {
      subscription.remove();

      // Nettoyer le timeout de navigation si le composant se démonte
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    };
  }, [handleDeepLink]);

  // Nettoyer le cache des URLs traitées toutes les 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      hasProcessedUrl.current.clear();
      console.log('🧹 [Deep Link] Cache des URLs nettoyé');
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    alertState,
    closeAlert,
  };
}

