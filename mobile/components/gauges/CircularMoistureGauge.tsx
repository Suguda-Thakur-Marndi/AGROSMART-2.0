import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants';

interface CircularMoistureGaugeProps {
  value: number; // 0 to 100
  targetMin?: number;
  targetMax?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  isPaddy?: boolean;
  alertText?: string;
  style?: StyleProp<ViewStyle>;
}

export const CircularMoistureGauge: React.FC<CircularMoistureGaugeProps> = ({
  value,
  targetMin = 35,
  targetMax = 60,
  size = 192, // 48 * 4
  strokeWidth = 14,
  color,
  isPaddy = false,
  alertText,
  style,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (circumference * clampedValue) / 100;

  // Determine color based on zone and threshold
  let activeColor = color;
  if (!activeColor) {
    if (isPaddy) {
      activeColor = Colors.stitch.water; // #559FC1
    } else {
      activeColor =
        value <= targetMin
          ? Colors.stitch.warningAmber // #D97706
          : Colors.stitch.secondary;   // #286B3D
    }
  }

  return (
    <View style={[styles.container, style]}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={styles.svg}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {/* Background Track */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={Colors.stitch.surfaceContainer}
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Target Range Track Guide (optional) */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isPaddy ? '#B2EBF2' : Colors.stitch.secondaryFixed}
              strokeWidth={4}
              strokeDasharray={`${(circumference * (targetMax - targetMin)) / 100} ${circumference}`}
              strokeDashoffset={-(circumference * targetMin) / 100}
              fill="none"
            />

            {/* Active Progress Arc */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        </Svg>

        {/* Centered Metric Label */}
        <View style={styles.centerOverlay}>
          <MaterialCommunityIcons
            name="water"
            size={24}
            color={isPaddy ? Colors.stitch.water : Colors.stitch.secondary}
          />
          <View style={styles.numberRow}>
            <Text style={styles.valueNumber}>{Math.round(clampedValue)}</Text>
            <Text style={styles.percentSymbol}>%</Text>
          </View>
          <Text style={styles.targetLabel}>
            Target: {targetMin}–{targetMax}%
          </Text>
        </View>
      </View>

      {/* Real-time Alert Status Pill */}
      {alertText ? (
        <View style={styles.alertPill}>
          <View style={styles.alertDot} />
          <Text style={styles.alertText}>{alertText}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  valueNumber: {
    ...Typography.metricXl,
    color: Colors.stitch.primary,
    fontWeight: '800',
  },
  percentSymbol: {
    ...Typography.headlineSm,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '600',
    marginLeft: 2,
  },
  targetLabel: {
    ...Typography.labelSm,
    color: Colors.stitch.onSurfaceVariant,
    marginTop: 2,
  },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: Spacing.spaceMd,
    paddingVertical: 6,
    borderRadius: 9999,
    marginTop: Spacing.spaceSm,
    gap: 6,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.stitch.warningAmber,
  },
  alertText: {
    ...Typography.labelSm,
    color: '#8D6E63',
    fontWeight: '600',
  },
});
