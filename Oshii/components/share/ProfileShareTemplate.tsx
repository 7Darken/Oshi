import { OshiiLogo } from '@/components/ui/OshiiLogo';
import { ProfileTypeIcon } from '@/components/ui/ProfileTypeIcon';
import { CUISINE_ORIGINS, DIET_TYPES_CONFIG } from '@/constants/recipeCategories';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef } from 'react';
import {
  Dimensions,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const TEMPLATE_PADDING = Spacing.lg;
const GRID_GAP = Spacing.md;
const MAX_TEMPLATE_HEIGHT = Math.min(screenHeight - Spacing.xl * 2, 780);
let TEMPLATE_HEIGHT = MAX_TEMPLATE_HEIGHT;
let TEMPLATE_WIDTH = (TEMPLATE_HEIGHT * 9) / 16;

const MAX_TEMPLATE_WIDTH = screenWidth - Spacing.xl * 2;
if (TEMPLATE_WIDTH > MAX_TEMPLATE_WIDTH) {
  TEMPLATE_WIDTH = MAX_TEMPLATE_WIDTH;
  TEMPLATE_HEIGHT = (TEMPLATE_WIDTH * 16) / 9;
}

const PREVIEW_WIDTH = Math.min(screenWidth - Spacing.lg * 2, TEMPLATE_WIDTH * 0.9);
const PREVIEW_SCALE = PREVIEW_WIDTH / TEMPLATE_WIDTH;
const PREVIEW_HEIGHT = TEMPLATE_HEIGHT * PREVIEW_SCALE;
const CARD_WIDTH = (TEMPLATE_WIDTH - TEMPLATE_PADDING * 2 - GRID_GAP) / 2;

type ProfileTypeKey = 'survivaliste' | 'cuisinier' | 'sportif';

interface ProfileShareTemplateProps {
  visible: boolean;
  onClose: () => void;
  avatarUrl: string | null;
  username: string;
  platformStats: { id: string; label: string; value: number; color: string }[];
  totalRecipes: number;
  profileTypeLabel?: string | null;
  profileTypeValue?: ProfileTypeKey | null;
  dietTags?: string[];
  favoriteCuisine?: string | null;
  totalCookingTime?: string | null;
  colors: {
    text: string;
    icon: string;
    border: string;
    background: string;
    primary: string;
    card: string;
  };
  t: (key: string, options?: Record<string, any>) => string;
  shareMessage: string;
}

type PlatformRow = {
  id: string;
  label: string;
  value: number;
  color: string;
  percentage: number;
};

interface TemplateContentProps {
  avatarUrl: string | null;
  username: string;
  colors: {
    text: string;
    icon: string;
    border: string;
    background: string;
    primary: string;
    card: string;
  };
  t: (key: string, options?: Record<string, any>) => string;
  totalRecipes: number;
  profileTypeLabel?: string | null;
  profileTypeValue?: ProfileTypeKey | null;
  platformRows: PlatformRow[];
  dietTags: string[];
  favoriteCuisine: string | null;
  totalCookingTime: string | null;
  shareMessage: string;
}

export function ProfileShareTemplate({
  visible,
  onClose,
  avatarUrl,
  username,
  platformStats,
  totalRecipes,
  profileTypeLabel,
  profileTypeValue,
  dietTags = [],
  favoriteCuisine,
  totalCookingTime,
  colors,
  t,
  shareMessage,
}: ProfileShareTemplateProps) {
  const viewShotRef = useRef<ViewShot>(null);

  const shareContent = useCallback(async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();

      if (uri) {
        await Share.share({
          url: uri,
          message: shareMessage,
        });
      } else {
        await Share.share({
          message: shareMessage,
        });
      }
    } catch (error) {
      console.warn('[ProfileShareTemplate] capture failed, fallback share', error);
      await Share.share({
        message: shareMessage,
      });
    } finally {
      onClose();
    }
  }, [onClose, shareMessage]);

  const total = platformStats.reduce((acc, item) => acc + item.value, 0);
  const platformRows = useMemo<PlatformRow[]>(
    () =>
      platformStats.map((item) => ({
        ...item,
        percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
      })),
    [platformStats, total],
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Hidden full-size template for capture */}
          <View style={styles.hiddenCapture}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 0.92 }}
              style={{ width: TEMPLATE_WIDTH, height: TEMPLATE_HEIGHT }}
            >
              <TemplateContent
                avatarUrl={avatarUrl}
                username={username}
                colors={colors}
                t={t}
                totalRecipes={totalRecipes}
                profileTypeLabel={profileTypeLabel}
                profileTypeValue={profileTypeValue}
                platformRows={platformRows}
                dietTags={dietTags}
                favoriteCuisine={favoriteCuisine ?? null}
                totalCookingTime={totalCookingTime ?? null}
                shareMessage={shareMessage}
              />
            </ViewShot>
          </View>

          {/* Preview scaled down */}
          <View style={[styles.previewWrapper, { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }]}>
            <View
              style={{ width: TEMPLATE_WIDTH, height: TEMPLATE_HEIGHT, transform: [{ scale: PREVIEW_SCALE }] }}
            >
              <TemplateContent
                avatarUrl={avatarUrl}
                username={username}
                colors={colors}
                t={t}
                totalRecipes={totalRecipes}
                profileTypeLabel={profileTypeLabel}
                profileTypeValue={profileTypeValue}
                platformRows={platformRows}
                dietTags={dietTags}
                favoriteCuisine={favoriteCuisine ?? null}
                totalCookingTime={totalCookingTime ?? null}
                shareMessage={shareMessage}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={shareContent}
          >
            <Feather name='share-2' size={18} color='#FFFFFF' />
            <Text style={styles.shareButtonText}>{t('profile.platformStats.shareAction')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const PLATFORM_LOGOS: Record<string, any> = {
  tiktok: require('@/assets/logo/Tiktoklogo.jpg'),
  instagram: require('@/assets/logo/InstagramLogo.png'),
  youtube: require('@/assets/logo/YoutubeLogo.png'),
};

// Map pour les icônes de diet avec support FR et EN
const dietIconMap = new Map();
DIET_TYPES_CONFIG.forEach((diet) => {
  dietIconMap.set(diet.value.toLowerCase(), diet.icon);
  dietIconMap.set(diet.value_en.toLowerCase(), diet.icon);
});

const cuisineFlagMap = new Map(
  CUISINE_ORIGINS.map((cuisine) => [cuisine.value.toLowerCase(), cuisine.flag]),
);

// Fonction pour traduire un diet type en fonction de la langue
const translateDietType = (diet: string, language: string): string => {
  const normalizedDiet = diet.toLowerCase().trim();

  // Chercher dans DIET_TYPES_CONFIG
  const dietConfig = DIET_TYPES_CONFIG.find(
    (d) => d.value.toLowerCase() === normalizedDiet || d.value_en.toLowerCase() === normalizedDiet
  );

  if (dietConfig) {
    return language === 'en' ? dietConfig.label_en : dietConfig.label;
  }

  // Si pas trouvé, retourner tel quel avec capitalisation
  return diet.charAt(0).toUpperCase() + diet.slice(1);
};

const TemplateContent: React.FC<TemplateContentProps> = ({
  avatarUrl,
  username,
  colors,
  t,
  totalRecipes,
  profileTypeLabel,
  profileTypeValue,
  platformRows,
  dietTags,
  favoriteCuisine,
  totalCookingTime,
  shareMessage,
}) => {
  const { language } = useI18n();

  const cuisineFlag = favoriteCuisine
    ? cuisineFlagMap.get(favoriteCuisine.toLowerCase())
    : undefined;

  // Traduire les diet tags en fonction de la langue
  const translatedDietTags = useMemo(
    () => dietTags.map((diet) => translateDietType(diet, language)),
    [dietTags, language]
  );

  return (
    <View style={[styles.template, { backgroundColor: colors.background, borderColor: colors.border }]}>
      {/* Halo de lumière */}
      <LinearGradient
        colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.08)', 'rgba(21,23,24,0)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0.05 }}
        end={{ x: 0.5, y: 0.95 }}
        style={styles.haloGlow}
        pointerEvents="none"
      />
      <View style={styles.templateHeader}>
        <View style={styles.templateAvatarWrapper}>
          {avatarUrl ? (
            <ExpoImage source={{ uri: avatarUrl }} style={styles.templateAvatar} contentFit='cover' />
          ) : (
            <View style={[styles.templateAvatarFallback, { backgroundColor: colors.primary }]}>
              <User size={32} color='#FFFFFF' />
            </View>
          )}
        </View>
        <View style={styles.templateHeaderText}>
          <Text style={[styles.templateUsername, { color: colors.text }]}>@{username}</Text>
          {profileTypeLabel && (
            <View
              style={[
                styles.profileTypePill,
                { borderColor: colors.border, backgroundColor: `${colors.card}33` },
              ]}
            >
              {profileTypeValue && (
                <ProfileTypeIcon profileType={profileTypeValue} size={18} style={styles.profileTypeIcon} />
              )}
              <Text style={[styles.profileTypeText, { color: colors.text }]}>{profileTypeLabel}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.metricsGrid}>
        <View style={[styles.gridCard, styles.statsCard, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]} numberOfLines={1}>
            {t('profile.platformStats.recipesTitle')}
          </Text>
          <View style={styles.statHeadline}>
            <Text style={[styles.metricValue, { color: colors.text }]}>{totalRecipes}</Text>
            <Text style={[styles.metricSubtitle, { color: colors.icon }]}>
              {t('profile.platformStats.recipesSubtitle')}
            </Text>
          </View>
          <View style={styles.platformBars}>
            {platformRows.length === 0 ? (
              <Text style={[styles.templateLegendEmpty, { color: colors.icon }]}>
                {t('profile.platformStats.empty')}
              </Text>
            ) : (
              platformRows.map((item: PlatformRow) => (
                <View key={`progress-${item.id}`} style={styles.platformBarRow}>
                  {renderLegendIcon(item.id, item.color)}
                  <View style={styles.platformBarTrackWrapper}>
                    <View style={[styles.platformBarTrack, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.platformBarFill,
                          { backgroundColor: item.color, width: `${Math.max(item.percentage, 6)}%` },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.platformBarValue, { color: colors.text }]}>{item.value}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={[styles.gridCard, styles.dietCard, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]} numberOfLines={1}>
            {t('profile.platformStats.dietsTitle')}
          </Text>
          <View style={styles.dietTagsWrapper}>
            {translatedDietTags.length === 0 ? (
              <Text style={[styles.templateLegendEmpty, { color: colors.icon }]}>
                {t('profile.platformStats.noDiets')}
              </Text>
            ) : (
              translatedDietTags.map((diet: string, index: number) => {
                // Utiliser le diet original pour l'icône
                const originalDiet = dietTags[index];
                return (
                  <View key={`${diet}-${index}`} style={[styles.dietTag, { borderColor: colors.border }]}>
                    {dietIconMap.has(originalDiet.toLowerCase()) && (
                      <ExpoImage source={dietIconMap.get(originalDiet.toLowerCase())!} style={styles.dietTagIcon} />
                    )}
                    <Text style={[styles.dietTagText, { color: colors.text }]} numberOfLines={1}>
                      {diet}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={[styles.gridCard, styles.infoCard, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]} numberOfLines={1}>
            {t('profile.platformStats.favoriteCuisine')}
          </Text>
          <View style={styles.infoRowContent}>
            {cuisineFlag ? (
              <ExpoImage source={{ uri: cuisineFlag }} style={styles.cuisineFlagIcon} contentFit='cover' />
            ) : (
              <FontAwesome5 name='flag' size={16} color={colors.primary} />
            )}
            <Text style={[styles.secondaryValue, { color: colors.text }]}>{favoriteCuisine ?? '—'}</Text>
          </View>
        </View>

        <View style={[styles.gridCard, styles.infoCard, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]} numberOfLines={1}>
            {t('profile.platformStats.totalCookingTime')}
          </Text>
          <View style={styles.infoRowContent}>
            <FontAwesome5 name='clock' size={16} color={colors.primary} />
            <Text style={[styles.secondaryValue, { color: colors.text }]}>{totalCookingTime ?? '—'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.templateFooter}>
        <View style={styles.footerLogo}>
          <OshiiLogo size='md' style={styles.footerLogoImage} />
          <Text style={[styles.footerTitle, { color: colors.text }]}>Oshii</Text>
        </View>
        <Text style={[styles.footerSubtitle, { color: colors.icon }]} numberOfLines={2}>
          {shareMessage}
        </Text>
      </View>
    </View>
  );
};

function renderLegendIcon(id: string, color: string) {
  if (PLATFORM_LOGOS[id]) {
    return (
      <ExpoImage
        source={PLATFORM_LOGOS[id]}
        style={styles.platformLogoIcon}
        contentFit='contain'
      />
    );
  }

  switch (id) {
    case 'tiktok':
      return <FontAwesome5 name='tiktok' size={16} color={color} style={styles.legendIcon} />;
    case 'instagram':
      return <FontAwesome5 name='instagram' size={16} color={color} style={styles.legendIcon} />;
    case 'youtube':
      return <FontAwesome5 name='youtube' size={16} color={color} style={styles.legendIcon} />;
    default:
      return <FontAwesome5 name='globe' size={16} color={color} style={styles.legendIcon} />;
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl +40,
    alignItems: 'center',
    gap: Spacing.md,
  },
  hiddenCapture: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    zIndex: -1,
    pointerEvents: 'none',
  },
  previewWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: BorderRadius.lg,
  },
  template: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: TEMPLATE_PADDING,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  haloGlow: {
    position: 'absolute',
    width: TEMPLATE_WIDTH * 1.3,
    height: TEMPLATE_WIDTH * 1.3,
    top: -TEMPLATE_WIDTH * 0.5,
    alignSelf: 'center',
    borderRadius: TEMPLATE_WIDTH * 1.3,
    opacity: 0.6,
    transform: [{ rotate: '-8deg' }],
  },
  templateHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  templateAvatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  templateAvatar: {
    width: '100%',
    height: '100%',
  },
  templateAvatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateHeaderText: {
    alignItems: 'center',
    gap: 6,
  },
  templateUsername: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  templateSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  profileTypePill: {
    alignSelf: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  profileTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileTypeIcon: {
    width: 18,
    height: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  gridCard: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    minHeight: 120,
    marginBottom: GRID_GAP,
  },
  statsCard: {
    minHeight: 150,
  },
  dietCard: {
    minHeight: 150,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statHeadline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  metricValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  metricSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  platformBars: {
    gap: Spacing.sm,

  },
  platformBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  platformBarTrackWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  platformBarValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  platformBarTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  platformBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  dietTagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dietTag: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dietTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dietTagIcon: {
    width: 16,
    height: 16,
  },
  infoCard: {
    minHeight: 110,
  },
  infoRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cuisineFlagIcon: {
    width: 20,
    height: 14,
    borderRadius: 3,
  },
  templateLegend: {
    width: '100%',
    gap: Spacing.sm,
  },
  templateLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendIcon: {
    width: 20,
  },
  platformLogoIcon: {
    width: 18,
    height: 18,
    borderRadius: BorderRadius.sm,
  },
  templateLegendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  templateLegendValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  templateLegendEmpty: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  templateFooter: {
    marginTop: -Spacing.xl ,
    gap: 4,
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  footerSubtitle: {
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 16,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerLogoImage: {
    width: 36,
    height: 36,
  },
  secondaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

