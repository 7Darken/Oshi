import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface DonutSegment {
  id: string;
  value: number;
  color: string;
}

interface PlatformDonutProps {
  stats: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  trackColor: string;
  valueColor: string;
  labelColor: string;
  totalLabel: string;
}

export function PlatformDonut({
  stats,
  size = 124,
  strokeWidth = 3,
  trackColor,
  valueColor,
  labelColor,
  totalLabel,
}: PlatformDonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = stats.reduce((acc, segment) => acc + segment.value, 0);

  let cumulative = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {total > 0 &&
          stats.map((segment) => {
            const dash = Math.max((segment.value / total) * circumference, 1);
            const dashArray = `${dash} ${circumference - dash}`;
            const strokeDashoffset = -cumulative;
            cumulative += (segment.value / total) * circumference;

            return (
              <Circle
                key={segment.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={dashArray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.valueText, { color: valueColor }]}>{total}</Text>
        <Text style={[styles.labelText, { color: labelColor }]}>{totalLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 20,
    fontWeight: '700',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});

