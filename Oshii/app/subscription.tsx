/**
 * Écran de sélection de plan d'abonnement
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { OshiiLogo } from '@/components/ui/OshiiLogo';

export default function SubscriptionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');

  const features = [
    'Recettes illimitées',
    'Analyse vidéo prioritaire',
    'Export de vos recettes en PDF',
    'Support client premium',
    'Accès aux fonctionnalités bêta',
  ];

  const handleStartTrial = () => {
    // TODO: Implémenter la logique d'abonnement
    console.log('Starting trial with plan:', selectedPlan);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Bouton de fermeture */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <OshiiLogo size="xl" />
        </View>

        {/* Titre */}
        <Text style={[styles.title, { color: colors.text }]}>
          Choisissez votre plan
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
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'yearly' && styles.planCardSelected,
              {
                backgroundColor: selectedPlan === 'yearly' ? colors.card : 'transparent',
                borderColor: selectedPlan === 'yearly' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.8}
          >
            {/* Badge de réduction */}
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>20% OFF</Text>
            </View>

            <View style={styles.planContent}>
              <View style={styles.planLeft}>
                <View
                  style={[
                    styles.radioButton,
                    selectedPlan === 'yearly' && styles.radioButtonSelected,
                    {
                      borderColor: selectedPlan === 'yearly' ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {selectedPlan === 'yearly' && (
                    <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={[styles.planDuration, { color: colors.text }]}>
                    12 Mois
                  </Text>
                  <Text style={[styles.planPrice, { color: colors.text }]}>
                    49,99 €
                  </Text>
                </View>
              </View>
              <Text style={[styles.planMonthlyPrice, { color: colors.icon }]}>
                4,17 €/mois
              </Text>
            </View>
          </TouchableOpacity>

          {/* Plan Mensuel */}
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
          >
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
                <View style={styles.planInfo}>
                  <Text style={[styles.planDuration, { color: colors.text }]}>
                    Mois
                  </Text>
                </View>
              </View>
              <Text style={[styles.planMonthlyPrice, { color: colors.icon }]}>
                5,99 €/mois
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bouton CTA */}
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.primary }]}
          onPress={handleStartTrial}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>
            Continuer
          </Text>
        </TouchableOpacity>

        {/* Liens du footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => console.log('Restore')}>
            <Text style={[styles.footerLink, { color: colors.icon }]}>
              Restaurer les achats
            </Text>
          </TouchableOpacity>
          <Text style={[styles.footerSeparator, { color: colors.icon }]}>•</Text>
          <TouchableOpacity onPress={() => console.log('Terms')}>
            <Text style={[styles.footerLink, { color: colors.icon }]}>
              Conditions
            </Text>
          </TouchableOpacity>
          <Text style={[styles.footerSeparator, { color: colors.icon }]}>•</Text>
          <TouchableOpacity onPress={() => console.log('Privacy')}>
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
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioButtonSelected: {
    borderWidth: 2,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
  },
  planInfo: {
    flex: 1,
  },
  planDuration: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  planMonthlyPrice: {
    fontSize: 16,
    fontWeight: '500',
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

