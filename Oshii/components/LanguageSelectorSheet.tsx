/**
 * Modal de sélection de la langue
 */

import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { useSettingsTranslation } from '@/hooks/useI18n';
import type { SupportedLanguage } from '@/services/i18n';

interface LanguageSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
}

type LanguageOption = {
  code: SupportedLanguage | null;
  label: string;
  nativeLabel: string;
};

export function LanguageSelectorSheet({ visible, onClose }: LanguageSelectorSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useSettingsTranslation();
  const { preferredLanguage, setPreferredLanguage } = useLanguageStore();

  const languages: LanguageOption[] = [
    { code: null, label: t('settings.languageAuto'), nativeLabel: '🌍' },
    { code: 'fr', label: t('settings.languageFrench'), nativeLabel: '🇫🇷' },
    { code: 'en', label: t('settings.languageEnglish'), nativeLabel: '🇬🇧' },
  ];

  const handleSelectLanguage = (code: SupportedLanguage | null) => {
    setPreferredLanguage(code);
    // Fermer le modal après un court délai pour que l'utilisateur voie la sélection
    setTimeout(() => {
      onClose();
    }, 300);
  };

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
            {t('settings.language')}
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
          {languages.map((language) => {
            const isSelected = preferredLanguage === language.code;

            return (
              <TouchableOpacity
                key={language.code || 'auto'}
                onPress={() => handleSelectLanguage(language.code)}
                activeOpacity={0.7}
              >
                <Card style={[
                  styles.languageCard,
                  isSelected && { borderColor: colors.primary, borderWidth: 2 }
                ]}>
                  <View style={styles.languageContent}>
                    <Text style={styles.flagEmoji}>{language.nativeLabel}</Text>
                    <View style={styles.languageTextContainer}>
                      <Text style={[styles.languageLabel, { color: colors.text }]}>
                        {language.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Check size={20} color={colors.primary} strokeWidth={3} />
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 0,
  },
  headerSpacer: {
    width: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  languageCard: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
