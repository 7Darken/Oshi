import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Plus } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HapticTab } from './haptic-tab';

interface CustomTabBarProps extends BottomTabBarProps {
  hasRecipes: boolean;
  onAddRecipe: () => void;
}

export function CustomTabBar({ state, descriptors, navigation, hasRecipes, onAddRecipe }: CustomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <React.Fragment key={route.key}>
            <HapticTab
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              {options.tabBarIcon?.({ focused: isFocused, color: isFocused ? colors.tint : colors.tabIconDefault, size: 28 })}
            </HapticTab>
            
            {/* Floating Add Button after first tab (index 0) */}
            {index === 0 && hasRecipes && (
              <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={onAddRecipe}
                activeOpacity={0.8}
              >
                <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 90,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

