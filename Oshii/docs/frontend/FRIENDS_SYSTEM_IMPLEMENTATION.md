# 🤝 Système d'Amis et Partage de Recettes - Guide d'implémentation

## 📋 Vue d'ensemble

Ce système permet aux utilisateurs de :
1. ✅ Ajouter des amis (demande → acceptation)
2. ✅ Envoyer des recettes à leurs amis
3. ✅ Recevoir des recettes (sans dossier, identifiées par `shared_recipes`)
4. ✅ Voir qui a envoyé chaque recette
5. ✅ Déplacer les recettes vers des dossiers existants

---

## 🏗️ Architecture

### Base de données (Supabase)

**Nouvelles tables :**
- `friend_requests` - Demandes d'amis (pending, accepted, declined)
- `friendships` - Amitiés actives (créées automatiquement à l'acceptation)
- `shared_recipes` - Recettes partagées avec métadonnées

**Aucune modification de `folders` nécessaire !**

**Concept clé :** Les recettes partagées ont `folder_id = NULL` et sont identifiées par leur présence dans `shared_recipes`.

**Triggers automatiques :**
1. Création d'amitié quand demande acceptée
2. Copie de la recette (avec `folder_id = NULL`) pour le destinataire

**Sécurité :** Row Level Security (RLS) configurée sur toutes les tables

**Vue utilitaire :** `shared_recipes_with_details` pour récupérer facilement les recettes partagées avec infos du sender

---

## 📝 Étapes d'implémentation

### ✅ Phase 1 : Base de données (FAIT)

Les fichiers suivants ont été créés :
- `supabase/migrations/001_friends_system.sql` - Schéma complet avec RLS et vue
- `types/friends.ts` - Types TypeScript
- `hooks/useFriends.ts` - Hook pour gérer les amis
- `hooks/useSharedRecipes.ts` - Hook pour partager des recettes
- `hooks/useSharedRecipesView.ts` - Hook pour afficher les recettes partagées reçues

**À faire :**
1. Exécuter la migration SQL dans Supabase

```bash
# Dans le dashboard Supabase > SQL Editor
# Copier/coller le contenu de supabase/migrations/001_friends_system.sql
# Exécuter
```

C'est tout ! Aucune modification de données existantes nécessaire.

---

### 🔨 Phase 2 : Interface utilisateur

#### 2.1 - Nouvel onglet "Amis"

**Créer :** `app/(tabs)/friends.tsx`

```typescript
import { useFriends } from '@/hooks/useFriends';
import { useSharedRecipes } from '@/hooks/useSharedRecipes';

// Sections à afficher :
// 1. Nombre d'amis + bouton "Ajouter"
// 2. Badge notifications (demandes en attente)
// 3. Liste des amis (FriendCard)
// 4. Bouton "Rechercher des amis"
```

**Modifier :** `app/(tabs)/_layout.tsx`

Ajouter l'onglet "Amis" dans la navigation :

```typescript
<Tabs.Screen
  name="friends"
  options={{
    title: 'Amis',
    tabBarIcon: ({ color }) => <Users size={24} color={color} />,
    tabBarBadge: pendingRequests.length > 0 ? pendingRequests.length : undefined,
  }}
/>
```

#### 2.2 - Composants UI

**Créer :** `components/friends/`

```
components/friends/
├── FriendCard.tsx               # Card pour un ami
├── FriendRequestCard.tsx        # Card demande d'ami (avec actions)
├── UserSearchCard.tsx           # Card résultat recherche
├── SharedRecipeCard.tsx         # Card recette partagée avec badge "De: @username"
├── ShareRecipeSheet.tsx         # Bottom sheet pour choisir l'ami
└── FriendsListSheet.tsx         # Liste amis pour partager
```

**Exemple FriendCard.tsx :**

```typescript
interface Props {
  friend: FriendshipWithProfile;
  onPress?: () => void;
  onShare?: () => void;
  onRemove?: () => void;
}

export function FriendCard({ friend, onPress, onShare, onRemove }: Props) {
  return (
    <Card>
      <Image source={{ uri: friend.friend?.avatar_url }} />
      <Text>{friend.friend?.username}</Text>
      <Button onPress={onShare}>Partager une recette</Button>
      <Button variant="danger" onPress={onRemove}>Retirer</Button>
    </Card>
  );
}
```

#### 2.3 - Écrans supplémentaires

**Créer :** `app/friends/`

```
app/friends/
├── search.tsx              # Rechercher des utilisateurs
├── requests.tsx            # Demandes reçues/envoyées
└── [id].tsx                # Profil d'un ami (optionnel)
```

**Exemple search.tsx :**

```typescript
export default function SearchFriendsScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const { searchUsers, sendFriendRequest } = useFriends();

  const handleSearch = async () => {
    const users = await searchUsers(query);
    setResults(users);
  };

  return (
    <View>
      <Input
        placeholder="Rechercher par nom d'utilisateur..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
      />
      <FlatList
        data={results}
        renderItem={({ item }) => (
          <UserSearchCard
            user={item}
            onAddFriend={() => sendFriendRequest(item.id)}
          />
        )}
      />
    </View>
  );
}
```

---

### 🎨 Phase 3 : Intégration dans l'app

#### 3.1 - Bouton "Partager" sur les recettes

**Modifier :** `app/result.tsx` (écran de détail d'une recette)

Ajouter un bouton "Partager avec un ami" :

```typescript
import { ShareRecipeSheet } from '@/components/friends/ShareRecipeSheet';

const [showShareSheet, setShowShareSheet] = useState(false);

// Dans le JSX :
<Button
  onPress={() => setShowShareSheet(true)}
  icon={<Send size={20} />}
>
  Partager avec un ami
</Button>

<ShareRecipeSheet
  visible={showShareSheet}
  recipeId={recipe.id}
  onClose={() => setShowShareSheet(false)}
/>
```

#### 3.2 - Section "Recettes partagées" dans l'onglet Recettes

**Modifier :** `app/(tabs)/index.tsx` (Home avec recettes)

Ajouter une section spéciale en haut pour les recettes partagées :

```typescript
import { useSharedRecipesView } from '@/hooks/useSharedRecipesView';

const { sharedRecipes, unreadCount } = useSharedRecipesView();

// Dans le JSX, AVANT la liste des dossiers :
{sharedRecipes.length > 0 && (
  <View style={styles.sharedSection}>
    <TouchableOpacity onPress={() => router.push('/shared-recipes')}>
      <View style={styles.sharedHeader}>
        <Inbox size={24} color={colors.primary} />
        <Text style={styles.sharedTitle}>Recettes partagées</Text>
        {unreadCount > 0 && (
          <Badge>{unreadCount}</Badge>
        )}
      </View>
    </TouchableOpacity>

    {/* Preview des 3 dernières recettes partagées */}
    <FlatList
      horizontal
      data={sharedRecipes.slice(0, 3)}
      renderItem={({ item }) => (
        <SharedRecipeCard recipe={item} />
      )}
    />
  </View>
)}

{/* Puis la liste des dossiers normaux */}
```

#### 3.3 - Afficher qui a envoyé la recette

**Créer :** `app/shared-recipes.tsx` - Écran dédié aux recettes partagées

```typescript
import { useSharedRecipesView } from '@/hooks/useSharedRecipesView';

export default function SharedRecipesScreen() {
  const { sharedRecipes, isLoading, markAsRead, moveToFolder } = useSharedRecipesView();

  return (
    <View>
      <Text style={styles.title}>Recettes partagées</Text>

      <FlatList
        data={sharedRecipes}
        renderItem={({ item }) => (
          <SharedRecipeCard
            recipe={item}
            onPress={() => {
              markAsRead(item.shared_id);
              router.push(`/result?id=${item.id}`);
            }}
            onMoveToFolder={(folderId) => moveToFolder(item.id, folderId)}
          />
        )}
      />
    </View>
  );
}
```

**Modifier :** `components/friends/SharedRecipeCard.tsx`

Afficher les infos du sender :

```typescript
export function SharedRecipeCard({ recipe }: { recipe: SharedRecipeWithSender }) {
  return (
    <Card>
      {!recipe.shared_is_read && <Badge>Nouveau</Badge>}

      {/* Image de la recette */}
      <Image source={{ uri: recipe.image_url }} />

      {/* Infos du sender */}
      <View style={styles.senderInfo}>
        <Image
          source={{ uri: recipe.shared_by_avatar_url }}
          style={styles.avatar}
        />
        <Text>Envoyé par @{recipe.shared_by_username}</Text>
      </View>

      {/* Titre de la recette */}
      <Text style={styles.title}>{recipe.title}</Text>

      {/* Message optionnel */}
      {recipe.shared_message && (
        <Text style={styles.message}>"{recipe.shared_message}"</Text>
      )}

      {/* Actions */}
      <Button onPress={() => {/* Ouvrir */}}>Voir la recette</Button>
      <Button onPress={() => {/* Déplacer vers dossier */}}>Enregistrer</Button>
    </Card>
  );
}
```

#### 3.4 - Déplacer vers un dossier

Le déplacement se fait simplement en mettant à jour le `folder_id` de la recette.

**Dans :** `components/friends/SharedRecipeCard.tsx`

Ajouter un bouton "Enregistrer dans..." qui ouvre un bottom sheet avec la liste des dossiers :

```typescript
import { useFolderStore } from '@/stores/useFolderStore';
import { useSharedRecipesView } from '@/hooks/useSharedRecipesView';

const { folders } = useFolderStore();
const { moveToFolder } = useSharedRecipesView();

const handleSaveToFolder = async (folderId: string) => {
  await moveToFolder(recipe.id, folderId);
  // La recette disparaîtra de la section "Recettes partagées"
  // car elle aura maintenant un folder_id != NULL
};

// Bottom sheet pour choisir le dossier
<BottomSheet visible={showFolderSheet}>
  {folders.map(folder => (
    <FolderOption
      key={folder.id}
      folder={folder}
      onPress={() => handleSaveToFolder(folder.id)}
    />
  ))}
</BottomSheet>
```

---

### 🔔 Phase 4 : Notifications (optionnel mais recommandé)

#### 4.1 - Badge sur l'onglet "Amis"

```typescript
// Dans app/(tabs)/_layout.tsx
const { pendingRequests } = useFriends();

<Tabs.Screen
  name="friends"
  options={{
    tabBarBadge: pendingRequests.length > 0 ? pendingRequests.length : undefined,
  }}
/>
```

#### 4.2 - Badge sur la section "Recettes partagées"

```typescript
const { unreadCount } = useSharedRecipesView();

// Afficher unreadCount sur la section "Recettes partagées" dans l'onglet Recettes
```

#### 4.3 - Push notifications (Phase future)

Installer `expo-notifications` et créer des webhooks Supabase pour envoyer des notifications quand :
- Nouvelle demande d'ami
- Demande acceptée
- Recette partagée

---

## 🧪 Tests

### Tests manuels à effectuer

1. **Recherche d'amis**
   - [ ] Rechercher un utilisateur par username
   - [ ] Envoyer une demande d'ami
   - [ ] Vérifier que la demande apparaît chez le destinataire

2. **Acceptation/Refus**
   - [ ] Accepter une demande → amitié créée
   - [ ] Refuser une demande → disparaît
   - [ ] Annuler une demande envoyée

3. **Partage de recettes**
   - [ ] Partager une recette avec un ami
   - [ ] Vérifier qu'elle apparaît dans la section "Recettes partagées" du destinataire
   - [ ] Vérifier que `folder_id = NULL` pour la recette partagée
   - [ ] Vérifier que le badge "Envoyé par @username" s'affiche
   - [ ] Message optionnel s'affiche

4. **Gestion des recettes partagées**
   - [ ] La section "Recettes partagées" apparaît quand il y a des recettes
   - [ ] Badge non lus fonctionne
   - [ ] Déplacer une recette vers un dossier (elle disparaît des recettes partagées)
   - [ ] La recette déplacée a maintenant un `folder_id` non NULL

5. **Sécurité**
   - [ ] On ne peut pas partager avec un non-ami
   - [ ] On ne peut pas voir les recettes des autres
   - [ ] RLS fonctionne correctement

---

## 📊 Évolutions futures

Une fois le MVP terminé, vous pourrez ajouter :

1. **Notifications push** (expo-notifications)
2. **Groupes d'amis** (partager à plusieurs)
3. **Collections partagées** (partager un dossier entier)
4. **Messagerie privée** (discussion autour des recettes)
5. **Feed d'activité** ("@user a partagé X recettes")
6. **Suggestions d'amis** (amis d'amis, utilisateurs populaires)
7. **Recettes collaboratives** (modifier à plusieurs)

---

## 🚀 Commencer l'implémentation

### Ordre recommandé :

1. ✅ **Exécuter la migration SQL** dans Supabase
2. **Créer l'onglet "Amis"** (`app/(tabs)/friends.tsx`)
3. **Créer les composants de base** (`components/friends/FriendCard.tsx`, etc.)
4. **Écran de recherche** (`app/friends/search.tsx`)
5. **Écran des demandes** (`app/friends/requests.tsx`)
6. **Écran recettes partagées** (`app/shared-recipes.tsx`)
7. **Composant SharedRecipeCard** (`components/friends/SharedRecipeCard.tsx`)
8. **Section dans l'onglet Recettes** (preview des recettes partagées)
9. **Bouton partager** sur les recettes (`app/result.tsx`)
10. **Bottom sheet de partage** (`components/friends/ShareRecipeSheet.tsx`)
11. **Tests complets**
12. **Polish UI/UX**

---

**Prêt à commencer ? Voulez-vous que je vous aide à créer l'onglet "Amis" en premier ?**
