/**
 * Store Zustand pour la gestion des dossiers utilisateur
 * Permet de persister les dossiers pour un usage hors ligne
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Folder } from '@/types/folder';

type FolderRecord = Folder;

export interface FolderStoreState {
  folders: FolderRecord[];
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  lastFetchedAt: number | null;
  setFolders: (updater: FolderRecord[] | ((prev: FolderRecord[]) => FolderRecord[])) => void;
  setIsLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  markFetched: () => void;
  setLastFetchedAt: (timestamp: number | null) => void;
}

export const useFolderStore = create<FolderStoreState>()(
  persist(
    (set) => ({
      folders: [],
      isLoading: false,
      error: null,
      hasFetched: false,
      lastFetchedAt: null,
      setFolders: (updater) =>
        set((state) => ({
          folders:
            typeof updater === 'function'
              ? (updater as (prev: FolderRecord[]) => FolderRecord[])(state.folders)
              : updater,
        })),
      setIsLoading: (value) => set({ isLoading: value }),
      setError: (value) => set({ error: value }),
      markFetched: () => set({ hasFetched: true, lastFetchedAt: Date.now() }),
      setLastFetchedAt: (timestamp) => set({ lastFetchedAt: timestamp }),
    }),
    {
      name: 'oshii-folders-cache',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        folders: state.folders,
        hasFetched: state.hasFetched,
        lastFetchedAt: state.lastFetchedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        // S'assurer que le chargement et les erreurs sont réinitialisés après réhydratation
        state.isLoading = false;
        state.error = null;
      },
    }
  )
);
