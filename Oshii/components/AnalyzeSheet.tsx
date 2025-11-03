/**
 * Sheet pour analyser une vidéo TikTok
 * PageSheet native avec icône TikTok et input
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { X, Clipboard as ClipboardIcon } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OshiiLogo } from '@/components/ui/OshiiLogo';

interface AnalyzeSheetProps {
  visible: boolean;
  onClose: () => void;
  onAnalyze: (url: string) => void;
  isLoading?: boolean;
}

export function AnalyzeSheet({ visible, onClose, onAnalyze, isLoading }: AnalyzeSheetProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleAnalyze = () => {
    if (!url || url.trim().length === 0) {
      setError('Veuillez saisir une URL valide');
      return;
    }

    // Validation basique d'URL
    try {
      new URL(url.trim());
    } catch {
      setError('Format d\'URL invalide');
      return;
    }

    setError(null);
    onAnalyze(url.trim());
  };

  const handleClose = () => {
    setUrl('');
    setError(null);
    onClose();
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await Clipboard.getStringAsync();
      if (clipboardText && clipboardText.trim().length > 0) {
        setUrl(clipboardText.trim());
        setError(null);
      } else {
        Alert.alert('Presse-papiers vide', 'Il n\'y a rien à coller dans le presse-papiers');
      }
    } catch (error) {
      console.error('Erreur lors de la lecture du presse-papiers:', error);
      Alert.alert('Erreur', 'Impossible de lire le presse-papiers');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Nouvelle recette
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Cards avec logos superposés */}
          <View style={styles.logosContainer}>
            {/* Carte TikTok (background, rotation horaire) */}
            <View style={[styles.logoCard, styles.tiktokCard, { backgroundColor: colors.card, overflow: 'hidden' }]}>
              <ExpoImage
                source={require('@/assets/logo/Tiktoklogo.jpg')}
                style={styles.tiktokLogo}
                contentFit="cover"
              />
            </View>
            
            {/* Carte Oshii (foreground, rotation antihoraire) */}
            <View style={[styles.logoCard, styles.oshiiCard, { backgroundColor: colors.card }]}>
              <OshiiLogo size="xl" />
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.text }]}>
            Collez un lien TikTok pour transformer la vidéo en recette
          </Text>

          {/* Input avec bouton coller */}
          <View style={styles.inputContainer}>
            <Input
              label="Lien TikTok"
              placeholder="https://www.tiktok.com/@..."
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                setError(null);
              }}
              error={error || undefined}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={handleAnalyze}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.pasteButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={handlePaste}
              activeOpacity={0.7}
            >
              <ClipboardIcon size={18} color={colors.text} />
              <Text style={[styles.pasteButtonText, { color: colors.text }]}>Coller</Text>
            </TouchableOpacity>
          </View>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={isLoading ? 'Analyse en cours...' : 'Analyser'}
              onPress={handleAnalyze}
              disabled={!url || url.trim().length === 0 || isLoading}
              loading={isLoading}
            />
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  logosContainer: {
    alignItems: 'center',
    justifyContent: 'center',

    height: 260,
    position: 'relative',
  },
  logoCard: {
    width: 140,
    height: 200,
    borderRadius: BorderRadius.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',

    elevation: 10,
    opacity: 0.97,
  },
  oshiiCard: {
    transform: [{ rotate: '-6deg' }],
    zIndex: 2,
    top: 10,
    alignSelf: 'center',
    marginLeft: -15,
  },
  tiktokCard: {
    transform: [{ rotate: '6deg' }],
    zIndex: 1,
    top: 10,
    alignSelf: 'center',
    marginRight: -15,
    opacity: 0.75,
  },
  tiktokLogo: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md + 4,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  pasteButton: {
    position: 'absolute',
    right: 12,
    top: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 4,
  },
  pasteButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  },
});

