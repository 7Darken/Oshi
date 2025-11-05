import Purchases, { CustomerInfo } from 'react-native-purchases';
import { supabase } from './supabase';

/**
 * Interface pour les informations premium
 */
export interface PremiumInfo {
  isPremium: boolean;
  premiumSince: string | null;
  premiumExpiry: string | null;
  subscriptionName: string | null;
}

/**
 * Synchronise le statut premium de RevenueCat vers Supabase
 * Cette fonction est la source de vérité pour le statut premium
 */
export async function syncPremiumStatus(userId: string): Promise<PremiumInfo> {
  try {
    console.log('🔄 [PREMIUM] Synchronisation du statut premium pour:', userId.substring(0, 8));

    // 1️⃣ Récupérer les infos depuis RevenueCat (source de vérité)
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = checkRevenueCatPremiumFromCustomerInfo(customerInfo);

    console.log('📊 [PREMIUM] Statut RevenueCat:', {
      isPremium,
      entitlements: Object.keys(customerInfo.entitlements.active),
      subscriptions: customerInfo.activeSubscriptions,
    });

    // 2️⃣ Construire les données premium
    const premiumData = buildPremiumData(customerInfo, isPremium);

    // 3️⃣ Mettre à jour Supabase
   const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: premiumData.isPremium,
        premium_since: premiumData.premiumSince,
        premium_expiry: premiumData.premiumExpiry,
        subscription_name: premiumData.subscriptionName,
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ [PREMIUM] Erreur mise à jour Supabase:', error);
      throw error;
    }

    console.log('✅ [PREMIUM] Synchronisation réussie:', premiumData);
    return premiumData;
  } catch (error) {
    console.error('❌ [PREMIUM] Erreur synchronisation:', error);
    throw error;
  }
}

/**
 * Vérifie si l'utilisateur est premium depuis RevenueCat CustomerInfo
 */
function checkRevenueCatPremiumFromCustomerInfo(customerInfo: CustomerInfo): boolean {
  // Vérifier s'il y a des entitlements actifs
  const hasActiveEntitlements = Object.keys(customerInfo.entitlements.active).length > 0;
  
  // Vérifier s'il y a des subscriptions actives
  const hasActiveSubscriptions = customerInfo.activeSubscriptions.length > 0;

  return hasActiveEntitlements || hasActiveSubscriptions;
}

/**
 * Construit les données premium depuis CustomerInfo
 */
function buildPremiumData(customerInfo: CustomerInfo, isPremium: boolean): PremiumInfo {
  if (!isPremium) {
    return {
      isPremium: false,
      premiumSince: null,
      premiumExpiry: null,
      subscriptionName: null,
    };
  }

  // Récupérer la première subscription active
  const firstSubscription = customerInfo.activeSubscriptions[0];
  
  // Récupérer les dates depuis les entitlements
  const entitlementKeys = Object.keys(customerInfo.entitlements.active);
  const firstEntitlement = entitlementKeys.length > 0 
    ? customerInfo.entitlements.active[entitlementKeys[0]] 
    : null;

  // Déterminer le nom de l'abonnement
  let subscriptionName = 'Oshii Pro';
  if (firstSubscription) {
    if (firstSubscription.includes('yearly')) {
      subscriptionName = 'Oshii Pro Yearly';
    } else if (firstSubscription.includes('monthly')) {
      subscriptionName = 'Oshii Pro Monthly';
    }
  }

  // Dates
  const premiumSince = firstEntitlement?.latestPurchaseDate || new Date().toISOString();
  const premiumExpiry = firstEntitlement?.expirationDate || null;

  return {
    isPremium: true,
    premiumSince,
    premiumExpiry,
    subscriptionName,
  };
}

/**
 * Récupère les infos premium depuis Supabase
 * Utilisé pour afficher rapidement sans attendre RevenueCat
 */
export async function getPremiumInfoFromDatabase(userId: string): Promise<PremiumInfo> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, premium_since, premium_expiry, subscription_name')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      isPremium: data.is_premium || false,
      premiumSince: data.premium_since || null,
      premiumExpiry: data.premium_expiry || null,
      subscriptionName: data.subscription_name || null,
    };
  } catch (error) {
    console.error('❌ [PREMIUM] Erreur récupération DB:', error);
    return {
      isPremium: false,
      premiumSince: null,
      premiumExpiry: null,
      subscriptionName: null,
    };
  }
}

/**
 * Vérifie si l'abonnement a expiré (selon la DB)
 * Utilisé comme vérification rapide côté client
 */
export function isPremiumExpired(premiumExpiry: string | null): boolean {
  if (!premiumExpiry) return false; // Pas de date d'expiration = illimité
  
  const expiryDate = new Date(premiumExpiry);
  const now = new Date();
  
  return expiryDate < now;
}

/**
 * Synchronise le statut premium lors de l'achat
 * Appelé immédiatement après un achat réussi
 */
export async function onPurchaseSuccess(userId: string, productId: string): Promise<void> {
  console.log('🎉 [PREMIUM] Achat réussi, synchronisation...');
  
  // Attendre un peu pour que RevenueCat se synchronise
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Synchroniser avec Supabase
  await syncPremiumStatus(userId);
}

/**
 * Synchronise le statut premium au démarrage de l'app
 * Vérifie les renouvellements et expirations
 */
export async function syncPremiumOnAppStart(userId: string): Promise<PremiumInfo> {
  console.log('🚀 [PREMIUM] Vérification du statut au démarrage');
  
  try {
    // 1️⃣ Récupérer depuis la DB (rapide)
    const dbInfo = await getPremiumInfoFromDatabase(userId);
    
    // 2️⃣ Si premium et pas expiré selon la DB, synchroniser avec RevenueCat
    // pour vérifier les renouvellements
    if (dbInfo.isPremium && !isPremiumExpired(dbInfo.premiumExpiry)) {
      console.log('ℹ️ [PREMIUM] Premium actif, vérification RevenueCat...');
      return await syncPremiumStatus(userId);
    }
    
    // 3️⃣ Si pas premium ou expiré, synchroniser avec RevenueCat
    // pour vérifier si l'utilisateur a acheté depuis un autre appareil
    console.log('ℹ️ [PREMIUM] Pas premium ou expiré, vérification RevenueCat...');
    return await syncPremiumStatus(userId);
  } catch (error) {
    console.error('❌ [PREMIUM] Erreur sync démarrage:', error);
    // En cas d'erreur, retourner les infos de la DB
    return await getPremiumInfoFromDatabase(userId);
  }
}

