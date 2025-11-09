/**
 * Hook personnalisé pour faciliter l'utilisation des traductions
 * Wrapper autour de react-i18next avec typage TypeScript
 */

import { useTranslation as useI18nextTranslation } from 'react-i18next';
import type { SupportedLanguage } from '@/services/i18n';

/**
 * Hook pour accéder aux traductions dans les composants
 *
 * @example
 * ```tsx
 * const { t, language, changeLanguage } = useI18n('recipe');
 *
 * <Text>{t('recipe.title')}</Text>
 * <Text>{t('recipe.currentStep', { current: 2, total: 5 })}</Text>
 * ```
 */
export function useI18n(namespace: 'common' | 'recipe' | 'auth' | 'folders' | 'settings' | 'profile' | 'tutorial' | 'search' | 'shopping' | 'onboarding' | 'subscription' = 'common') {
  const { t, i18n } = useI18nextTranslation(namespace);

  return {
    /**
     * Fonction de traduction
     * @param key - Clé de traduction (ex: "recipe.title")
     * @param params - Paramètres d'interpolation (ex: { count: 5 })
     */
    t,

    /**
     * Langue actuelle (ex: "fr", "en")
     */
    language: i18n.language as SupportedLanguage,

    /**
     * Changer la langue manuellement (rarement nécessaire car détection auto)
     * @param lang - Code langue ("fr", "en")
     */
    changeLanguage: (lang: SupportedLanguage) => {
      console.log('🌍 [i18n] Changement de langue:', lang);
      return i18n.changeLanguage(lang);
    },

    /**
     * Vérifier si une clé de traduction existe
     * @param key - Clé de traduction
     */
    exists: (key: string) => i18n.exists(key),
  };
}

/**
 * Hook pour accéder aux traductions communes (common namespace)
 * Raccourci pour useI18n('common')
 */
export function useCommonTranslation() {
  return useI18n('common');
}

/**
 * Hook pour accéder aux traductions de recettes
 * Raccourci pour useI18n('recipe')
 */
export function useRecipeTranslation() {
  return useI18n('recipe');
}

/**
 * Hook pour accéder aux traductions d'authentification
 * Raccourci pour useI18n('auth')
 */
export function useAuthTranslation() {
  return useI18n('auth');
}

/**
 * Hook pour accéder aux traductions de dossiers
 * Raccourci pour useI18n('folders')
 */
export function useFoldersTranslation() {
  return useI18n('folders');
}

/**
 * Hook pour accéder aux traductions des paramètres
 * Raccourci pour useI18n('settings')
 */
export function useSettingsTranslation() {
  return useI18n('settings');
}

/**
 * Hook pour accéder aux traductions du profil
 * Raccourci pour useI18n('profile')
 */
export function useProfileTranslation() {
  return useI18n('profile');
}

/**
 * Hook pour accéder aux traductions du tutoriel
 * Raccourci pour useI18n('tutorial')
 */
export function useTutorialTranslation() {
  return useI18n('tutorial');
}

/**
 * Hook pour accéder aux traductions de recherche
 * Raccourci pour useI18n('search')
 */
export function useSearchTranslation() {
  return useI18n('search');
}

/**
 * Hook pour accéder aux traductions de la liste de courses
 * Raccourci pour useI18n('shopping')
 */
export function useShoppingTranslation() {
  return useI18n('shopping');
}

/**
 * Hook pour accéder aux traductions de l'onboarding
 * Raccourci pour useI18n('onboarding')
 */
export function useOnboardingTranslation() {
  return useI18n('onboarding');
}

/**
 * Hook pour accéder aux traductions du paywall / abonnement
 * Raccourci pour useI18n('subscription')
 */
export function useSubscriptionTranslation() {
  return useI18n('subscription');
}
