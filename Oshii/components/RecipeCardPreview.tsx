/**
 * RecipeCardPreview
 * Affiche une carte partageable de recette au format exportable
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FullRecipe } from '@/types/recipe';
import { OshiiLogo } from '@/components/ui/OshiiLogo';

export type PreviewIngredient = {
  name: string;
  quantity?: string | null;
  unit?: string | null;
};

export type PreviewMacros = {
  proteins: number;
  carbs: number;
  fats: number;
  proteinPercent: number;
  carbPercent: number;
  fatPercent: number;
};

interface RecipeCardPreviewProps {
  recipe: FullRecipe;
  ingredients: PreviewIngredient[];
  macros?: PreviewMacros | null;
  portions: number;
}

type RecipePreviewTheme = {
  canvasBg: string;
  cardBg: string;
  borderColor: string;
  divider: string;
  sectionSurface: string;
  sectionSubSurface: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  shadow: string;
  metaPillBg: string;
  metaPillLabel: string;
  metaPillValue: string;
  logoBadgeBg: string;
  logoBadgeText: string;
  tagBackground: string;
  tagBorder: string;
  tagIconBg: string;
  tagIconText: string;
  macroBgProteins: string;
  macroBgCarbs: string;
  macroBgFats: string;
  footerBadgeBg: string;
  footerBadgeText: string;
};

export function RecipeCardPreview({
  recipe,
  ingredients,
  macros,
  portions,
}: RecipeCardPreviewProps) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  const theme = useMemo<RecipePreviewTheme>(() => {
    const isDark = colorScheme === 'dark';

    return {
      canvasBg: palette.background,
      cardBg: palette.card,
      borderColor: palette.border,
      divider: palette.border,
      sectionSurface: isDark ? palette.card : '#F9FAFB',
      sectionSubSurface: isDark ? palette.card : '#F3F4F6',
      textPrimary: palette.text,
      textSecondary: palette.icon,
      primary: palette.primary,
      shadow: isDark ? 'rgba(0, 0, 0, 0.48)' : 'rgba(15, 23, 42, 0.16)',
      metaPillBg: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.08)',
      metaPillLabel: isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 23, 42, 0.6)',
      metaPillValue: isDark ? '#FFFFFF' : palette.text,
      logoBadgeBg: isDark ? 'rgba(249, 64, 60, 0.18)' : 'rgba(249, 64, 60, 0.08)',
      logoBadgeText: isDark ? '#FFECEA' : palette.primary,
      tagBackground: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
      tagBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
      tagIconBg: isDark ? 'rgba(249, 64, 60, 0.24)' : 'rgba(249, 64, 60, 0.12)',
      tagIconText: isDark ? '#FFEDEA' : palette.primary,
      macroBgProteins: isDark ? 'rgba(76, 175, 80, 0.20)' : 'rgba(76, 175, 80, 0.12)',
      macroBgCarbs: isDark ? 'rgba(66, 165, 245, 0.20)' : 'rgba(66, 165, 245, 0.12)',
      macroBgFats: isDark ? 'rgba(255, 171, 64, 0.24)' : 'rgba(255, 171, 64, 0.16)',
      footerBadgeBg: isDark ? 'rgba(249, 64, 60, 0.24)' : 'rgba(249, 64, 60, 0.12)',
      footerBadgeText: '#FFFFFF',
    };
  }, [palette, colorScheme]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const displayedIngredients = ingredients.slice(0, 12);
  const extraIngredientsCount = Math.max(ingredients.length - displayedIngredients.length, 0);

  const sortedSteps = [...(recipe.steps ?? [])].sort((a, b) => a.order - b.order);
  const displayedSteps = sortedSteps.slice(0, 5);
  const extraStepsCount = Math.max(sortedSteps.length - displayedSteps.length, 0);

  const hasMacros = Boolean(macros);

  return (
    <View style={styles.canvas}>
      <View style={styles.card} collapsable={false}>
        {recipe.image_url ? (
          <View style={styles.coverContainer}>
            <ExpoImage
              source={{ uri: recipe.image_url }}
              style={styles.coverImage}
              contentFit="cover"
              transition={250}
            />
            <View style={styles.coverOverlay} />
            <View style={styles.coverContent}>
              <Text style={styles.coverTitle} numberOfLines={2}>
                {recipe.title}
              </Text>
              <View style={styles.metaPillRow}>
                {recipe.total_time && (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillLabel}>Temps</Text>
                    <Text style={styles.metaPillValue}>{recipe.total_time}</Text>
                  </View>
                )}
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillLabel}>Portions</Text>
                  <Text style={styles.metaPillValue}>{portions}</Text>
                </View>
                {recipe.calories && (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillLabel}>Calories</Text>
                    <Text style={styles.metaPillValue}>
                      {Math.round(
                        recipe.calories * (portions / (recipe.servings || portions))
                      )}{' '}
                      kcal
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.titleFallback}>
            <Text style={styles.fallbackTitle} numberOfLines={2}>
              {recipe.title}
            </Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Résumé</Text>
            <View style={styles.brandBadge}>
              <OshiiLogo size="sm" style={styles.brandLogo} />
            </View>
          </View>

          <View style={styles.metaGrid}>
            {recipe.total_time && (
              <View style={styles.metaItemCard}>
                <Text style={styles.metaCardLabel}>Temps total</Text>
                <Text style={styles.metaCardValue}>{recipe.total_time}</Text>
              </View>
            )}
            {recipe.servings && (
              <View style={styles.metaItemCard}>
                <Text style={styles.metaCardLabel}>Portions</Text>
                <Text style={styles.metaCardValue}>{portions}</Text>
              </View>
            )}
            {recipe.calories && (
              <View style={styles.metaItemCard}>
                <Text style={styles.metaCardLabel}>Calories</Text>
                <Text style={styles.metaCardValue}>
                  {Math.round(
                    recipe.calories * (portions / (recipe.servings || portions))
                  )}{' '}
                  kcal
                </Text>
              </View>
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionBlockHeader}>
              <Text style={styles.sectionBlockTitle}>Ingrédients essentiels</Text>
              <Text style={styles.sectionBlockSubtitle}>
                Top {displayedIngredients.length}
                {extraIngredientsCount > 0 ? ` (+${extraIngredientsCount})` : ''}
              </Text>
            </View>
            {displayedIngredients.length > 0 ? (
              <View style={styles.tagsContainer}>
                {displayedIngredients.map((ingredient, index) => {
                  const quantity = ingredient.quantity ? ingredient.quantity : '';
                  const unit = ingredient.unit ? ` ${ingredient.unit}` : '';
                  const badgeLetter = ingredient.name?.trim()?.charAt(0)?.toUpperCase() || '#';

                  return (
                    <View key={`${ingredient.name}-${index}`} style={styles.tag}>
                      <View style={styles.tagIcon}>
                        <Text style={styles.tagIconText}>{badgeLetter}</Text>
                      </View>
                      <Text style={styles.tagText} numberOfLines={1}>
                        {ingredient.name}
                        {quantity || unit ? ` · ${quantity}${unit}` : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>Ingrédients indisponibles</Text>
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionBlockHeader}>
              <Text style={styles.sectionBlockTitle}>Étapes clés</Text>
              <Text style={styles.sectionBlockSubtitle}>
                Top {displayedSteps.length}
                {extraStepsCount > 0 ? ` (+${extraStepsCount})` : ''}
              </Text>
            </View>
            {displayedSteps.length > 0 ? (
              <View style={styles.stepsContainer}>
                {displayedSteps.map((step, index) => (
                  <View key={`${step.id || index}`} style={styles.stepRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText} numberOfLines={2}>
                      {step.text}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Aucune étape renseignée</Text>
            )}
          </View>

          {hasMacros && macros && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionBlockHeader}>
                <Text style={styles.sectionBlockTitle}>
                  Macros (pour {portions} portion{portions > 1 ? 's' : ''})
                </Text>
              </View>
              <View style={styles.macrosRow}>
                <View style={[styles.macroItem, styles.macroItemProteins]}>
                  <Text style={styles.macroLabel}>Protéines</Text>
                  <Text style={styles.macroValue}>{Math.round(macros.proteins)} g</Text>
                </View>
                <View style={[styles.macroItem, styles.macroItemCarbs]}>
                  <Text style={styles.macroLabel}>Glucides</Text>
                  <Text style={styles.macroValue}>{Math.round(macros.carbs)} g</Text>
                </View>
                <View style={[styles.macroItem, styles.macroItemFats]}>
                  <Text style={styles.macroLabel}>Lipides</Text>
                  <Text style={styles.macroValue}>{Math.round(macros.fats)} g</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.footerBadge}>
              <OshiiLogo size="sm" />
            </View>
            <View>
              <Text style={styles.footerTitle}>Transformez vos vidéos en recettes</Text>
              <Text style={styles.footerSubtitle}>Partagez votre création culinaire</Text>
            </View>
          </View>
          {recipe.source_url && (
            <Text style={styles.footerLink} numberOfLines={1}>
              Source · {recipe.source_url.replace(/^https?:\/\//, '')}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: RecipePreviewTheme) =>
  StyleSheet.create({
    canvas: {
      width: '100%',
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      backgroundColor: theme.canvasBg,
    },
    card: {
      width: '100%',
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.18,
      shadowRadius: 48,
      elevation: 18,
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: theme.shadow,
      backgroundColor: theme.cardBg,
      borderColor: theme.borderColor,
    },
    coverContainer: {
      position: 'relative',
      height: 220,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderColor,
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    coverOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
    },
    coverContent: {
      position: 'absolute',
      bottom: Spacing.lg,
      left: Spacing.lg,
      right: Spacing.lg,
    },
    coverTitle: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '700',
      marginBottom: Spacing.sm,
    },
    metaPillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: Spacing.sm,
    },
    metaPill: {
      borderRadius: BorderRadius.full,
      paddingVertical: 4,
      paddingHorizontal: Spacing.md,
      marginRight: Spacing.sm,
      marginBottom: Spacing.sm,
      backgroundColor: theme.metaPillBg,
    },
    metaPillLabel: {
      fontSize: 11,
      color: theme.metaPillLabel,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    metaPillValue: {
      color: theme.metaPillValue,
      fontSize: 15,
      fontWeight: '600',
    },
    titleFallback: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xl,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderColor,
    },
    fallbackTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    body: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.divider,
      marginBottom: Spacing.lg,
    },
    sectionHeading: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    brandBadge: {
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderColor,
      backgroundColor: theme.logoBadgeBg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    brandBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.logoBadgeText,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    brandLogo: {
      width: 28,
      height: 28,
    },
    metaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: Spacing.lg,
    },
    metaItemCard: {
      flexBasis: '48%',
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      marginRight: Spacing.sm,
      marginBottom: Spacing.sm,
      borderColor: theme.borderColor,
      backgroundColor: theme.sectionSurface,
    },
    metaCardLabel: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: Spacing.xs,
      color: theme.textSecondary,
    },
    metaCardValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    sectionBlock: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      borderColor: theme.borderColor,
      backgroundColor: theme.sectionSurface,
    },
    sectionBlockHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    sectionBlockTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    sectionBlockSubtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    tagsContainer: {
      marginTop: Spacing.sm,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.tagBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.tagBorder,
      maxWidth: '100%',
      gap: Spacing.xs,
    },
    tagIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.tagIconBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagIconText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.tagIconText,
    },
    tagText: {
      flexShrink: 1,
      fontSize: 14,
      fontWeight: '500',
      color: theme.textPrimary,
    },
    emptyText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.textSecondary,
    },
    stepsContainer: {
      marginTop: Spacing.sm,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
      backgroundColor: theme.sectionSubSurface,
    },
    stepBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
      backgroundColor: theme.primary,
    },
    stepBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    stepText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: theme.textPrimary,
    },
    macrosRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    macroItem: {
      flex: 1,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      marginRight: Spacing.sm,
    },
    macroItemProteins: {
      backgroundColor: theme.macroBgProteins,
    },
    macroItemCarbs: {
      backgroundColor: theme.macroBgCarbs,
    },
    macroItemFats: {
      backgroundColor: theme.macroBgFats,
      marginRight: 0,
    },
    macroLabel: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: Spacing.xs,
      color: theme.textSecondary,
    },
    macroValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderColor,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    footerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    footerBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
      backgroundColor: theme.footerBadgeBg,
    },
    footerBadgeText: {
      color: theme.footerBadgeText,
      fontWeight: '700',
      fontSize: 16,
    },
    footerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    footerSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    footerLink: {
      fontSize: 12,
      maxWidth: 160,
      textAlign: 'right',
      color: theme.textSecondary,
    },
  });

export default RecipeCardPreview;
