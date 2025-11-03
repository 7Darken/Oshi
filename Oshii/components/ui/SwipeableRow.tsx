/**
 * Composant SwipeableRow - Swipe natif pour révéler actions
 */

import React, { ReactNode, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface SwipeableRowProps {
  children: ReactNode;
  onDelete: () => void;
  rightAction?: ReactNode;
}

export function SwipeableRow({ children, onDelete, rightAction }: SwipeableRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const swipeableRef = useRef<Swipeable>(null);

  const handleSwipeableOpen = () => {
    onDelete();
    // Fermer le swipe après l'action
    setTimeout(() => {
      swipeableRef.current?.close();
    }, 100);
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const containerScale = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.8, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={styles.rightAction}>
        <View style={styles.actionContent}>
          {rightAction || (
            <Animated.View style={{ transform: [{ scale: containerScale }] }}>
              <View style={[styles.iconContainer, { backgroundColor: colors.destructive }]}>
                <Trash2 size={24} color="#FFFFFF" strokeWidth={2} />
              </View>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        onSwipeableOpen={handleSwipeableOpen}
        rightThreshold={60}
        friction={2}
      >
        {children}
      </Swipeable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  rightAction: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    borderTopRightRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  defaultDeleteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

