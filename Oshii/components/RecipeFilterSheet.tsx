import {
  DIET_TYPES_CONFIG,
  DietType,
  MEAL_TYPES_CONFIG,
  MealType,
} from '@/constants/recipeCategories';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image as ExpoImage } from 'expo-image';
import { X } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  ImageSourcePropType,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface RecipeFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  onToggleMealType: (value: MealType) => void;
  onToggleDietType: (value: DietType) => void;
  selectedMealTypes: MealType[];
  selectedDietTypes: DietType[];
}

export function RecipeFilterSheet({
  visible,
  onClose,
  onApply,
  onReset,
  onToggleMealType,
  onToggleDietType,
  selectedMealTypes,
  selectedDietTypes,
}: RecipeFilterSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const shadowColor = colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.12)';

  const totalSelectedFilters = selectedMealTypes.length + selectedDietTypes.length;

  const renderFilterOption = useCallback(
    (label: string, icon: ImageSourcePropType | undefined, isActive: boolean, onPress: () => void, key?: string) => (
      <TouchableOpacity
        key={key ?? label}
        style={[
          styles.filterOption,
          {
            backgroundColor: isActive
              ? (colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')
              : colors.card,
            borderColor: isActive ? colors.primary : colors.border,
            borderWidth: isActive ? 1.5 : 1,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon && (
          <ExpoImage
            source={icon}
            style={styles.filterIcon}
            contentFit="contain"
          />
        )}
        <Text
          style={[
            styles.filterOptionText,
            {
              color: colors.text,
              fontWeight: isActive ? '600' : '500',
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    ),
    [colors.primary, colors.card, colors.border, colors.text, colorScheme],
  );

  const renderMealTypeCard = useCallback(
    (label: string, icon: ImageSourcePropType | undefined, isActive: boolean, onPress: () => void, key?: string) => (
      <TouchableOpacity
        key={key ?? label}
        style={[
          styles.mealTypeCard,
          {
            backgroundColor: isActive
              ? (colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')
              : colors.card,
            borderColor: isActive ? colors.primary : colors.border,
            borderWidth: isActive ? 1.5 : 1,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon && (
          <ExpoImage
            source={icon}
            style={styles.mealTypeIcon}
            contentFit="contain"
          />
        )}
        <Text
          style={[
            styles.mealTypeText,
            {
              color: colors.text,
              fontWeight: isActive ? '600' : '500',
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    ),
    [colors.primary, colors.card, colors.border, colors.text, colorScheme],
  );

  const renderSection = useCallback(
    (
      title: string,
      selectedCount: number,
      children: React.ReactNode,
    ) => (
      <View key={title} style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          {selectedCount > 0 && (
            <View style={[styles.sectionBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.sectionBadgeText, { color: '#FFFFFF' }]}>
                {selectedCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.tagsGrid}>{children}</View>
      </View>
    ),
    [colors.icon, colors.primary, colors.text],
  );

  return (
    <Modal
      transparent={false}
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Pill drag indicator */}
        <View style={styles.pillContainer}>
          <View style={[styles.pill, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>
              Filtres
            </Text>
            {totalSelectedFilters > 0 && (
              <View style={[styles.filterCountBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterCountText}>{totalSelectedFilters}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.card }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Type de repas</Text>
              {selectedMealTypes.length > 0 && (
                <View style={[styles.sectionBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.sectionBadgeText, { color: '#FFFFFF' }]}>
                    {selectedMealTypes.length}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.mealTypesGrid}>
              {MEAL_TYPES_CONFIG.map((option) =>
                renderMealTypeCard(
                  option.label,
                  option.icon,
                  selectedMealTypes.includes(option.value),
                  () => onToggleMealType(option.value),
                  `meal-${option.value}`,
                ),
              )}
            </View>
          </View>

          {renderSection(
            'Type de régime',
            selectedDietTypes.length,
            DIET_TYPES_CONFIG.map((option) =>
              renderFilterOption(
                option.label,
                option.icon,
                selectedDietTypes.includes(option.value),
                () => onToggleDietType(option.value),
                `diet-${option.value}`,
              ),
            ),
          )}
        </ScrollView>

        <View
          style={[styles.actions, { backgroundColor: colors.background, borderTopColor: colors.border }]}
        >
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: colors.card },
            ]}
            onPress={onReset}
            activeOpacity={0.7}
            disabled={totalSelectedFilters === 0}
          >
            <Text style={[
              styles.secondaryButtonText,
              { color: totalSelectedFilters === 0 ? colors.icon : colors.text }
            ]}>
              Réinitialiser
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={onApply}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>
              {totalSelectedFilters > 0
                ? `Afficher les résultats (${totalSelectedFilters})`
                : 'Afficher tout'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pillContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  pill: {
    width: 36,
    height: 5,
    borderRadius: BorderRadius.full,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  filterCountBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  filterCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl + Spacing.lg,
    gap: Spacing.xl,
  },
  sectionCard: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md + 2,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    minHeight: 40,
    gap: Spacing.xs,
  },
  filterIcon: {
    width: 20,
    height: 20,
  },
  filterOptionText: {
    fontSize: 14,
  },
  mealTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  mealTypeCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  mealTypeIcon: {
    width: 40,
    height: 40,
  },
  mealTypeText: {
    fontSize: 13,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
    borderTopWidth: 1,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

