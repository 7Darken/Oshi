/**
 * Store Zustand pour gérer la langue de l'application
 * Persiste la préférence de langue dans AsyncStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupportedLanguage } from '@/services/i18n';
import i18n from '@/services/i18n';

interface LanguageState {
  /**
   * Langue préférée de l'utilisateur
   * null = utiliser la détection automatique du système
   */
  preferredLanguage: SupportedLanguage | null;

  /**
   * Définir la langue préférée et l'appliquer immédiatement
   * @param language - Code langue ("fr", "en") ou null pour auto
   */
  setPreferredLanguage: (language: SupportedLanguage | null) => void;

  /**
   * Obtenir la langue actuellement active
   */
  getCurrentLanguage: () => SupportedLanguage;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      preferredLanguage: null, // null = auto-detect

      setPreferredLanguage: (language: SupportedLanguage | null) => {
        console.log('🌍 [LanguageStore] Changement de langue:', language || 'auto');

        // Si null, on utilise la langue détectée du système
        const targetLanguage = language || i18n.language as SupportedLanguage;

        // Changer la langue dans i18next
        i18n.changeLanguage(targetLanguage).then(() => {
          console.log('✅ [LanguageStore] Langue changée:', i18n.language);
        });

        // Mettre à jour le store
        set({ preferredLanguage: language });
      },

      getCurrentLanguage: () => {
        const state = get();
        return (state.preferredLanguage || i18n.language) as SupportedLanguage;
      },
    }),
    {
      name: 'language-storage', // Nom de la clé dans AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
