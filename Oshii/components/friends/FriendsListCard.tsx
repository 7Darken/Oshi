/**
 * Card pour afficher la liste des amis
 * Style minimaliste avec preview des 3 premiers amis
 */

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFriends } from '@/hooks/useFriends';
import { Image as ExpoImage } from 'expo-image';
import { Check, ChevronRight, RefreshCw, UserCircle, UserPlus, Users, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface FriendsListCardProps {
  onSeeAll: () => void;
  onAddFriend: () => void;
}

export function FriendsListCard({ onSeeAll, onAddFriend }: FriendsListCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    friends,
    isLoading,
    pendingRequests,
    sentRequests,
    acceptFriendRequest,
    declineFriendRequest,
    getFriends,
    getPendingRequests,
    getSentRequests,
  } = useFriends();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Combiner les amis confirmés, les demandes reçues et les demandes envoyées
  const allFriendsWithStatus = [
    ...friends.map(f => ({ ...f, isPending: false, isReceived: false })),
    ...pendingRequests.map(r => ({
      id: r.id,
      user_id_1: r.sender_id,
      user_id_2: r.receiver_id,
      created_at: r.created_at,
      friend: r.sender,
      isPending: true,
      isReceived: true, // Demande reçue
    })),
    ...sentRequests.map(r => ({
      id: r.id,
      user_id_1: r.sender_id,
      user_id_2: r.receiver_id,
      created_at: r.created_at,
      friend: r.receiver,
      isPending: true,
      isReceived: false, // Demande envoyée
    })),
  ];

  const previewFriends = allFriendsWithStatus.slice(0, 3);
  const totalCount = allFriendsWithStatus.length;

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingId(requestId);
    await acceptFriendRequest(requestId);
    setProcessingId(null);
  };

  const handleDeclineRequest = async (requestId: string) => {
    setProcessingId(requestId);
    await declineFriendRequest(requestId);
    setProcessingId(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      getFriends(),
      getPendingRequests(),
      getSentRequests(),
    ]);
    setIsRefreshing(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Users size={20} color={colors.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Mes amis
            </Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              {friends.length} {friends.length > 1 ? 'amis' : 'ami'}
              {pendingRequests.length > 0 && ` • ${pendingRequests.length} demande${pendingRequests.length > 1 ? 's' : ''}`}
              {sentRequests.length > 0 && ` • ${sentRequests.length} en attente`}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Badge des demandes en attente */}
          {pendingRequests.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{pendingRequests.length}</Text>
            </View>
          )}

          {/* Bouton Refresh (visible uniquement si demandes en attente) */}
          {pendingRequests.length > 0 && (
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: `${colors.primary}15` }]}
              onPress={handleRefresh}
              activeOpacity={0.7}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <RefreshCw size={16} color={colors.primary} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          )}

          {/* Bouton Ajouter un ami */}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: `${colors.primary}15` }]}
            onPress={onAddFriend}
            activeOpacity={0.7}
          >
            <UserPlus size={18} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading state */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {/* Empty state */}
      {!isLoading && totalCount === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            Vous n'avez pas encore d'amis
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.icon }]}>
            Ajoutez des amis pour partager vos recettes
          </Text>
        </View>
      )}

      {/* Preview des amis */}
      {!isLoading && totalCount > 0 && (
        <>
          <View style={styles.friendsList}>
            {previewFriends.map((friendship) => (
              <FriendPreviewItem
                key={friendship.id}
                friendship={friendship}
                colors={colors}
                isPending={friendship.isPending}
                isReceived={friendship.isReceived}
                onAccept={() => handleAcceptRequest(friendship.id)}
                onDecline={() => handleDeclineRequest(friendship.id)}
                isProcessing={processingId === friendship.id}
              />
            ))}
          </View>

          {/* Bouton "Voir tout" */}
          {totalCount > 3 && (
            <TouchableOpacity
              style={[styles.seeAllButton, { borderColor: colors.border }]}
              onPress={onSeeAll}
              activeOpacity={0.7}
            >
              <Text style={[styles.seeAllText, { color: colors.text }]}>
                Voir tous les amis ({totalCount})
              </Text>
              <ChevronRight size={18} color={colors.icon} />
            </TouchableOpacity>
          )}

          {/* Ou bouton "Gérer" si 3 amis ou moins */}
          {totalCount <= 3 && totalCount > 0 && (
            <TouchableOpacity
              style={[styles.seeAllButton, { borderColor: colors.border }]}
              onPress={onSeeAll}
              activeOpacity={0.7}
            >
              <Text style={[styles.seeAllText, { color: colors.text }]}>
                Gérer mes amis
              </Text>
              <ChevronRight size={18} color={colors.icon} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

interface FriendPreviewItemProps {
  friendship: any;
  colors: any;
  isPending: boolean;
  isReceived: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  isProcessing?: boolean;
}

function FriendPreviewItem({ friendship, colors, isPending, isReceived, onAccept, onDecline, isProcessing }: FriendPreviewItemProps) {
  const friend = friendship.friend;

  return (
    <View style={[styles.friendItem, isPending && !isReceived && { opacity: 0.5 }]}>
      <View style={[styles.friendAvatar, { backgroundColor: friend?.avatar_url ? 'transparent' : 'rgba(239, 68, 68, 0.12)' }]}>
        {friend?.avatar_url ? (
          <ExpoImage
            source={{ uri: friend.avatar_url }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <UserCircle size={28} color="rgba(239, 68, 68, 0.7)" />
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>
          {friend?.username || 'Utilisateur'}
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
      {isReceived && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.primary }]}
            onPress={onAccept}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Check size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.declineButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={onDecline}
            disabled={isProcessing}
          >
            <X size={16} color={colors.icon} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
  friendsList: {
    gap: Spacing.sm,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
  },
  pendingLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  receivedLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  acceptButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    marginHorizontal: -Spacing.lg,
    marginBottom: -Spacing.lg,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
