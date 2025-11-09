/**
 * TutorialSheet - Guide pour transformer des vidéos TikTok en recettes
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTutorialTranslation } from '@/hooks/useI18n';

interface TutorialSheetProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH * 0.7;

export function TutorialSheet({ visible, onClose }: TutorialSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useTutorialTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const TUTORIAL_STEPS = [
    {
      id: 1,
      image: require('@/assets/Tutorial/screen1.png'),
      title: t('tutorial.steps.step1.title'),
      description: t('tutorial.steps.step1.description'),
    },
    {
      id: 2,
      image: require('@/assets/Tutorial/screen2.png'),
      title: t('tutorial.steps.step2.title'),
      description: t('tutorial.steps.step2.description'),
    },
    {
      id: 3,
      image: require('@/assets/Tutorial/screen3.png'),
      title: t('tutorial.steps.step3.title'),
      description: t('tutorial.steps.step3.description'),
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / IMAGE_WIDTH);
    setCurrentIndex(index);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('tutorial.title')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            {t('tutorial.subtitle')}
          </Text>

          {/* Carousel horizontal */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContent}
            snapToInterval={IMAGE_WIDTH + Spacing.lg}
            decelerationRate="fast"
          >
            {TUTORIAL_STEPS.map((step, index) => (
              <View
                key={step.id}
                style={[
                  styles.stepContainer,
                  index === 0 && styles.firstStep,
                  index === TUTORIAL_STEPS.length - 1 && styles.lastStep,
                ]}
              >
                {/* Image */}
                <View style={styles.imageContainer}>
                  <ExpoImage
                    source={step.image}
                    style={styles.image}
                    contentFit="contain"
                    transition={200}
                  />
                </View>

                {/* Texte */}
                <View style={styles.textContainer}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>
                    {step.title}
                  </Text>
                  <Text style={[styles.stepDescription, { color: colors.icon }]}>
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Indicateurs de pagination */}
          <View style={styles.pagination}>
            {TUTORIAL_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor:
                      index === currentIndex ? colors.primary : colors.border,
                  },
                  index === currentIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          {/* Note finale */}
          <View style={[styles.noteContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.noteTitle, { color: colors.text }]}>
              {t('tutorial.tip.title')}
            </Text>
            <Text style={[styles.noteText, { color: colors.icon }]}>
              {t('tutorial.tip.text')}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: (SCREEN_WIDTH - IMAGE_WIDTH) / 2,
  },
  stepContainer: {
    width: IMAGE_WIDTH,
    alignItems: 'center',
    marginHorizontal: Spacing.lg / 2,
  },
  firstStep: {
    marginLeft: 0,
  },
  lastStep: {
    marginRight: 0,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 1.8,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  noteContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
