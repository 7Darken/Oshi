import React, { useCallback } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  DIET_TYPES,
  MEAL_TYPES,
  DietType,
  MealType,
} from '@/constants/recipeCategories';

const formatLabel = (value: string) =>
  value
    .split(' ')
    .map((segment) =>
      segment
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-'),
    )
    .join(' ');

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

  const renderFilterOption = useCallback(
    (label: string, isActive: boolean, onPress: () => void, key?: string) => (
      <TouchableOpacity
        key={key ?? label}
        style={[
          styles.filterOption,
          {
            backgroundColor: colors.card,
            borderColor: isActive ? colors.primary : colors.border,
            shadowColor,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.filterOptionText,
            { color: isActive ? colors.primary : colors.text },
          ]}
        >
          {formatLabel(label)}
        </Text>
      </TouchableOpacity>
    ),
    [colors.primary, colors.card, colors.border, colors.text, shadowColor],
  );

  const renderSection = useCallback(
    (
      title: string,
      selectedCount: number,
      description: string,
      children: React.ReactNode,
    ) => (
      <View
        key={title}
        style={[
          styles.sectionCard,
          { backgroundColor: colors.card, borderColor: colors.border, shadowColor },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          {selectedCount > 0 && (
            <View style={[styles.sectionBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.sectionBadgeText, { color: colors.background }]}>
                {selectedCount}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.sectionDescription, { color: colors.icon }]}>{description}</Text>
        <View style={styles.tagsGrid}>{children}</View>
      </View>
    ),
    [colors.card, colors.border, colors.icon, colors.primary, colors.text, colors.background, shadowColor],
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}> 
            Filtres de recette
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderSection(
            'Type de repas',
            selectedMealTypes.length,
            'Filtrez par moment de dégustation ou format du plat.',
            MEAL_TYPES.map((option) =>
              renderFilterOption(
                option,
                selectedMealTypes.includes(option),
                () => onToggleMealType(option),
                `meal-${option}`,
              ),
            ),
          )}

          {renderSection(
            'Type de régime',
            selectedDietTypes.length,
            'Combinez plusieurs régimes compatibles pour affiner vos résultats.',
            DIET_TYPES.map((option) =>
              renderFilterOption(
                option,
                selectedDietTypes.includes(option),
                () => onToggleDietType(option),
                `diet-${option}`,
              ),
            ),
          )}
        </ScrollView>

        <View
          style={[styles.actions, { borderTopColor: colors.border }]}
        >
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
            onPress={onReset}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Réinitialiser
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={onApply}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { color: colors.background }]}>
              Appliquer
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 44,
    gap: Spacing.md,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  primaryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

