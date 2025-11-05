/**
 * Écran d'onboarding - 3 étapes pour les nouveaux utilisateurs
 */

import { Button } from '@/components/ui/Button';
import { OshiiLogo } from '@/components/ui/OshiiLogo';
import { ProfileTypeIcon } from '@/components/ui/ProfileTypeIcon';
import { StepProgress } from '@/components/ui/StepProgress';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/services/supabase';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Step = 1 | 2 | 3;

type ProfileType = 'survivaliste' | 'cuisinier' | 'sportif';

// Images du tutoriel
const tutorialImages = [
  require('@/assets/Tutorial/screen1.png'),
  require('@/assets/Tutorial/screen2.png'),
  require('@/assets/Tutorial/screen3.png'),
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [username, setUsername] = useState('');
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
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

  const profileTypes: { id: ProfileType; label: string; description: string }[] = [
    { 
      id: 'survivaliste', 
      label: 'Survivaliste', 
      description: 'Recettes simples et efficaces',
    },
    { 
      id: 'cuisinier', 
      label: 'Cuisinier', 
      description: 'Passion pour la gastronomie',
    },
    { 
      id: 'sportif', 
      label: 'Sportif', 
      description: 'Alimentation équilibrée et healthy',
    },
  ];


  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!username.trim()) {
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!profileType) {
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
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
          profile_type: profileType,
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
    if (currentStep === 2) return profileType !== null;
    if (currentStep === 3) return true; // L'étape 3 n'a plus besoin de sélection
    return false;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Barre de progression en haut */}
      <StepProgress totalSteps={3} currentStep={currentStep} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec logo et texte */}
        <View style={styles.header}>
          <OshiiLogo size="md" />
          <Text style={[styles.logoText, { color: colors.text }]}>Oshii</Text>
        </View>

        {/* Contenu de l'étape */}
        <View style={styles.content}>
          {currentStep === 1 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Quel est votre prénom ?
              </Text>
              <Text style={[styles.stepDescription, { color: colors.icon }]}>
                Nous l&apos;utiliserons pour personnaliser votre expérience
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
                Quel est votre profil ?
              </Text>
              <Text style={[styles.stepDescription, { color: colors.icon }]}>
                Cela nous aide à vous proposer des recettes adaptées
              </Text>
              <View style={styles.optionsContainer}>
                {profileTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: colors.card,
                        borderColor:
                          profileType === type.id
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setProfileType(type.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionHeader}>
                      <ProfileTypeIcon profileType={type.id} size={48} />
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: colors.text },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: colors.icon },
                      ]}
                    >
                      {type.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.stepContentNoHorizontalPadding}>
              <View style={styles.step3TextContainer}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>
                  Transforme tes vidéos
                </Text>
                <Text style={[styles.stepDescription, { color: colors.icon }]}>
                  Apprenez à utiliser l&apos;application en quelques étapes
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tutorialContainer}
                style={styles.tutorialScrollView}
              >
                {tutorialImages.map((image, index) => {
                  const imageKey = `tutorial-${index}`;
                  return (
                    <View
                      key={imageKey}
                      style={styles.tutorialImageWrapper}
                    >
                      <ExpoImage
                        source={image}
                        style={styles.tutorialImage}
                        contentFit="contain"
                        transition={200}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Boutons de navigation */}
        <View style={styles.footer}>
          <View style={styles.navigationButtons}>
            {/* Bouton Retour (visible uniquement si currentStep > 1) */}
            {currentStep > 1 && (
              <TouchableOpacity
                style={[
                  styles.backButton,
                  {
                    backgroundColor: 'transparent',
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleBack}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
                <Text style={[styles.backButtonText, { color: colors.text }]}>
                  Retour
                </Text>
              </TouchableOpacity>
            )}

            {/* Bouton Suivant */}
            <Button
              title={currentStep === 3 ? `C'est parti !` : 'Suivant'}
              onPress={handleNext}
              disabled={!canProceed() || isLoading}
              loading={isLoading}
              style={styles.nextButton}
            />
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
  scrollContent: {
    flexGrow: 1,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: -Spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: Spacing.lg,
  },
  stepContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  stepContentNoHorizontalPadding: {
    alignItems: 'center',
  },
  step3TextContainer: {
    paddingHorizontal: Spacing.lg,
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
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  optionCard: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  optionDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  tutorialScrollView: {
    marginTop: Spacing.lg,
  },
  tutorialContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  tutorialImageWrapper: {
    width: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tutorialImage: {
    width: 200,
    aspectRatio: 9 / 16, // Format portrait standard pour les captures d'écran
  },
  footer: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.xs,
    minWidth: 100,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
  },
});

