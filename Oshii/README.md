# 🌸 Oshii

**Oshii** est une application mobile culinaire intelligente développée en React Native (TypeScript) avec Expo Router.

Transformez vos vidéos TikTok culinaires en recettes exploitables et lisibles instantanément !

## ✨ Fonctionnalités

- 📱 Interface élégante inspirée de la sobriété japonaise
- 🤖 Analyse automatique de vidéos via OpenAI GPT-4
- 📝 Extraction complète de recettes (ingrédients, étapes, durées)
- ✅ Checklist interactive pour les ingrédients
- ⏱️ Timer intégré pour le suivi de cuisson
- 🔗 Partage direct depuis TikTok/Safari (iOS)

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ installé
- Expo CLI installé globalement : `npm install -g expo-cli`
- Une clé API OpenAI

### Installation

1. **Cloner le projet** (si applicable)

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**

   Créez un fichier `.env` à la racine du projet :

   ```bash
   OPENAI_API_KEY=sk-votre-cle-api-ici
   ```

   Les variables d'environnement sont chargées via `app.config.js` et accessibles via `expo-constants`.
   ⚠️ **Important** : Le fichier `.env` ne doit jamais être commité dans Git (déjà dans `.gitignore`).

4. **Démarrer l'application**

   ```bash
   npx expo start
   ```

   Ou avec cache nettoyé (recommandé) :

   ```bash
   npx expo start -c
   ```

5. **Tester l'application**

   - **iOS** : Appuyez sur `i` dans le terminal ou scannez le QR code avec l'app Expo Go
   - **Android** : Appuyez sur `a` dans le terminal ou scannez le QR code avec l'app Expo Go
   - **Web** : Appuyez sur `w` dans le terminal

## 📁 Structure du projet

```
Oshii/
├── app/                    # Écrans (Expo Router)
│   ├── index.tsx          # Écran d'accueil (HomeScreen)
│   ├── analyze.tsx        # Écran d'analyse (AnalyzeScreen)
│   ├── result.tsx         # Écran de résultat (ResultScreen)
│   └── _layout.tsx        # Configuration de la navigation
├── components/            # Composants réutilisables
│   └── ui/               # Composants UI de base
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── IngredientRow.tsx
│       ├── StepRow.tsx
│       └── LoadingOverlay.tsx
├── constants/            # Constantes (thème, couleurs)
│   └── theme.ts
├── hooks/               # Hooks personnalisés
│   ├── useAnalyzeLink.ts
│   └── use-color-scheme.ts
├── services/            # Services (API, etc.)
│   └── openai.ts
├── stores/             # Stores Zustand
│   └── useRecipeStore.ts
└── types/              # Types TypeScript
    ├── recipe.ts
    └── env.d.ts
```

## 🎨 Design System

### Palette de couleurs

- **Beige clair** : `#F5F1E8`
- **Blanc cassé** : `#FAFAF8`
- **Corail doux** : `#FF8B7A`
- **Gris doux** : `#E5E5E5`

### Typographie

- **Police principale** : Inter ou Poppins
- **Espacements** : 4, 8, 16, 24, 32, 48px
- **Border radius** : 8, 16, 20, 24px

## 🔧 Développement

### Bonnes pratiques respectées

- ✅ TypeScript strict (aucun `any`)
- ✅ Typage complet de tous les composants
- ✅ Code modulaire et bien organisé
- ✅ Compatibilité Expo Go
- ✅ Gestion d'état avec Zustand
- ✅ Design minimaliste et élégant

### Commandes utiles

```bash
# Démarrer avec cache nettoyé
npx expo start -c

# Lancer le linter
npm run lint

# iOS
npx expo start --ios

# Android
npx expo start --android

# Web
npx expo start --web
```

## 📱 Écrans de l'application

### HomeScreen (`/`)

- Champ de saisie pour coller un lien TikTok/vidéo
- Bouton "Analyser" pour démarrer l'analyse
- Gestion des erreurs

### AnalyzeScreen (`/analyze`)

- **Skeleton moderne** avec animations shimmer pendant l'analyse
- **Barre de progression** avec étapes : Transcription → Extraction → Normalisation → Finalisation
- **Bouton "Annuler"** pour arrêter l'analyse (utilise AbortController)
- **Gestion d'erreurs** avec composant ErrorState et bouton "Réessayer"
- **Affichage minimum** de 1200ms pour éviter les flickers
- Appel automatique à l'API OpenAI avec support de l'annulation
- Redirection vers ResultScreen une fois terminé

### ResultScreen (`/result`)

- Affichage complet de la recette
- Liste des ingrédients avec checklist
- Étapes numérotées avec durées
- Temps total et nombre de portions
- Boutons "Démarrer la cuisson" et "Nouveau lien"

## 🔧 API d'analyse

### `useAnalyzeLink()`

Hook personnalisé pour analyser un lien avec support de l'annulation et du suivi de progression.

```typescript
const { analyzeLink, cancelAnalysis } = useAnalyzeLink();

// Analyser un lien avec callbacks de progression
await analyzeLink(url, {
  onProgress: (stage: AnalyzeStage) => {
    console.log(`Étape actuelle: ${stage}`);
  },
  signal?: AbortSignal, // Optionnel : pour contrôle externe
  timeout?: number,      // Optionnel : timeout personnalisé (défaut: 30000ms)
});

// Annuler l'analyse en cours
cancelAnalysis();
```

### `analyzeRecipeFromUrl(url, options?)`

Service OpenAI pour analyser une recette depuis une URL.

```typescript
import { analyzeRecipeFromUrl } from '@/services/openai';

const recipe = await analyzeRecipeFromUrl(url, {
  signal: abortSignal,  // Support AbortController
  timeout: 30000,       // Timeout personnalisé (ms)
});
```

**Gestion des erreurs :**
- `AbortError` : Requête annulée par l'utilisateur ou timeout
- `Error` : Erreur réseau, API, ou validation

## 🔐 Sécurité

⚠️ **Important** : Le fichier `.env` contenant votre clé API OpenAI ne doit **jamais** être commité dans Git. Il est déjà ignoré via `.gitignore`.

## 🛣️ Roadmap

- [ ] Mode "cuisine" avec timer complet
- [ ] Partage iOS via Share Extension
- [ ] Sauvegarde locale des recettes
- [ ] Mode sombre amélioré
- [ ] Support des vidéos YouTube
- [ ] Historique des recettes analysées

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

## 📄 Licence

Ce projet est privé.

---

Développé avec ❤️ et ☕ par l'équipe Oshii
