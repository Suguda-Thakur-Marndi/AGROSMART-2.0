import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Line,
  Circle,
  G,
} from 'react-native-svg';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants';

interface HydroSparklineProps {
  height?: number;
  showLegend?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const HydroSparkline: React.FC<HydroSparklineProps> = ({
  height = 140,
  showLegend = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {showLegend && (
        <View style={styles.legendRow}>
          <View style={styles.legendItems}>
            <View style={styles.legendBadge}>
              <View style={[styles.legendDot, { backgroundColor: Colors.stitch.water }]} />
              <Text style={styles.legendText}>Plot B: Paddy (72%)</Text>
            </View>
            <View style={styles.legendBadge}>
              <View style={[styles.legendDot, { backgroundColor: Colors.stitch.secondary }]} />
              <Text style={styles.legendText}>Plot A: Veg (38%)</Text>
            </View>
          </View>
          <Text style={styles.valveEventsText}>⚡ Valve Events</Text>
        </View>
      )}

      <Svg width="100%" height={height} viewBox="0 0 320 110">
        <Defs>
          <LinearGradient id="paddyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#559FC1" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#559FC1" stopOpacity="0.0" />
          </LinearGradient>
          <LinearGradient id="vegGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#286B3D" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#286B3D" stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Horizontal Dotted Guide Lines */}
        <Line x1="0" y1="20" x2="320" y2="20" stroke="#C1C8C1" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
        <Line x1="0" y1="60" x2="320" y2="60" stroke="#C1C8C1" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
        <Line x1="0" y1="95" x2="320" y2="95" stroke="#C1C8C1" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />

        {/* Paddy Area & Curve (Plot B) */}
        <Path
          d="M0,32 Q40,28 75,35 T150,22 T220,38 T280,24 L320,30 L320,110 L0,110 Z"
          fill="url(#paddyGrad)"
        />
        <Path
          d="M0,32 Q40,28 75,35 T150,22 T220,38 T280,24 L320,30"
          fill="none"
          stroke="#559FC1"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Vegetable Area & Curve (Plot A) */}
        <Path
          d="M0,74 Q35,82 70,68 T140,86 T210,65 T280,82 L320,70 L320,110 L0,110 Z"
          fill="url(#vegGrad)"
        />
        <Path
          d="M0,74 Q35,82 70,68 T140,86 T210,65 T280,82 L320,70"
          fill="none"
          stroke="#286B3D"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Valve Event Pulse Markers */}
        <G transform="translate(68, 64)">
          <Circle cx="0" cy="0" r="4" fill="#FFFFFF" stroke="#286B3D" strokeWidth="2" />
          <Line x1="0" y1="4" x2="0" y2="40" stroke="#286B3D" strokeWidth="1" strokeDasharray="2,2" />
        </G>
        <G transform="translate(148, 18)">
          <Circle cx="0" cy="0" r="4" fill="#FFFFFF" stroke="#559FC1" strokeWidth="2" />
          <Line x1="0" y1="4" x2="0" y2="86" stroke="#559FC1" strokeWidth="1" strokeDasharray="2,2" />
        </G>
        <G transform="translate(208, 61)">
          <Circle cx="0" cy="0" r="4" fill="#FFFFFF" stroke="#286B3D" strokeWidth="2" />
          <Line x1="0" y1="4" x2="0" y2="43" stroke="#286B3D" strokeWidth="1" strokeDasharray="2,2" />
        </G>
        <G transform="translate(278, 20)">
          <Circle cx="0" cy="0" r="4" fill="#FFFFFF" stroke="#559FC1" strokeWidth="2" />
          <Line x1="0" y1="4" x2="0" y2="84" stroke="#559FC1" strokeWidth="1" strokeDasharray="2,2" />
        </G>
      </Svg>

      <View style={styles.timeAxisRow}>
        <Text style={styles.timeAxisText}>00:00</Text>
        <Text style={styles.timeAxisText}>04:00</Text>
        <Text style={styles.timeAxisText}>08:00 (Valve)</Text>
        <Text style={styles.timeAxisText}>12:00</Text>
        <Text style={styles.timeAxisText}>Now</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(240, 238, 228, 0.6)',
    borderRadius: BorderRadius.md,
    padding: Spacing.spaceSm,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.spaceXs,
    paddingHorizontal: Spacing.spaceXs,
  },
  legendItems: {
    flexDirection: 'row',
    gap: Spacing.spaceSm,
  },
  legendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 4,
    borderRadius: 2,
  },
  legendText: {
    ...Typography.labelSm,
    color: Colors.stitch.outline,
  },
  valveEventsText: {
    ...Typography.labelSm,
    color: Colors.stitch.secondary,
    fontWeight: '600',
  },
  timeAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.spaceXs,
    marginTop: Spacing.spaceXs,
  },
  timeAxisText: {
    ...Typography.labelSm,
    fontSize: 9,
    color: Colors.stitch.outline,
  },
});
