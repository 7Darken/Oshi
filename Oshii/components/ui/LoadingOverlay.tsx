/**
 * Composant LoadingOverlay - Overlay de chargement
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({
  visible,
  message = 'Analyse en cours...',
}: LoadingOverlayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          {message && (
            <Text style={[styles.message, { color: colors.text }]}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  message: {
    marginTop: Spacing.md,
    fontSize: 16,
    textAlign: 'center',
  },
});

