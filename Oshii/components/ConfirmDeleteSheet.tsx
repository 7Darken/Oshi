/**
 * Composant ConfirmDeleteSheet - Sheet pour confirmer la suppression
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Trash2, X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';

interface ConfirmDeleteSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
  title?: string;
  message?: string;
}

export function ConfirmDeleteSheet({
  visible,
  onClose,
  onConfirm,
  isDeleting = false,
  title = 'Supprimer la recette',
  message = 'Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.',
}: ConfirmDeleteSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width: windowWidth } = useWindowDimensions();

  // Déterminer si on doit afficher les boutons en colonne sur les petits écrans
  const isSmallScreen = windowWidth < 350;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.destructive + '15' }]}>
            <Trash2 size={32} color={colors.destructive} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.icon }]}>{message}</Text>

          {/* Buttons - Responsive: colonne sur petits écrans, ligne sur grands écrans */}
          <View style={[
            styles.buttonsContainer,
            isSmallScreen && styles.buttonsContainerColumn
          ]}>
            <Button
              title="Annuler"
              onPress={onClose}
              variant="primary"
              style={
                isSmallScreen
                  ? [styles.buttonFullWidth, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]
                  : [styles.cancelButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]
              }
              textStyle={{ color: colors.text }}
              disabled={isDeleting}
            />
            <Button
              title="Supprimer"
              onPress={handleConfirm}
              variant="primary"
              style={
                isSmallScreen
                  ? [styles.buttonFullWidth, { backgroundColor: colors.destructive }]
                  : [styles.deleteButton, { backgroundColor: colors.destructive }]
              }
              disabled={isDeleting}
              loading={isDeleting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  buttonsContainerColumn: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
  },
  deleteButton: {
    flex: 1,
    minHeight: 48,
  },
  buttonFullWidth: {
    flex: 0,
    width: '100%',
  },
});

