/**
 * Écran d'inscription (RegisterScreen)
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
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthContext } from '@/contexts/AuthContext';
import { OshiiLogo } from '@/components/ui/OshiiLogo';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signUp, isLoading } = useAuthContext();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleRegister = async () => {
    // Réinitialiser l'erreur
    setError(null);

    // Validation
    if (!email || !password || !confirmPassword) {
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

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await signUp({ email, password });
      router.replace('/onboarding');
    } catch (err: any) {
      // Gérer les différents types d'erreurs
      const errorMessage = err.message?.toLowerCase() || '';
      
      if (errorMessage.includes('user already registered') || 
          errorMessage.includes('email already exists') ||
          errorMessage.includes('already in use')) {
        setError('Cet email est déjà utilisé');
      } else if (errorMessage.includes('invalid email')) {
        setError('Format d\'email invalide');
      } else if (errorMessage.includes('weak password') || 
                 errorMessage.includes('password is too weak')) {
        setError('Le mot de passe est trop faible');
      } else if (errorMessage.includes('network')) {
        setError('Erreur de connexion. Vérifiez votre connexion internet');
      } else {
        // Logger uniquement les erreurs inattendues
        console.error('❌ Erreur d\'inscription:', err);
        setError('Erreur lors de l\'inscription. Veuillez réessayer');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Bouton retour */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <OshiiLogo size="lg" />
          <Text style={[styles.title, { color: colors.text, marginTop: Spacing.md }]}>Créer un compte</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Rejoignez-nous pour commencer
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
          />

          <Input
            label="Confirmer le mot de passe"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (error) setError(null);
            }}
            secureTextEntry
            autoCapitalize="none"
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title="S'inscrire"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.icon }]}>
              Déjà un compte ?{' '}
            </Text>
            <Text
              style={[styles.loginLink, { color: colors.primary }]}
              onPress={handleLogin}
            >
              Connectez-vous
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xxl,
    left: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
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
  registerButton: {
    marginTop: Spacing.md,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

