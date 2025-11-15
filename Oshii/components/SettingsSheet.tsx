/**
 * Page Sheet des paramètres de l'application
 */

import { ConfirmDeleteSheet } from '@/components/ConfirmDeleteSheet';
import { LanguageSelectorSheet } from '@/components/LanguageSelectorSheet';
import { TutorialSheet } from '@/components/TutorialSheet';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProfileTranslation, useSettingsTranslation } from '@/hooks/useI18n';
import { initRevenueCat } from '@/services/revenueCat';
import { useLanguageStore } from '@/stores/useLanguageStore';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ChevronRight, Globe, HelpCircle, Info, LogOut, Mail, Moon, Star, Trash2, X } from 'lucide-react-native';
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
  const { t } = useSettingsTranslation();
  const { t: tProfile } = useProfileTranslation();
  const { preferredLanguage } = useLanguageStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  const appName = Constants?.expoConfig?.name ?? 'Oshii';
  const appVersion = Constants?.expoConfig?.version ?? '1.0.0';

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
        t('settings.error'),
        err.message || t('settings.deleteError')
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
          t('settings.serviceUnavailable'),
          t('settings.subscriptionUnavailable')
        );
        return;
      }

      await Purchases.showManageSubscriptions();
    } catch (error) {
      console.error('❌ [SettingsSheet] Erreur ouverture gestion abonnement:', error);
      Alert.alert(
        t('settings.error'),
        t('settings.subscriptionError')
      );
    } finally {
      setIsManagingSubscription(false);
    }
  };

  // Vérifier si c'est un email Apple Private Relay
  const isApplePrivateRelay = user?.email?.includes('privaterelay.appleid.com');
  const displayEmail = isApplePrivateRelay ? t('settings.appleAccount') : (user?.email || t('settings.notProvided'));

  // Détecter le thème actuel
  const themeLabel = colorScheme === 'dark' ? t('settings.themeDark') : t('settings.themeLight');

  // Label de la langue actuelle
  const getLanguageLabel = () => {
    if (preferredLanguage === null) return t('settings.languageAuto');
    if (preferredLanguage === 'fr') return t('settings.languageFrench');
    if (preferredLanguage === 'en') return t('settings.languageEnglish');
    return t('settings.languageAuto');
  };

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
      id: 'language',
      title: t('settings.language'),
      icon: Globe,
      description: getLanguageLabel(),
      onPress: () => {
        setShowLanguageSelector(true);
      },
    },
    {
      id: 'theme',
      title: t('settings.theme'),
      icon: Moon,
      description: themeLabel,
      onPress: () => {
        // TODO: Implémenter le changement de thème
        console.log('Thème');
      },
    },
    {
      id: 'help',
      title: t('settings.help'),
      icon: HelpCircle,
      description: t('settings.helpDescription'),
      onPress: () => {
        setShowTutorial(true);
      },
    },
    {
      id: 'about',
      title: t('settings.about'),
      icon: Info,
      description: t('settings.aboutDescription'),
      onPress: () => {
        Alert.alert(
          appName,
          `Version ${appVersion}\n${t('settings.tagline')}`,
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
            {t('settings.title')}
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
            <>
              <Card style={[styles.optionCard, styles.premiumActiveCard]}>
                <View style={styles.optionContent}>
                  <View style={[styles.iconContainer, styles.premiumIconBackground]}>
                    <Star size={20} color={colors.primary} fill={colors.primary} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      {tProfile('profile.premium.activeTitle')}
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.icon }]}>
                      {tProfile('profile.premium.activeDescription')}
                    </Text>
                  </View>
                  <View style={styles.premiumActivePill}>
                    <Text style={styles.premiumActivePillText}>{tProfile('profile.premium.activeBadge')}</Text>
                  </View>
                </View>
              </Card>
              <TouchableOpacity onPress={handleManageSubscription} activeOpacity={0.7}>
                <Card style={styles.optionCard}>
                  <View style={styles.optionContent}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
                      <Star size={20} color={colors.primary} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: colors.text }]}>
                        {t('settings.premium')}
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.icon }]}>
                        {t('settings.managePremium')}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.icon} />
                  </View>
                </Card>
              </TouchableOpacity>
            </>
          )}

          {/* Container Email */}
          <Card style={styles.optionCard}>
            <View style={styles.optionContent}>
              <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
                <Mail size={20} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t('settings.email')}
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
                  t('settings.logoutAlert.title'),
                  t('settings.logoutAlert.message'),
                  [
                    { text: t('settings.logoutAlert.cancel'), style: 'cancel' },
                    {
                      text: t('settings.logoutAlert.confirm'),
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
              <Text style={styles.logoutText}>{t('settings.logoutButton')}</Text>
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
              <Text style={[styles.deleteText, { color: colors.icon }]}>
                {t('settings.deleteAccountButton')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Version */}
          <View style={styles.footer}>
            <Text style={[styles.version, { color: colors.icon }]}>
              Oshii v1.0.0
            </Text>
            <Text style={[styles.tagline, { color: colors.icon }]}>
              {t('settings.tagline')}
            </Text>

            {/* Liens légaux */}
            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={handleOpenTerms}>
                <Text style={[styles.legalLink, { color: colors.icon }]}>
                  {t('settings.terms')}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.legalSeparator, { color: colors.icon }]}>•</Text>
              <TouchableOpacity onPress={handleOpenPrivacy}>
                <Text style={[styles.legalLink, { color: colors.icon }]}>
                  {t('settings.privacy')}
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
        title={t('settings.deleteAlert.title')}
        message={t('settings.deleteAlert.message')}
      />

      {/* Modal du tutoriel */}
      <TutorialSheet
        visible={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {/* Modal de sélection de langue */}
      <LanguageSelectorSheet
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
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
  premiumActiveCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
  premiumIconBackground: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  premiumActivePill: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  premiumActivePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(239, 68, 68, 1)',
    textTransform: 'uppercase',
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

