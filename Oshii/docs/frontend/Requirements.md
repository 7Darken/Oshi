🌸 Concept global

Oshii est une application mobile culinaire intelligente développée en React Native (TypeScript), pensée d’abord pour iOS et compatible avec Expo Go.
L’idée est simple :

L’utilisateur partage un lien TikTok (ou tout autre lien vidéo culinaire) vers Oshii.
L’application analyse la vidéo grâce à OpenAI, en extrait la recette complète (titre, ingrédients, étapes, durées, portions) et la restitue de manière claire, interactive et élégante.

Oshii permet donc de transformer un TikTok culinaire en recette exploitable et lisible instantanément, sans passer par un site ou un backend.

⚙️ Fonctionnement général (100 % local)

Partage du lien depuis TikTok ou Safari

L’utilisateur clique sur “Partager” → “Oshii”.

L’app s’ouvre automatiquement sur l’écran d’analyse (AnalyzeScreen).

Le lien est transmis via une Share Extension iOS (ShareExtension.swift + shareExtensionHandler.ts).

Analyse locale du lien

Le lien est traité directement côté client.

Un prompt OpenAI est envoyé via fetch à l’API (clé en .env).

OpenAI retourne un objet JSON avec :

{
  "title": "Poulet teriyaki",
  "ingredients": [
    {"name": "Poulet", "quantity": "300g"},
    {"name": "Sauce soja", "quantity": "2 c. à soupe"}
  ],
  "steps": [
    {"order": 1, "text": "Faire revenir le poulet", "duration": "5 min"},
    {"order": 2, "text": "Ajouter la sauce", "duration": "3 min"}
  ],
  "total_time": "15 min",
  "servings": 2
}


L’analyse et le stockage se font localement avec Zustand (useRecipeStore.ts).

Affichage clair et interactif

L’app affiche la recette de manière moderne et épurée :

Titre du plat

Liste des ingrédients (checklist)

Étapes numérotées avec durées

Temps total et portions

Possibilité de démarrer un mode “cuisine” avec timer.

🧩 Structure logique de l’app
📱 Écrans principaux

HomeScreen

Champ pour coller un lien TikTok ou URL

Bouton “Analyser”

Redirection vers AnalyzeScreen

AnalyzeScreen

Affiche un état “Analyse en cours...”

Appelle useAnalyzeTikTok() (ou useAnalyzeLink.ts)

Récupère les données via OpenAI

Stocke le résultat dans Zustand

Redirige vers ResultScreen

ResultScreen

Affiche la recette complète :

Ingrédients

Étapes (avec durées)

Bouton “Démarrer cuisson”

Timer intégré

Bouton “Nouveau lien” pour recommencer.

🧠 Hooks et logique interne

useRecipeStore.ts → gère l’état global de la recette.

useAnalyzeTikTok.ts → gère la logique d’appel à OpenAI et la mise à jour du store.

shareExtensionHandler.ts → gère la réception du lien depuis le partage iOS.

openai.ts → service d’appel à l’API OpenAI.

🪶 UI et design system

Palette : beige clair, blanc cassé, corail doux, gris doux.

Typographie : Inter ou Poppins.

Design minimaliste, inspiré de la sobriété japonaise :

Espacements généreux (padding)

Coins arrondis (border-radius 16 à 20)

Icônes simples (Lucide Icons)

Animations légères (Framer Motion)

Composants de base :

Button

Input

Card

IngredientRow

StepRow

LoadingOverlay

🧭 Navigation

Stack Navigation (@react-navigation/native-stack)

3 routes principales :

/home

/analyze

/result

Redirection automatique après analyse.

🔐 Gestion des clés et variables

Fichier .env contenant :

OPENAI_API_KEY=sk-xxxxx


Utilisé via react-native-dotenv.

🔄 Fonctionnalité de partage iOS

Objectif : permettre le partage direct d’un lien TikTok vers Oshii.

Fichiers :

ios/ShareExtension.swift → extension native

src/utils/shareExtensionHandler.ts → réception côté JavaScript

Comportement :

L’app s’ouvre sur AnalyzeScreen dès réception du lien.

L’analyse commence automatiquement.

🚀 Bonnes pratiques à respecter

Respecter le typage strict TypeScript (aucun any).

Ne jamais passer de chaînes à la place de booléens.

Isoler toute la logique API dans services/.

Utiliser Zustand pour la persistance locale.

Nettoyer le cache Metro avant chaque build (npx expo start -c).

Toujours viser compatibilité avec Expo Go.

Code modulaire, clair, et commenté.