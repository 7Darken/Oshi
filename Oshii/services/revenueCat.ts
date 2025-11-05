/**
 * Service RevenueCat simplifié
 */

import Purchases, {
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ========== TYPES ==========

export interface SubscriptionProduct {
  identifier: string;
  priceString: string;
  period: 'monthly' | 'annual';
}

export interface SubscriptionOffering {
  monthly: SubscriptionProduct | null;
  annual: SubscriptionProduct | null;
}

// ========== VARIABLES ==========

let isInitialized = false;
let currentOffering: PurchasesOffering | null = null;

// ========== FONCTIONS ==========

/**
 * Initialiser RevenueCat
 */
export async function initRevenueCat(userId?: string): Promise<boolean> {
  if (isInitialized) {
    console.log('✅ RevenueCat déjà initialisé');
    return true;
  }

  try {
    const { REVENUECAT_IOS_API_KEY, REVENUECAT_ANDROID_API_KEY } =
      Constants.expoConfig?.extra || {};

    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ Clé API RevenueCat non trouvée pour', Platform.OS);
      return false;
    }

    // Configuration
    // Utiliser INFO au lieu de DEBUG pour éviter les logs d'erreur inutiles (comme les annulations)
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.INFO : LOG_LEVEL.WARN);
    await Purchases.configure({ apiKey, appUserID: userId });

    isInitialized = true;
    console.log('✅ [RC] RevenueCat configuré pour user:', userId?.substring(0, 8));
    return true;
  } catch (error) {
    console.error('❌ Erreur initialisation RevenueCat:', error);
    return false;
  }
}

/**
 * Récupérer les offres disponibles
 */
export async function fetchOfferings(): Promise<SubscriptionOffering> {
  try {
    const offerings = await Purchases.getOfferings();
    console.log('📦 Offerings récupérés:', offerings);
    currentOffering = offerings.current;

    console.log('📦 Offerings récupérés:', currentOffering?.identifier);
    console.log('📦 Packages disponibles:', currentOffering?.availablePackages.length || 0);

    if (!currentOffering || currentOffering.availablePackages.length === 0) {
      console.warn('⚠️ Aucun package disponible');
      return { monthly: null, annual: null };
    }

    // Afficher chaque package
    currentOffering.availablePackages.forEach((pkg, index) => {
      console.log(`📦 Package ${index + 1}:`, {
        id: pkg.product.identifier,
        type: pkg.packageType,
        price: pkg.product.priceString,
      });
    });

    // Trouver monthly et annual
    const monthly = findPackage(currentOffering, 'MONTHLY');
    const annual = findPackage(currentOffering, 'ANNUAL') || findPackage(currentOffering, 'YEARLY');

    console.log('✅ Offres mappées:', {
      monthly: monthly?.identifier || 'non trouvé',
      annual: annual?.identifier || 'non trouvé',
    });

    return { monthly, annual };
  } catch (error) {
    console.error('❌ Erreur récupération offres:', error);
    return { monthly: null, annual: null };
  }
}

/**
 * Acheter un produit et synchroniser avec Supabase
 */
export async function purchaseProduct(
  productId: string,
  onSuccess?: () => Promise<void>
): Promise<boolean> {
  try {
    console.log('🛒 [ACHAT] Démarrage de l\'achat pour:', productId);

    if (!currentOffering) {
      console.error('❌ [ACHAT] Pas d\'offering disponible');
      return false;
    }

    const pkg = currentOffering.availablePackages.find(
      (p) => p.product.identifier === productId
    );

    if (!pkg) {
      console.error('❌ [ACHAT] Package non trouvé:', productId);
      console.error('❌ [ACHAT] Packages disponibles:', 
        currentOffering.availablePackages.map(p => p.product.identifier)
      );
      return false;
    }

    console.log('🛒 [ACHAT] Package trouvé:', {
      id: pkg.product.identifier,
      price: pkg.product.priceString,
      type: pkg.packageType,
    });

    console.log('🛒 [ACHAT] Appel à Purchases.purchasePackage...');
    const result = await Purchases.purchasePackage(pkg);
    
    console.log('✅ [ACHAT] Achat réussi!');
    console.log('✅ [ACHAT] Customer info:', {
      entitlements: Object.keys(result.customerInfo.entitlements.active),
      products: Object.keys(result.customerInfo.activeSubscriptions),
    });
    
    // ✨ Callback de synchronisation après achat (vers Supabase)
    if (onSuccess) {
      console.log('🔄 [ACHAT] Appel du callback de synchronisation...');
      await onSuccess();
    }
    
    return true;
  } catch (error: any) {
    // Annulation par l'utilisateur = comportement normal, pas une erreur
    if (error.userCancelled || error.code === '1') {
      console.log('ℹ️ [ACHAT] Achat annulé par l\'utilisateur');
      return false;
    }
    
    // Erreur réelle
    console.error('❌ [ACHAT] Erreur lors de l\'achat:', error);
    console.error('❌ [ACHAT] Code erreur:', error.code);
    console.error('❌ [ACHAT] Message:', error.message);
    return false;
  }
}

/**
 * Restaurer les achats
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    console.log('🔄 Restauration des achats...');
    await Purchases.restorePurchases();
    console.log('✅ Achats restaurés');
    return true;
  } catch (error) {
    console.error('❌ Erreur restauration:', error);
    return false;
  }
}

/**
 * Vérifier si l'utilisateur est premium
 */
export async function isPremium(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const hasActiveEntitlements = Object.keys(customerInfo.entitlements.active).length > 0;
    const hasActiveSubscriptions = customerInfo.activeSubscriptions.length > 0;
    
    return hasActiveEntitlements || hasActiveSubscriptions;
  } catch (error) {
    console.error('❌ [RC] Erreur vérification premium:', error);
    return false;
  }
}

// ========== HELPERS ==========

function findPackage(offering: PurchasesOffering, type: string): SubscriptionProduct | null {
  const pkg = offering.availablePackages.find((p) =>
    p.packageType.toUpperCase().includes(type)
  );

  if (!pkg) return null;

  const period = type === 'MONTHLY' ? 'monthly' : 'annual';

  return {
    identifier: pkg.product.identifier,
    priceString: pkg.product.priceString,
    period,
  };
}

