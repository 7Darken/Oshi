/**
 * Composant MacroCircle - Cercle de progression pour macronutriment
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Spacing } from '@/constants/theme';

interface MacroCircleProps {
  value: number; // Valeur en grammes
  label: string;
  color: string;
  percentage: number; // Pourcentage pour la progression (0-100)
  size?: number;
  textColor?: string; // Couleur du texte
}

export function MacroCircle({ 
  value, 
  label, 
  color, 
  percentage, 
  size = 80,
  textColor = '#000000'
}: MacroCircleProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <View style={styles.container}>
      <View style={[styles.circleContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Cercle de fond */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`${color}30`} // Version avec opacité pour le fond
            strokeWidth={8}
            fill="none"
          />
          {/* Cercle de progression */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={8}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        
        {/* Contenu au centre */}
        <View style={styles.innerContent}>
          <View style={styles.valueRow}>
            <Text style={[styles.value, { color: textColor }]}>{value}</Text>
            <Text style={[styles.unit, { color: textColor }]}>g</Text>
          </View>
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});

