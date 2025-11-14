# 🎨 Intégration UI du Système d'Amis - Documentation

## ✅ Ce qui a été implémenté

### 1. Composants créés

**`components/friends/AddFriendCard.tsx`**
- Card minimaliste pour ajouter un ami par username
- Recherche automatique + validation
- Gestion des erreurs (utilisateur introuvable, déjà ami, demande déjà envoyée)
- Style cohérent avec l'app

**`components/friends/FriendsListCard.tsx`**
- Card affichant la liste des amis
- Preview des 3 premiers amis avec avatar
- Badge pour les demandes en attente
- Bouton "Voir tout" / "Gérer mes amis"
- Empty state élégant

**`components/friends/FriendsSheet.tsx`**
- Bottom sheet complet pour gérer les amis
- 3 onglets : Amis / Demandes reçues / Demandes envoyées
- Actions : Accepter, Refuser, Annuler, Retirer
- Loading states et confirmations
- Design moderne avec tabs

### 2. Écran modifié

**`app/(tabs)/profile.tsx`**
- Ajout de la section Amis (avant Premium)
- Intégration d'`AddFriendCard` et `FriendsListCard`
- State pour gérer le `FriendsSheet`

---

## 📱 Flux utilisateur

### Ajouter un ami

```
1. User ouvre l'onglet Profil
2. Voit la card "Ajouter un ami"
3. Saisit le username (ex: "alice")
4. Appuie sur "Ajouter"
   ↓
5. Recherche automatique via searchUsers()
6. Vérifications :
   - Utilisateur existe ?
   - Déjà ami ?
   - Demande déjà envoyée ?
   ↓
7. Si OK : Demande envoyée ✅
8. Alert de confirmation
```

### Gérer les demandes

```
1. User voit un badge sur "Mes amis" (3)
2. Clique sur "Gérer mes amis"
   ↓
3. Bottom sheet s'ouvre
4. Voit 3 onglets :
   - Amis (5)
   - Reçues (3) 🔴
   - Envoyées (1)
   ↓
5. Dans "Reçues" :
   - Voir qui a envoyé
   - Accepter ✅ ou Refuser ❌
   ↓
6. Dans "Envoyées" :
   - Voir à qui j'ai envoyé
   - Annuler la demande
   ↓
7. Dans "Amis" :
   - Voir tous mes amis
   - Retirer un ami
```

---

## 🎨 Design minimaliste

### Palette de couleurs

```typescript
// Cards
backgroundColor: colors.card
borderColor: colors.border
borderWidth: 1
borderRadius: BorderRadius.lg

// Icons containers
backgroundColor: `${colors.primary}15` // 15% d'opacité
iconColor: colors.primary

// Textes
title: colors.text (bold, 17px)
subtitle: colors.icon (regular, 13px)

// Boutons primaires
backgroundColor: colors.primary
color: #FFFFFF
```

### Spacing cohérent

```typescript
padding: Spacing.lg (16px)
gap: Spacing.sm (8px)
marginBottom: Spacing.lg (16px)
```

---

## 🔄 États et interactions

### Loading states
- Bouton "Ajouter" → ActivityIndicator pendant la recherche
- Actions (Accepter, Refuser) → ActivityIndicator pendant le traitement
- Liste des amis → ActivityIndicator centré

### Empty states
- "Aucun ami" avec icon et message encourageant
- "Aucune demande" avec icon et message informatif
- Design élégant avec icon background semi-transparent

### Confirmations
- Retirer un ami → Alert avec confirmation
- Demande envoyée → Alert de succès
- Erreurs → Alert avec message clair

---

## 🚀 Prochaines étapes

### Phase 1 : Base de données ✅
- Migration SQL exécutée
- Tables créées (friend_requests, friendships, shared_recipes)
- RLS configuré

### Phase 2 : Interface amis ✅
- AddFriendCard créé
- FriendsListCard créé
- FriendsSheet créé
- Intégration dans profile.tsx

### Phase 3 : Partage de recettes (À FAIRE)

**A. Créer le composant `ShareRecipeSheet.tsx`**

```typescript
// components/friends/ShareRecipeSheet.tsx

interface ShareRecipeSheetProps {
  visible: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
}

export function ShareRecipeSheet({ visible, onClose, recipeId, recipeTitle }: ShareRecipeSheetProps) {
  // Afficher la liste des amis
  // Input pour message optionnel
  // Bouton "Partager"
  // Utiliser useSharedRecipes().shareRecipe()
}
```

**B. Ajouter le bouton "Partager" dans `app/result.tsx`**

```typescript
import { ShareRecipeSheet } from '@/components/friends/ShareRecipeSheet';
import { Send } from 'lucide-react-native';

const [showShareSheet, setShowShareSheet] = useState(false);

// Dans le JSX, à côté de "Démarrer la cuisson"
<Button
  onPress={() => setShowShareSheet(true)}
  icon={<Send size={20} />}
  variant="secondary"
>
  Partager avec un ami
</Button>

<ShareRecipeSheet
  visible={showShareSheet}
  onClose={() => setShowShareSheet(false)}
  recipeId={recipe.id}
  recipeTitle={recipe.title}
/>
```

**C. Créer l'écran `app/shared-recipes.tsx`**

```typescript
// Afficher toutes les recettes partagées avec moi
import { useSharedRecipesView } from '@/hooks/useSharedRecipesView';

export default function SharedRecipesScreen() {
  const { sharedRecipes, unreadCount, markAsRead, moveToFolder } = useSharedRecipesView();

  return (
    <ScrollView>
      <Text>Recettes partagées ({unreadCount} nouvelles)</Text>

      {sharedRecipes.map(recipe => (
        <SharedRecipeCard
          key={recipe.id}
          recipe={recipe}
          onPress={() => {
            markAsRead(recipe.shared_id);
            router.push(`/result?id=${recipe.id}`);
          }}
          onSave={(folderId) => moveToFolder(recipe.id, folderId)}
        />
      ))}
    </ScrollView>
  );
}
```

**D. Créer le composant `SharedRecipeCard.tsx`**

```typescript
// components/friends/SharedRecipeCard.tsx

interface SharedRecipeCardProps {
  recipe: SharedRecipeWithSender;
  onPress: () => void;
  onSave: (folderId: string) => void;
}

export function SharedRecipeCard({ recipe, onPress, onSave }: SharedRecipeCardProps) {
  return (
    <Card>
      {!recipe.shared_is_read && <Badge>Nouveau</Badge>}

      <Image source={{ uri: recipe.image_url }} />

      {/* Infos de l'expéditeur */}
      <View style={styles.senderInfo}>
        <Image source={{ uri: recipe.shared_by_avatar_url }} style={styles.avatar} />
        <Text>Envoyé par @{recipe.shared_by_username}</Text>
      </View>

      <Text>{recipe.title}</Text>

      {recipe.shared_message && (
        <Text style={styles.message}>"{recipe.shared_message}"</Text>
      )}

      <Button onPress={onPress}>Voir la recette</Button>
      <Button onPress={() => {/* Ouvrir bottom sheet de dossiers */}}>
        Enregistrer dans...
      </Button>
    </Card>
  );
}
```

**E. Ajouter une section dans `app/(tabs)/index.tsx`**

```typescript
import { useSharedRecipesView } from '@/hooks/useSharedRecipesView';

const { sharedRecipes, unreadCount } = useSharedRecipesView();

// AVANT la liste des dossiers
{sharedRecipes.length > 0 && (
  <TouchableOpacity
    style={styles.sharedSection}
    onPress={() => router.push('/shared-recipes')}
  >
    <View style={styles.sharedHeader}>
      <Inbox size={24} color={colors.primary} />
      <Text style={styles.sharedTitle}>Recettes partagées</Text>
      {unreadCount > 0 && (
        <Badge>{unreadCount}</Badge>
      )}
    </View>

    {/* Preview horizontal des 3 dernières */}
    <FlatList
      horizontal
      data={sharedRecipes.slice(0, 3)}
      renderItem={({ item }) => (
        <SharedRecipePreview recipe={item} />
      )}
    />
  </TouchableOpacity>
)}
```

---

## 🧪 Tests à effectuer

### Tests d'ajout d'amis
- [ ] Ajouter un ami par username → Demande envoyée
- [ ] Chercher un username inexistant → Message d'erreur
- [ ] Chercher un ami déjà ajouté → Message approprié
- [ ] Chercher un user avec demande en attente → Message approprié

### Tests de gestion des demandes
- [ ] Recevoir une demande → Badge apparaît
- [ ] Accepter une demande → Amitié créée, disparaît de "Reçues"
- [ ] Refuser une demande → Disparaît de "Reçues"
- [ ] Annuler une demande envoyée → Disparaît de "Envoyées"

### Tests de gestion des amis
- [ ] Voir la liste complète des amis
- [ ] Retirer un ami → Confirmation puis suppression
- [ ] Empty states s'affichent correctement

### Tests de partage (À VENIR)
- [ ] Partager une recette avec un ami → Copie créée avec folder_id = NULL
- [ ] Recevoir une recette → Apparaît dans "Recettes partagées"
- [ ] Badge "Envoyé par @username" s'affiche
- [ ] Message optionnel s'affiche
- [ ] Marquer comme lu → Badge disparaît
- [ ] Enregistrer dans un dossier → Disparaît de "Recettes partagées"

---

## 📝 Notes importantes

### Sécurité
- RLS configuré sur toutes les tables
- On ne peut partager qu'avec des amis (vérification côté Supabase)
- On ne peut voir que ses propres données

### Performance
- Les listes d'amis sont chargées au montage du hook
- Refresh automatique après chaque action
- Vue Supabase pour optimiser les requêtes de recettes partagées

### UX
- Feedbacks visuels (loading, success, erreurs)
- Confirmations pour actions destructives
- Empty states encourageants
- Design cohérent avec le reste de l'app

---

**État actuel : ✅ Interface amis terminée !**

**Prochaine étape : 🚀 Implémenter le partage de recettes**
