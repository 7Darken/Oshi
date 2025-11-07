import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkContext } from '@/contexts/NetworkContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WifiOff } from 'lucide-react-native';

export function OfflineBanner() {
  const { isOffline } = useNetworkContext();
  const colorScheme = useColorScheme();

  if (!isOffline) {
    return null;
  }

  const scheme = colorScheme ?? 'light';
  const bannerStyles = {
    backgroundColor: scheme === 'dark' ? 'rgba(249, 64, 60, 0.14)' : 'rgba(249, 64, 60, 0.12)',
    borderColor: scheme === 'dark' ? 'rgba(249, 64, 60, 0.35)' : 'rgba(249, 64, 60, 0.25)',
    iconTint: Colors.light.primary,
    textColor: scheme === 'dark' ? '#FFD8D4' : Colors.light.primary,
  } as const;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: bannerStyles.backgroundColor,
            borderColor: bannerStyles.borderColor,
          },
        ]}
      >
        <View style={styles.iconWrapper}>
          <WifiOff size={16} color={bannerStyles.textColor} strokeWidth={2} />
        </View>
        <Text style={[styles.text, { color: bannerStyles.textColor }]}>Mode hors ligne — certaines données peuvent être obsolètes.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    width: '100%',
  },
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth * 1.5,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'left',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
