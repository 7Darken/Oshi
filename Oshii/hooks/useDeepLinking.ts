/**
 * Hook personnalisé pour gérer les deep links TikTok partagés
 * depuis l'application TikTok via la Share Extension iOS
 */

import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
}

export function useDeepLinking() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const processingUrl = useRef<string | null>(null);
  const hasProcessedUrl = useRef<Set<string>>(new Set());
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertState({
      visible: true,
      title,
      message,
    });
  };

  const closeAlert = () => {
    setAlertState({
      visible: false,
      title: '',
      message: '',
    });
  };

  useEffect(() => {
    // Handler pour les liens entrants (app déjà ouverte)
    const handleDeepLink = async (event: { url: string }) => {
      console.log('🔗 [Deep Link] URL reçue:', event.url);

      // FILTRES : Ignorer les deep links qui ne sont PAS de la share extension
      
      // 1. Ignorer les liens de développement Expo
      if (event.url.includes('expo-development-client')) {
        console.log('⏭️ [Deep Link] Lien de développement Expo ignoré');
        return;
      }

      // 2. Ignorer les callbacks OAuth (Apple, Google, etc.)
      if (event.url.includes('auth-callback')) {
        console.log('⏭️ [Deep Link] Callback OAuth ignoré');
        return;
      }

      // 3. Ne traiter QUE les liens avec le format "oshii://?url=..." (share extension)
      if (!event.url.startsWith('oshii://?url=')) {
        console.log('⏭️ [Deep Link] Format non supporté, ignoré');
        return;
      }

      // Attendre que l'auth soit chargée
      if (isAuthLoading) {
        console.log('⏳ [Deep Link] En attente de l\'authentification...');
        return;
      }

      // Vérifier que l'utilisateur est authentifié
      if (!user) {
        console.log('❌ [Deep Link] Utilisateur non authentifié, redirection vers login');
        router.replace('/welcome');
        return;
      }

      // Parser l'URL pour extraire le paramètre 'url'
      const urlParts = event.url.split('?');
      const queryString = urlParts[1] || '';
      const params = new URLSearchParams(queryString);
      const sharedUrl = params.get('url');

      if (!sharedUrl) {
        console.log('⚠️ [Deep Link] Aucune URL trouvée dans le lien');
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

      // Vérifier que c'est bien une URL TikTok
      if (!sharedUrl.includes('tiktok.com')) {
        console.log('⚠️ [Deep Link] URL non TikTok ignorée:', sharedUrl);
        showAlert(
          'Lien incorrect',
          'Veuillez partager un lien TikTok valide pour analyser une recette.'
        );
        return;
      }

      console.log('✅ [Deep Link] Lien TikTok valide reçu:', sharedUrl);
      
      // Marquer l'URL comme en cours de traitement
      processingUrl.current = sharedUrl;
      hasProcessedUrl.current.add(sharedUrl);

      try {
        // Encoder l'URL et naviguer vers l'écran d'analyse
        const encodedUrl = encodeURIComponent(sharedUrl);
        
        // Petit délai pour s'assurer que l'app est prête
        setTimeout(() => {
          console.log('🚀 [Deep Link] Navigation vers l\'écran d\'analyse...');
          router.push(`/analyze?url=${encodedUrl}` as any);
          processingUrl.current = null;
        }, 300);
      } catch (error) {
        console.error('❌ [Deep Link] Erreur lors du traitement:', error);
        processingUrl.current = null;
      }
    };

    // Handler pour les liens au démarrage (app fermée)
    const handleInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        
        if (initialUrl) {
          console.log('🔗 [Deep Link] URL initiale détectée:', initialUrl);
          
          // Appliquer les mêmes filtres que pour handleDeepLink
          if (
            initialUrl.includes('expo-development-client') ||
            initialUrl.includes('auth-callback') ||
            !initialUrl.startsWith('oshii://?url=')
          ) {
            console.log('⏭️ [Deep Link] URL initiale ignorée (non share extension)');
            return;
          }
          
          // Attendre que l'auth soit chargée
          if (isAuthLoading) {
            console.log('⏳ [Deep Link] En attente de l\'authentification initiale...');
            return;
          }

          handleDeepLink({ url: initialUrl });
        }
      } catch (error) {
        console.error('❌ [Deep Link] Erreur lors de la récupération de l\'URL initiale:', error);
      }
    };

    // Écouter les événements de deep linking
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Vérifier s'il y a une URL initiale (au démarrage)
    handleInitialUrl();

    // Nettoyage
    return () => {
      subscription.remove();
    };
  }, [user, isAuthLoading, router]);

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

