/**
 * Onglet Profil - Informations utilisateur
 */

import { AddFriendSheet } from '@/components/friends/AddFriendSheet';
import { FriendsListCard } from '@/components/friends/FriendsListCard';
import { FriendsSheetNative } from '@/components/friends/FriendsSheetNative';
import { SettingsSheet } from '@/components/SettingsSheet';
import { ProfileTypeIcon } from '@/components/ui/ProfileTypeIcon';
import { ToastNotification } from '@/components/ui/ToastNotification';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Camera, ChevronRight, Settings, Star, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user, logout, profile, refreshProfile, isPremium } = useAuthContext();
  const { uploadAvatar, isUploading } = useAvatarUpload();
  const [showSettings, setShowSettings] = useState(false);
  const [showFriendsSheet, setShowFriendsSheet] = useState(false);
  const [showAddFriendSheet, setShowAddFriendSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Utiliser les données du profil depuis le contexte
  const username = profile?.username || null;
  const avatarUrl = profile?.avatar_url || null;
  const profileType = profile?.profile_type || null;

  // Mapper le profile_type vers un label lisible
  const getProfileTypeLabel = (type: string | null): string => {
    switch (type) {
      case 'survivaliste':
        return 'Survivaliste';
      case 'cuisinier':
        return 'Cuisinier';
      case 'sportif':
        return 'Sportif';
      default:
        return 'Passionné de cuisine';
    }
  };

  // Rafraîchir le profil quand l'écran devient actif (au cas où il aurait été mis à jour ailleurs)
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleLogout = async () => {
    await logout();
    router.replace('/welcome');
  };

  const handleAddFriendSuccess = (username: string) => {
    setToastMessage(`Demande envoyée à @${username}`);
    setShowToast(true);
  };

  const handleAvatarPress = () => {
    try {
      console.log('👆 [Profile] Appui sur avatar');
      uploadAvatar();
    } catch (error) {
      console.error('❌ [Profile] Erreur lors de l\'appel uploadAvatar:', error);
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

        <View style={styles.avatarWrapper}>
          <TouchableOpacity
            onPress={handleAvatarPress}
            disabled={isUploading}
            activeOpacity={0.8}
          >
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
              {/* Overlay avec spinner lors de l'upload */}
              {isUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              )}
            </View>
            {/* Badge caméra pour indiquer qu'on peut changer la photo */}
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Camera size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          {isPremium && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Star size={14} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          )}
        </View>
        <Text style={[styles.name, { color: colors.text }]}>
         @{username || user?.email?.split('@')[0] || 'Chef'}
        </Text>
        {profileType && (
          <View style={[styles.profileTypeTag, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ProfileTypeIcon 
              profileType={profileType as 'survivaliste' | 'cuisinier' | 'sportif'} 
              size={20} 
            />
            <Text style={[styles.profileTypeText, { color: colors.text }]}>
              {getProfileTypeLabel(profileType)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Container Premium - Visible au-dessus si l'utilisateur n'est pas premium */}
        {!isPremium && (
          <TouchableOpacity
            style={[styles.premiumCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
            onPress={() => router.push('/subscription')}
            activeOpacity={0.7}
          >
            <View style={styles.premiumContent}>
              <View style={[styles.premiumIconContainer, { backgroundColor: colors.primary }]}>
                <Star size={24} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <View style={styles.premiumTextContainer}>
                <Text style={[styles.premiumTitle, { color: colors.text }]}>
                  Passer à Oshii Pro
                </Text>
                <Text style={[styles.premiumSubtitle, { color: colors.icon }]}>
                  Débloquez toutes les fonctionnalités
                </Text>
              </View>
              <ChevronRight size={20} color={colors.icon} />
            </View>
          </TouchableOpacity>
        )}

        {/* Section Amis */}
        <FriendsListCard
          onSeeAll={() => setShowFriendsSheet(true)}
          onAddFriend={() => setShowAddFriendSheet(true)}
        />

        {/* Container Oshii Pro - Visible en dessous si l'utilisateur est premium */}
        {isPremium && (
          <View style={[styles.proCard, { backgroundColor: colors.card, borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
            <View style={styles.proHeader}>
              <View style={[styles.proIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Star size={20} color={colors.primary} fill={colors.primary} />
              </View>
              <Text style={[styles.proTitle, { color: colors.text }]}>
                Oshii Pro
              </Text>
            </View>
            <View style={styles.proFeatures}>
              <View style={styles.proFeature}>
                <View style={[styles.proFeatureDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.proFeatureText, { color: colors.icon }]}>
                  Générations illimitées
                </Text>
              </View>
              <View style={styles.proFeature}>
                <View style={[styles.proFeatureDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.proFeatureText, { color: colors.icon }]}>
                  Recettes personnalisées
                </Text>
              </View>
              <View style={styles.proFeature}>
                <View style={[styles.proFeatureDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.proFeatureText, { color: colors.icon }]}>
                  Support prioritaire
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.icon }]}>
            Oshii v1.0.0
          </Text>
          <Text style={[styles.tagline, { color: colors.icon }]}>
            Vos recettes, simplifiées
          </Text>
        </View>
      </View>

      <AddFriendSheet
        visible={showAddFriendSheet}
        onClose={() => setShowAddFriendSheet(false)}
        onSuccess={handleAddFriendSuccess}
      />

      <FriendsSheetNative
        visible={showFriendsSheet}
        onClose={() => setShowFriendsSheet(false)}
      />

      <SettingsSheet
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}
        user={user}
      />

      <ToastNotification
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
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
    paddingTop: Spacing.xxl + Spacing.xl + Spacing.xxl,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: Spacing.xxl + Spacing.xl,
    right: Spacing.lg,
    padding: Spacing.sm,
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  profileTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  profileTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  premiumCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  premiumSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  proCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  proIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  proFeatures: {
    gap: Spacing.sm,
  },
  proFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  proFeatureDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
  },
  proFeatureText: {
    fontSize: 14,
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
