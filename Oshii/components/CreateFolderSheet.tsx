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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';

interface CreateFolderSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => Promise<boolean>;
}

export function CreateFolderSheet({
  visible,
  onClose,
  onCreateFolder,
}: CreateFolderSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Auto-focus sur l'input quand la sheet s'ouvre
  useEffect(() => {
    if (visible) {
      // Petit délai pour s'assurer que la Modal est montée
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setFolderName('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!folderName || folderName.trim().length === 0) {
      setError('Veuillez entrer un nom de dossier');
      return;
    }

    setIsCreating(true);
    setError(null);

    const success = await onCreateFolder(folderName.trim());

    setIsCreating(false);

    if (success) {
      handleClose();
    } else {
      setError('Erreur lors de la création du dossier');
    }
  };

  const handleClose = () => {
    setFolderName('');
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
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Nouveau Dossier</Text>
          <Pressable
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.description, { color: colors.icon }]}>
            Organisez vos recettes en les classant dans des dossiers
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Nom du dossier</Text>
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
              placeholder="Ex: Desserts, Pâtes, Salades..."
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
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title="Annuler"
            onPress={handleClose}
            variant="primary"
            style={[styles.button, { backgroundColor: colors.card }]}
            textStyle={{ color: colors.text }}
            disabled={isCreating}
          />
          <Button
            title={isCreating ? 'Création...' : 'Créer'}
            onPress={handleCreate}
            variant="primary"
            style={[styles.button, styles.createButton]}
            disabled={!folderName || folderName.trim().length === 0 || isCreating}
            loading={isCreating}
          />
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  description: {
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginTop: Spacing.md,
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

