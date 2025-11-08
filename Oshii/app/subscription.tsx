/**
 * Écran de sélection de plan d'abonnement
 */

import { OshiiLogo } from '@/components/ui/OshiiLogo';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SubscriptionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  
  const { 
    isLoading, 
    isPremium, 
    offerings, 
    isPurchasing, 
    purchase, 
    restorePurchases 
  } = useRevenueCat();

  // Si l'utilisateur est déjà premium, rediriger vers home
  useEffect(() => {
    if (isPremium && !isLoading) {
      router.back();
    }
  }, [isPremium, isLoading, router]);

  const features = [
    'Recettes illimitées',
    'Analyse vidéo prioritaire',
    'Export de vos recettes en Image',
    'Partagez vos recettes préférées',
    'Accédez aux recettes de vos amis',
  ];

  // Calculer le pourcentage d'économie de l'abonnement annuel
  const calculateSavingsPercentage = (): number => {
    if (!offerings?.annual || !offerings?.monthly) return 0;
    
    // Extraire les prix numériques des strings (ex: "24,99 $US" -> 24.99)
    const annualPrice = parseFloat(offerings.annual.priceString.replace(/[^0-9.,]/g, '').replace(',', '.'));
    const monthlyPrice = parseFloat(offerings.monthly.priceString.replace(/[^0-9.,]/g, '').replace(',', '.'));
    
    // Prix mensuel si on prend l'annuel
    const annualMonthlyPrice = annualPrice / 12;
    
    // Calcul du pourcentage d'économie
    const savings = ((monthlyPrice - annualMonthlyPrice) / monthlyPrice) * 100;
    
    return Math.round(savings);
  };

  const savingsPercentage = calculateSavingsPercentage();

  // Calculer le prix mensuel de l'abonnement annuel
  const getAnnualMonthlyPrice = (): string => {
    if (!offerings?.annual) return '';
    
    // Extraire le prix numérique et la devise
    const priceString = offerings.annual.priceString;
    const annualPrice = parseFloat(priceString.replace(/[^0-9.,]/g, '').replace(',', '.'));
    const currency = priceString.replace(/[0-9.,\s]/g, '');
    
    // Prix par mois
    const monthlyPrice = (annualPrice / 12).toFixed(2).replace('.', ',');
    
    return `${monthlyPrice} ${currency}/mois`;
  };

  const handleStartTrial = async () => {
    console.log('🎯 [PAYWALL] Bouton Continuer pressé');
    console.log('🎯 [PAYWALL] Plan sélectionné:', selectedPlan);

    if (!offerings) {
      console.error('❌ [PAYWALL] Aucune offre disponible');
      return;
    }

    const selectedProduct = selectedPlan === 'annual' ? offerings.annual : offerings.monthly;
    
    if (!selectedProduct) {
      console.error('❌ [PAYWALL] Produit sélectionné non disponible');
      return;
    }

    console.log('🎯 [PAYWALL] Produit sélectionné:', {
      id: selectedProduct.identifier,
      price: selectedProduct.priceString,
      period: selectedProduct.period,
    });

    console.log('🎯 [PAYWALL] Appel à purchase()...');
    const success = await purchase(selectedProduct.identifier);
    
    if (success) {
      console.log('✅ [PAYWALL] Achat réussi, fermeture du paywall');
      router.back();
    }
    // Si l'achat échoue ou est annulé, on reste sur le paywall
    // Les logs appropriés ont déjà été affichés par le service
  };

  const handleRestore = async () => {
    await restorePurchases();
  };

  const handleOpenPrivacy = async () => {
    const url = 'https://v0-oshii.vercel.app/privacy';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const handleOpenTerms = async () => {
    const url = 'https://v0-oshii.vercel.app/terms';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  // Afficher un loader pendant le chargement initial
  if (isLoading && !offerings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement des offres...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Bouton de fermeture */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={isPurchasing}
        >
          <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <OshiiLogo size="xl" />
        </View>

        {/* Titre */}
        <Text style={[styles.title, { color: colors.text }]}>
          Oshii Pro
        </Text>

        {/* Liste des fonctionnalités */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                <Check size={16} color="#FFFFFF" strokeWidth={3} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Options de plan */}
        <View style={styles.plansContainer}>
          {/* Plan Annuel */}
          {offerings?.annual && (
            <TouchableOpacity
              style={[
                styles.planCard,
                styles.planCardAnnual,
                selectedPlan === 'annual' && styles.planCardSelected,
                {
                  backgroundColor: selectedPlan === 'annual' ? colors.card : 'transparent',
                  borderColor: selectedPlan === 'annual' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedPlan('annual')}
              activeOpacity={0.8}
              disabled={isPurchasing}
            >
              {/* Badge économies */}
              {savingsPercentage > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>Économise {savingsPercentage}%</Text>
                </View>
              )}

              <View style={styles.planWrapper}>
                {/* Ligne principale : Radio + Titre + Prix */}
                <View style={styles.planContent}>
                  <View style={styles.planLeft}>
                    <View
                      style={[
                        styles.radioButton,
                        selectedPlan === 'annual' && styles.radioButtonSelected,
                        {
                          borderColor: selectedPlan === 'annual' ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {selectedPlan === 'annual' && (
                        <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <View>
                      <Text style={[styles.planTitle, { color: colors.text }]}>
                        Annuel
                      </Text>
                      {/* Durée en bas, alignée avec le titre */}
                      <View style={styles.durationRow}>
                        <Text style={[styles.planDuration, { color: colors.icon }]}>
                          12 mois
                        </Text>
                        <Text style={[styles.monthlyEquivalent, { color: colors.icon }]}>
                          • {getAnnualMonthlyPrice()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.planPrice, { color: colors.text }]}>
                    {offerings.annual.priceString}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Plan Mensuel */}
          {offerings?.monthly && (
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
                {
                  backgroundColor: selectedPlan === 'monthly' ? colors.card : 'transparent',
                  borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
              disabled={isPurchasing}
            >
              <View style={styles.planWrapper}>
                {/* Ligne principale : Radio + Titre + Prix */}
                <View style={styles.planContent}>
                  <View style={styles.planLeft}>
                    <View
                      style={[
                        styles.radioButton,
                        selectedPlan === 'monthly' && styles.radioButtonSelected,
                        {
                          borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {selectedPlan === 'monthly' && (
                        <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <View>
                      <Text style={[styles.planTitle, { color: colors.text }]}>
                        Mensuel
                      </Text>
                      {/* Durée en bas, alignée avec le titre */}
                      <Text style={[styles.planDuration, { color: colors.icon }]}>
                        1 mois
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.planPrice, { color: colors.text }]}>
                    {offerings.monthly.priceString}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Note de renouvellement automatique */}
        <Text style={[styles.renewalNote, { color: colors.icon }]}>
          Renouvellement automatique
        </Text>

        {/* Bouton CTA */}
        <TouchableOpacity
          style={[
            styles.ctaButton, 
            { 
              backgroundColor: colors.primary,
              opacity: isPurchasing ? 0.6 : 1,
            }
          ]}
          onPress={handleStartTrial}
          activeOpacity={0.8}
          disabled={isPurchasing || !offerings}
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaButtonText}>
              Continuer
            </Text>
          )}
        </TouchableOpacity>

        {/* Liens du footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRestore} disabled={isPurchasing}>
            <Text style={[styles.footerLink, { color: colors.icon }]}>
              Restaurer les achats
            </Text>
          </TouchableOpacity>
          <Text style={[styles.footerSeparator, { color: colors.icon }]}>•</Text>
          <TouchableOpacity onPress={handleOpenTerms}>
            <Text style={[styles.footerLink, { color: colors.icon }]}>
              Conditions
            </Text>
          </TouchableOpacity>
          <Text style={[styles.footerSeparator, { color: colors.icon }]}>•</Text>
          <TouchableOpacity onPress={handleOpenPrivacy}>
            <Text style={[styles.footerLink, { color: colors.icon }]}>
              Confidentialité
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    justifyContent: 'space-between',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: Spacing.md,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  featuresContainer: {
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  plansContainer: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  planCard: {
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    position: 'relative',
  },
  planCardAnnual: {
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.md + 2,
  },
  planCardSelected: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    zIndex: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  planWrapper: {
    // Pas de gap nécessaire car tout est dans planContent maintenant
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderWidth: 2,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planDuration: {
    fontSize: 13,
    fontWeight: '400',
  },
  monthlyEquivalent: {
    fontSize: 11,
    fontWeight: '400',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  renewalNote: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  ctaButton: {
    paddingVertical: Spacing.md + Spacing.xs,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  footerLink: {
    fontSize: 14,
  },
  footerSeparator: {
    fontSize: 14,
  },
});

