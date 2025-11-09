/**
 * Composant FolderSelectorSheet - Sheet pour sélectionner un dossier
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { X, Check, Folder } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFolders } from '@/hooks/useFolders';
import { useRecipeTranslation } from '@/hooks/useI18n';

// Palette de couleurs pour les icônes de dossiers
const FOLDER_COLORS = [
  '#FF8B7A',
  '#E8D5B7',
  '#B8E0D2',
  '#D4C5E8',
  '#FFD4A3',
  '#B3D9E8',
];

// Fonction pour obtenir une couleur basée sur le nom
const getFolderColor = (name: string): string => {
  const index = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % FOLDER_COLORS.length;
  return FOLDER_COLORS[index];
};

// Fonction pour obtenir l'icône dynamiquement
const getIconComponent = (iconName: string = 'cooking-pot') => {
  const pascalName = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  const IconComponent = (LucideIcons as any)[pascalName] || LucideIcons.Folder;
  return IconComponent;
};

interface FolderSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  currentFolderId: string | null;
  onSelectFolder: (folderId: string | null) => Promise<void>;
  isUpdating?: boolean;
}

export function FolderSelectorSheet({
  visible,
  onClose,
  currentFolderId,
  onSelectFolder,
  isUpdating = false,
}: FolderSelectorSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useRecipeTranslation();
  const { folders, isLoading, error } = useFolders();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);

  // Réinitialiser la sélection quand le sheet s'ouvre
  useEffect(() => {
    if (visible) {
      setSelectedFolderId(currentFolderId);
    }
  }, [visible, currentFolderId]);

  const handleConfirm = async () => {
    await onSelectFolder(selectedFolderId);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('recipe.folderSelector.title')}
          </Text>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.icon }]}>
                {t('recipe.folderSelector.loading')}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Text style={[styles.errorText, { color: colors.icon }]}>{error}</Text>
            </View>
          ) : (
            <>
              {/* Option "Aucun dossier" */}
              <TouchableOpacity
                onPress={() => setSelectedFolderId(null)}
                disabled={isUpdating}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.folderCard,
                    selectedFolderId === null && {
                      borderColor: colors.primary,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <View style={styles.folderCardContent}>
                    <View style={[styles.folderIcon, { backgroundColor: colors.secondary }]}>
                      <Folder size={24} color={colors.icon} />
                    </View>
                    <View style={styles.folderInfo}>
                      <Text style={[styles.folderName, { color: colors.text }]}>
                        {t('recipe.folderSelector.noFolder')}
                      </Text>
                      <Text style={[styles.folderDescription, { color: colors.icon }]}>
                        {t('recipe.folderSelector.unclassified')}
                      </Text>
                    </View>
                    {selectedFolderId === null && (
                      <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                        <Check size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>

              {/* Liste des dossiers */}
              {folders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  onPress={() => setSelectedFolderId(folder.id)}
                  disabled={isUpdating}
                  activeOpacity={0.7}
                >
                  <Card
                    style={[
                      styles.folderCard,
                      selectedFolderId === folder.id && {
                        borderColor: colors.primary,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <View style={styles.folderCardContent}>
                      {(() => {
                        const IconComponent = getIconComponent(folder.icon_name);
                        return (
                          <View style={styles.folderIcon}>
                            <IconComponent size={24} color={getFolderColor(folder.name)} strokeWidth={2} />
                          </View>
                        );
                      })()}
                      <View style={styles.folderInfo}>
                        <Text style={[styles.folderName, { color: colors.text }]}>
                          {folder.name}
                        </Text>
                        <Text style={[styles.folderDescription, { color: colors.icon }]}>
                          {t('recipe.folderSelector.recipeCount', { count: folder.recipes_count || 0 })}
                        </Text>
                      </View>
                      {selectedFolderId === folder.id && (
                        <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                          <Check size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>

        {/* Footer avec bouton Confirmer */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <Button
            title={t('recipe.folderSelector.confirm')}
            onPress={handleConfirm}
            loading={isUpdating}
            disabled={isUpdating || selectedFolderId === currentFolderId}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  folderCard: {
    marginBottom: Spacing.md,
  },
  folderCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  folderDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});

