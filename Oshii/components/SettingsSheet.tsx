/**
 * Page Sheet des paramètres de l'application
 */

import { ConfirmDeleteSheet } from '@/components/ConfirmDeleteSheet';
import { TutorialSheet } from '@/components/TutorialSheet';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initRevenueCat } from '@/services/revenueCat';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ChevronRight, HelpCircle, Info, LogOut, Mail, Moon, Star, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Purchases from 'react-native-purchases';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: any;
}

export function SettingsSheet({ visible, onClose, onLogout, user }: SettingsSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { deleteAccount, isPremium } = useAuthContext();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  const appName = Constants?.expoConfig?.name ?? 'Oshii';
  const appVersion = Constants?.expoConfig?.version ?? '1.0.0';
  const appTagline = 'Vos recettes, simplifiées';

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      // Fermer le modal de confirmation
      setShowDeleteConfirm(false);
      // Attendre un peu pour que l'utilisateur voie la fermeture du modal
      await new Promise(resolve => setTimeout(resolve, 300));
      // Fermer le SettingsSheet
      onClose();
      // Rediriger vers la page d'accueil
      router.replace('/welcome');
    } catch (err: any) {
      console.error('❌ [SettingsSheet] Erreur lors de la suppression du compte:', err);
      Alert.alert(
        'Erreur',
        err.message || 'Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.'
      );
      setIsDeleting(false);
    }
  };

  const handleManageSubscription = async () => {
    if (isManagingSubscription) {
      return;
    }

    setIsManagingSubscription(true);

    try {
      const initialized = await initRevenueCat(user?.id ?? undefined);

      if (!initialized) {
        Alert.alert(
          'Service indisponible',
          'La gestion de l’abonnement n’est pas disponible pour le moment. Veuillez réessayer plus tard.'
        );
        return;
      }

      await Purchases.showManageSubscriptions();
    } catch (error) {
      console.error('❌ [SettingsSheet] Erreur ouverture gestion abonnement:', error);
      Alert.alert(
        'Erreur',
        'Impossible d’ouvrir la gestion d’abonnement. Veuillez réessayer plus tard.'
      );
    } finally {
      setIsManagingSubscription(false);
    }
  };

  // Vérifier si c'est un email Apple Private Relay
  const isApplePrivateRelay = user?.email?.includes('privaterelay.appleid.com');
  const displayEmail = isApplePrivateRelay ? 'Compte Apple' : (user?.email || 'Non renseigné');

  // Détecter le thème actuel
  const themeLabel = colorScheme === 'dark' ? 'Sombre' : 'Clair';

  // Fonctions pour ouvrir les liens web
  const handleOpenTerms = async () => {
    const url = 'https://v0-oshii.vercel.app/terms';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const handleOpenPrivacy = async () => {
    const url = 'https://v0-oshii.vercel.app/privacy';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const settingsOptions = [
    {
      id: 'theme',
      title: 'Thème',
      icon: Moon,
      description: themeLabel,
      onPress: () => {
        // TODO: Implémenter le changement de thème
        console.log('Thème');
      },
    },
    {
      id: 'help',
      title: 'Aide',
      icon: HelpCircle,
      description: 'Comment transformer vos vidéos',
      onPress: () => {
        setShowTutorial(true);
      },
    },
    {
      id: 'about',
      title: 'À propos',
      icon: Info,
      description: 'Informations sur l\'application',
      onPress: () => {
        Alert.alert(
          appName,
          `Version ${appVersion}\n${appTagline}`,
          [{ text: 'OK', style: 'default' }],
        );
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Paramètres
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Container Abonnement Premium - Visible uniquement si premium */}
          {isPremium && (
            <TouchableOpacity
              onPress={handleManageSubscription}
              activeOpacity={0.7}
            >
              <Card style={styles.optionCard}>
                <View style={styles.optionContent}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Star size={20} color={colors.primary} fill={colors.primary} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      Abonnement Premium
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.icon }]}>
                      Gérer mon abonnement
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.icon} />
                </View>
              </Card>
            </TouchableOpacity>
          )}

          {/* Container Email */}
          <Card style={styles.optionCard}>
            <View style={styles.optionContent}>
              <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
                <Mail size={20} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  Email
                </Text>
                <Text style={[styles.optionDescription, { color: colors.icon }]}>
                  {displayEmail}
                </Text>
              </View>
            </View>
          </Card>

          {settingsOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={option.onPress}
                activeOpacity={0.7}
              >
                <Card style={styles.optionCard}>
                  <View style={styles.optionContent}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
                      <IconComponent size={20} color={colors.primary} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: colors.text }]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.icon }]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}

          {/* Boutons de déconnexion et suppression */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}
              onPress={() => {
                Alert.alert(
                  'Se déconnecter',
                  'Es-tu sûr de vouloir te déconnecter ? Tu devras te reconnecter pour accéder à tes recettes.',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Oui, se déconnecter',
                      style: 'destructive',
                      onPress: () => {
                        onLogout();
                      },
                    },
                  ],
                );
              }}
              activeOpacity={0.7}
            >
              <LogOut size={20} color="#FF6B6B" />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: colors.border }]}
              onPress={() => {
                console.log('🔴 [SettingsSheet] Bouton "Supprimer mon compte" pressé');
                setShowDeleteConfirm(true);
              }}
              activeOpacity={0.7}
            >
              <Trash2 size={20} color={colors.icon} />
              <Text style={[styles.deleteText, { color: colors.icon }]}>Supprimer mon compte</Text>
            </TouchableOpacity>
          </View>

          {/* Version */}
          <View style={styles.footer}>
            <Text style={[styles.version, { color: colors.icon }]}>
              Oshii v1.0.0
            </Text>
            <Text style={[styles.tagline, { color: colors.icon }]}>
              Vos recettes, simplifiées
            </Text>
            
            {/* Liens légaux */}
            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={handleOpenTerms}>
                <Text style={[styles.legalLink, { color: colors.icon }]}>
                  Conditions d&apos;utilisation
                </Text>
              </TouchableOpacity>
              <Text style={[styles.legalSeparator, { color: colors.icon }]}>•</Text>
              <TouchableOpacity onPress={handleOpenPrivacy}>
                <Text style={[styles.legalLink, { color: colors.icon }]}>
                  Confidentialité
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteSheet
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeleting}
        title="Supprimer mon compte"
        message="Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action supprimera irréversiblement toutes vos données : vos recettes, vos dossiers, vos listes de courses, et toutes les informations associées à votre compte. Cette action est irréversible et ne peut pas être annulée."
      />

      {/* Modal du tutoriel */}
      <TutorialSheet
        visible={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  optionCard: {
    marginBottom: Spacing.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  optionDescription: {
    fontSize: 14,
  },
  actionsContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginLeft: Spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  version: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  legalLink: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    marginHorizontal: Spacing.sm,
  },
});

