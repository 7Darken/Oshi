/**
 * Composant CreateFolderSheet - Sheet native pour créer un nouveau dossier
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCommonTranslation } from '@/hooks/useI18n';
import { Button } from '@/components/ui/Button';
import { IconSelectorSheet } from '@/components/IconSelectorSheet';

interface CreateFolderSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, iconName: string) => Promise<boolean>;
}


// Fonction pour obtenir l'icône dynamiquement
const getIconComponent = (iconName: string) => {
  const pascalName = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  const IconComponent = (LucideIcons as any)[pascalName] || LucideIcons.Folder;
  return IconComponent;
};

export function CreateFolderSheet({
  visible,
  onClose,
  onCreateFolder,
}: CreateFolderSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useCommonTranslation();
  const [folderName, setFolderName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('cooking-pot');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Auto-focus sur l'input quand la sheet s'ouvre
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setFolderName('');
      setSelectedIcon('cooking-pot');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!folderName || folderName.trim().length === 0) {
      setError(t('createFolder.errorEmpty'));
      return;
    }

    setIsCreating(true);
    setError(null);

    const success = await onCreateFolder(folderName.trim(), selectedIcon);

    setIsCreating(false);

    if (success) {
      handleClose();
    } else {
      setError(t('createFolder.errorCreate'));
    }
  };

  const handleClose = () => {
    setFolderName('');
    setSelectedIcon('cooking-pot');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Sélection d'icône - Centré en haut */}
          <View style={styles.iconContainer}>
            <TouchableOpacity
              onPress={() => setShowIconSelector(true)}
              activeOpacity={0.7}
              disabled={isCreating}
            >
              <View style={[
                styles.iconDisplay,
                {
                  backgroundColor: colorScheme === 'dark' 
                    ? 'rgba(249, 64, 60, 0.15)' 
                    : 'rgba(249, 64, 60, 0.1)',
                }
              ]}>
                {(() => {
                  const IconComponent = getIconComponent(selectedIcon);
                  return <IconComponent size={56} color={colors.primary} />;
                })()}
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{t('createFolder.label')}</Text>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: error ? colors.destructive : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={t('createFolder.placeholder')}
              placeholderTextColor={colors.icon}
              value={folderName}
              onChangeText={(text) => {
                setFolderName(text);
                setError(null);
              }}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              blurOnSubmit={true}
              maxLength={15}
              editable={!isCreating}
            />
            {error && <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>}
            <Text style={[styles.hint, { color: colors.icon }]}>
              {t('createFolder.hint')}
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title={t('common.cancel')}
            onPress={handleClose}
            variant="primary"
            style={[styles.button, { backgroundColor: colors.card }]}
            textStyle={{ color: colors.text }}
            disabled={isCreating}
          />
          <Button
            title={isCreating ? t('createFolder.creating') : t('createFolder.create')}
            onPress={handleCreate}
            variant="primary"
            style={[styles.button, styles.createButton]}
            disabled={!folderName || folderName.trim().length === 0 || isCreating}
            loading={isCreating}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Icon Selector Sheet */}
      <IconSelectorSheet
        visible={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelectIcon={setSelectedIcon}
        selectedIcon={selectedIcon}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  inputContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 50,
  },
  errorText: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  hint: {
    fontSize: 13,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconDisplay: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
  },
  createButton: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
});

