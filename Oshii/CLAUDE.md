# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Oshii is a mobile recipe extraction app built with React Native (TypeScript) and Expo. Users share TikTok cooking videos, and the app uses OpenAI GPT-4 to extract structured recipes (ingredients, steps, timing) through a custom Express backend.

**Primary language:** French (UI, comments, documentation)

## Tech Stack

- **Framework:** React Native 0.81.5 + Expo SDK 54
- **Routing:** Expo Router 6 (file-based, type-safe)
- **Language:** TypeScript (strict mode, no `any` allowed)
- **State:** Zustand with AsyncStorage persistence
- **Database:** Supabase (auth, recipes, folders, shopping list)
- **Backend:** Express API for video analysis
- **AI:** OpenAI GPT-4 for recipe extraction
- **Payments:** RevenueCat (iOS subscriptions)
- **UI:** Reanimated, Lucide icons, expo-blur

## Development Commands

```bash
# Start development server (recommended: clear cache)
npx expo start -c

# Platform-specific
npx expo start --ios
npx expo start --android

# Linting
npm run lint

# Reset project (clean reinstall)
npm run reset-project
```

## Architecture

### File-Based Routing (Expo Router)

- `app/(tabs)/` - Tab navigation screens (index, search, shopping, profile)
- `app/analyze.tsx` - Recipe analysis with progress tracking
- `app/result.tsx` - Recipe detail view
- `app/steps.tsx` - Cooking mode with step-by-step instructions
- `app/subscription.tsx` - Premium paywall
- `app/welcome.tsx`, `app/login.tsx`, `app/register.tsx` - Auth flow
- `app/_layout.tsx` - Root layout with providers

### State Management

**Zustand stores** (persisted to AsyncStorage):
- `stores/useRecipeStore.ts` - Current recipe + all recipes cache
- `stores/useFolderStore.ts` - User folders
- `stores/useFoodItemsStore.ts` - Shopping list items

**React Context:**
- `contexts/AuthContext.tsx` - Authentication state
- `contexts/NetworkContext.tsx` - Offline detection

### Core Hooks

- `hooks/useAuth.ts` - Login, register, logout, OAuth
- `hooks/useAnalyzeLink.ts` - Recipe analysis with premium checks
- `hooks/useDeepLinking.ts` - TikTok share handling (`oshii://` scheme)
- `hooks/useRecipes.ts` - CRUD operations for recipes
- `hooks/useFolders.ts` - Folder management
- `hooks/useShoppingList.ts` - Shopping list logic
- `hooks/useRevenueCat.ts` - In-app purchase integration

### Services

- `services/supabase.ts` - Supabase client + auth
- `services/api.ts` - Backend API client (recipe analysis)
- `services/revenueCat.ts` - RevenueCat SDK wrapper
- `services/premium.ts` - Premium status synchronization
- `services/appleAuth.ts`, `services/googleAuth.ts` - OAuth providers

### Database Schema (Supabase)

```sql
profiles (id, username, avatar_url, is_premium, free_generations_remaining, ...)
recipes (id, user_id, folder_id, title, servings, prep_time, cook_time, source_url, ...)
ingredients (id, recipe_id, name, quantity, unit, food_item_id)
steps (id, recipe_id, order, text, duration, temperature)
folders (id, user_id, name, icon, created_at)
food_items (id, user_id, name, quantity, unit, checked, created_at)
```

## Recipe Analysis Flow

1. User shares TikTok URL via deep link (`oshii://?url=...`) or manual input
2. `useAnalyzeLink.ts` checks premium status:
   - Free users: 2 generations max
   - Premium users: Unlimited
3. Backend API call to `/analyze` endpoint:
   - Downloads video
   - Transcribes audio
   - Extracts recipe via GPT-4
   - Returns structured JSON
4. Recipe saved to Supabase + Zustand cache
5. Navigate to `result.tsx` screen

## Authentication Flow

```
welcome.tsx → login.tsx/register.tsx → onboarding.tsx → (tabs)/index.tsx
                      ↓
                auth-callback.tsx (OAuth redirect)
```

- Email/password + OAuth (Google, Apple Sign In)
- Session stored in SecureStore
- Auto token refresh via Supabase client

## Premium/Freemium Model

- **Free:** 2 recipe generations
- **Premium:** Unlimited generations (via RevenueCat subscription)
- Counter decrements in `useAnalyzeLink.ts` on successful analysis
- Premium status synced: RevenueCat → Supabase → Local state
- Paywall modal shown when free limit reached

## Environment Variables

Required in `.env` (NEVER commit):

```bash
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
REVENUECAT_IOS_API_KEY=appl_...
```

Accessed via `Constants.expoConfig.extra` (loaded in `app.config.js`)

## Configuration Files

- `app.config.js` - Expo config with env vars, custom scheme (`oshii://`), bundle ID
- `tsconfig.json` - Strict TypeScript, path alias `@/*` → `./`
- `babel.config.js` - Module resolver for path alias, Reanimated plugin (must be last)

## Development Guidelines

1. **TypeScript:** Strict mode enforced - no `any`, all types must be explicit
2. **State updates:** Use Zustand stores for global state, local state for UI-only
3. **API calls:** Always handle offline scenarios (check `useNetworkStatus`)
4. **Premium checks:** Verify `is_premium` or `free_generations_remaining` before costly operations
5. **Navigation:** Use `router.push()` from `expo-router` (type-safe)
6. **Components:** Atomic design - `components/ui/` for base components
7. **Error handling:** Catch `NotRecipeError` for non-culinary content from backend
8. **Cache clearing:** Run `npx expo start -c` when dependencies change

## Native iOS Features

- **Share Extension:** `ios/ShareFromTikTok/` - Receives shared URLs from TikTok
- **Deep linking:** Custom scheme `oshii://` handled in `useDeepLinking.ts`
- **Secure storage:** `expo-secure-store` for auth tokens
- **Haptics:** `expo-haptics` for feedback on interactions
- **Apple Sign In:** Native capability configured in Xcode

## Testing

Minimal test coverage exists:
- `__tests__/RecipeAnalyzeSkeleton.test.tsx`
- `__tests__/useAnalyzeLink.test.ts`

Run tests with standard Jest commands (not configured in package.json).

## Common Issues & Fixes

Refer to technical documentation for known issues:
- `DEEP_LINKING_IMPLEMENTATION.md` - Deep linking setup
- `APPLE_SIGN_IN_SETUP.md` - Apple OAuth configuration
- `RECIPE_EXISTS_FIX.md` - Handling duplicate recipes
- `SKELETON_STUCK_FIX.md` - Loading state bug
- `DOUBLE_DECREMENTATION_FIX.md` - Free generation counter bug

## Key Design Principles

**Visual style:** Minimal, Japanese-inspired design
- Colors: Beige clair (#F5F1E8), Blanc cassé (#FAFAF8), Corail doux (#FF8B7A)
- Typography: Inter/Poppins with generous spacing (4, 8, 16, 24, 32, 48px)
- Border radius: 8, 16, 20, 24px
- Smooth animations via Reanimated (60fps)

**Offline-first:**
- Zustand stores persist to AsyncStorage
- Network detection via `@react-native-community/netinfo`
- Offline banner when disconnected
- Background sync on reconnection

## Path Alias

Use `@/` to import from root:

```typescript
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
```
