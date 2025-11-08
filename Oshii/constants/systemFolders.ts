/**
 * Constantes pour les dossiers système
 */

export const SYSTEM_FOLDERS = {
  RECEIVED: 'SYSTEM_FOLDER_RECEIVED', // Dossier virtuel pour les recettes reçues
} as const;

export const SYSTEM_FOLDER_NAMES = {
  [SYSTEM_FOLDERS.RECEIVED]: 'Envoyés',
} as const;

export type SystemFolderId = typeof SYSTEM_FOLDERS[keyof typeof SYSTEM_FOLDERS];

export function isSystemFolder(folderId: string): boolean {
  return Object.values(SYSTEM_FOLDERS).includes(folderId as SystemFolderId);
}

export function getSystemFolderName(folderId: string): string | null {
  if (isSystemFolder(folderId)) {
    return SYSTEM_FOLDER_NAMES[folderId as SystemFolderId];
  }
  return null;
}
