/**
 * Types TypeScript pour le système d'amis et partage de recettes
 */

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface FriendRequestWithProfile extends FriendRequest {
  sender?: UserProfile;
  receiver?: UserProfile;
}

export interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
}

export interface FriendshipWithProfile extends Friendship {
  friend?: UserProfile; // L'autre utilisateur dans l'amitié
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface SharedRecipe {
  id: string;
  recipe_id: string;
  shared_by_user_id: string;
  shared_with_user_id: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SharedRecipeWithDetails extends SharedRecipe {
  shared_by?: UserProfile; // Qui a partagé
}

// Pour la recherche d'utilisateurs
export interface UserSearchResult {
  id: string;
  username: string;
  avatar_url: string | null;
  is_friend: boolean; // Si déjà ami
  has_pending_request: boolean; // Si demande en attente
  request_sent_by_me: boolean; // Si c'est moi qui ai envoyé la demande
}
