/**
 * Hook pour gérer les dossiers de l'utilisateur
 * Récupération et création via Supabase
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';

export interface DatabaseFolder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  recipes_count?: number;
}

export interface UseFoldersReturn {
  folders: DatabaseFolder[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createFolder: (name: string) => Promise<DatabaseFolder | null>;
}

/**
 * Hook pour récupérer et gérer les dossiers de l'utilisateur
 * @returns Objet contenant les dossiers, l'état de chargement et les erreurs
 */
export function useFolders(): UseFoldersReturn {
  const [folders, setFolders] = useState<DatabaseFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async (silent: boolean = false) => {
    if (!silent) {
      console.log('📁 [Folders] Récupération des dossiers...');
      setIsLoading(true);
      setError(null);
    }

    try {
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });

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

      // Compter les recettes pour chaque dossier
      const foldersWithCount = await Promise.all(
        (foldersData || []).map(async (folder) => {
          const { count } = await supabase
            .from('recipes')
            .select('*', { count: 'exact', head: true })
            .eq('folder_id', folder.id);

          return {
            ...folder,
            recipes_count: count || 0,
          };
        })
      );

      // Vérifier si les données ont vraiment changé avant de mettre à jour l'état
      setFolders(prevFolders => {
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
    } catch (err: any) {
      console.error('❌ [Folders] Erreur:', err);
      if (!silent) {
        setError(err.message || 'Une erreur est survenue');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  const createFolder = useCallback(async (name: string): Promise<DatabaseFolder | null> => {
    console.log('📁 [Folders] Création d\'un dossier:', name);
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
  }, [fetchFolders]);

  useEffect(() => {
    fetchFolders(false); // Chargement initial avec loading
  }, [fetchFolders]);

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

