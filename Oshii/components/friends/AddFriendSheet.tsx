/**
 * Page Sheet pour ajouter un ami
 * Même style que SettingsSheet avec Modal presentationStyle="pageSheet"
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Modal,
  ScrollView,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFriends } from '@/hooks/useFriends';
import * as Haptics from 'expo-haptics';

interface AddFriendSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (username: string) => void;
}

export function AddFriendSheet({ visible, onClose, onSuccess }: AddFriendSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { searchUsers, sendFriendRequest, getSentRequests } = useFriends();

  const [username, setUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setUsername('');
    setError(null);
    Keyboard.dismiss();
    onClose();
  };

  const handleAddFriend = async () => {
    if (!username.trim()) {
      setError('Veuillez saisir un nom d\'utilisateur');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);

      // Rechercher l'utilisateur
      const users = await searchUsers(username.trim());

      if (users.length === 0) {
        setError(`Utilisateur @${username} introuvable`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsSearching(false);
        return;
      }

      const user = users[0];

      // Vérifier s'il est déjà ami
      if (user.is_friend) {
        setError(`Vous êtes déjà ami avec @${user.username}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setIsSearching(false);
        return;
      }

      // Vérifier si demande déjà envoyée
      if (user.has_pending_request) {
        if (user.request_sent_by_me) {
          setError(`Demande déjà envoyée à @${user.username}`);
        } else {
          setError(`@${user.username} vous a déjà envoyé une demande`);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setIsSearching(false);
        return;
      }

      // Envoyer la demande
      setIsSending(true);
      const result = await sendFriendRequest(user.id);

      if (result.success) {
        // Succès !
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Rafraîchir la liste des demandes envoyées
        await getSentRequests();

        onSuccess(user.username);
        setUsername('');
        setError(null);
        handleClose();
      } else {
        setError(result.error || 'Une erreur est survenue');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSearching(false);
      setIsSending(false);
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
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Ajouter un ami
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <Text style={[styles.description, { color: colors.icon }]}>
            Recherchez un ami par son nom d'utilisateur
          </Text>

          {/* Input */}
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Search size={20} color={colors.icon} style={styles.searchIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Nom d'utilisateur..."
              placeholderTextColor={colors.icon}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleAddFriend}
              editable={!isSearching && !isSending}
            />
          </View>

          {/* Message d'erreur */}
          {error && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.primary }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Bouton Ajouter */}
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: colors.primary },
              (isSearching || isSending || !username.trim()) &&
                styles.addButtonDisabled,
            ]}
            onPress={handleAddFriend}
            disabled={isSearching || isSending || !username.trim()}
            activeOpacity={0.7}
          >
            {isSearching || isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>Ajouter</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 52,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  addButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
