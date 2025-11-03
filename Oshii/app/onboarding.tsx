/**
 * Écran d'onboarding - 3 étapes pour les nouveaux utilisateurs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { OshiiLogo } from '@/components/ui/OshiiLogo';
import { supabase } from '@/services/supabase';
import { useAuthContext } from '@/contexts/AuthContext';

type Step = 1 | 2 | 3;

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [username, setUsername] = useState('');
  const [skillLevel, setSkillLevel] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, refreshSession, profile, refreshProfile } = useAuthContext();

  // Récupérer le profil utilisateur pour préremplir le nom
  useEffect(() => {
    // Rafraîchir le profil au montage
    refreshProfile();
  }, [refreshProfile]);

  // Préremplir le username depuis le profil ou user_metadata
  useEffect(() => {
    if (!username) {
      // D'abord, utiliser le username du profil
      if (profile?.username) {
        setUsername(profile.username);
      } else if (user?.user_metadata) {
        // Sinon, essayer d'extraire le nom depuis user_metadata (Google)
        const userMetadata = user.user_metadata || {};
        const googleName = 
          userMetadata.full_name || 
          userMetadata.name ||
          `${userMetadata.first_name || ''} ${userMetadata.last_name || ''}`.trim();
        
        if (googleName) {
          setUsername(googleName);
        }
      }
    }
  }, [profile?.username, user?.user_metadata, username]);

  const skillLevels = [
    { id: 'beginner', label: 'Débutant', description: 'Je découvre la cuisine' },
    { id: 'intermediate', label: 'Intermédiaire', description: 'J\'ai quelques bases' },
    { id: 'expert', label: 'Expert', description: 'Je maîtrise la cuisine' },
  ];

  const goals = [
    { id: 'discover', label: 'Découvrir', description: 'Explorer de nouvelles recettes' },
    { id: 'improve', label: 'Progresser', description: 'Améliorer mes compétences' },
    { id: 'share', label: 'Partager', description: 'Partager mes créations' },
  ];

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!username.trim()) {
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!skillLevel) {
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!goal) {
        return;
      }
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);

    try {
      // Créer ou mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username.trim(),
          onboarding_completed: true,
        });

      if (profileError) {
        throw profileError;
      }

      // Rafraîchir le profil dans le contexte après la mise à jour
      await refreshProfile();

      // Rafraîchir la session pour mettre à jour les données utilisateur
      await refreshSession();

      // Rediriger vers la home
      router.replace('/(tabs)?fromOnboarding=true');
    } catch (error: any) {
      console.error('❌ Erreur lors de la complétion de l\'onboarding:', error);
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return username.trim().length > 0;
    if (currentStep === 2) return skillLevel !== null;
    if (currentStep === 3) return goal !== null;
    return false;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec logo */}
        <View style={styles.header}>
          <OshiiLogo size="md" />
        </View>

        {/* Indicateur de progression */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    step <= currentStep ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Contenu de l'étape */}
        <View style={styles.content}>
          {currentStep === 1 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Quel est votre prénom ?
              </Text>
              <Text style={[styles.stepDescription, { color: colors.icon }]}>
                Nous l'utiliserons pour personnaliser votre expérience
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Votre prénom"
                placeholderTextColor={colors.icon}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={30}
              />
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Quel est votre niveau ?
              </Text>
              <Text style={[styles.stepDescription, { color: colors.icon }]}>
                Cela nous aide à vous proposer des recettes adaptées
              </Text>
              <View style={styles.optionsContainer}>
                {skillLevels.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor:
                          skillLevel === level.id
                            ? colors.primary
                            : colors.card,
                        borderColor:
                          skillLevel === level.id
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setSkillLevel(level.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color:
                            skillLevel === level.id ? '#FFFFFF' : colors.text,
                        },
                      ]}
                    >
                      {level.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        {
                          color:
                            skillLevel === level.id
                              ? 'rgba(255, 255, 255, 0.8)'
                              : colors.icon,
                        },
                      ]}
                    >
                      {level.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Quel est votre objectif ?
              </Text>
              <Text style={[styles.stepDescription, { color: colors.icon }]}>
                Dites-nous ce qui vous motive
              </Text>
              <View style={styles.optionsContainer}>
                {goals.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor:
                          goal === g.id ? colors.primary : colors.card,
                        borderColor: goal === g.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setGoal(g.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: goal === g.id ? '#FFFFFF' : colors.text,
                        },
                      ]}
                    >
                      {g.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        {
                          color:
                            goal === g.id
                              ? 'rgba(255, 255, 255, 0.8)'
                              : colors.icon,
                        },
                      ]}
                    >
                      {g.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Bouton suivant */}
        <View style={styles.footer}>
          <Button
            title={currentStep === 3 ? 'Commencer' : 'Suivant'}
            onPress={handleNext}
            disabled={!canProceed() || isLoading}
            loading={isLoading}
            style={styles.nextButton}
          />
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  stepContent: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.md,
  },
  input: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
    marginTop: Spacing.md,
  },
  optionsContainer: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  optionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: 14,
  },
  footer: {
    marginTop: Spacing.xxl,
  },
  nextButton: {
    width: '100%',
  },
});

