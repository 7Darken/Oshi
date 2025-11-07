import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ShoppingCart, Sparkles } from 'lucide-react-native';

import { CustomTabBar } from '@/components/CustomTabBar';
import { AnalyzeSheet } from '@/components/AnalyzeSheet';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRecipes } from '@/hooks/useRecipes';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { useFoodItemsStore } from '@/stores/useFoodItemsStore';
import { useNetworkContext } from '@/contexts/NetworkContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { recipes } = useRecipes();
  const hasRecipes = recipes.length > 0;
  const { openAnalyzeSheet, showAnalyzeSheet, closeAnalyzeSheet, clearRecipe } = useRecipeStore();
  const { loadFoodItems } = useFoodItemsStore();
  const { isOffline } = useNetworkContext();
  const hasAttemptedFoodItems = useRef(false);

  // Charger les food_items au démarrage des tabs
  useEffect(() => {
    if (isOffline || hasAttemptedFoodItems.current) {
      return;
    }

    hasAttemptedFoodItems.current = true;
    loadFoodItems();
  }, [loadFoodItems, isOffline]);

  useEffect(() => {
    if (!isOffline && !hasAttemptedFoodItems.current) {
      hasAttemptedFoodItems.current = true;
      loadFoodItems();
    }
  }, [isOffline, loadFoodItems]);

  // Handler pour ouvrir l'AnalyzeSheet avec retour haptique
  const handleOpenAnalyzeSheet = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    openAnalyzeSheet();
  }, [openAnalyzeSheet]);

  // Handler pour analyser un TikTok (accessible depuis tous les onglets)
  const handleAnalyze = useCallback(async (url: string) => {
    clearRecipe();
    const encodedUrl = encodeURIComponent(url);
    closeAnalyzeSheet();
    router.push(`/analyze?url=${encodedUrl}` as any);
  }, [router, clearRecipe, closeAnalyzeSheet]);

  return (
    <>
      <Tabs
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            hasRecipes={hasRecipes}
            onAddRecipe={handleOpenAnalyzeSheet}
          />
        )}
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Rechercher',
            tabBarIcon: ({ color }) => <Sparkles size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="shopping"
          options={{
            title: 'Courses',
            tabBarIcon: ({ color }) => <ShoppingCart size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          }}
        />
      </Tabs>

      {/* Page Sheet - Analyser une vidéo (accessible depuis tous les onglets) */}
      <AnalyzeSheet
        visible={showAnalyzeSheet}
        onClose={closeAnalyzeSheet}
        onAnalyze={handleAnalyze}
      />
    </>
  );
}
