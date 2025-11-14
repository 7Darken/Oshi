# 🍎 Apple Sign In - Documentation

## 📋 Vue d'ensemble

Le système d'authentification Apple Sign In permet aux utilisateurs de se connecter avec leur compte Apple **via OAuth Web**. Il utilise le même pattern que Google OAuth pour garantir la compatibilité avec le Service ID configuré dans Supabase.

### ✅ Fonctionnalités
- ✅ Authentification via WebBrowser OAuth (pas de SDK natif Apple)
- ✅ Compatible avec Service ID Supabase (`com.x7kenz.Oshii.auth`)
- ✅ Création automatique de compte pour les nouveaux utilisateurs
- ✅ Connexion pour les utilisateurs existants
- ✅ Extraction du nom complet depuis Apple (si partagé)
- ✅ Redirection vers onboarding ou home selon le statut
- ✅ Gestion de l'annulation par l'utilisateur

## 🏗️ Architecture

### Fichiers impliqués

1. **`services/appleAuth.ts`**
   - Service principal pour l'authentification Apple OAuth
   - Utilise `WebBrowser.openAuthSessionAsync` (comme Google)
   - Gère la communication avec Supabase via OAuth Web

2. **`hooks/useAuth.ts`**
   - Ajout de `signInWithApple()` dans le hook
   - Gestion des états de chargement

3. **`contexts/AuthContext.tsx`**
   - Exposition de `signInWithApple()` dans le contexte
   - Disponible partout dans l'app

4. **`app/welcome.tsx`**
   - Bouton "Continuer avec Apple" fonctionnel
   - Gestion des états de chargement et erreurs

## 🔧 Configuration

### Configuration Supabase

**Client ID / Service ID** : `com.x7kenz.Oshii.auth`

Ce Service ID doit être configuré dans :
1. **Supabase Dashboard** → Authentication → Providers → Apple
   - **Client ID** : `com.x7kenz.Oshii.auth`
   - Configurer les autres paramètres selon la documentation Supabase

2. **Apple Developer Console**
   - Service ID : `com.x7kenz.Oshii.auth`
   - Activer "Sign In with Apple"
   - Configurer les domaines et redirect URLs

### Configuration App

**Bundle ID** : `com.x7kenz.Oshii`  
**Service ID** : `com.x7kenz.Oshii.auth`

⚠️ **Important** : Le Bundle ID (`com.x7kenz.Oshii`) et le Service ID (`com.x7kenz.Oshii.auth`) sont **différents**. C'est normal ! Le flux OAuth Web utilise le Service ID, ce qui résout le problème d'audience dans le token.

## 📊 Flux d'authentification

### 1️⃣ Utilisateur clique sur "Continuer avec Apple"

```
WelcomeScreen
    ↓
handleAppleLogin()
    ↓
signInWithApple() [AuthContext]
    ↓
handleSignInWithApple() [useAuth]
    ↓
signInWithAppleService() [appleAuth.ts]
```

### 2️⃣ Démarrage du flux OAuth

```typescript
// Dans appleAuth.ts
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'apple',
  options: {
    redirectTo: 'oshii://auth-callback',
    skipBrowserRedirect: false,
  },
});

// data.url = URL Supabase qui redirige vers Apple OAuth
```

### 3️⃣ Ouverture du navigateur

```typescript
const result = await WebBrowser.openAuthSessionAsync(
  data.url,  // URL Supabase → Apple OAuth
  'oshii://auth-callback'
);

// Le navigateur s'ouvre
// L'utilisateur se connecte avec Apple
// Apple redirige vers Supabase avec le Service ID correct
// Supabase redirige vers l'app avec les tokens
```

### 4️⃣ Extraction des tokens depuis l'URL de callback

```typescript
// URL de callback : oshii://auth-callback?access_token=...&refresh_token=...
const url = new URL(result.url);
const accessToken = url.searchParams.get('access_token');
const refreshToken = url.searchParams.get('refresh_token');
```

### 5️⃣ Création de la session Supabase

```typescript
const { data: sessionData, error } = await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: refreshToken,
});

// La session est créée avec les bons tokens
// Le token Apple a maintenant l'audience correcte (Service ID)
```

### 6️⃣ Création/Vérification du profil

```typescript
// Vérifier si profil existe
const { data: existingProfile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

if (!existingProfile) {
  // NOUVEAU COMPTE
  await supabase.from('profiles').insert({
    id: userId,
    username: profileData.name,  // Nom extrait d'Apple
    onboarding_completed: false,
    profile_type: null,
  });
  
  return { needsOnboarding: true };
} else {
  // COMPTE EXISTANT
  return { needsOnboarding: !existingProfile.onboarding_completed };
}
```

### 7️⃣ Redirection finale

```typescript
// Dans welcome.tsx
router.push('/auth-callback');

// auth-callback.tsx vérifie:
if (!onboarding_completed) {
  router.replace('/onboarding');
} else {
  router.replace('/(tabs)');
}
```

## 🎯 Avantages de cette approche

### ✅ OAuth Web vs SDK Natif

| Critère | OAuth Web (Notre solution) | SDK Natif Apple |
|---------|---------------------------|------------------|
| **Service ID** | ✅ Utilise `com.x7kenz.Oshii.auth` | ❌ Force le Bundle ID |
| **Compatibilité Supabase** | ✅ Parfaite | ❌ Problème d'audience |
| **Complexité** | ✅ Simple (même pattern que Google) | ❌ Configuration complexe |
| **Maintenance** | ✅ Facile | ❌ Nécessite config Xcode |
| **Cross-platform** | ✅ Fonctionne iOS et Android | ❌ iOS uniquement |

### 🔒 Sécurité

- ✅ Le flux OAuth est entièrement géré par Supabase
- ✅ Les tokens sont validés côté serveur
- ✅ Le Service ID correct est utilisé
- ✅ Pas de manipulation manuelle de tokens JWT

### 📱 Expérience utilisateur

- ✅ Popup de connexion Apple standard
- ✅ Remplissage automatique des identifiants
- ✅ Touch ID / Face ID supporté
- ✅ Gestion de l'annulation sans erreur

## 🎨 Cas d'usage

### Cas 1 : Nouvel utilisateur avec email partagé

```
1. User clique "Continuer avec Apple"
2. Navigateur s'ouvre → Apple OAuth
3. User se connecte et partage email + nom
4. Email: "john.doe@icloud.com"
5. Nom: "John Doe"
6. Supabase crée compte
7. Profil créé avec username: "John Doe"
8. Redirection → /onboarding
```

### Cas 2 : Nouvel utilisateur qui masque son email

```
1. User clique "Continuer avec Apple"
2. Navigateur s'ouvre → Apple OAuth
3. User masque son email
4. Apple génère: "xxx@privaterelay.appleid.com"
5. Nom: "John Doe"
6. Supabase crée compte avec email relay
7. Profil créé avec username: "John Doe"
8. Redirection → /onboarding
```

### Cas 3 : Utilisateur existant

```
1. User clique "Continuer avec Apple"
2. Navigateur s'ouvre → Apple OAuth
3. Authentification automatique (déjà connecté)
4. Supabase trouve le compte existant
5. Vérifie onboarding_completed
6. Redirection → /(tabs) ou /onboarding
```

### Cas 4 : Utilisateur annule

```
1. User clique "Continuer avec Apple"
2. Navigateur s'ouvre → Apple OAuth
3. User appuie sur "Annuler"
4. result.type === 'cancel'
5. Retour silencieux sur welcome screen
6. Aucune alerte affichée
```

## 📝 Logs de débogage

### Authentification réussie

```
🍎 [Apple Auth] Démarrage de l'authentification Apple OAuth...
🔗 [Apple Auth] Redirect URL: oshii://auth-callback
🔗 [Apple Auth] Ouverture du navigateur pour l'authentification...
🔗 [Apple Auth] OAuth URL: https://...supabase.co/auth/v1/authorize?provider=apple
📱 [Apple Auth] Résultat du navigateur: success
✅ [Apple Auth] Callback URL reçue: oshii://auth-callback?access_token=...
🔑 [Apple Auth] Tokens extraits: { hasAccessToken: true, hasRefreshToken: true }
🔐 [Apple Auth] Création de la session avec les tokens...
✅ [Apple Auth] Session créée avec succès
👤 [Apple Auth] Utilisateur: john.doe@icloud.com
📋 [Apple Auth] Extraction des données de profil...
📋 [Apple Auth] Données de profil extraites: { name: 'John Doe', email: 'john.doe@icloud.com' }
💾 [Apple Auth] Mise à jour du profil...
🆕 [Apple Auth] Création d'un nouveau profil
✅ [Apple Auth] Profil mis à jour avec succès
✅ [Apple Auth] Authentification Apple complétée avec succès
✅ [Welcome] Authentification Apple réussie
🔄 [Welcome] Navigation vers /auth-callback
```

### Annulation

```
🍎 [Apple Auth] Démarrage de l'authentification Apple OAuth...
🔗 [Apple Auth] Ouverture du navigateur pour l'authentification...
📱 [Apple Auth] Résultat du navigateur: cancel
ℹ️ [Apple Auth] Authentification annulée par l'utilisateur
```

## 🔄 Différences avec Google OAuth

Les deux flux sont **identiques** :

| Étape | Apple | Google |
|-------|-------|--------|
| 1. Init OAuth | `signInWithOAuth({ provider: 'apple' })` | `signInWithOAuth({ provider: 'google' })` |
| 2. Navigateur | `WebBrowser.openAuthSessionAsync()` | `WebBrowser.openAuthSessionAsync()` |
| 3. Callback | `oshii://auth-callback?tokens...` | `oshii://auth-callback?tokens...` |
| 4. Session | `setSession({ tokens })` | `setSession({ tokens })` |
| 5. Profil | Extraction + Upsert | Extraction + Upsert |

✅ **Avantage** : Code réutilisable, maintenance simplifiée

## 🧪 Testing

### Prérequis

1. **Apple Developer Console**
   - Service ID créé : `com.x7kenz.Oshii.auth`
   - Sign In with Apple activé
   - Domaines configurés (selon Supabase)

2. **Supabase Dashboard**
   - Apple provider activé
   - Client ID : `com.x7kenz.Oshii.auth`
   - Clés et certificats configurés

3. **App iOS**
   - Bundle ID : `com.x7kenz.Oshii`
   - URL Scheme : `oshii`

### Tester le flux

```bash
# 1. Lancer l'app sur iOS
npx expo run:ios

# 2. Aller sur l'écran Welcome
# 3. Cliquer sur "Continuer avec Apple"
# 4. Vérifier que le navigateur s'ouvre
# 5. Se connecter avec Apple ID
# 6. Vérifier la redirection et la création de compte
```

### Debug en cas de problème

1. **Vérifier les logs** : Tous les logs commencent par `[Apple Auth]`
2. **Vérifier l'URL de callback** : Doit contenir `access_token` et `refresh_token`
3. **Vérifier Supabase** : Le compte doit être créé dans `auth.users`
4. **Vérifier le profil** : Le profil doit être dans `public.profiles`

## ⚠️ Limitations

### 1. Nom disponible uniquement à la première connexion

Apple ne fournit le nom complet qu'à la **première authentification**. Lors des connexions suivantes, le nom n'est pas renvoyé.

**Solution** : Le nom est sauvegardé dans la base de données au premier login.

### 2. Email privé Apple Relay

Si l'utilisateur choisit "Masquer mon adresse e-mail", Apple crée une adresse `@privaterelay.appleid.com` qui redirige vers l'email réel.

**Solution** : L'email relay est sauvegardé tel quel. L'utilisateur peut mettre à jour son email dans les paramètres plus tard.

### 3. Nécessite un navigateur

Le flux OAuth nécessite l'ouverture d'un navigateur, contrairement au SDK natif.

**Avantage** : Plus simple à maintenir et compatible avec Supabase.

## ✅ Checklist d'intégration

- [x] Package `expo-web-browser` installé (déjà inclus)
- [x] Service `appleAuth.ts` créé (OAuth Web)
- [x] Hook `useAuth.ts` mis à jour
- [x] Context `AuthContext.tsx` mis à jour
- [x] Bouton Apple fonctionnel dans `welcome.tsx`
- [x] Extraction des données de profil
- [x] Création automatique de profil
- [x] Gestion de l'annulation par l'utilisateur
- [x] Logs de débogage détaillés
- [ ] Configuration Apple Developer Console (Service ID)
- [ ] Configuration Supabase (Apple provider)
- [ ] Tests sur appareil iOS physique
- [ ] Validation en production

## 🔄 Maintenance

### Mise à jour du Service ID

Si le Service ID change, modifier dans :
1. **Supabase Dashboard** (Client ID)
2. **Apple Developer Console** (Service ID)
3. **Cette documentation**

### Ajout de scopes OAuth

Par défaut, Supabase demande les scopes nécessaires. Si besoin de plus :

```typescript
// Dans appleAuth.ts (optionnel)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'apple',
  options: {
    redirectTo: redirectUrl,
    scopes: 'name email', // Scopes supplémentaires
  },
});
```

## 📚 Ressources

- [Supabase Apple OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Expo WebBrowser Documentation](https://docs.expo.dev/versions/latest/sdk/webbrowser/)

---

**Version** : 2.0 (OAuth Web)  
**Dernière mise à jour** : 3 novembre 2025  
**Service ID** : com.x7kenz.Oshii.auth  
**Bundle ID** : com.x7kenz.Oshii
