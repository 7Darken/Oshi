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
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Plus, Crown } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { FolderCard } from '@/components/ui/FolderCard';
import { CreateFolderSheet } from '@/components/CreateFolderSheet';
import { OshiiLogo } from '@/components/ui/OshiiLogo';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { useRecipes } from '@/hooks/useRecipes';
import { useFolders } from '@/hooks/useFolders';

// Composant mémorisé pour le container des dossiers (évite les re-renders inutiles)
const FoldersContainer = React.memo(({ 
  folders, 
  orphanCount, 
  colors, 
  router, 
  handleFolderPress,
  setShowFolderSheet 
}: {
  folders: { id: string; name: string; recipes_count?: number }[];
  orphanCount: number;
  colors: any;
  router: any;
  handleFolderPress: (folderId: string, folderName: string) => void;
  setShowFolderSheet: (show: boolean) => void;
}) => {
  if (folders.length === 0 && orphanCount === 0) return null;

  return (
    <View style={styles.foldersContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes recettes</Text>
      <View style={styles.foldersGrid}>
        {/* Dossier fictif "Non enregistrés" */}
        {orphanCount > 0 && (
          <FolderCard
            name="Non enregistrés"
            recipeCount={orphanCount}
            onPress={() => {
              router.push('/folder?folderId=null' as any);
            }}
          />
        )}
        {/* Dossiers réels */}
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            name={folder.name}
            recipeCount={folder.recipes_count || 0}
            onPress={() => handleFolderPress(folder.id, folder.name)}
          />
        ))}
        {/* Carte "+ Nouveau dossier" */}
        <TouchableOpacity
          style={[styles.newFolderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowFolderSheet(true)}
          activeOpacity={0.7}
        >
          <View style={styles.newFolderIconContainer}>
            <View style={[styles.newFolderIconCircle, { borderColor: colors.border }]}>
              <Plus size={32} color={colors.primary} strokeWidth={2} />
            </View>
          </View>
          <Text style={[styles.newFolderLabel, { color: colors.text }]}>
            Nouveau dossier
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
  const { recipes, isLoading: recipesLoading, error: recipesError, refresh: refreshRecipes } = useRecipes();
  const { folders, createFolder, refresh: refreshFolders } = useFolders();
  const hasOpenedPaywall = useRef(false);
  
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

  // Calculer les recettes non associées à un dossier (mémorisé pour éviter les re-renders)
  const orphanCount = useMemo(() => {
    return recipes.filter((recipe) => !recipe.folder_id).length;
  }, [recipes]);


  const handleFolderPress = useCallback((folderId: string, folderName: string) => {
    router.push(`/folder?folderId=${folderId}` as any);
  }, [router]);

  const handleCreateFolder = async (name: string): Promise<boolean> => {
    const newFolder = await createFolder(name);
    return !!newFolder;
  };

  // Rafraîchir les dossiers et recettes quand l'écran redevient actif (optimisé)
  useFocusEffect(
    useCallback(() => {
      // Rafraîchir silencieusement sans mettre en loading (pour éviter la disparition du header)
      refreshFolders().catch(err => {
        console.error('❌ [Home] Erreur lors du refresh des dossiers:', err);
      });
      refreshRecipes().catch(err => {
        console.error('❌ [Home] Erreur lors du refresh des recettes:', err);
      });
    }, [refreshFolders, refreshRecipes])
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
            <TouchableOpacity
              style={[styles.premiumButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/subscription' as any)}
              activeOpacity={0.8}
            >
              <Crown size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.premiumButtonText}>Premium</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Liste des dossiers - Composant mémorisé pour éviter les re-renders */}
        <FoldersContainer
          folders={folders}
          orphanCount={orphanCount}
          colors={colors}
          router={router}
          handleFolderPress={handleFolderPress}
          setShowFolderSheet={setShowFolderSheet}
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
              <TouchableOpacity
                style={[styles.premiumButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/subscription' as any)}
                activeOpacity={0.8}
              >
                <Crown size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.premiumButtonText}>Premium</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.emptyStateContent}>
              {/* Logo TikTok avec opacité réduite */}
              <View style={styles.tiktokLogoContainer}>
                <ExpoImage
                  source={require('@/assets/logo/Tiktoklogo.jpg')}
                  style={styles.tiktokLogoImage}
                  contentFit="cover"
                />
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
    width: 140,
    height: 140,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    opacity: 0.7,
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  newFolderCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    width: '47%',
    borderStyle: 'dashed',
  },
  newFolderIconContainer: {
    marginBottom: Spacing.md,
  },
  newFolderIconCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newFolderLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
