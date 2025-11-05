/**
 * Hook RevenueCat simplifié
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  initRevenueCat,
  fetchOfferings,
  purchaseProduct,
  restorePurchases as restorePurchasesService,
  SubscriptionOffering,
} from '@/services/revenueCat';
import {
  syncPremiumStatus,
  syncPremiumOnAppStart,
  onPurchaseSuccess,
} from '@/services/premium';
import { useAuthContext } from '@/contexts/AuthContext';

export function useRevenueCat() {
  const { user, refreshProfile } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<SubscriptionOffering | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Initialiser au chargement
  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // 1️⃣ Initialiser RevenueCat
        const success = await initRevenueCat(user.id);
        if (!success) {
          console.warn('⚠️ RevenueCat non initialisé');
          return;
        }

        // 2️⃣ Récupérer les offres
        const offers = await fetchOfferings();
        
        console.log('📦 [PAYWALL] ===== OFFERINGS =====');
        console.log('📦 offerings:', offers);
        console.log('📦 Annual:', offers.annual);
        console.log('📦 ============================');
        
        setOfferings(offers);

        // 3️⃣ Synchroniser le statut premium au démarrage
        // Vérifie les renouvellements et expirations
        const premiumInfo = await syncPremiumOnAppStart(user.id);
        setIsPremium(premiumInfo.isPremium);

        console.log('✅ [PREMIUM] Statut synchronisé:', premiumInfo);
      } catch (error) {
        console.error('❌ Erreur init RevenueCat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [user?.id]);

  // Acheter un produit
  const purchase = useCallback(async (productId: string): Promise<boolean> => {
    if (!user?.id) {
      console.error('❌ [PREMIUM] User ID manquant');
      return false;
    }

    setIsPurchasing(true);

    // Callback de synchronisation après achat réussi
    const onSuccess = async () => {
      await onPurchaseSuccess(user.id, productId);
    };

    const success = await purchaseProduct(productId, onSuccess);

    if (success) {
      // Synchroniser le statut premium immédiatement
      const premiumInfo = await syncPremiumStatus(user.id);
      setIsPremium(premiumInfo.isPremium);
      
      // Rafraîchir le profil dans le contexte pour mettre à jour isPremium partout
      await refreshProfile();
      
      Alert.alert('Félicitations ! 🎉', 'Vous êtes maintenant Premium !');
    }
    // Si l'achat échoue, purchaseProduct() a déjà loggé la raison
    // Pas besoin d'afficher une alerte si l'utilisateur a simplement annulé

    setIsPurchasing(false);
    return success;
  }, [user?.id, refreshProfile]);

  // Restaurer les achats
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      console.error('❌ [PREMIUM] User ID manquant');
      return false;
    }

    try {
      setIsLoading(true);
      const success = await restorePurchasesService();

      if (success) {
        // Synchroniser avec Supabase après restauration
        const premiumInfo = await syncPremiumStatus(user.id);
        setIsPremium(premiumInfo.isPremium);
        
        // Rafraîchir le profil dans le contexte pour mettre à jour isPremium partout
        await refreshProfile();
        
        if (premiumInfo.isPremium) {
          Alert.alert('Achats restaurés', 'Vos achats ont été restaurés !');
        } else {
          Alert.alert('Aucun achat', 'Aucun abonnement trouvé.');
        }
      }

      return success;
    } catch (error) {
      console.error('❌ Erreur restauration:', error);
      Alert.alert('Erreur', 'Impossible de restaurer les achats');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshProfile]);

  return {
    isLoading,
    isPremium,
    offerings,
    isPurchasing,
    purchase,
    restorePurchases,
  };
}

