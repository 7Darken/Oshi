/**
 * Configuration i18next pour l'internationalisation de l'app
 * Détecte automatiquement la langue du système et fallback en anglais
 * Utilise la langue préférée stockée si définie par l'utilisateur
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import des traductions françaises
import frCommon from '@/locales/fr/common.json';
import frRecipe from '@/locales/fr/recipe.json';
import frAuth from '@/locales/fr/auth.json';
import frFolders from '@/locales/fr/folders.json';
import frSettings from '@/locales/fr/settings.json';
import frProfile from '@/locales/fr/profile.json';
import frTutorial from '@/locales/fr/tutorial.json';
import frSearch from '@/locales/fr/search.json';
import frShopping from '@/locales/fr/shopping.json';
import frOnboarding from '@/locales/fr/onboarding.json';
import frSubscription from '@/locales/fr/subscription.json';

// Import des traductions anglaises
import enCommon from '@/locales/en/common.json';
import enRecipe from '@/locales/en/recipe.json';
import enAuth from '@/locales/en/auth.json';
import enFolders from '@/locales/en/folders.json';
import enSettings from '@/locales/en/settings.json';
import enProfile from '@/locales/en/profile.json';
import enTutorial from '@/locales/en/tutorial.json';
import enSearch from '@/locales/en/search.json';
import enShopping from '@/locales/en/shopping.json';
import enOnboarding from '@/locales/en/onboarding.json';
import enSubscription from '@/locales/en/subscription.json';

// Ressources de traduction organisées par namespace
const resources = {
  fr: {
    common: frCommon,
    recipe: frRecipe,
    auth: frAuth,
    folders: frFolders,
    settings: frSettings,
    profile: frProfile,
    tutorial: frTutorial,
    search: frSearch,
    shopping: frShopping,
    onboarding: frOnboarding,
    subscription: frSubscription,
  },
  en: {
    common: enCommon,
    recipe: enRecipe,
    auth: enAuth,
    folders: enFolders,
    settings: enSettings,
    profile: enProfile,
    tutorial: enTutorial,
    search: enSearch,
    shopping: enShopping,
    onboarding: enOnboarding,
    subscription: enSubscription,
  },
};

// Langues supportées
export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Détecte la langue du système et retourne une langue supportée
 * Fallback : fr (français par défaut) puis en (anglais)
 */
export function getDeviceLanguage(): SupportedLanguage {
  const deviceLocales = Localization.getLocales();

  if (deviceLocales.length === 0) {
    console.log('📱 [i18n] Aucune locale détectée, utilisation du français par défaut');
    return 'fr';
  }

  // Récupérer le code langue (ex: "fr" depuis "fr-FR")
  const primaryLocale = deviceLocales[0];
  const languageCode = primaryLocale.languageCode || 'fr';

  console.log('📱 [i18n] Langue du système détectée:', languageCode);
  console.log('📱 [i18n] Locales complètes:', deviceLocales.map(l => l.languageTag).join(', '));

  // Vérifier si la langue est supportée
  if (SUPPORTED_LANGUAGES.includes(languageCode as SupportedLanguage)) {
    console.log('✅ [i18n] Langue supportée:', languageCode);
    return languageCode as SupportedLanguage;
  }

  // Fallback en anglais
  console.log('⚠️ [i18n] Langue non supportée, fallback en anglais');
  return 'en';
}

/**
 * Récupère la langue préférée depuis AsyncStorage (si définie par l'utilisateur)
 * Sinon utilise la détection automatique du système
 */
async function getInitialLanguage(): Promise<SupportedLanguage> {
  try {
    const storedLanguage = await AsyncStorage.getItem('language-storage');
    if (storedLanguage) {
      const parsed = JSON.parse(storedLanguage);
      const preferredLanguage = parsed?.state?.preferredLanguage;

      if (preferredLanguage && SUPPORTED_LANGUAGES.includes(preferredLanguage)) {
        console.log('💾 [i18n] Langue préférée stockée:', preferredLanguage);
        return preferredLanguage;
      }
    }
  } catch (error) {
    console.error('❌ [i18n] Erreur lors de la lecture de la langue stockée:', error);
  }

  // Si pas de langue stockée, utiliser la détection auto
  return getDeviceLanguage();
}

// Initialiser i18next avec la langue détectée du système
i18n
  .use(initReactI18next) // Intégration avec React
  .init({
    resources,
    lng: getDeviceLanguage(), // Langue détectée automatiquement
    fallbackLng: 'en', // Langue de fallback si traduction manquante
    defaultNS: 'common', // Namespace par défaut
    ns: ['common', 'recipe', 'auth', 'folders', 'settings', 'profile', 'tutorial', 'search', 'shopping', 'onboarding', 'subscription'], // Namespaces disponibles

    // Options de compatibilité
    compatibilityJSON: 'v4', // Format JSON compatible i18next v4+

    // Interpolation
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },

    // Pluralisation
    pluralSeparator: '_',

    // Debug (désactiver en production)
    debug: __DEV__,

    // Options React
    react: {
      useSuspense: false, // Désactiver Suspense pour éviter les problèmes avec React Native
    },
  });

console.log('🌍 [i18n] Langue active (initiale):', i18n.language);
console.log('🌍 [i18n] Namespaces chargés:', i18n.options.ns);

// Charger la langue préférée stockée de manière asynchrone
getInitialLanguage().then((lang) => {
  if (lang !== i18n.language) {
    console.log('🔄 [i18n] Changement vers la langue préférée:', lang);
    i18n.changeLanguage(lang);
  }
});

export default i18n;
