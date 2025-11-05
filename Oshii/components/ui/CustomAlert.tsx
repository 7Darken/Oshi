/**
 * Composant Alert personnalisé avec le style de l'app
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'error' | 'warning' | 'info';
}

export function CustomAlert({
  visible,
  title,
  message,
  onClose,
  type = 'error',
}: CustomAlertProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const iconColor = type === 'error' ? colors.primary : colors.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.alertContainer, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Bouton fermer */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={colors.icon} />
          </TouchableOpacity>

          {/* Icône */}
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <AlertCircle size={48} color={iconColor} strokeWidth={2} />
          </View>

          {/* Titre */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.icon }]}>{message}</Text>

          {/* Bouton OK */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
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
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  button: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

