# Configuration du Téléchargement TikTok

## ⚠️ Problème Important

TikTok **ne permet PAS** de télécharger directement les vidéos depuis les liens `https://www.tiktok.com/...`. Il faut d'abord extraire l'URL réelle du média.

## 🔧 Solution : Extraire l'URL Réelle

Vous avez deux options :

### Option 1 : Utiliser un Service d'Extraction (Recommandé)

Ajoutez une étape avant l'appel à l'Edge Function pour extraire l'URL réelle :

```typescript
// Exemple avec une API tierce (à adapter selon le service choisi)
async function getTikTokDirectUrl(tiktokUrl: string): Promise<string> {
  // Utiliser un service comme :
  // - yt-dlp (via backend)
  // - tiktok-api
  // - tiktok-downloader API
  // - etc.
  
  const response = await fetch('VOTRE_SERVICE_EXTRACTION', {
    method: 'POST',
    body: JSON.stringify({ url: tiktokUrl }),
  });
  
  const data = await response.json();
  return data.videoUrl; // URL directe du média (ex: https://...amazonaws.com/video.mp4)
}
```

### Option 2 : Modifier l'Edge Function pour Extraire l'URL

Modifiez l'Edge Function Supabase pour utiliser `yt-dlp` ou un service similaire :

```typescript
// Dans l'Edge Function
import { exec } from 'https://deno.land/x/exec/mod.ts';

// Utiliser yt-dlp pour extraire l'URL
const result = await exec(`yt-dlp --get-url "${videoUrl}"`);
const directUrl = result.output.trim();
```

## 📋 Validation Ajoutée

L'Edge Function vérifie maintenant :

1. ✅ **Détection des URLs TikTok** : Refuse les liens `tiktok.com/...` directement
2. ✅ **Validation du format** : Vérifie les magic bytes (MP4, WebM, etc.)
3. ✅ **Détection de corruption** : Vérifie que le fichier n'est pas vide
4. ✅ **Détection HTML** : Détecte si c'est une page d'erreur au lieu d'une vidéo

## 🔍 Debugging

Si vous obtenez des erreurs :

1. **"URL TikTok non supportée directement"** 
   → Vous devez extraire l'URL réelle avant d'appeler l'Edge Function

2. **"Fichier corrompu"** ou **"Format invalide"**
   → L'URL fournie ne pointe pas vers une vidéo valide
   → Vérifiez que l'URL est bien l'URL directe du média

3. **"Fichier trop petit"**
   → L'URL retourne probablement du HTML/JSON au lieu d'une vidéo
   → Vérifiez l'URL dans un navigateur

## 🚀 Prochaines Étapes

1. Implémenter l'extraction de l'URL réelle (Option 1 ou 2)
2. Tester avec une URL directe de vidéo
3. Vérifier les logs de l'Edge Function pour voir les validations

## 📚 Ressources

- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [TikTok API Alternatives](https://zylalabs.com/blog/top-tiktok-video-fetch-api-alternatives-in-2025)

