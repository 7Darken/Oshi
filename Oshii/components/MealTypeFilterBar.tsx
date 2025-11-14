import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MEAL_TYPES_CONFIG, type MealType } from '@/constants/recipeCategories';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/useI18n';

interface MealTypeFilterBarProps {
  selectedMealTypes: MealType[];
  onToggleMealType: (value: MealType) => void;
}

export function MealTypeFilterBar({ selectedMealTypes, onToggleMealType }: MealTypeFilterBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDarkMode = (colorScheme ?? 'light') === 'dark';
  const { language } = useI18n();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MEAL_TYPES_CONFIG.map((option) => {
          const isActive = selectedMealTypes.includes(option.value);
          const displayLabel = language === 'en' && option.label_en ? option.label_en : option.label;

          const handlePress = () => {
            if (Platform.OS === 'ios') {
              void Haptics.selectionAsync();
            }
            onToggleMealType(option.value);
          };

          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.mealTypeCard,
                {
                  backgroundColor: isActive
                    ? (isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')
                    : colors.card,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderWidth: isActive ? 1.5 : 1,
                },
              ]}
              onPress={handlePress}
              activeOpacity={0.75}
            >
              {option.icon && (
                <ExpoImage
                  source={option.icon}
                  style={[styles.mealTypeIcon, isActive && styles.mealTypeIconActive]}
                  contentFit="contain"
                  transition={150}
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
                {displayLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {

    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  mealTypeCard: {
    width: 100,
    height: 90,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
    marginRight: Spacing.md,
  },
  mealTypeIcon: {
    width: 36,
    height: 36,
    marginBottom: Spacing.xs,
  },
  mealTypeIconActive: {
    transform: [{ rotate: '12deg' }],
  },
  mealTypeText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
