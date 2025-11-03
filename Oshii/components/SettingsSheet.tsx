/**
 * Page Sheet des paramètres de l'application
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { X, Bell, Shield, HelpCircle, Info, LogOut, Trash2 } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export function SettingsSheet({ visible, onClose, onLogout, onDeleteAccount }: SettingsSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const settingsOptions = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Gérer les notifications',
      onPress: () => {
        // TODO: Implémenter la page de notifications
        console.log('Notifications');
      },
    },
    {
      id: 'privacy',
      title: 'Confidentialité',
      icon: Shield,
      description: 'Paramètres de confidentialité',
      onPress: () => {
        // TODO: Implémenter la page de confidentialité
        console.log('Confidentialité');
      },
    },
    {
      id: 'help',
      title: 'Aide',
      icon: HelpCircle,
      description: 'Centre d\'aide et support',
      onPress: () => {
        // TODO: Implémenter la page d'aide
        console.log('Aide');
      },
    },
    {
      id: 'about',
      title: 'À propos',
      icon: Info,
      description: 'Informations sur l\'application',
      onPress: () => {
        // TODO: Implémenter la page À propos
        console.log('À propos');
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
              onPress={onLogout}
              activeOpacity={0.7}
            >
              <LogOut size={20} color="#FF6B6B" />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: colors.border }]}
              onPress={onDeleteAccount}
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
          </View>
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
  },
});

