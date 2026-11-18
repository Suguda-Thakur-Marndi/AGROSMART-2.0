import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants';

interface HorizontalThresholdBarProps {
  currentValue: number;
  floorValue?: number;
  saturationValue?: number;
  unit?: string;
  isPaddy?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const HorizontalThresholdBar: React.FC<HorizontalThresholdBarProps> = ({
  currentValue,
  floorValue = 35,
  saturationValue = 60,
  unit = '%',
  isPaddy = false,
  style,
}) => {
  const clampedVal = Math.min(Math.max(currentValue, 0), 100);
  const floorPct = Math.min(Math.max(floorValue, 0), 100);
  const bandWidth = Math.max(saturationValue - floorValue, 0);

  return (
    <View style={[styles.container, style]}>
      {/* Label Row */}
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>
          {isPaddy ? 'Min Water Layer: ' : 'Wilting Floor: '}
          <Text style={styles.floorVal}>
            {floorValue}
            {unit}
          </Text>
        </Text>
        <Text style={styles.labelText}>
          Current: <Text style={styles.currentVal}>{currentValue}{unit}</Text>
        </Text>
        <Text style={styles.labelText}>
          Saturation: <Text style={styles.satVal}>{saturationValue}{unit}</Text>
        </Text>
      </View>

      {/* Bar Track */}
      <View style={styles.track}>
        {/* Floor Warning Band */}
        <View style={[styles.floorBand, { width: `${floorPct}%` }]} />
        {/* Optimal Range Band */}
        <View
          style={[
            styles.optimalBand,
            {
              left: `${floorPct}%`,
              width: `${bandWidth}%`,
              backgroundColor: isPaddy
                ? Colors.stitch.waterLight
                : Colors.stitch.secondaryContainer,
            },
          ]}
        />
        {/* Active Indicator Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: `${clampedVal}%`,
              backgroundColor:
                clampedVal < floorValue
                  ? Colors.stitch.error
                  : isPaddy
                  ? Colors.stitch.water
                  : Colors.stitch.secondary,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: Spacing.spaceMd,
    borderRadius: BorderRadius.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.spaceXs + 2,
  },
  labelText: {
    ...Typography.labelSm,
    color: Colors.stitch.onSurfaceVariant,
  },
  floorVal: {
    color: Colors.stitch.error,
    fontWeight: '700',
  },
  currentVal: {
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  satVal: {
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  track: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.surfaceContainerHighest,
    position: 'relative',
    overflow: 'hidden',
  },
  floorBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(186, 26, 26, 0.25)',
  },
  optimalBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  thumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 10,
    marginLeft: -5,
    borderRadius: BorderRadius.full,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
