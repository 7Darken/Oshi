/**
 * Onglet Profil - Informations utilisateur
 */

import { AddFriendSheet } from '@/components/friends/AddFriendSheet';
import { FriendsListCard } from '@/components/friends/FriendsListCard';
import { FriendsSheetNative } from '@/components/friends/FriendsSheetNative';
import { SettingsSheet } from '@/components/SettingsSheet';
import { PlatformDonut } from '@/components/share/PlatformDonut';
import { ProfileShareTemplate } from '@/components/share/ProfileShareTemplate';
import { ProfileTypeIcon } from '@/components/ui/ProfileTypeIcon';
import { ToastNotification } from '@/components/ui/ToastNotification';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { useProfileTranslation } from '@/hooks/useI18n';
import { getUserStats } from '@/services/api';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Camera, ChevronRight, MoreHorizontal, Settings, Star, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const capitalizeFirstLetter = (value: string) =>
  !value ? value : value.charAt(0).toUpperCase() + value.slice(1);

const parseDurationToMinutes = (raw: string): number => {
  if (!raw) return 0;
  let minutes = 0;
  const hourMatch = raw.match(/(\d+)\s*h/i);
  if (hourMatch) {
    minutes += parseInt(hourMatch[1], 10) * 60;
  }
  const minuteMatch = raw.match(/(\d+)\s*(?:min|m)/i);
  if (minuteMatch) {
    minutes += parseInt(minuteMatch[1], 10);
  }
  if (!hourMatch && !minuteMatch) {
    const numeric = parseInt(raw, 10);
    if (!Number.isNaN(numeric)) {
      minutes += numeric;
    }
  }
  return minutes;
};

const formatDuration = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}min`;
  }
  return `${minutes}min`;
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { t } = useProfileTranslation();
  const { user, logout, profile, refreshProfile, isPremium, token, refreshSession } = useAuthContext();
  const { uploadAvatar, isUploading } = useAvatarUpload();
  const [showSettings, setShowSettings] = useState(false);
  const [showFriendsSheet, setShowFriendsSheet] = useState(false);
  const [showAddFriendSheet, setShowAddFriendSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [platformStats, setPlatformStats] = useState<{ id: string; label: string; value: number; color: string }[]>([]);
  const [totalRecipesCount, setTotalRecipesCount] = useState(0);
  const [dietTags, setDietTags] = useState<string[]>([]);
  const [favoriteCuisine, setFavoriteCuisine] = useState<string | null>(null);
  const [totalCookingTime, setTotalCookingTime] = useState<string | null>(null);
  const [showShareTemplate, setShowShareTemplate] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Utiliser les données du profil depuis le contexte
  const username = profile?.username || null;
  const avatarUrl = profile?.avatar_url || null;
  const profileType = profile?.profile_type || null;

  const displayUsername = useMemo(
    () => username || user?.email?.split('@')[0] || t('profile.defaultUsername'),
    [username, user?.email, t],
  );

  // Mapper le profile_type vers un label lisible
  const getProfileTypeLabel = (type: string | null): string => {
    switch (type) {
      case 'survivaliste':
        return t('profile.profileTypes.survivaliste');
      case 'cuisinier':
        return t('profile.profileTypes.cuisinier');
      case 'sportif':
        return t('profile.profileTypes.sportif');
      default:
        return t('profile.profileTypes.default');
    }
  };

  // Rafraîchir le profil quand l'écran devient actif (au cas où il aurait été mis à jour ailleurs)
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Récupérer les statistiques depuis le backend via /user/stats
  const fetchUserStats = useCallback(async () => {
    if (!user?.id || !token) {
      console.log('[Profile] Utilisateur non connecté ou token manquant');
      setPlatformStats([]);
      setTotalRecipesCount(0);
      setDietTags([]);
      setFavoriteCuisine(null);
      setTotalCookingTime(null);
      return;
    }

    setIsLoadingStats(true);

    try {
      console.log('📊 [Profile] Récupération des stats utilisateur...');

      const stats = await getUserStats(token, {
        getToken: () => token,
        refreshSession,
      });

      console.log('✅ [Profile] Stats récupérées:', stats);

      if (!stats) {
        console.warn('⚠️ [Profile] Aucune stats retournée');
        return;
      }

      // Mettre à jour le total de recettes
      setTotalRecipesCount(stats.totalRecipes);

      // Mapper les stats de plateforme
      // Le backend renvoie un tableau: [{ platform: 'TikTok', count: 17 }, ...]
      const availablePlatforms = [
        {
          id: 'tiktok',
          label: t('profile.platformStats.tiktok'),
          color: colors.primary,
          backendName: 'TikTok',
        },
        {
          id: 'instagram',
          label: t('profile.platformStats.instagram'),
          color: '#9f1c3f',
          backendName: 'Instagram',
        },
        {
          id: 'youtube',
          label: t('profile.platformStats.youtube'),
          color: 'white',
          backendName: 'YouTube',
        },
      ];

      // Créer une map depuis le backend pour faciliter l'accès
      const platformCountMap = new Map(
        stats.recipesByPlatform.map((item) => [item.platform, item.count])
      );

      // Toujours afficher les 3 plateformes principales, même si 0
      const platformsWithData = availablePlatforms.map((platform) => ({
        id: platform.id,
        label: platform.label,
        color: platform.color,
        value: platformCountMap.get(platform.backendName) ?? 0,
      }));

      // Calculer le nombre de recettes "autres" (plateformes non répertoriées)
      const totalKnown = platformsWithData.reduce((acc, item) => acc + item.value, 0);
      const otherCount = stats.totalRecipes - totalKnown;

      // Ajouter "Autres" seulement s'il y a des recettes d'autres plateformes
      const finalStats =
        otherCount > 0
          ? [
              ...platformsWithData,
              {
                id: 'other',
                label: t('profile.platformStats.others'),
                value: otherCount,
                color: colors.icon,
              },
            ]
          : platformsWithData;

      setPlatformStats(finalStats);

      // Cuisine favorite avec majuscule
      setFavoriteCuisine(
        stats.topCuisineOrigin ? capitalizeFirstLetter(stats.topCuisineOrigin) : null
      );

      // Top diet types (prendre les 4 premiers) avec majuscule
      const topDiets = stats.topDietTypes
        .slice(0, 4)
        .map((item) => capitalizeFirstLetter(item.diet));
      setDietTags(topDiets);

      // Temps de cuisson total
      const { hours, minutes } = stats.totalCookTime;
      if (hours > 0 || minutes > 0) {
        const formatted = hours > 0
          ? `${hours}h${minutes.toString().padStart(2, '0')}min`
          : `${minutes}min`;
        setTotalCookingTime(formatted);
      } else {
        setTotalCookingTime(null);
      }
    } catch (err) {
      console.error('❌ [Profile] Erreur lors de la récupération des stats:', err);
      // En cas d'erreur, afficher des stats vides
      setPlatformStats([]);
      setTotalRecipesCount(0);
      setDietTags([]);
      setFavoriteCuisine(null);
      setTotalCookingTime(null);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user?.id, token, refreshSession, colors.primary, colors.icon, t]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  const handleLogout = async () => {
    await logout();
    router.replace('/welcome');
  };

  const handleAddFriendSuccess = (username: string) => {
    setToastMessage(t('profile.friendRequestSent', { username }));
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

  const statsFormatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    [],
  );

  const shareMessage = useMemo(
    () => t('profile.platformStats.shareMessage', { username: displayUsername }),
    [displayUsername, t],
  );

  const showStatsLocked = totalRecipesCount < 3;
  const shareButtonPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showStatsLocked) {
      shareButtonPulse.stopAnimation();
      shareButtonPulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shareButtonPulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(shareButtonPulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [shareButtonPulse, showStatsLocked]);

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
        </View>
        <View style={styles.usernameContainer}>
          <Text style={[styles.name, { color: colors.text }]}>@{displayUsername}</Text>
      {isPremium && (
          <View style={styles.premiumBadgeInline}>
            <Star size={13} color={colors.primary} fill={colors.primary} />
          </View>
        )}
        </View>
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
                  {t('profile.premium.upgrade')}
                </Text>
                <Text style={[styles.premiumSubtitle, { color: colors.icon }]}>
                  {t('profile.premium.unlockFeatures')}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.icon} />
            </View>
          </TouchableOpacity>
        )}

        {/* Répartition plateformes */}
        <View style={styles.platformCard}>
          <View style={styles.platformHeader}>
            <Text style={[styles.platformTitle, { color: colors.text }]}>
              {t('profile.platformStats.title')}
            </Text>
            <View style={styles.shareButtonWrapper}>
              <TouchableOpacity
                onPress={() => setShowShareTemplate(true)}
                style={[
                  styles.shareButton,
                  { borderColor: colors.border, opacity: showStatsLocked ? 0.4 : 1 },
                ]}
                activeOpacity={0.8}
                disabled={showStatsLocked}
              >
                <Feather name="share-2" size={16} color={colors.text} />
                <Text style={[styles.shareButtonLabel, { color: colors.text }]}>
                  {t('profile.platformStats.shareAction')}
                </Text>
              </TouchableOpacity>
              {!showStatsLocked && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.shareButtonShimmer,
                    {
                      transform: [
                        {
                          translateX: shareButtonPulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-120, 120],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}
            </View>
          </View>
          <View style={styles.platformContent}>
            {isLoadingStats ? (
              <View style={styles.statsLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.statsLoadingText, { color: colors.icon }]}>
                  {t('profile.platformStats.loading')}
                </Text>
              </View>
            ) : (
              <>
                <PlatformDonut
                  stats={platformStats.map(({ id, value, color }) => ({ id, value, color }))}
                  totalLabel={t('profile.platformStats.total')}
                  trackColor={colors.border}
                  valueColor={colors.text}
                  labelColor={colors.icon}
                />
                <View style={styles.platformLegend}>
                  {platformStats.length === 0 ? (
                    <Text style={[styles.platformLegendEmpty, { color: colors.icon }]}>
                      {t('profile.platformStats.empty')}
                    </Text>
                  ) : (
                    platformStats.map((item) => (
                      <View key={item.id} style={styles.platformLegendRow}>
                        {renderPlatformIcon(item.id, item.color)}
                        <Text style={[styles.platformLegendLabel, { color: colors.text }]}>
                          {item.label}
                        </Text>
                        <Text style={[styles.platformLegendValue, { color: colors.icon }]}>
                          {statsFormatter.format(item.value)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </View>
          {showStatsLocked && (
            <BlurView
              intensity={40}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={styles.statsLockedOverlay}
            >
              <Text style={[styles.statsLockedText, { color: colors.text }]}>
                {t('profile.platformStats.unavailable')}
              </Text>
            </BlurView>
          )}
        </View>

        {/* Section Amis */}
        <FriendsListCard
          onSeeAll={() => setShowFriendsSheet(true)}
          onAddFriend={() => setShowAddFriendSheet(true)}
        />

        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.icon }]}>
            {t('profile.footer.version', { version: '1.0.0' })}
          </Text>
          <Text style={[styles.tagline, { color: colors.icon }]}>
            {t('profile.footer.tagline')}
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
      <ProfileShareTemplate
        visible={showShareTemplate}
        onClose={() => setShowShareTemplate(false)}
        avatarUrl={avatarUrl}
        username={displayUsername}
        platformStats={platformStats}
        totalRecipes={totalRecipesCount}
        profileTypeLabel={profileType ? getProfileTypeLabel(profileType) : null}
        profileTypeValue={profileType ?? null}
        dietTags={dietTags}
        favoriteCuisine={favoriteCuisine}
        totalCookingTime={totalCookingTime}
        colors={colors}
        t={t}
        shareMessage={shareMessage}
      />
    </ScrollView>
  );
}

// Logos des plateformes
const PLATFORM_LOGOS: Record<string, any> = {
  tiktok: require('@/assets/logo/Tiktoklogo.jpg'),
  instagram: require('@/assets/logo/InstagramLogo.png'),
  youtube: require('@/assets/logo/YoutubeLogo.png'),
};

function renderPlatformIcon(id: string, color: string) {
  // Utiliser les vrais logos si disponibles
  if (PLATFORM_LOGOS[id]) {
    return (
      <ExpoImage
        source={PLATFORM_LOGOS[id]}
        style={styles.platformLogoIcon}
        contentFit="contain"
      />
    );
  }

  // Fallback pour "autres" ou plateformes non répertoriées
  return <MoreHorizontal size={16} color={color} style={styles.platformLegendIcon} />;
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
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
  },
  premiumBadgeInline: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
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
  platformCard: {
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  platformTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  platformContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  shareButton: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  shareButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  shareButtonWrapper: {
    position: 'relative',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  shareButtonShimmer: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    width: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.13)',
    borderRadius: BorderRadius.full,
    shadowColor: '#ef4444',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  platformLegend: {
    flex: 1,
    gap: Spacing.sm,
  },
  platformLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  platformLegendIcon: {
    marginRight: Spacing.xs,
  },
  platformLogoIcon: {
    width: 20,
    height: 20,
    marginRight: Spacing.xs,
    borderRadius: 4,
  },
  platformLegendLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  platformLegendValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsLockedOverlay: {
    position: 'absolute',
    left: -15,
    right: -15,
    bottom: Spacing.xs,
    top: Spacing.lg * 1.9,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.xs,
    overflow: 'hidden',
  },
  statsLockedText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  platformLegendEmpty: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  statsLoadingText: {
    fontSize: 14,
    fontWeight: '500',
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
