/**
 * Hook pour gérer les dossiers de l'utilisateur
 * Récupération et création via Supabase
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { useNetworkContext } from '@/contexts/NetworkContext';
import { useFolderStore } from '@/stores/useFolderStore';
import type { FolderStoreState } from '@/stores/useFolderStore';
import type { Folder } from '@/types/folder';

export type DatabaseFolder = Folder;

export interface UseFoldersReturn {
  folders: DatabaseFolder[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createFolder: (name: string, iconName?: string) => Promise<DatabaseFolder | null>;
}

/**
 * Hook pour récupérer et gérer les dossiers de l'utilisateur
 * @returns Objet contenant les dossiers, l'état de chargement et les erreurs
 */
export function useFolders(): UseFoldersReturn {
  const folders = useFolderStore((state: FolderStoreState) => state.folders);
  const setFolders = useFolderStore((state: FolderStoreState) => state.setFolders);
  const isLoading = useFolderStore((state: FolderStoreState) => state.isLoading);
  const setIsLoading = useFolderStore((state: FolderStoreState) => state.setIsLoading);
  const error = useFolderStore((state: FolderStoreState) => state.error);
  const setError = useFolderStore((state: FolderStoreState) => state.setError);
  const markFetched = useFolderStore((state: FolderStoreState) => state.markFetched);
  const hasFetched = useFolderStore((state: FolderStoreState) => state.hasFetched);
  const recipesLastUpdatedAt = useRecipeStore((state) => state.recipesLastUpdatedAt);
  const hasFetchedRef = useRef(false);
  const { isOffline } = useNetworkContext();

  const isFetchingRef = useRef(false);

  const fetchFolders = useCallback(async (silent: boolean = false, signal?: AbortSignal) => {
    // Vérifier si un fetch est déjà en cours pour éviter les race conditions
    if (isFetchingRef.current) {
      console.log('🔒 [Folders] Fetch déjà en cours, ignoré');
      return;
    }

    if (isOffline) {
      if (!silent) {
        setIsLoading(false);
      }
      return;
    }

    isFetchingRef.current = true;

    if (!silent) {
      console.log('📁 [Folders] Récupération des dossiers...');
      setIsLoading(true);
      setError(null);
    }

    try {
      // Vérifier si l'opération a été annulée
      if (signal?.aborted) {
        console.log('⏹️ [Folders] Fetch annulé');
        return;
      }

      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (signal?.aborted) return;

      if (foldersError) {
        console.error('❌ [Folders] Erreur lors de la récupération:', foldersError);
        if (!silent) {
          throw new Error(`Erreur lors de la récupération: ${foldersError.message}`);
        }
        return;
      }

      if (silent) {
        console.log('🔄 [Folders] Refresh silencieux des dossiers...');
      } else {
        console.log('✅ [Folders]', foldersData?.length || 0, 'dossiers trouvés');
      }

      // Optimisation: Récupérer tous les counts en une seule requête avec GROUP BY
      const { data: recipeCounts, error: countError } = await supabase
        .from('recipes')
        .select('folder_id');

      if (signal?.aborted) return;

      if (countError) {
        console.error('❌ [Folders] Erreur lors du comptage des recettes:', countError);
      }

      // Créer un Map pour compter les recettes par folder_id
      const countsMap = new Map<string, number>();
      if (recipeCounts) {
        recipeCounts.forEach((item) => {
          if (item.folder_id) {
            countsMap.set(item.folder_id, (countsMap.get(item.folder_id) || 0) + 1);
          }
        });
      }

      // Mapper les counts aux folders (plus de N+1 queries!)
      const foldersWithCount = (foldersData || []).map((folder) => ({
        ...folder,
        recipes_count: countsMap.get(folder.id) || 0,
      }));

      if (signal?.aborted) return;

      // Vérifier si les données ont vraiment changé avant de mettre à jour l'état
      setFolders((prevFolders: DatabaseFolder[]) => {
        const prevIds = new Set(prevFolders.map(f => f.id));
        const newIds = new Set(foldersWithCount.map(f => f.id));

        // Vérifier si les IDs sont identiques
        if (prevIds.size === newIds.size && [...prevIds].every(id => newIds.has(id))) {
          // Vérifier si les compteurs ou noms ont changé
          const hasChanges = foldersWithCount.some(newFolder => {
            const prevFolder = prevFolders.find(f => f.id === newFolder.id);
            return !prevFolder ||
                   prevFolder.recipes_count !== newFolder.recipes_count ||
                   prevFolder.name !== newFolder.name;
          });

          if (!hasChanges) {
            // Aucun changement, retourner les références précédentes
            return prevFolders;
          }
        }

        // Il y a des changements, mettre à jour
        return foldersWithCount;
      });
      markFetched();
      hasFetchedRef.current = true;
    } catch (err: any) {
      if (signal?.aborted) return;
      console.error('❌ [Folders] Erreur:', err);
      if (!silent) {
        setError(err.message || 'Une erreur est survenue');
      }
    } finally {
      isFetchingRef.current = false;
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [isOffline, setError, setFolders, setIsLoading, markFetched]);

  const createFolder = useCallback(async (name: string, iconName: string = 'cooking-pot'): Promise<DatabaseFolder | null> => {
    console.log('📁 [Folders] Création d\'un dossier:', name, 'avec icône:', iconName);
    setError(null);

    try {
      // Vérifier la session avant l'insertion
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 [Folders] Session:', session ? 'connecté' : 'non connecté');
      if (!session) {
        throw new Error('Vous devez être connecté pour créer un dossier');
      }

      const { data: newFolder, error: createError } = await supabase
        .from('folders')
        .insert({
          name: name.trim(),
          icon_name: iconName,
          user_id: session.user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ [Folders] Erreur lors de la création:', createError);
        throw new Error(`Erreur lors de la création: ${createError.message}`);
      }

      console.log('✅ [Folders] Dossier créé:', newFolder.id);

      // Rafraîchir la liste
      await fetchFolders();

      return newFolder;
    } catch (err: any) {
      console.error('❌ [Folders] Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
      return null;
    }
  }, [fetchFolders, setError]);

  // Effet pour le chargement initial (avec cleanup pour éviter memory leak)
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!hasFetched && !isOffline) {
      hasFetchedRef.current = false;
      fetchFolders(false, signal).catch((err) => {
        if (!signal.aborted) {
          console.error('❌ [Folders] Erreur lors du chargement initial:', err);
        }
      });
    } else if (isOffline && folders.length > 0) {
      hasFetchedRef.current = true;
      markFetched();
    }

    // Cleanup: annuler les requêtes en cours si le composant unmount
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline, hasFetched]); // fetchFolders, folders.length, markFetched exclus intentionnellement pour éviter re-fetch en boucle

  // Effet pour rafraîchir quand les recettes changent (avec cleanup)
  useEffect(() => {
    if (!hasFetchedRef.current || !recipesLastUpdatedAt || isOffline) {
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    fetchFolders(true, signal).catch((err) => {
      if (!signal.aborted) {
        console.error('❌ [Folders] Erreur lors du refresh lié aux recettes:', err);
      }
    });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipesLastUpdatedAt, isOffline]); // fetchFolders exclu intentionnellement pour éviter re-fetch en boucle

  const refresh = useCallback(() => {
    return fetchFolders(true); // Refresh silencieux sans loading
  }, [fetchFolders]);

  return {
    folders,
    isLoading,
    error,
    refresh,
    createFolder,
  };
}

