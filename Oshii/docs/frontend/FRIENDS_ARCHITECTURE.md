# 🏗️ Architecture du Système d'Amis - Version Simplifiée

## 🎯 Concept clé

**Les recettes partagées n'ont PAS de `folder_id` (NULL)**

Au lieu de créer un dossier système "Envoyés", on identifie simplement les recettes partagées par :
- `folder_id = NULL`
- Présence dans la table `shared_recipes`

---

## 📊 Schéma de données

### Tables

```sql
-- Demandes d'amis
friend_requests {
  id UUID PRIMARY KEY
  sender_id UUID → profiles(id)
  receiver_id UUID → profiles(id)
  status VARCHAR(20) -- 'pending', 'accepted', 'declined'
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
}

-- Amitiés actives
friendships {
  id UUID PRIMARY KEY
  user_id_1 UUID → profiles(id)  -- Plus petit ID
  user_id_2 UUID → profiles(id)  -- Plus grand ID
  created_at TIMESTAMPTZ
}

-- Recettes partagées
shared_recipes {
  id UUID PRIMARY KEY
  recipe_id UUID → recipes(id)
  shared_by_user_id UUID → profiles(id)
  shared_with_user_id UUID → profiles(id)
  message TEXT
  is_read BOOLEAN DEFAULT false
  created_at TIMESTAMPTZ
}
```

### Vue utilitaire

```sql
shared_recipes_with_details {
  -- Jointure de shared_recipes + recipes + profiles
  -- Pour récupérer facilement toutes les infos
}
```

---

## 🔄 Flux de partage

```
User A partage une recette avec User B
         ↓
1. INSERT dans shared_recipes
         ↓
2. TRIGGER create_recipe_copy_on_share() s'exécute
         ↓
3. Copie la recette avec :
   - user_id = User B
   - folder_id = NULL ← Important !
   - Copie des ingrédients
   - Copie des étapes
         ↓
4. Met à jour shared_recipes avec le nouvel ID de recette
         ↓
User B voit la recette dans "Recettes partagées"
(requête : WHERE user_id = User B AND folder_id IS NULL)
```

---

## 📱 Interface utilisateur

### 1. Onglet "Recettes" (`app/(tabs)/index.tsx`)

```
┌─────────────────────────────────────┐
│ 📥 Recettes partagées (3) 🔴       │
│                                     │
│ [Card] [Card] [Card] → Horizontal  │
│ "Par @alice" "Par @bob" "Par @eve"  │
│                                     │
├─────────────────────────────────────┤
│ 📁 Mes dossiers                     │
│                                     │
│ ▶ Favoris (12 recettes)            │
│ ▶ À faire (5 recettes)             │
│ ▶ Desserts (8 recettes)            │
└─────────────────────────────────────┘
```

### 2. Écran "Recettes partagées" (`app/shared-recipes.tsx`)

```
┌─────────────────────────────────────┐
│ ← Recettes partagées                │
├─────────────────────────────────────┤
│ 🔴 [Image de recette]               │
│    Poulet teriyaki                  │
│    👤 Envoyé par @alice             │
│    💬 "Essaie celle-là, c'est top!" │
│    [Voir] [Enregistrer dans...]    │
├─────────────────────────────────────┤
│    [Image de recette]               │
│    Pâtes carbonara                  │
│    👤 Envoyé par @bob               │
│    [Voir] [Enregistrer dans...]    │
└─────────────────────────────────────┘
```

---

## 🗂️ Logique de filtrage

### Recettes partagées (non enregistrées)

```typescript
// Dans useSharedRecipesView.ts
const getSharedRecipes = async () => {
  // Récupérer les recettes avec folder_id = NULL
  // ET présentes dans shared_recipes pour l'utilisateur
  const { data } = await supabase
    .from('recipes')
    .select('*, shared_recipes!inner(*)')
    .eq('user_id', user.id)
    .is('folder_id', null)
    .eq('shared_recipes.shared_with_user_id', user.id);
};
```

### Recettes dans un dossier (enregistrées)

```typescript
// Dans useFolderRecipes.ts (existant)
const getRecipesInFolder = async (folderId: string) => {
  // Récupérer les recettes avec folder_id = folderId
  const { data } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id)
    .eq('folder_id', folderId);
};
```

### Toutes les recettes

```typescript
// Dans useRecipes.ts (existant)
const getAllRecipes = async () => {
  // Récupérer TOUTES les recettes de l'utilisateur
  // Y compris celles avec folder_id = NULL
  const { data } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id);
};
```

---

## ✨ Avantages de cette approche

### ✅ Simplicité
- Pas de modification de la table `folders`
- Pas de dossier système spécial à gérer
- Moins de code, moins de bugs

### ✅ Flexibilité
- La recette peut facilement passer de "partagée" à "dans un dossier"
- Suffit de faire `UPDATE recipes SET folder_id = X WHERE id = Y`
- Pas de déplacement complexe entre dossiers système et normaux

### ✅ Performance
- Une simple requête avec `WHERE folder_id IS NULL`
- Pas de jointure complexe avec des flags système
- Index natif sur `folder_id`

### ✅ Évolutivité
- Facile d'ajouter d'autres "vues" sans dossier
- Ex: "Recettes récentes", "Favoris", etc.
- Juste des filtres différents sur `folder_id`

---

## 🔧 Comportements importants

### Quand une recette est partagée
1. ✅ Copie créée avec `folder_id = NULL`
2. ✅ Entrée dans `shared_recipes` avec `is_read = false`
3. ✅ Apparaît dans "Recettes partagées"

### Quand une recette est enregistrée
1. ✅ `UPDATE recipes SET folder_id = X`
2. ✅ Disparaît de "Recettes partagées"
3. ✅ Apparaît dans le dossier choisi
4. ✅ L'entrée `shared_recipes` reste (pour l'historique)

### Quand une recette est supprimée
1. ✅ `DELETE FROM recipes WHERE id = X`
2. ✅ Cascade : supprime aussi `shared_recipes` (ON DELETE CASCADE)
3. ✅ Cascade : supprime aussi `ingredients` et `steps`

---

## 🎨 Composants UI

### SharedRecipeCard
- Badge "Nouveau" si `is_read = false`
- Avatar + username de l'expéditeur
- Message optionnel
- Actions : "Voir" et "Enregistrer dans..."

### ShareRecipeSheet
- Liste des amis
- Champ message optionnel
- Bouton "Partager"

### FriendCard
- Avatar + username
- Bouton "Partager une recette"
- Bouton "Retirer"

---

## 🚀 Exemple de code

### Afficher les recettes partagées

```typescript
import { useSharedRecipesView } from '@/hooks/useSharedRecipesView';

export default function HomeScreen() {
  const { sharedRecipes, unreadCount } = useSharedRecipesView();

  return (
    <View>
      {sharedRecipes.length > 0 && (
        <View style={styles.sharedSection}>
          <Text>Recettes partagées ({unreadCount} non lues)</Text>
          {sharedRecipes.map(recipe => (
            <SharedRecipeCard
              key={recipe.id}
              recipe={recipe}
              onPress={() => markAsRead(recipe.shared_id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
```

### Partager une recette

```typescript
import { useSharedRecipes } from '@/hooks/useSharedRecipes';

const { shareRecipe } = useSharedRecipes();

const handleShare = async (friendId: string) => {
  await shareRecipe(
    recipe.id,
    friendId,
    "Essaie cette recette, elle est délicieuse !"
  );
};
```

### Enregistrer dans un dossier

```typescript
import { useSharedRecipesView } from '@/hooks/useSharedRecipesView';

const { moveToFolder } = useSharedRecipesView();

const handleSave = async (folderId: string) => {
  await moveToFolder(recipe.id, folderId);
  // La recette disparaît de "Recettes partagées"
};
```

---

## 📝 Requêtes SQL utiles

### Compter les recettes partagées non lues

```sql
SELECT COUNT(*)
FROM recipes r
INNER JOIN shared_recipes sr ON sr.recipe_id = r.id
WHERE r.user_id = $1
  AND r.folder_id IS NULL
  AND sr.is_read = false;
```

### Récupérer les recettes partagées avec infos

```sql
SELECT
  r.*,
  sr.id as shared_id,
  sr.message,
  sr.is_read,
  sr.created_at as shared_at,
  p.username as shared_by_username,
  p.avatar_url as shared_by_avatar
FROM recipes r
INNER JOIN shared_recipes sr ON sr.recipe_id = r.id
INNER JOIN profiles p ON p.id = sr.shared_by_user_id
WHERE r.user_id = $1
  AND r.folder_id IS NULL
ORDER BY sr.created_at DESC;
```

---

**Cette architecture est simple, élégante et évolutive !** 🎉
