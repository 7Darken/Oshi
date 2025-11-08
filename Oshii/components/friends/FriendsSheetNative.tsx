/**
 * Page Sheet native pour gérer les amis
 * Design moderne avec Modal pageSheet
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
  Modal,
  SafeAreaView,
} from 'react-native';
import {
  UserCircle,
  UserMinus,
  Check,
  X,
  Users,
  ArrowLeft,
  UserPlus,
  Clock,
} from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFriends } from '@/hooks/useFriends';
import { FriendRequestWithProfile } from '@/types/friends';

interface FriendsSheetNativeProps {
  visible: boolean;
  onClose: () => void;
}

type Tab = 'all' | 'received' | 'sent';

export function FriendsSheetNative({ visible, onClose }: FriendsSheetNativeProps) {
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

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const totalFriends = friends.length + sentRequests.length + pendingRequests.length;

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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Mes amis</Text>
            <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
              {totalFriends} {totalFriends === 1 ? 'ami' : 'amis'}
            </Text>
          </View>
          <View style={styles.closeButton} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.tabs, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'all' && [styles.tabActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setActiveTab('all')}
              activeOpacity={0.7}
            >
              <Users size={16} color={activeTab === 'all' ? '#FFFFFF' : colors.icon} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'all' ? '#FFFFFF' : colors.icon },
                ]}
              >
                Tous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'received' && [styles.tabActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setActiveTab('received')}
              activeOpacity={0.7}
            >
              <UserPlus size={16} color={activeTab === 'received' ? '#FFFFFF' : colors.icon} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'received' ? '#FFFFFF' : colors.icon },
                ]}
              >
                Reçues
              </Text>
              {pendingRequests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'sent' && [styles.tabActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setActiveTab('sent')}
              activeOpacity={0.7}
            >
              <Clock size={16} color={activeTab === 'sent' ? '#FFFFFF' : colors.icon} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'sent' ? '#FFFFFF' : colors.icon },
                ]}
              >
                Envoyées
              </Text>
            </TouchableOpacity>
          </View>
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
              <Text style={[styles.loadingText, { color: colors.icon }]}>
                Chargement...
              </Text>
            </View>
          ) : (
            <>
              {/* Tab Tous */}
              {activeTab === 'all' && (
                <>
                  {totalFriends === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="Aucun ami"
                      subtitle="Commencez à ajouter des amis pour partager vos meilleures recettes"
                      colors={colors}
                    />
                  ) : (
                    <>
                      {/* Section Demandes reçues */}
                      {pendingRequests.length > 0 && (
                        <View style={styles.section}>
                          <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Demandes reçues
                          </Text>
                          {pendingRequests.map((request) => (
                            <ReceivedRequestItem
                              key={request.id}
                              request={request}
                              colors={colors}
                              onAccept={() => handleAcceptRequest(request.id)}
                              onDecline={() => handleDeclineRequest(request.id)}
                              isProcessing={processingId === request.id}
                            />
                          ))}
                        </View>
                      )}

                      {/* Section Amis confirmés */}
                      {friends.length > 0 && (
                        <View style={styles.section}>
                          <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Amis ({friends.length})
                          </Text>
                          {friends.map((friendship) => (
                            <FriendItem
                              key={friendship.id}
                              friendship={friendship}
                              colors={colors}
                              onRemove={() =>
                                handleRemoveFriend(friendship.id, friendship.friend?.username || '')
                              }
                              isProcessing={processingId === friendship.id}
                            />
                          ))}
                        </View>
                      )}

                      {/* Section Demandes envoyées */}
                      {sentRequests.length > 0 && (
                        <View style={styles.section}>
                          <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            En attente ({sentRequests.length})
                          </Text>
                          {sentRequests.map((request) => (
                            <SentRequestItem
                              key={request.id}
                              request={request}
                              colors={colors}
                              onCancel={() => handleCancelRequest(request.id)}
                              isProcessing={processingId === request.id}
                            />
                          ))}
                        </View>
                      )}
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
                      subtitle="Vous n'avez pas de demande d'ami en attente"
                      colors={colors}
                    />
                  ) : (
                    pendingRequests.map((request) => (
                      <ReceivedRequestItem
                        key={request.id}
                        request={request}
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
                      subtitle="Vos demandes d'amis en attente apparaîtront ici"
                      colors={colors}
                    />
                  ) : (
                    sentRequests.map((request) => (
                      <SentRequestItem
                        key={request.id}
                        request={request}
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
      </SafeAreaView>
    </Modal>
  );
}

// Composant FriendItem
interface FriendItemProps {
  friendship: any;
  colors: any;
  onRemove: () => void;
  isProcessing: boolean;
}

function FriendItem({ friendship, colors, onRemove, isProcessing }: FriendItemProps) {
  const friend = friendship.friend;

  return (
    <View style={[styles.item, { backgroundColor: colors.card }]}>
      <View
        style={[
          styles.itemAvatar,
          { backgroundColor: friend?.avatar_url ? 'transparent' : 'rgba(239, 68, 68, 0.12)' },
        ]}
      >
        {friend?.avatar_url ? (
          <ExpoImage
            source={{ uri: friend.avatar_url }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <UserCircle size={40} color="rgba(239, 68, 68, 0.7)" />
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.text }]}>
          @{friend?.username || 'Utilisateur'}
        </Text>
        <Text style={[styles.itemSubtext, { color: colors.icon }]}>Ami</Text>
      </View>
      <TouchableOpacity
        style={[styles.iconButton, { borderColor: colors.border }]}
        onPress={onRemove}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={colors.icon} />
        ) : (
          <UserMinus size={20} color={colors.icon} />
        )}
      </TouchableOpacity>
    </View>
  );
}

// Composant ReceivedRequestItem
interface ReceivedRequestItemProps {
  request: FriendRequestWithProfile;
  colors: any;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing: boolean;
}

function ReceivedRequestItem({
  request,
  colors,
  onAccept,
  onDecline,
  isProcessing,
}: ReceivedRequestItemProps) {
  const user = request.sender;

  return (
    <View style={[styles.item, { backgroundColor: colors.card }]}>
      <View
        style={[
          styles.itemAvatar,
          { backgroundColor: user?.avatar_url ? 'transparent' : 'rgba(239, 68, 68, 0.12)' },
        ]}
      >
        {user?.avatar_url ? (
          <ExpoImage
            source={{ uri: user.avatar_url }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <UserCircle size={40} color="rgba(239, 68, 68, 0.7)" />
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.text }]}>
          @{user?.username || 'Utilisateur'}
        </Text>
        <Text style={[styles.itemSubtext, { color: colors.primary }]}>Demande d'ami</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.primary }]}
          onPress={onAccept}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.declineButton,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={onDecline}
          disabled={isProcessing}
        >
          <X size={20} color={colors.icon} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Composant SentRequestItem
interface SentRequestItemProps {
  request: FriendRequestWithProfile;
  colors: any;
  onCancel: () => void;
  isProcessing: boolean;
}

function SentRequestItem({ request, colors, onCancel, isProcessing }: SentRequestItemProps) {
  const user = request.receiver;

  return (
    <View style={[styles.item, { backgroundColor: colors.card, opacity: 0.7 }]}>
      <View
        style={[
          styles.itemAvatar,
          { backgroundColor: user?.avatar_url ? 'transparent' : 'rgba(239, 68, 68, 0.12)' },
        ]}
      >
        {user?.avatar_url ? (
          <ExpoImage
            source={{ uri: user.avatar_url }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <UserCircle size={40} color="rgba(239, 68, 68, 0.7)" />
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.text }]}>
          @{user?.username || 'Utilisateur'}
        </Text>
        <Text style={[styles.itemSubtext, { color: colors.icon }]}>En attente</Text>
      </View>
      <TouchableOpacity
        style={[styles.cancelButtonOutline, { borderColor: colors.border }]}
        onPress={onCancel}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={colors.icon} />
        ) : (
          <Text style={[styles.cancelButtonText, { color: colors.icon }]}>Annuler</Text>
        )}
      </TouchableOpacity>
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
      <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}10` }]}>
        <Icon size={48} color={colors.icon} strokeWidth={1.5} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    position: 'relative',
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl * 2,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemAvatar: {
    width: 56,
    height: 56,
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
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemSubtext: {
    fontSize: 14,
    fontWeight: '500',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  declineButton: {
    borderWidth: 1,
  },
  cancelButtonOutline: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
