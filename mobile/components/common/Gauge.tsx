import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../../constants';

interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  lowThreshold?: number;
  highThreshold?: number;
  style?: StyleProp<ViewStyle>;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  min = 0,
  max = 100,
  unit = '%',
  label,
  size = 140,
  strokeWidth = 12,
  color,
  lowThreshold,
  highThreshold,
  style,
}) => {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Arc angles: from 135 deg to 405 deg (270 deg sweep)
  const startAngle = 135;
  const sweepAngle = 270;

  const clampedValue = Math.min(Math.max(value, min), max);
  const percentage = (clampedValue - min) / (max - min);
  const currentAngle = startAngle + percentage * sweepAngle;

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    r: number,
    angleInDegrees: number,
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (
    x: number,
    y: number,
    r: number,
    startDeg: number,
    endDeg: number,
  ) => {
    const start = polarToCartesian(x, y, r, endDeg);
    const end = polarToCartesian(x, y, r, startDeg);
    const largeArcFlag = endDeg - startDeg <= 180 ? '0' : '1';

    return [
      'M',
      start.x,
      start.y,
      'A',
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(' ');
  };

  const bgPath = describeArc(center, center, radius, startAngle, startAngle + sweepAngle);
  const activePath =
    percentage > 0.01
      ? describeArc(center, center, radius, startAngle, currentAngle)
      : '';

  // Determine dynamic color if not provided
  let activeColor = color ?? Colors.primary.natural;
  if (!color) {
    if (lowThreshold !== undefined && value < lowThreshold) {
      activeColor = Colors.status.warning;
    } else if (highThreshold !== undefined && value > highThreshold) {
      activeColor = Colors.accent.blue;
    } else {
      activeColor = Colors.primary.light;
    }
  }

  return (
    <View style={[styles.container, { width: size, height: size + 20 }, style]}>
      <Svg width={size} height={size}>
        <G>
          {/* Background Track */}
          <Path
            d={bgPath}
            stroke="#ECEFF1"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          {/* Active Progress */}
          {activePath ? (
            <Path
              d={activePath}
              stroke={activeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
          ) : null}
        </G>
      </Svg>

      {/* Center Value */}
      <View style={[styles.valueOverlay, { top: size * 0.38 }]}>
        <Text style={[styles.valueText, { color: activeColor }]}>
          {typeof value === 'number'
            ? value % 1 === 0
              ? value
              : value.toFixed(1)
            : value}
          <Text style={styles.unitText}>{unit}</Text>
        </Text>
        {label ? <Text style={styles.labelText}>{label}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  valueOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    ...Typography.headlineLarge,
    fontWeight: '700',
  },
  unitText: {
    ...Typography.titleSmall,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  labelText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});
