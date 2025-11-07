/**
 * Route racine - Redirection automatique selon l'état d'authentification
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthContext } from '@/contexts/AuthContext';

export default function IndexScreen() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, isLoading, user, profile, session, isOffline, safeFetchProfile } = useAuthContext();
  const isNavigationReady = navigationState?.key != null;
  const hasLocalSession = !!(session?.user?.id || user?.id);
  const safeFetchProfileRef = useRef(safeFetchProfile);

  useEffect(() => {
    safeFetchProfileRef.current = safeFetchProfile;
  }, [safeFetchProfile]);

  // Rediriger selon l'état d'authentification et onboarding
  useEffect(() => {
    if (!isNavigationReady) {
      console.log('⏳ [Index] Navigation non prête, attente...');
      return;
    }

    const checkOnboarding = async () => {
      // Si on charge encore, ne rien faire
      if (isLoading) {
        console.log('⏳ [Index] Chargement en cours, attente...');
        return;
      }

      console.log('🔄 [Index] Vérification authentification et onboarding...');
      console.log('🔄 [Index] État:', {
        isLoading,
        isAuthenticated,
        hasLocalSession,
        isOffline,
        onboardingFromProfile: profile?.onboarding_completed,
      });

      if (!hasLocalSession) {
        console.log('🔄 [Index] Aucune session locale, redirection vers welcome');
        router.replace('/welcome');
        return;
      }

      if (isOffline) {
        console.log('✅ [Index] Mode hors ligne détecté, redirection vers tabs sans vérification distante');
        router.replace('/(tabs)');
        return;
      }

      const ensureOnboarding = async () => {
        let onboardingCompleted = profile?.onboarding_completed;

        if (onboardingCompleted == null) {
          const latest = await safeFetchProfileRef.current?.();
          onboardingCompleted = latest?.onboarding_completed ?? true;
          console.log('📋 [Index] Profil rafraîchi:', {
            onboardingCompleted,
          });
        }

        if (onboardingCompleted) {
          console.log('✅ [Index] Onboarding confirmé, redirection vers tabs');
          router.replace('/(tabs)');
        } else {
          console.log('🔄 [Index] Onboarding requis, redirection vers onboarding');
          router.replace('/onboarding');
        }
      };

      await ensureOnboarding();
    };

    void checkOnboarding();
  }, [isNavigationReady, isLoading, hasLocalSession, isOffline, isAuthenticated, profile?.onboarding_completed, router]);

  // Afficher un loader pendant le chargement de l'auth
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.text }]}>
        Chargement...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: Spacing.md,
  },
});

