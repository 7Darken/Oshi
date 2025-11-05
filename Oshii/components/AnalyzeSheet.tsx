/**
 * Sheet pour analyser une vidéo TikTok
 * PageSheet native avec icône TikTok et input
 */

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OshiiLogo } from '@/components/ui/OshiiLogo';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Clipboard from 'expo-clipboard';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clipboard as ClipboardIcon, Sparkles, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type KeyboardEvent,
} from 'react-native';

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
  const router = useRouter();
  const { isPremium, profile, canGenerateRecipe } = useAuthContext();
  const shiftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleShow = (event: KeyboardEvent) => {
      const keyboardHeight = event?.endCoordinates?.height ?? 0;
      const offset = Math.min(keyboardHeight * 0.45, 180);

      Animated.timing(shiftAnim, {
        toValue: -offset,
        duration: event?.duration ?? 240,
        useNativeDriver: true,
      }).start();
    };

    const handleHide = (event: KeyboardEvent) => {
      Animated.timing(shiftAnim, {
        toValue: 0,
        duration: event?.duration ?? 200,
        useNativeDriver: true,
      }).start();
    };

    const subscriptions = [
      Keyboard.addListener(showEvent, handleShow),
      Keyboard.addListener(hideEvent, handleHide),
    ];

    return () => {
      subscriptions.forEach((sub) => sub.remove());
    };
  }, [shiftAnim]);

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

    // Si l'utilisateur n'a plus de générations et n'est pas premium, ouvrir le paywall
    if (!canGenerateRecipe) {
      onClose();
      router.push('/subscription');
      return;
    }

    setError(null);
    onAnalyze(url.trim());
    
    // Clear l'input après avoir lancé l'analyse
    setUrl('');
  };

  const handleClose = () => {
    Keyboard.dismiss();
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.touchableArea}>
          <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 32 : 0}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerSpacer} />
              <Text style={[styles.headerTitle, { color: colors.text }]}> 
                Nouvelle recette
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <Animated.View
              pointerEvents="box-none"
              style={[styles.animatedContent, { transform: [{ translateY: shiftAnim }] }]}
            >
              <View style={styles.content}>
          {/* Cards avec logos superposés */}
          <View style={styles.logosContainer}>
            {/* Carte TikTok (background, rotation horaire) */}
            <View style={[styles.logoCard, styles.tiktokCard, { backgroundColor: colors.card, overflow: 'hidden' }]}
            >
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

          {/* Label avec container de générations sur la même ligne */}
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text }]}>Lien TikTok</Text>
            {!isPremium && profile && (
              <View style={[styles.generationsContainer, { 
                backgroundColor: colorScheme === 'dark' 
                  ? 'rgba(249, 64, 60, 0.15)' 
                  : 'rgba(249, 64, 60, 0.1)',
                borderColor: canGenerateRecipe ? 'transparent' : colors.primary,
                borderWidth: canGenerateRecipe ? 0 : 1,
              }]}>
                <Sparkles size={14} color={colors.primary} />
                <Text style={[styles.generationsText, { 
                  color: colors.primary 
                }]}>
                  {canGenerateRecipe 
                    ? `${profile.free_generations_remaining} restante${profile.free_generations_remaining > 1 ? 's' : ''}`
                    : 'Limite atteinte'}
                </Text>
              </View>
            )}
          </View>

          {/* Input avec bouton coller */}
          <View style={styles.inputContainer}>
            <Input
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
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  touchableArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    zIndex: 10,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  animatedContent: {
    flex: 1,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: Spacing.xs,
    position: 'relative',
  },
  pasteButton: {
    position: 'absolute',
    right: 12,
    top: 12,
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
  generationsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  generationsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  },
});

