/**
 * Onglet Profil - Informations utilisateur
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, User, Mail, Trash2, Settings } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';
import { useAuthContext } from '@/contexts/AuthContext';
import { ConfirmDeleteSheet } from '@/components/ConfirmDeleteSheet';
import { SettingsSheet } from '@/components/SettingsSheet';
import { supabase } from '@/services/supabase';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user, logout, deleteAccount, profile, refreshProfile } = useAuthContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Utiliser les données du profil depuis le contexte
  const username = profile?.username || null;
  const avatarUrl = profile?.avatar_url || null;

  // Rafraîchir le profil quand l'écran devient actif (au cas où il aurait été mis à jour ailleurs)
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleLogout = async () => {
    await logout();
    router.replace('/welcome');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      setShowDeleteConfirm(false);
      router.replace('/welcome');
    } catch (err: any) {
      Alert.alert(
        'Erreur',
        err.message || 'Une erreur est survenue lors de la suppression du compte'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        {/* Bouton Settings en haut à droite */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Settings size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={[styles.avatarContainer, { backgroundColor: avatarUrl ? 'transparent' : colors.primary }]}>
          {avatarUrl ? (
            <ExpoImage
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <User size={48} color="#FFFFFF" />
          )}
        </View>
        <Text style={[styles.name, { color: colors.text }]}>
          {username || user?.email?.split('@')[0] || 'Chef'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Passionné de cuisine
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Mail size={20} color={colors.icon} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>
                Email
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.email || 'Non renseigné'}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.icon }]}>
            Oshii v1.0.0
          </Text>
          <Text style={[styles.tagline, { color: colors.icon }]}>
            Vos recettes, simplifiées
          </Text>
        </View>
      </View>

      <ConfirmDeleteSheet
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeleting}
        title="Supprimer mon compte"
        message="Êtes-vous sûr de vouloir supprimer votre compte ? Cette action supprimera définitivement toutes vos recettes, dossiers et données. Cette action est irréversible."
      />

      <SettingsSheet
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}
        onDeleteAccount={() => setShowDeleteConfirm(true)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.xl,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: Spacing.xxl + Spacing.xl,
    right: Spacing.lg,
    padding: Spacing.sm,
    zIndex: 10,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  infoCard: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
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
