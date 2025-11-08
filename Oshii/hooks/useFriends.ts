/**
 * Hook pour gérer le système d'amis
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  FriendRequest,
  FriendRequestWithProfile,
  Friendship,
  FriendshipWithProfile,
  UserSearchResult,
} from '@/types/friends';

export function useFriends() {
  const { user } = useAuthContext();
  const [friends, setFriends] = useState<FriendshipWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestWithProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // RÉCUPÉRER LA LISTE DES AMIS
  // =====================================================
  const getFriends = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id_1,
          user_id_2,
          created_at
        `)
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (err) throw err;

      // Pour chaque amitié, récupérer le profil de l'ami
      const friendsWithProfiles = await Promise.all(
        (data || []).map(async (friendship) => {
          const friendId = friendship.user_id_1 === user.id
            ? friendship.user_id_2
            : friendship.user_id_1;

          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', friendId)
            .single();

          return {
            ...friendship,
            friend: profile || undefined,
          };
        })
      );

      setFriends(friendsWithProfiles);
    } catch (err: any) {
      console.error('❌ [useFriends] Erreur getFriends:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // RÉCUPÉRER LES DEMANDES REÇUES
  // =====================================================
  const getPendingRequests = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          updated_at
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (err) throw err;

      // Récupérer les profils des senders
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', request.sender_id)
            .single();

          return {
            ...request,
            sender: profile || undefined,
          };
        })
      );

      setPendingRequests(requestsWithProfiles);
    } catch (err: any) {
      console.error('❌ [useFriends] Erreur getPendingRequests:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // RÉCUPÉRER LES DEMANDES ENVOYÉES
  // =====================================================
  const getSentRequests = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          updated_at
        `)
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (err) throw err;

      // Récupérer les profils des receivers
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', request.receiver_id)
            .single();

          return {
            ...request,
            receiver: profile || undefined,
          };
        })
      );

      setSentRequests(requestsWithProfiles);
    } catch (err: any) {
      console.error('❌ [useFriends] Erreur getSentRequests:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // RECHERCHER DES UTILISATEURS
  // =====================================================
  const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
    if (!user || !query.trim()) return [];

    try {
      setError(null);

      console.log('🔍 [useFriends] Recherche username:', query);
      console.log('👤 [useFriends] User ID actuel:', user.id);

      // Rechercher les utilisateurs par username (case-insensitive)
      const { data: users, error: err } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', user.id) // Exclure soi-même
        .limit(20);

      console.log('📊 [useFriends] Résultats recherche:', users);
      console.log('📊 [useFriends] Nombre de résultats:', users?.length || 0);

      if (err) {
        console.error('❌ [useFriends] Erreur Supabase recherche:', err);
        throw err;
      }

      if (!users || users.length === 0) {
        console.log('⚠️ [useFriends] Aucun utilisateur trouvé pour:', query);
        console.log('⚠️ [useFriends] Vérifiez:');
        console.log('   1. Le username existe dans la table profiles');
        console.log('   2. Les RLS policies permettent la lecture');
        console.log('   3. Le username n\'est pas celui de l\'user actuel');
      }

      // Pour chaque utilisateur, vérifier s'il est déjà ami ou si demande en attente
      const usersWithStatus = await Promise.all(
        (users || []).map(async (profile) => {
          // Vérifier si déjà ami (vérifier les deux combinaisons possibles)
          const { data: friendship } = await supabase
            .from('friendships')
            .select('id')
            .or(
              `and(user_id_1.eq.${user.id},user_id_2.eq.${profile.id}),and(user_id_1.eq.${profile.id},user_id_2.eq.${user.id})`
            )
            .maybeSingle();

          // Vérifier si demande en attente
          const { data: sentRequest } = await supabase
            .from('friend_requests')
            .select('id')
            .eq('sender_id', user.id)
            .eq('receiver_id', profile.id)
            .eq('status', 'pending')
            .maybeSingle();

          const { data: receivedRequest } = await supabase
            .from('friend_requests')
            .select('id')
            .eq('sender_id', profile.id)
            .eq('receiver_id', user.id)
            .eq('status', 'pending')
            .maybeSingle();

          return {
            ...profile,
            is_friend: !!friendship,
            has_pending_request: !!(sentRequest || receivedRequest),
            request_sent_by_me: !!sentRequest,
          };
        })
      );

      return usersWithStatus;
    } catch (err: any) {
      console.error('❌ [useFriends] Erreur searchUsers:', err);
      setError(err.message);
      return [];
    }
  };

  // =====================================================
  // ENVOYER UNE DEMANDE D'AMI
  // =====================================================
  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    try {
      setError(null);

      const { error: err } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'pending',
        });

      if (err) throw err;

      console.log('✅ [useFriends] Demande d\'ami envoyée');
      return { success: true };
    } catch (err: any) {
      console.error('❌ [useFriends] Erreur sendFriendRequest:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // =====================================================
  // ACCEPTER UNE DEMANDE D'AMI
  // =====================================================
  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    try {
      setError(null);

      const { error: err } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('receiver_id', user.id); // Sécurité : seul le receiver peut accepter

      if (err) throw err;

      console.log('✅ [useFriends] Demande acceptée');

      // Rafraîchir les listes
      await getFriends();
      await getPendingRequests();

      return { success: true };
    } catch (err: any) {
      console.error('❌ [useFriends] Erreur acceptFriendRequest:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // =====================================================
  // REFUSER UNE DEMANDE D'AMI
  // =====================================================
  const declineFriendRequest = async (requestId: string) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    try {
      setError(null);

      const { error: err } = await supabase
        .from('friend_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('receiver_id', user.id);

      if (err) throw err;

      console.log('✅ [useFriends] Demande refusée');
      await getPendingRequests();

      return { success: true };
    } catch (err: any) {
      console.error('❌ [useFriends] Erreur declineFriendRequest:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // =====================================================
  // ANNULER UNE DEMANDE ENVOYÉE
  // =====================================================
  const cancelFriendRequest = async (requestId: string) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    try {
      setError(null);

      const { error: err } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('sender_id', user.id); // Sécurité : seul le sender peut annuler

      if (err) throw err;

      console.log('✅ [useFriends] Demande annulée');
      await getSentRequests();

      return { success: true };
    } catch (err: any) {
      console.error('❌ [useFriends] Erreur cancelFriendRequest:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // =====================================================
  // SUPPRIMER UN AMI
  // =====================================================
  const removeFriend = async (friendshipId: string) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    try {
      setError(null);

      const { error: err } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (err) throw err;

      console.log('✅ [useFriends] Ami supprimé');
      await getFriends();

      return { success: true };
    } catch (err: any) {
      console.error('❌ [useFriends] Erreur removeFriend:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Charger automatiquement au montage
  useEffect(() => {
    if (user) {
      getFriends();
      getPendingRequests();
      getSentRequests();
    }
  }, [user]);

  return {
    // État
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    error,

    // Actions
    getFriends,
    getPendingRequests,
    getSentRequests,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
  };
}
