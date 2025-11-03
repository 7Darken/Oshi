import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
            name="result" 
            options={{ 
              headerShown: false,
              title: 'Recette'
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
      </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
