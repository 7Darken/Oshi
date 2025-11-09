/**
 * Écran de bienvenue (WelcomeScreen)
 * Première page de l'app avec options de connexion
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuthTranslation, useCommonTranslation } from '@/hooks/useI18n';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signInWithGoogle, signInWithApple } = useAuthContext();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const { t } = useAuthTranslation();
  const { t: tCommon } = useCommonTranslation();

  const handleEmailLogin = () => {
    router.push('/login');
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      
      if (result.error) {
        setIsGoogleLoading(false);
        Alert.alert(
          tCommon('common.error'),
          result.error.message || t('loginErrorWithProvider', { provider: t('providers.google') })
        );
        return;
      }

      // L'authentification a réussi
      console.log('✅ [Welcome] Authentification Google réussie');
      
      // Si pas d'erreur, rediriger vers auth-callback qui gérera la redirection finale
      // (la session est déjà créée dans googleAuth.ts et dans le contexte)
      if (!result.error) {
        console.log('🔄 [Welcome] Attente stabilisation puis navigation vers /auth-callback...');
        console.log('✅ [Welcome] ProfileData:', result.profileData);
        
        // Attendre un peu pour que la session soit bien établie dans Supabase
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('🔄 [Welcome] Navigation vers /auth-callback');
        router.push('/auth-callback');
      } else {
        console.error('❌ [Welcome] Erreur lors de l\'authentification:', result.error);
        setIsGoogleLoading(false);
      }
    } catch (error: any) {
      setIsGoogleLoading(false);
      Alert.alert(
        tCommon('common.error'),
        error.message || t('loginErrorWithProvider', { provider: t('providers.google') })
      );
    }
    // Ne pas mettre setIsGoogleLoading(false) ici car la navigation peut prendre du temps
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    try {
      const result = await signInWithApple();
      
      // Si l'utilisateur a annulé, ne rien faire
      if (!result.error && !result.user) {
        setIsAppleLoading(false);
        return;
      }

      if (result.error) {
        setIsAppleLoading(false);
        Alert.alert(
          tCommon('common.error'),
          result.error.message || t('loginErrorWithProvider', { provider: t('providers.apple') })
        );
        return;
      }

      // L'authentification a réussi
      console.log('✅ [Welcome] Authentification Apple réussie');
      
      // Attendre un peu pour que la session soit bien établie dans Supabase
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 [Welcome] Navigation vers /auth-callback');
      router.push('/auth-callback');
    } catch (error: any) {
      setIsAppleLoading(false);
      Alert.alert(
        tCommon('common.error'),
        error.message || t('loginErrorWithProvider', { provider: t('providers.apple') })
      );
    }
    // Ne pas mettre setIsAppleLoading(false) ici car la navigation peut prendre du temps
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo et nom */}
      <View style={styles.logoSection}>
        <ExpoImage
          source={require('@/assets/images/imgWelcome.png')}
          style={styles.welcomeImage}
          contentFit="contain"
        />
        <Text style={[styles.appName, { color: colors.text }]}>Oshii</Text>
        <Text style={[styles.description, { color: colors.icon }]}>
          {t('welcomeHeadline')}
        </Text>
      </View>

      {/* Boutons de connexion */}
      <View style={styles.loginSection}>
        {/* Email */}
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleEmailLogin}
          activeOpacity={0.8}
        >
          <Mail size={20} color={colors.text} />
          <Text style={[styles.loginButtonText, { color: colors.text }]}>
            {t('continueWith')} <Text style={styles.loginButtonBold}>{t('providers.email')}</Text>
          </Text>
        </TouchableOpacity>

        {/* Google */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            { backgroundColor: colors.card, borderColor: colors.border },
            isGoogleLoading && styles.loginButtonDisabled
          ]}
          onPress={handleGoogleLogin}
          activeOpacity={0.8}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <ExpoImage
              source={require('@/assets/logo/GoogleLogo.png')}
              style={styles.googleIcon}
              contentFit="contain"
            />
          )}
          <Text style={[styles.loginButtonText, { color: colors.text }]}>
            {isGoogleLoading ? t('connecting') : (
              <>
                {t('continueWith')} <Text style={styles.loginButtonBold}>{t('providers.google')}</Text>
              </>
            )}
          </Text>
        </TouchableOpacity>

        {/* Apple */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            {
              backgroundColor: colorScheme === 'light' ? '#000000' : colors.card,
              borderColor: colorScheme === 'light' ? '#000000' : colors.border,
            },
            isAppleLoading && styles.loginButtonDisabled
          ]}
          onPress={handleAppleLogin}
          activeOpacity={0.8}
          disabled={isAppleLoading}
        >
          {isAppleLoading ? (
            <ActivityIndicator size="small" color={colorScheme === 'light' ? '#FFFFFF' : colors.text} />
          ) : (
            <ExpoImage
              source={require('@/assets/logo/AppleLogo.png')}
              style={styles.appleIcon}
              contentFit="contain"
            />
          )}
          <Text style={[
            styles.loginButtonText,
            { color: colorScheme === 'light' ? '#FFFFFF' : colors.text }
          ]}>
            {isAppleLoading ? t('connecting') : (
              <>
                {t('continueWith')} <Text style={styles.loginButtonBold}>{t('providers.apple')}</Text>
              </>
            )}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl * 2,
  },
  welcomeImage: {
    width: 200,
    height: 200,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: Spacing.lg,
    letterSpacing: 1,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  loginSection: {
    gap: Spacing.md,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  loginButtonText: {
    fontSize: 16,
    marginLeft: Spacing.md,
  },
  loginButtonBold: {
    fontWeight: '700',
  },
  googleIcon: {
    width: 28,
    height: 28,
  },
  appleIcon: {
    width: 22,
    height: 22,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
});

