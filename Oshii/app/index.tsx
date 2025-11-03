/**
 * Route racine - Redirection automatique selon l'état d'authentification
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';

export default function IndexScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, isLoading, user } = useAuthContext();

  // Rediriger selon l'état d'authentification et onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      // Si on charge encore, ne rien faire
      if (isLoading) {
        console.log('⏳ [Index] Chargement en cours, attente...');
        return;
      }

      console.log('🔄 [Index] Vérification authentification et onboarding...');
      console.log('🔄 [Index] État:', { isLoading, isAuthenticated, hasUser: !!user?.id });

      if (isAuthenticated && user?.id) {
        try {
          // Vérifier si l'onboarding est complété
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            // PGRST116 = pas de ligne trouvée, ce qui est normal pour un nouveau compte
            console.error('❌ [Index] Erreur lors de la vérification du profil:', error);
          }

          console.log('📋 [Index] Profil:', { exists: !!profile, onboardingCompleted: profile?.onboarding_completed });

          // Si pas de profil ou onboarding non complété, rediriger vers onboarding
          if (!profile || !profile.onboarding_completed) {
            console.log('🔄 [Index] Redirection vers onboarding');
            router.replace('/onboarding');
          } else {
            console.log('🔄 [Index] Redirection vers tabs');
            router.replace('/(tabs)');
          }
        } catch (err) {
          console.error('❌ [Index] Erreur lors de la vérification:', err);
          // En cas d'erreur, rediriger vers onboarding par sécurité
          router.replace('/onboarding');
        }
      } else if (!isLoading && !isAuthenticated) {
        console.log('🔄 [Index] Non authentifié, redirection vers welcome');
        router.replace('/welcome');
      }
    };

    checkOnboarding();
  }, [isAuthenticated, isLoading, user, router]);

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

