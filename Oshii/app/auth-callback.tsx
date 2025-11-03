/**
 * Route de callback OAuth
 * Gère le retour après authentification Google/Apple
 */

import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { refreshSession, refreshProfile } = useAuthContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Flag pour éviter les exécutions multiples
  const isProcessing = useRef(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Éviter les exécutions multiples
    if (isProcessing.current || hasRedirected.current) {
      console.log('⏭️ [Auth Callback] Callback déjà en cours ou redirection déjà effectuée, ignoré');
      return;
    }

    const handleCallback = async () => {
      isProcessing.current = true;

      try {
        console.log('🔄 [Auth Callback] === DÉBUT DU CALLBACK ===');

        // Vérifier si une session existe déjà (créée par googleAuth.ts)
        console.log('🔍 [Auth Callback] Vérification de la session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.error('❌ [Auth Callback] Session non disponible:', sessionError);
          hasRedirected.current = true;
          router.replace('/welcome');
          return;
        }

        console.log('✅ [Auth Callback] Session trouvée');
        
        // Récupérer l'utilisateur
        console.log('👤 [Auth Callback] Récupération de l\'utilisateur...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('❌ [Auth Callback] Utilisateur non disponible:', userError);
          hasRedirected.current = true;
          router.replace('/welcome');
          return;
        }

        console.log('✅ [Auth Callback] Utilisateur trouvé:', user.email);
        console.log('✅ [Auth Callback] ID utilisateur:', user.id);

        // Rafraîchir la session et le profil dans le contexte
        console.log('🔄 [Auth Callback] Rafraîchissement de la session dans le contexte...');
        await refreshSession();
        await refreshProfile(); // Charger le profil dans le contexte

        // Récupérer le profil depuis le contexte après rafraîchissement
        // Note: On fait quand même une requête directe ici pour être sûr d'avoir les données à jour
        // car le contexte pourrait prendre un peu de temps à se mettre à jour
        console.log('📋 [Auth Callback] Vérification de l\'onboarding...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed, username')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ [Auth Callback] Erreur lors de la récupération du profil:', profileError);
        }

        console.log('📋 [Auth Callback] Profil récupéré:', {
          exists: !!profile,
          onboardingCompleted: profile?.onboarding_completed,
          username: profile?.username,
        });

        // Effectuer la redirection une seule fois
        if (hasRedirected.current) {
          console.log('⏭️ [Auth Callback] Redirection déjà effectuée, ignoré');
          return;
        }

        hasRedirected.current = true;

        if (!profile || !profile.onboarding_completed) {
          console.log('🔄 [Auth Callback] === REDIRECTION VERS ONBOARDING ===');
          router.replace('/onboarding');
        } else {
          console.log('🔄 [Auth Callback] === REDIRECTION VERS HOME ===');
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('❌ [Auth Callback] Erreur:', error);
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          router.replace('/welcome');
        }
      } finally {
        isProcessing.current = false;
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dépendances vides pour éviter les re-exécutions

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.text }]}>
        Connexion en cours...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  text: {
    marginTop: Spacing.lg,
    fontSize: 16,
  },
});

