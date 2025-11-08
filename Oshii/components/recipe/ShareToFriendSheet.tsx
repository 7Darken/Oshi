/**
 * Page sheet pour partager une recette à un ami
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { UserCircle, Send, X } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFriends } from '@/hooks/useFriends';

interface ShareToFriendSheetProps {
  visible: boolean;
  onClose: () => void;
  onShare: (friendId: string, message?: string) => void;
  isSharing: boolean;
}

export function ShareToFriendSheet({
  visible,
  onClose,
  onShare,
  isSharing,
}: ShareToFriendSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { friends, isLoading } = useFriends();
  const [selectedFriendshipId, setSelectedFriendshipId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const handleShare = () => {
    if (selectedFriendshipId) {
      onShare(selectedFriendshipId, message.trim() || undefined);
      setSelectedFriendshipId(null);
      setMessage('');
    }
  };

  const handleClose = () => {
    setSelectedFriendshipId(null);
    setMessage('');
    onClose();
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
          <Text style={[styles.title, { color: colors.text }]}>
            Partager à un ami
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={[styles.description, { color: colors.icon }]}>
            Sélectionnez un ami pour partager cette recette
          </Text>
        </View>

        {/* Liste des amis */}
        <ScrollView
          style={styles.friendsList}
          contentContainerStyle={styles.friendsListContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : friends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                Vous n'avez pas encore d'amis
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                Ajoutez des amis pour partager vos recettes
              </Text>
            </View>
          ) : (
            friends.map((friendship) => {
              const friend = friendship.friend;
              const isSelected = selectedFriendshipId === friendship.id;

              return (
                <TouchableOpacity
                  key={friendship.id}
                  style={[
                    styles.friendItem,
                    {
                      backgroundColor: isSelected ? `${colors.primary}15` : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedFriendshipId(friendship.id)}
                  activeOpacity={0.7}
                  disabled={isSharing}
                >
                  <View
                    style={[
                      styles.friendAvatar,
                      {
                        backgroundColor: friend?.avatar_url
                          ? 'transparent'
                          : 'rgba(239, 68, 68, 0.12)',
                      },
                    ]}
                  >
                    {friend?.avatar_url ? (
                      <ExpoImage
                        source={{ uri: friend.avatar_url }}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <UserCircle size={32} color="rgba(239, 68, 68, 0.7)" />
                    )}
                  </View>
                  <Text style={[styles.friendName, { color: colors.text }]}>
                    @{friend?.username || 'Utilisateur'}
                  </Text>
                  {isSelected && (
                    <View
                      style={[
                        styles.selectedIndicator,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <View style={styles.selectedDot} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Message optionnel */}
        {selectedFriendshipId && (
          <View style={styles.messageContainer}>
            <TextInput
              style={[
                styles.messageInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Ajouter un message (optionnel)"
              placeholderTextColor={colors.icon}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={200}
            />
          </View>
        )}

        {/* Bouton Envoyer - Visible uniquement si un ami est sélectionné */}
        {selectedFriendshipId && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: colors.primary },
                isSharing && styles.sendButtonDisabled,
              ]}
              onPress={handleShare}
              disabled={isSharing}
              activeOpacity={0.7}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={20} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>Envoyer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  headerSpacer: {
    width: 40,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  descriptionContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  friendsList: {
    flex: 1,
  },
  friendsListContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.sm,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  friendName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
  },
  messageContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  messageInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  sendButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
