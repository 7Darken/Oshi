import React, { useCallback, useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { useDeepLinking } from '@/hooks/useDeepLinking';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { OfflineBanner } from '@/components/OfflineBanner';

function RootNavigator() {
  const colorScheme = useColorScheme();
  
  // Gérer les deep links TikTok partagés
  const { alertState, closeAlert } = useDeepLinking();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <OfflineBanner />
      <Stack>
          <Stack.Screen 
            name="welcome" 
            options={{ 
              headerShown: false,
              title: 'Bienvenue'
            }} 
          />
          <Stack.Screen 
            name="login" 
            options={{ 
              headerShown: false,
              title: 'Connexion'
            }} 
          />
          <Stack.Screen 
            name="register" 
            options={{ 
              headerShown: false,
              title: 'Inscription'
            }} 
          />
          <Stack.Screen 
            name="onboarding" 
            options={{ 
              headerShown: false,
              title: 'Onboarding'
            }} 
          />
          <Stack.Screen 
            name="auth-callback" 
            options={{ 
              headerShown: false,
              title: 'Callback OAuth'
            }} 
          />
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: false,
              title: 'Accueil'
            }} 
          />
          <Stack.Screen 
            name="analyze" 
            options={{ 
              headerShown: false,
              title: 'Analyse'
            }} 
          />
          <Stack.Screen 
            name="not-recipe" 
            options={{ 
              headerShown: false,
              title: 'Aucune recette',
              presentation: 'card'
            }} 
          />
          <Stack.Screen 
            name="result" 
            options={{ 
              headerShown: false,
              title: 'Recette'
            }} 
          />
          <Stack.Screen 
            name="steps" 
            options={{ 
              headerShown: false,
              title: 'Étapes',
              presentation: 'fullScreenModal'
            }} 
          />
                <Stack.Screen
                  name="folder"
                  options={{
                    headerShown: false,
                    title: 'Dossier'
                  }}
                />
                <Stack.Screen
                  name="subscription"
                  options={{
                    headerShown: false,
                    title: 'Abonnement',
                    presentation: 'modal'
                  }}
                />
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal', 
              title: 'Modal' 
            }} 
          />
      </Stack>
      <StatusBar style="auto" />
      
      {/* Alert pour liens invalides */}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        onClose={closeAlert}
        type="error"
      />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [rootViewReady, setRootViewReady] = useState(false);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => {
      // Ignore errors (already hidden)
    });
  }, []);

  useEffect(() => {
    if (rootViewReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [rootViewReady]);

  const onLayoutRootView = useCallback(() => {
    setRootViewReady(true);
  }, []);

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <NetworkProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
});
