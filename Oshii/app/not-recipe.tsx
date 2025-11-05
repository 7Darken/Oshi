/**
 * Écran NOT_RECIPE
 * Affiche un message quand le contenu TikTok n'est pas une recette
 * Design minimaliste et moderne avec les couleurs de l'app
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, X } from 'lucide-react-native';
import { Colors, OshiiColors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotRecipeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleClose = () => {
    console.log('🔙 [NotRecipe] Retour à la home screen');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]} edges={['top', 'bottom']}>
      {/* Bouton fermer en haut à droite */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <X size={24} color={isDark ? Colors.dark.text : Colors.light.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Contenu centré */}
      <View style={styles.content}>
        {/* Icône exclamation */}
        <View style={[styles.iconContainer, { backgroundColor: `${OshiiColors.primary}15` }]}>
          <AlertCircle size={64} color={OshiiColors.primary} strokeWidth={2} />
        </View>

        {/* Titre */}
        <Text style={[styles.title, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
          Aucune recette détectée
        </Text>

        {/* Message */}
        <Text style={[styles.message, { color: isDark ? Colors.dark.icon : Colors.light.icon }]}>
          Oshii n&apos;a pas pu extraire de recette de cette vidéo.{'\n'}
          Essayez avec une vidéo de cuisine.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});

