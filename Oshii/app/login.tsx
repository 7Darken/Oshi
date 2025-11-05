/**
 * Écran de connexion (LoginScreen)
 * Design minimaliste avec email/mot de passe
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthContext } from '@/contexts/AuthContext';
import { OshiiLogo } from '@/components/ui/OshiiLogo';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signIn, signInWithGoogle, signInWithApple, isLoading } = useAuthContext();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    // Réinitialiser l'erreur
    setError(null);

    // Validation
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!validateEmail(email)) {
      setError('Veuillez entrer un email valide');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      await signIn({ email, password });
      router.replace('/(tabs)');
    } catch (err: any) {
      // Gérer les différents types d'erreurs
      const errorMessage = err.message?.toLowerCase() || '';
      
      if (errorMessage.includes('invalid login credentials') || 
          errorMessage.includes('invalid email or password') ||
          errorMessage.includes('incorrect') ||
          errorMessage.includes('wrong')) {
        setError('Email ou mot de passe incorrect');
      } else if (errorMessage.includes('email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter');
      } else if (errorMessage.includes('too many requests')) {
        setError('Trop de tentatives. Veuillez réessayer plus tard');
      } else if (errorMessage.includes('network')) {
        setError('Erreur de connexion. Vérifiez votre connexion internet');
      } else {
        // Logger uniquement les erreurs inattendues
        console.error('❌ Erreur de connexion:', err);
        setError('Erreur de connexion. Veuillez réessayer');
      }
    }
  };

  const handleSignUp = () => {
    router.push('/register');
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      
      if (result.error) {
        setIsGoogleLoading(false);
        Alert.alert(
          'Erreur',
          result.error.message || 'Une erreur est survenue lors de la connexion avec Google'
        );
        return;
      }

      // L'authentification a réussi
      // Le redirect OAuth va automatiquement ouvrir auth-callback qui gérera la redirection finale
      console.log('✅ [Login] Authentification Google réussie, redirection automatique...');
      
      // Si pas de redirect automatique, rediriger vers auth-callback
      if (result.user && result.session) {
        router.replace('/auth-callback');
      }
    } catch (error: any) {
      setIsGoogleLoading(false);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la connexion avec Google'
      );
    }
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    try {
      const result = await signInWithApple();
      
      if (result.error) {
        setIsAppleLoading(false);
        Alert.alert(
          'Erreur',
          result.error.message || 'Une erreur est survenue lors de la connexion avec Apple'
        );
        return;
      }

      // L'authentification a réussi
      // Le redirect OAuth va automatiquement ouvrir auth-callback qui gérera la redirection finale
      console.log('✅ [Login] Authentification Apple réussie, redirection automatique...');
      
      // Si pas de redirect automatique, rediriger vers auth-callback
      if (result.user && result.session) {
        router.replace('/auth-callback');
      }
    } catch (error: any) {
      setIsAppleLoading(false);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la connexion avec Apple'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <OshiiLogo size="lg" />
          <Text style={[styles.title, { color: colors.text, marginTop: Spacing.md }]}>Bienvenue</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Connectez-vous pour continuer
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Votre adresse email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={error?.includes('email') ? error : undefined}
          />

          <Input
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
            secureTextEntry
            autoCapitalize="none"
            error={error?.includes('mot de passe') ? error : undefined}
          />

          {error && !error.includes('email') && !error.includes('mot de passe') && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
          />

          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: colors.icon }]}>
              Pas encore de compte ?{' '}
            </Text>
            <Text
              style={[styles.signupLink, { color: colors.primary }]}
              onPress={handleSignUp}
            >
              Inscrivez-vous
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.icon }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Boutons Google et Apple */}
          <TouchableOpacity
            style={[
              styles.socialButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              isGoogleLoading && styles.socialButtonDisabled
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
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              {isGoogleLoading ? 'Connexion...' : (
                <>Continuer avec <Text style={styles.socialButtonBold}>Google</Text></>
              )}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                backgroundColor: colorScheme === 'light' ? '#000000' : colors.card,
                borderColor: colorScheme === 'light' ? '#000000' : colors.border,
              },
              isAppleLoading && styles.socialButtonDisabled
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
              styles.socialButtonText,
              { color: colorScheme === 'light' ? '#FFFFFF' : colors.text }
            ]}>
              {isAppleLoading ? 'Connexion...' : (
                <>Continuer avec <Text style={styles.socialButtonBold}>Apple</Text></>
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  googleIcon: {
    width: 28,
    height: 28,
  },
  appleIcon: {
    width: 22,
    height: 22,
  },
  socialButtonText: {
    fontSize: 16,
    marginLeft: Spacing.md,
  },
  socialButtonBold: {
    fontWeight: '700',
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
});

