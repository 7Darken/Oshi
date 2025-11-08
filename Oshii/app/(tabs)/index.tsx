/**
 * Onglet Home - Analyser les vidéos TikTok et afficher les recettes
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Plus, Crown, Sparkles, Star } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { FolderCard } from '@/components/ui/FolderCard';
import { CreateFolderSheet } from '@/components/CreateFolderSheet';
import { OshiiLogo } from '@/components/ui/OshiiLogo';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { useRecipes } from '@/hooks/useRecipes';
import { useFolders } from '@/hooks/useFolders';
import { useSharedRecipeIds } from '@/hooks/useSharedRecipeIds';
import { SYSTEM_FOLDERS } from '@/constants/systemFolders';

// Composant mémorisé pour le container des dossiers (évite les re-renders inutiles)
const FoldersContainer = React.memo(({
  folders,
  orphanCount,
  colors,
  colorScheme,
  router,
  handleFolderPress,
  setShowFolderSheet,
  isPremium,
  freeGenerationsRemaining,
  cardWidth,
  onOpenPaywall,
}: {
  folders: { id: string; name: string; icon_name?: string; recipes_count?: number }[];
  orphanCount: number;
  colors: any;
  colorScheme: 'light' | 'dark';
  router: any;
  handleFolderPress: (folderId: string, folderName: string) => void;
  setShowFolderSheet: (show: boolean) => void;
  isPremium: boolean;
  freeGenerationsRemaining: number;
  cardWidth: number;
  onOpenPaywall: () => void;
}) => {
  if (folders.length === 0 && orphanCount === 0) return null;

  return (
    <View style={styles.foldersContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes recettes</Text>
        {!isPremium && (
          <View style={[
            styles.generationsCounter, 
            { 
              backgroundColor: colorScheme === 'dark' 
                ? 'rgba(249, 64, 60, 0.15)' 
                : 'rgba(249, 64, 60, 0.1)',
            }
          ]}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={[styles.generationsCounterText, { color: colors.primary }]}>
              {freeGenerationsRemaining}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.foldersGrid}>
        {/* Dossier fictif "Non enregistrés" */}
        {orphanCount > 0 && (
          <View style={{ width: cardWidth }}>
            <FolderCard
              name="Non enregistrés"
              recipeCount={orphanCount}
              iconName="folder"
              onPress={() => {
                router.push('/folder?folderId=null' as any);
              }}
            />
          </View>
        )}
        {/* Dossiers réels */}
        {folders.map((folder) => {
          const isReceivedFolder = folder.id === SYSTEM_FOLDERS.RECEIVED;
          const isLocked = isReceivedFolder && !isPremium;

          return (
            <View key={folder.id} style={{ width: cardWidth }}>
              <FolderCard
                name={folder.name}
                recipeCount={folder.recipes_count || 0}
                iconName={folder.icon_name}
                isLocked={isLocked}
                onPress={() => {
                  if (isLocked) {
                    onOpenPaywall();
                  } else {
                    handleFolderPress(folder.id, folder.name);
                  }
                }}
              />
            </View>
          );
        })}
        {/* Carte "+ Nouveau dossier" */}
        <TouchableOpacity
          style={[styles.newFolderCard, { backgroundColor: colors.card, borderColor: colors.border, width: cardWidth }]}
          onPress={() => setShowFolderSheet(true)}
          activeOpacity={0.7}
        >
          <View style={styles.newFolderIconContainer}>
            <View style={[styles.newFolderIconBackground, { backgroundColor: colorScheme === 'dark' ? 'rgba(249, 64, 60, 0.15)' : 'rgba(249, 64, 60, 0.1)' }]}>
              <Plus size={28} color={colors.primary} strokeWidth={1.5} />
            </View>
          </View>
          <Text style={[styles.newFolderLabel, { color: colors.text }]}>
            Nouveau dossier
          </Text>
          <Text style={[styles.newFolderSubLabel, { color: colors.icon }]}>
            {' '}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

FoldersContainer.displayName = 'FoldersContainer';

export default function HomeScreen() {
  const [showFolderSheet, setShowFolderSheet] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width: windowWidth } = useWindowDimensions();
  const { recipes, isLoading: recipesLoading, error: recipesError, refresh: refreshRecipes } = useRecipes();
  const { folders, createFolder, refresh: refreshFolders } = useFolders();
  const { sharedRecipeIds } = useSharedRecipeIds();
  const { isPremium, profile, refreshFreeGenerations, user } = useAuthContext();
  const hasOpenedPaywall = useRef(false);
  const lastRefreshTime = useRef<number>(0);
  
  // Calculer la largeur des cartes pour 2 par ligne
  const cardWidth = useMemo(() => {
    const horizontalPadding = Spacing.lg * 2; // Padding gauche + droite
    const gap = Spacing.md; // Gap entre les cartes
    const availableWidth = windowWidth - horizontalPadding;
    return (availableWidth - gap) / 2;
  }, [windowWidth]);
  
  // Loading combiné pour le chargement initial
  const isLoading = recipesLoading;

  // Ouvrir le paywall automatiquement si l'utilisateur vient de terminer l'onboarding
  useEffect(() => {
    if (params.fromOnboarding === 'true' && !hasOpenedPaywall.current) {
      hasOpenedPaywall.current = true;
      // Petit délai pour une meilleure UX
      const timer = setTimeout(() => {
        router.push('/subscription' as any);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [params.fromOnboarding, router]);

  // Rafraîchir free_generations_remaining au chargement initial (pour les non-premium)
  useEffect(() => {
    if (!isPremium && user?.id) {
      // Petit délai pour laisser le temps au contexte de se charger
      const timer = setTimeout(() => {
        refreshFreeGenerations(true).catch(err => {
          if (__DEV__) {
            console.error('❌ [Home] Erreur lors du refresh initial de free_generations_remaining:', err);
          }
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPremium, user?.id, refreshFreeGenerations]);

  // Calculer les recettes non associées à un dossier (mémorisé pour éviter les re-renders)
  // Exclure les recettes partagées (qui sont dans le dossier "Envoyés")
  const orphanCount = useMemo(() => {
    return recipes.filter((recipe) => {
      // Exclure les recettes avec folder_id
      if (recipe.folder_id) return false;

      // Exclure les recettes partagées
      if (sharedRecipeIds.includes(recipe.id)) return false;

      return true;
    }).length;
  }, [recipes, sharedRecipeIds]);


  const handleFolderPress = useCallback((folderId: string, folderName: string) => {
    router.push(`/folder?folderId=${folderId}` as any);
  }, [router]);

  const handleCreateFolder = async (name: string, iconName: string): Promise<boolean> => {
    const newFolder = await createFolder(name, iconName);
    return !!newFolder;
  };

  const handleOpenPaywall = useCallback(() => {
    router.push('/subscription' as any);
  }, [router]);

  // Rafraîchir les dossiers, recettes et free_generations_remaining quand l'écran redevient actif (optimisé avec debounce)
  useFocusEffect(
    useCallback(() => {
      // Debounce: éviter les refresh trop fréquents (minimum 2 secondes entre chaque refresh)
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;

      if (timeSinceLastRefresh < 2000) {
        console.log('🔒 [Home] Refresh ignoré (debounce:', timeSinceLastRefresh, 'ms)');
        return;
      }

      lastRefreshTime.current = now;
      console.log('🔄 [Home] Refresh silencieux des données...');

      // Utiliser Promise.all pour paralléliser les requêtes au lieu de les lancer séquentiellement
      const refreshPromises = [
        refreshFolders().catch(err => {
          console.error('❌ [Home] Erreur lors du refresh des dossiers:', err);
        }),
        refreshRecipes().catch(err => {
          console.error('❌ [Home] Erreur lors du refresh des recettes:', err);
        }),
      ];

      // Rafraîchir free_generations_remaining uniquement pour les non-premium (silencieux)
      if (!isPremium) {
        refreshPromises.push(
          refreshFreeGenerations(true).catch(err => {
            // Erreur silencieuse, ne pas logger en prod pour éviter le spam
            if (__DEV__) {
              console.error('❌ [Home] Erreur lors du refresh de free_generations_remaining:', err);
            }
          })
        );
      }

      // Attendre que toutes les requêtes soient terminées
      Promise.all(refreshPromises).then(() => {
        console.log('✅ [Home] Refresh terminé');
      });
    }, [isPremium])
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header - affiché seulement s'il y a des recettes (pas dépendant du loading pour éviter la disparition) */}
        {recipes.length > 0 && !recipesError && (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <OshiiLogo size="md" />
              <Text style={[styles.title, { color: colors.text }]}>Oshii</Text>
            </View>
            {isPremium ? (
              <View style={[styles.proTag, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                <Star size={14} color={colors.primary} fill={colors.primary} />
                <Text style={[styles.proTagText, { color: colors.primary }]}>Oshii Pro</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.premiumButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/subscription' as any)}
                activeOpacity={0.8}
              >
                <Crown size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.premiumButtonText}>Premium</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Liste des dossiers - Composant mémorisé pour éviter les re-renders */}
        <FoldersContainer
          folders={folders}
          orphanCount={orphanCount}
          colors={colors}
          colorScheme={colorScheme ?? 'light'}
          router={router}
          handleFolderPress={handleFolderPress}
          setShowFolderSheet={setShowFolderSheet}
          isPremium={isPremium}
          freeGenerationsRemaining={profile?.free_generations_remaining ?? 0}
          cardWidth={cardWidth}
          onOpenPaywall={handleOpenPaywall}
        />

        {/* Empty state si aucune recette */}
        {!isLoading && !recipesError && recipes.length === 0 && (
          <View style={styles.emptyStateContainer}>
            {/* Logo Oshii en haut à gauche */}
            <View style={styles.emptyStateHeader}>
              <View style={styles.headerLeft}>
                <OshiiLogo size="md" />
                <Text style={[styles.emptyStateHeaderText, { color: colors.text }]}>Oshii</Text>
              </View>
              {isPremium ? (
                <View style={[styles.proTag, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                  <Star size={14} color={colors.primary} fill={colors.primary} />
                  <Text style={[styles.proTagText, { color: colors.primary }]}>Oshii Pro</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.premiumButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/subscription' as any)}
                  activeOpacity={0.8}
                >
                  <Crown size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.premiumButtonText}>Premium</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.emptyStateContent}>
              {/* Card avec logo TikTok centré */}
              <View style={[styles.tiktokLogoContainer, { backgroundColor: '#000000', borderColor: colors.border }]}>
                <View style={styles.tiktokLogoWrapper}>
                  <ExpoImage
                    source={require('@/assets/logo/Tiktoklogo.jpg')}
                    style={styles.tiktokLogoImage}
                    contentFit="contain"
                  />
                </View>
              </View>
              
              {/* Titre */}
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                Aucune recette pour le moment
              </Text>
              
              {/* Description */}
              <Text style={[styles.emptyStateDescription, { color: colors.icon }]}>
                Transformez vos vidéos TikTok en recettes
              </Text>
              
              {/* Bouton CTA */}
              <TouchableOpacity
                style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  const { openAnalyzeSheet } = useRecipeStore.getState();
                  openAnalyzeSheet();
                }}
                activeOpacity={0.8}
              >
                <Plus size={32} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* États de chargement et d'erreur */}
        {isLoading && recipes.length === 0 && (
          <View style={styles.recipesContainer}>
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.icon }]}>
                Chargement de vos recettes...
              </Text>
            </View>
          </View>
        )}

        {recipesError && (
          <View style={styles.recipesContainer}>
            <View style={styles.centerContainer}>
              <Text style={[styles.errorText, { color: colors.icon }]}>
                {recipesError}
              </Text>
              <Button
                title="Réessayer"
                onPress={refreshRecipes}
                variant="secondary"
                style={{ marginTop: Spacing.md }}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Page Sheet - Créer un Dossier */}
      <CreateFolderSheet
        visible={showFolderSheet}
        onClose={() => setShowFolderSheet(false)}
        onCreateFolder={handleCreateFolder}
      />

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    borderWidth: 1,
  },
  proTagText: {
    fontSize: 13,
    fontWeight: '700',
  },
  recipesContainer: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  recipeCard: {
    marginBottom: Spacing.md,
  },
  recipeHeader: {
    marginBottom: Spacing.md,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  recipeDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  recipeInfos: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recipeDetails: {
    marginTop: Spacing.xs,
  },
  detailsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    minHeight: 500,
  },
  emptyStateHeader: {
    position: 'absolute',
    top: Spacing.xxl + Spacing.md,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyStateHeaderText: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  emptyStateContent: {
    alignItems: 'center',
    width: '100%',
  },
  tiktokLogoContainer: {
    width: 100,
    height: 160,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tiktokLogoWrapper: {
    width: '60%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tiktokLogoImage: {
    width: '100%',
    height: '100%',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 24,
  },
  emptyStateButton: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  foldersContainer: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
    justifyContent: 'space-between',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  generationsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  generationsCounterText: {
    fontSize: 15,
    fontWeight: '700',
  },
  newFolderCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newFolderIconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  newFolderIconBackground: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newFolderLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  newFolderSubLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
});
