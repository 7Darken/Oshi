# 🌍 Guide d'Internationalisation (i18n)

Ce guide explique comment utiliser le système de traduction dans Oshii.

## 📚 Architecture

```
locales/
├── fr/                    # Traductions françaises
│   ├── common.json       # Textes communs (boutons, erreurs, etc.)
│   ├── recipe.json       # Textes liés aux recettes
│   ├── auth.json         # Textes d'authentification
│   └── folders.json      # Textes des dossiers
└── en/                    # Traductions anglaises
    ├── common.json
    ├── recipe.json
    ├── auth.json
    └── folders.json
```

## 🚀 Utilisation dans les Composants

### Exemple basique

```tsx
import { useI18n } from '@/hooks/useI18n';

function MyComponent() {
  const { t } = useI18n('recipe');

  return (
    <View>
      <Text>{t('recipe.title')}</Text>
      <Text>{t('recipe.ingredients')}</Text>
    </View>
  );
}
```

### Avec interpolation (variables)

```tsx
const { t } = useI18n('recipe');

// Fichier JSON: "currentStep": "Étape {{current}}/{{total}}"
<Text>{t('recipe.currentStep', { current: 2, total: 5 })}</Text>
// Affiche: "Étape 2/5"
```

### Avec pluralisation

```tsx
const { t } = useI18n('common');

// Fichier JSON:
// "portion": "portion",
// "portion_plural": "portions"

<Text>{t('units.portion', { count: 1 })}</Text>  // "portion"
<Text>{t('units.portion', { count: 5 })}</Text>  // "portions"
```

### Hooks spécialisés

```tsx
import { useRecipeTranslation } from '@/hooks/useI18n';

function RecipeScreen() {
  const { t } = useRecipeTranslation(); // Équivalent à useI18n('recipe')

  return <Text>{t('recipe.cookButton')}</Text>;
}
```

Hooks disponibles :
- `useCommonTranslation()` → namespace `common`
- `useRecipeTranslation()` → namespace `recipe`
- `useAuthTranslation()` → namespace `auth`
- `useFoldersTranslation()` → namespace `folders`

## 🔧 Détection Automatique de la Langue

Le système détecte automatiquement la langue de l'appareil au démarrage :

1. **Langue supportée** → Utilise cette langue
   - Exemple : Appareil en français → App en français ✅
   - Exemple : Appareil en anglais → App en anglais ✅

2. **Langue non supportée** → Fallback en anglais
   - Exemple : Appareil en danois → App en anglais 🇬🇧
   - Exemple : Appareil en espagnol → App en anglais 🇬🇧

### Langues supportées actuellement

- 🇫🇷 Français (`fr`)
- 🇬🇧 Anglais (`en`)

## ➕ Ajouter une Nouvelle Langue

### 1. Créer les fichiers de traduction

```bash
mkdir locales/es  # Exemple pour l'espagnol
```

Copier et traduire tous les fichiers JSON :
```bash
locales/es/
├── common.json
├── recipe.json
├── auth.json
└── folders.json
```

### 2. Importer dans `services/i18n.ts`

```typescript
// Ajouter l'import
import esCommon from '@/locales/es/common.json';
import esRecipe from '@/locales/es/recipe.json';
import esAuth from '@/locales/es/auth.json';
import esFolders from '@/locales/es/folders.json';

// Ajouter aux ressources
const resources = {
  fr: { ... },
  en: { ... },
  es: {  // Nouvelle langue
    common: esCommon,
    recipe: esRecipe,
    auth: esAuth,
    folders: esFolders,
  },
};

// Mettre à jour les langues supportées
export const SUPPORTED_LANGUAGES = ['fr', 'en', 'es'] as const;
```

C'est tout ! La langue sera automatiquement détectée si l'appareil est configuré en espagnol.

## 📝 Ajouter de Nouvelles Traductions

### 1. Ajouter la clé dans les fichiers JSON

**locales/fr/recipe.json** :
```json
{
  "recipe": {
    "shareSuccess": "Recette partagée avec succès !"
  }
}
```

**locales/en/recipe.json** :
```json
{
  "recipe": {
    "shareSuccess": "Recipe shared successfully!"
  }
}
```

### 2. Utiliser dans le code

```tsx
const { t } = useI18n('recipe');

<Text>{t('recipe.shareSuccess')}</Text>
```

## 🎯 Bonnes Pratiques

### ✅ À FAIRE

- **Organiser par namespace** : Mettre les traductions dans le bon fichier
  - `common.json` → Boutons, erreurs génériques
  - `recipe.json` → Tout ce qui concerne les recettes
  - `auth.json` → Connexion, inscription
  - `folders.json` → Gestion des dossiers

- **Utiliser l'interpolation** pour les variables :
  ```tsx
  t('recipe.currentStep', { current: 2, total: 5 })
  ```

- **Utiliser la pluralisation** pour les quantités :
  ```json
  {
    "portion": "portion",
    "portion_plural": "portions"
  }
  ```

### ❌ À ÉVITER

- ❌ Hardcoder du texte directement :
  ```tsx
  <Text>Cuisiner</Text>  // ❌ NON
  ```

- ✅ Toujours utiliser les traductions :
  ```tsx
  <Text>{t('recipe.cookButton')}</Text>  // ✅ OUI
  ```

- ❌ Dupliquer les traductions dans plusieurs fichiers
- ❌ Utiliser des clés génériques comme `text1`, `label2`
- ✅ Utiliser des clés descriptives comme `cookButton`, `shareSuccess`

## 🔍 Tester les Traductions

### Changer la langue manuellement (pour test)

```tsx
const { changeLanguage } = useI18n();

// Tester en français
changeLanguage('fr');

// Tester en anglais
changeLanguage('en');
```

### Vérifier si une traduction existe

```tsx
const { exists } = useI18n('recipe');

if (exists('recipe.newFeature')) {
  // La traduction existe
} else {
  // Traduction manquante
}
```

## 🌐 Exemples Complets

### Exemple 1 : Écran de recette

```tsx
import { useRecipeTranslation } from '@/hooks/useI18n';

function RecipeScreen() {
  const { t } = useRecipeTranslation();
  const recipe = { servings: 4, totalTime: '30 min' };

  return (
    <View>
      <Text>{t('recipe.title')}</Text>

      <Text>
        {t('recipe.servings')}: {recipe.servings}
      </Text>

      <Text>
        {t('recipe.totalTime')}: {recipe.totalTime}
      </Text>

      <Button title={t('recipe.cookButton')} />
    </View>
  );
}
```

### Exemple 2 : Messages avec interpolation

```tsx
import { useI18n } from '@/hooks/useI18n';

function StepIndicator({ current, total }: { current: number; total: number }) {
  const { t } = useI18n('recipe');

  return (
    <Text>{t('recipe.currentStep', { current, total })}</Text>
  );
}

// Affichera : "Étape 2/5" (FR) ou "Step 2/5" (EN)
```

### Exemple 3 : Dates relatives

```tsx
import { useI18n } from '@/hooks/useI18n';

function formatRelativeDate(daysAgo: number) {
  const { t } = useI18n('common');

  if (daysAgo === 0) return t('time.today');
  if (daysAgo === 1) return t('time.yesterday');
  return t('time.daysAgo', { count: daysAgo });
}

formatRelativeDate(0);  // "Aujourd'hui" / "Today"
formatRelativeDate(1);  // "Hier" / "Yesterday"
formatRelativeDate(3);  // "Il y a 3 jours" / "3 days ago"
```

## 🐛 Débogage

### Activer le mode debug

Le mode debug est activé automatiquement en développement (`__DEV__`).

Logs affichés :
```
📱 [i18n] Langue du système détectée: fr
✅ [i18n] Langue supportée: fr
🌍 [i18n] Langue active: fr
🌍 [i18n] Namespaces chargés: ['common', 'recipe', 'auth', 'folders']
```

### Traduction manquante

Si une clé n'existe pas, i18next affichera la clé elle-même :
```tsx
t('recipe.missingKey')  // Affiche: "recipe.missingKey"
```

### Vérifier la langue active

```tsx
const { language } = useI18n();
console.log('Langue actuelle:', language); // "fr" ou "en"
```

## 🚀 Migration Progressive

Pas besoin de tout traduire d'un coup ! Tu peux migrer progressivement :

1. **Commencer par un écran** (ex: écran de connexion)
2. **Ajouter les traductions** pour cet écran
3. **Remplacer les textes hardcodés** par `t('auth.login')`, etc.
4. **Tester** en changeant la langue
5. **Répéter** pour les autres écrans

Les textes non migrés resteront en français jusqu'à ce que tu les convertisses.

---

**Prêt à rendre Oshii multilingue ! 🌍✨**
