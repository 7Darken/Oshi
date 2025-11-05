# Implémentation Deep Linking - Documentation Technique

## 🎯 Vue d'ensemble

L'implémentation du deep linking pour Oshii permet de :
1. Recevoir des liens TikTok partagés depuis l'app TikTok via Share Extension iOS
2. Ouvrir automatiquement l'app Oshii
3. Vérifier l'authentification de l'utilisateur
4. Lancer l'analyse de la recette automatiquement

## 🏗️ Architecture

### Composants créés

1. **Hook personnalisé** : `hooks/useDeepLinking.ts`
   - Gère la logique de détection et traitement des deep links
   - Intégré dans le `_layout.tsx` racine

2. **Modifications du layout** : `app/_layout.tsx`
   - Restructuration pour permettre l'utilisation de hooks dans le contexte Auth
   - Séparation entre `RootLayout` (providers) et `RootNavigator` (navigation + hooks)

### Flow du Deep Linking

```
TikTok App → Share Extension → Deep Link URL
                                      ↓
                              Linking.addEventListener
                                      ↓
                              useDeepLinking Hook
                                      ↓
                            Vérification Auth ←→ AuthContext
                                      ↓
                              Parser l'URL TikTok
                                      ↓
                            Navigation /analyze
                                      ↓
                           Analyse automatique
```

## 📂 Fichiers modifiés/créés

### 1. `hooks/useDeepLinking.ts` (nouveau)

**Responsabilités** :
- Écouter les événements `url` de `Linking`
- Gérer l'URL initiale au démarrage de l'app
- Vérifier l'authentification de l'utilisateur
- Valider que l'URL est bien un lien TikTok
- Éviter les doublons et traitements simultanés
- Naviguer vers l'écran d'analyse avec l'URL encodée

**Points clés** :

```typescript
// Éviter les doublons
const hasProcessedUrl = useRef<Set<string>>(new Set());

// Éviter les traitements simultanés
const processingUrl = useRef<string | null>(null);

// Nettoyer le cache toutes les 5 minutes
useEffect(() => {
  const interval = setInterval(() => {
    hasProcessedUrl.current.clear();
  }, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

**Gestion des cas particuliers** :

1. **App fermée** : `Linking.getInitialURL()` récupère l'URL au démarrage
2. **App ouverte** : `Linking.addEventListener('url')` écoute les nouveaux liens
3. **Auth en cours** : Attente que `isAuthLoading` soit `false`
4. **User non authentifié** : Redirection vers `/welcome`

### 2. `app/_layout.tsx` (modifié)

**Avant** :
```typescript
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <Stack>...</Stack>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

**Après** :
```typescript
function RootNavigator() {
  useDeepLinking(); // Hook qui a besoin du contexte Auth
  
  return (
    <ThemeProvider>
      <Stack>...</Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator /> {/* Maintenant à l'intérieur du AuthProvider */}
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

**Raison** : Le hook `useDeepLinking` a besoin d'accéder au contexte `AuthProvider` via `useAuth()`. Il doit donc être appelé dans un composant enfant de `AuthProvider`.

### 3. `app.config.js` (déjà configuré)

Le scheme `oshii` est déjà configuré :
```javascript
scheme: 'oshii',
```

Cela permet les deep links au format : `oshii://?url=https://tiktok.com/...`

## 🔄 Flow détaillé

### Scénario 1 : App fermée

1. Utilisateur partage un lien TikTok depuis TikTok
2. Share Extension créée le deep link `oshii://?url=...`
3. iOS lance l'app Oshii
4. `RootLayout` monte → `AuthProvider` monte → `RootNavigator` monte
5. `useDeepLinking` s'exécute
6. `Linking.getInitialURL()` récupère l'URL
7. Attente que `isAuthLoading` soit `false`
8. Vérification que `user` existe
9. Parsing et validation de l'URL TikTok
10. Navigation vers `/analyze?url=...`
11. L'écran `analyze.tsx` lance l'analyse automatiquement

### Scénario 2 : App déjà ouverte

1. Utilisateur partage un lien TikTok depuis TikTok
2. Share Extension créée le deep link `oshii://?url=...`
3. iOS bascule vers l'app Oshii (déjà ouverte)
4. `Linking.addEventListener('url')` reçoit l'événement
5. Vérification Auth (déjà chargée)
6. Parsing et validation
7. Navigation vers `/analyze?url=...`

### Scénario 3 : Utilisateur non authentifié

1. Deep link reçu
2. `isAuthLoading` est `false`
3. `user` est `null`
4. Log : `❌ [Deep Link] Utilisateur non authentifié`
5. Redirection vers `/welcome`
6. Utilisateur doit se connecter/créer un compte

## 🛡️ Protections implémentées

### 1. Prévention des doublons
```typescript
const hasProcessedUrl = useRef<Set<string>>(new Set());

if (hasProcessedUrl.current.has(sharedUrl)) {
  console.log('⏭️ [Deep Link] URL déjà traitée, ignorée');
  return;
}

hasProcessedUrl.current.add(sharedUrl);
```

### 2. Prévention des traitements simultanés
```typescript
const processingUrl = useRef<string | null>(null);

if (processingUrl.current === sharedUrl) {
  console.log('⏳ [Deep Link] URL en cours de traitement, ignorée');
  return;
}

processingUrl.current = sharedUrl;
```

### 3. Validation de l'URL TikTok
```typescript
if (!sharedUrl.includes('tiktok.com')) {
  console.log('⚠️ [Deep Link] URL non TikTok ignorée');
  return;
}
```

### 4. Nettoyage du cache
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    hasProcessedUrl.current.clear();
    console.log('🧹 [Deep Link] Cache des URLs nettoyé');
  }, 5 * 60 * 1000); // Toutes les 5 minutes

  return () => clearInterval(interval);
}, []);
```

## 🧪 Tests recommandés

### Test 1 : App fermée, utilisateur authentifié
1. Forcer fermer l'app Oshii
2. Ouvrir TikTok
3. Partager une vidéo vers Oshii
4. ✅ L'app doit s'ouvrir et lancer l'analyse

### Test 2 : App ouverte, utilisateur authentifié
1. Ouvrir Oshii (n'importe quel écran)
2. Ouvrir TikTok
3. Partager une vidéo vers Oshii
4. ✅ L'app doit basculer et lancer l'analyse

### Test 3 : Utilisateur non authentifié
1. Se déconnecter de Oshii
2. Partager une vidéo TikTok vers Oshii
3. ✅ L'app doit ouvrir l'écran de connexion

### Test 4 : Partage multiple rapide
1. Partager 3 vidéos TikTok rapidement
2. ✅ Une seule doit être traitée
3. ✅ Les autres doivent être ignorées (logs dans console)

### Test 5 : URL non TikTok
1. Partager une URL non-TikTok vers Oshii (via une autre app)
2. ✅ Doit être ignorée (log dans console)

## 📊 Logs de debug

Tous les logs commencent par `[Deep Link]` :

| Emoji | Message | Signification |
|-------|---------|---------------|
| 🔗 | `URL reçue:` | Un deep link a été détecté |
| ⏳ | `En attente de l'authentification...` | Auth en cours de chargement |
| ❌ | `Utilisateur non authentifié` | Redirection vers login |
| ⚠️ | `Aucune URL TikTok trouvée` | Paramètre `url` manquant |
| ⏭️ | `URL déjà traitée, ignorée` | Doublon détecté |
| ⏳ | `URL en cours de traitement` | Traitement simultané évité |
| ⚠️ | `URL non TikTok ignorée` | L'URL ne contient pas "tiktok.com" |
| ✅ | `Lien TikTok valide reçu:` | Validation réussie |
| 🚀 | `Navigation vers l'écran d'analyse...` | Lancement de l'analyse |
| 🧹 | `Cache des URLs nettoyé` | Nettoyage périodique |

## 🔧 Dépannage

### Problème : Le deep link ne fonctionne pas

**Solutions** :
1. Vérifier que le scheme `oshii` est bien configuré dans `app.config.js`
2. Rebuild l'app après modification du scheme
3. Tester sur device physique (pas simulateur)
4. Vérifier les logs dans Metro/Xcode

### Problème : L'app s'ouvre mais n'analyse pas

**Solutions** :
1. Vérifier que l'utilisateur est authentifié
2. Regarder les logs `[Deep Link]` dans la console
3. Vérifier que l'URL contient bien "tiktok.com"
4. Vérifier que le paramètre `?url=...` est présent

### Problème : Multiples analyses lancées

**Solutions** :
1. Vérifier que les `useRef` sont bien utilisés
2. Augmenter le délai dans `setTimeout` (actuellement 300ms)
3. Vérifier qu'il n'y a pas d'autres listeners `Linking` ailleurs

## 🚀 Améliorations futures possibles

1. **Toast de confirmation** : Afficher un toast "Analyse en cours..." quand le deep link est traité
2. **Gestion d'erreurs** : Si l'analyse échoue, proposer de réessayer
3. **File d'attente** : Permettre le traitement séquentiel de plusieurs liens
4. **Analytics** : Tracker les sources de partage (combien viennent de TikTok vs saisie manuelle)
5. **Support Android** : Implémenter une Share Extension pour Android

