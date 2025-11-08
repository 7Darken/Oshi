/**
 * Bottom sheet pour gérer les amis
 * - Liste complète des amis
 * - Demandes en attente
 * - Demandes envoyées
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Users,
  UserCircle,
  UserPlus,
  UserMinus,
  Check,
  X,
  Clock,
} from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFriends } from '@/hooks/useFriends';
import { FriendshipWithProfile, FriendRequestWithProfile } from '@/types/friends';

interface FriendsSheetProps {
  visible: boolean;
  onClose: () => void;
}

type Tab = 'friends' | 'received' | 'sent';

export function FriendsSheet({ visible, onClose }: FriendsSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingId(requestId);
    const result = await acceptFriendRequest(requestId);
    if (result.success) {
      Alert.alert('✅ Demande acceptée', 'Vous êtes maintenant amis !');
    } else {
      Alert.alert('Erreur', result.error || 'Une erreur est survenue');
    }
    setProcessingId(null);
  };

  const handleDeclineRequest = async (requestId: string) => {
    setProcessingId(requestId);
    const result = await declineFriendRequest(requestId);
    if (!result.success) {
      Alert.alert('Erreur', result.error || 'Une erreur est survenue');
    }
    setProcessingId(null);
  };

  const handleCancelRequest = async (requestId: string) => {
    setProcessingId(requestId);
    const result = await cancelFriendRequest(requestId);
    if (!result.success) {
      Alert.alert('Erreur', result.error || 'Une erreur est survenue');
    }
    setProcessingId(null);
  };

  const handleRemoveFriend = async (friendshipId: string, username: string) => {
    Alert.alert(
      'Retirer cet ami',
      `Êtes-vous sûr de vouloir retirer @${username} de vos amis ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(friendshipId);
            const result = await removeFriend(friendshipId);
            if (!result.success) {
              Alert.alert('Erreur', result.error || 'Une erreur est survenue');
            }
            setProcessingId(null);
          },
        },
      ]
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height="80%">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Mes amis</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'friends' && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <Users size={18} color={activeTab === 'friends' ? colors.primary : colors.icon} />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'friends' ? colors.primary : colors.icon },
              ]}
            >
              Amis ({friends.length + sentRequests.length + pendingRequests.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'received' && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('received')}
          >
            <UserPlus size={18} color={activeTab === 'received' ? colors.primary : colors.icon} />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'received' ? colors.primary : colors.icon },
              ]}
            >
              Reçues ({pendingRequests.length})
            </Text>
            {pendingRequests.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.tabBadgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'sent' && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('sent')}
          >
            <Clock size={18} color={activeTab === 'sent' ? colors.primary : colors.icon} />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'sent' ? colors.primary : colors.icon },
              ]}
            >
              Envoyées ({sentRequests.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              {/* Tab Amis */}
              {activeTab === 'friends' && (
                <>
                  {friends.length === 0 && sentRequests.length === 0 && pendingRequests.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="Aucun ami"
                      subtitle="Ajoutez des amis pour partager vos recettes"
                      colors={colors}
                    />
                  ) : (
                    <>
                      {/* Amis confirmés */}
                      {friends.map((friendship) => (
                        <FriendItem
                          key={friendship.id}
                          friendship={friendship}
                          colors={colors}
                          onRemove={() =>
                            handleRemoveFriend(friendship.id, friendship.friend?.username || '')
                          }
                          isProcessing={processingId === friendship.id}
                          isPending={false}
                          isReceived={false}
                        />
                      ))}

                      {/* Demandes reçues (à accepter/refuser) */}
                      {pendingRequests.map((request) => (
                        <FriendItem
                          key={request.id}
                          friendship={{
                            id: request.id,
                            user_id_1: request.sender_id,
                            user_id_2: request.receiver_id,
                            created_at: request.created_at,
                            friend: request.sender,
                          }}
                          colors={colors}
                          onAccept={() => handleAcceptRequest(request.id)}
                          onDecline={() => handleDeclineRequest(request.id)}
                          isProcessing={processingId === request.id}
                          isPending={true}
                          isReceived={true}
                        />
                      ))}

                      {/* Demandes envoyées (en attente) */}
                      {sentRequests.map((request) => (
                        <FriendItem
                          key={request.id}
                          friendship={{
                            id: request.id,
                            user_id_1: request.sender_id,
                            user_id_2: request.receiver_id,
                            created_at: request.created_at,
                            friend: request.receiver,
                          }}
                          colors={colors}
                          onRemove={() => handleCancelRequest(request.id)}
                          isProcessing={processingId === request.id}
                          isPending={true}
                          isReceived={false}
                        />
                      ))}
                    </>
                  )}
                </>
              )}

              {/* Tab Demandes reçues */}
              {activeTab === 'received' && (
                <>
                  {pendingRequests.length === 0 ? (
                    <EmptyState
                      icon={UserPlus}
                      title="Aucune demande"
                      subtitle="Vous n'avez pas de demande en attente"
                      colors={colors}
                    />
                  ) : (
                    pendingRequests.map((request) => (
                      <RequestItem
                        key={request.id}
                        request={request}
                        type="received"
                        colors={colors}
                        onAccept={() => handleAcceptRequest(request.id)}
                        onDecline={() => handleDeclineRequest(request.id)}
                        isProcessing={processingId === request.id}
                      />
                    ))
                  )}
                </>
              )}

              {/* Tab Demandes envoyées */}
              {activeTab === 'sent' && (
                <>
                  {sentRequests.length === 0 ? (
                    <EmptyState
                      icon={Clock}
                      title="Aucune demande envoyée"
                      subtitle="Vos demandes d'amis apparaîtront ici"
                      colors={colors}
                    />
                  ) : (
                    sentRequests.map((request) => (
                      <RequestItem
                        key={request.id}
                        request={request}
                        type="sent"
                        colors={colors}
                        onCancel={() => handleCancelRequest(request.id)}
                        isProcessing={processingId === request.id}
                      />
                    ))
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

// Composant FriendItem
interface FriendItemProps {
  friendship: any;
  colors: any;
  onRemove?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  isProcessing: boolean;
  isPending: boolean;
  isReceived: boolean;
}

function FriendItem({ friendship, colors, onRemove, onAccept, onDecline, isProcessing, isPending, isReceived }: FriendItemProps) {
  const friend = friendship.friend;

  return (
    <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }, isPending && !isReceived && { opacity: 0.5 }]}>
      <View style={[styles.itemAvatar, { backgroundColor: friend?.avatar_url ? 'transparent' : 'rgba(239, 68, 68, 0.12)' }]}>
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
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.text }]}>
          @{friend?.username || 'Utilisateur'}
        </Text>
        {isPending && !isReceived && (
          <Text style={[styles.pendingLabel, { color: colors.icon }]}>
            En attente
          </Text>
        )}
        {isReceived && (
          <Text style={[styles.receivedLabel, { color: colors.primary }]}>
            Demande d'ami
          </Text>
        )}
      </View>

      {/* Boutons pour les demandes reçues */}
      {isReceived ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={onAccept}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Check size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={onDecline}
            disabled={isProcessing}
          >
            <X size={18} color={colors.icon} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.removeButton, { borderColor: colors.border }]}
          onPress={onRemove}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.icon} />
          ) : (
            <UserMinus size={18} color={colors.icon} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// Composant RequestItem
interface RequestItemProps {
  request: FriendRequestWithProfile;
  type: 'received' | 'sent';
  colors: any;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  isProcessing: boolean;
}

function RequestItem({ request, type, colors, onAccept, onDecline, onCancel, isProcessing }: RequestItemProps) {
  const user = type === 'received' ? request.sender : request.receiver;

  return (
    <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.itemAvatar, { backgroundColor: user?.avatar_url ? 'transparent' : 'rgba(239, 68, 68, 0.12)' }]}>
        {user?.avatar_url ? (
          <ExpoImage
            source={{ uri: user.avatar_url }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <UserCircle size={32} color="rgba(239, 68, 68, 0.7)" />
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.text }]}>
          @{user?.username || 'Utilisateur'}
        </Text>
      </View>

      {type === 'received' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={onAccept}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Check size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={onDecline}
            disabled={isProcessing}
          >
            <X size={18} color={colors.icon} />
          </TouchableOpacity>
        </View>
      )}

      {type === 'sent' && (
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={onCancel}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.icon} />
          ) : (
            <Text style={[styles.cancelButtonText, { color: colors.icon }]}>Annuler</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// Composant EmptyState
interface EmptyStateProps {
  icon: any;
  title: string;
  subtitle: string;
  colors: any;
}

function EmptyState({ icon: Icon, title, subtitle, colors }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}15` }]}>
        <Icon size={32} color={colors.icon} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.icon }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    minWidth: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  itemAvatar: {
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
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
  },
  pendingLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  receivedLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
