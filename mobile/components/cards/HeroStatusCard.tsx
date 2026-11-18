import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants';

interface HeroStatusCardProps {
  farmerName?: string;
  isDemoMode?: boolean;
  temperature?: number | null;
  weatherCondition?: string;
  lastSyncedText?: string;
  connectionLabel?: string;
  onConnectionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const HeroStatusCard: React.FC<HeroStatusCardProps> = ({
  farmerName = 'Farmer',
  isDemoMode = true,
  temperature = 29,
  weatherCondition = 'Clear',
  lastSyncedText = 'Synced 2m ago',
  connectionLabel,
  onConnectionPress,
  style,
}) => {
  return (
    <LinearGradient
      colors={['#183D2B', '#234C37', '#2E5A44']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {/* Top Status & Sync Indicator */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.hardwareBadge}
          onPress={onConnectionPress}
          activeOpacity={0.8}
        >
          <View style={styles.pulseDotWrapper}>
            <View style={styles.pulseRing} />
            <View style={styles.pulseCore} />
          </View>
          <Text style={styles.hardwareText}>
            {connectionLabel || 'EWS Mega • Wi-Fi / Bluetooth'}
          </Text>
        </TouchableOpacity>

        <View style={styles.syncBadge}>
          <Text style={styles.syncText}>{lastSyncedText}</Text>
        </View>
      </View>

      {/* Demo Mode Pill */}
      {isDemoMode && (
        <View style={styles.demoPill}>
          <View style={styles.demoLeft}>
            <MaterialCommunityIcons
              name="flask"
              size={16}
              color={Colors.stitch.onTertiaryFixed}
            />
            <Text style={styles.demoText}>DEMO MODE: SIMULATED DATA ACTIVE</Text>
          </View>
          <Text style={styles.demoVersion}>v2.0 IoT</Text>
        </View>
      )}

      {/* Greeting & Weather Widget */}
      <View style={styles.bottomRow}>
        <View style={styles.greetingCol}>
          <Text style={styles.greetingSub}>Good Morning, {farmerName}!</Text>
          <Text style={styles.greetingTitle}>Active Automation</Text>
        </View>

        <View style={styles.weatherBadge}>
          <MaterialCommunityIcons
            name="weather-sunny"
            size={20}
            color={Colors.stitch.secondary}
          />
          <Text style={styles.weatherTemp}>
            {temperature != null ? `${temperature}°C` : '--°C'}
          </Text>
          <Text style={styles.weatherCond}>{weatherCondition}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl, // 24px
    padding: Spacing.marginCompact,
    overflow: 'hidden',
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.spaceSm,
  },
  hardwareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDotWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.spaceXs + 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.stitch.secondaryContainer,
    opacity: 0.6,
  },
  pulseCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stitch.secondaryContainer,
  },
  hardwareText: {
    ...Typography.labelSm,
    color: Colors.stitch.secondaryContainer,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  syncBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.spaceSm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  syncText: {
    ...Typography.labelSm,
    color: Colors.neutral.warmWhite,
    fontWeight: '600',
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.stitch.tertiaryFixed,
    paddingHorizontal: Spacing.spaceMd,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.spaceMd,
  },
  demoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  demoText: {
    ...Typography.labelSm,
    color: Colors.stitch.onTertiaryFixed,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoVersion: {
    ...Typography.labelSm,
    color: Colors.stitch.tertiaryContainer,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  greetingCol: {
    flex: 1,
  },
  greetingSub: {
    ...Typography.labelMd,
    color: Colors.stitch.onPrimaryContainer,
    marginBottom: 2,
  },
  greetingTitle: {
    ...Typography.headlineMd,
    color: Colors.neutral.warmWhite,
    fontWeight: '700',
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.warmWhite,
    paddingHorizontal: Spacing.spaceMd,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  weatherTemp: {
    ...Typography.labelMd,
    color: Colors.stitch.onSurface,
    fontWeight: '700',
  },
  weatherCond: {
    ...Typography.bodySm,
    color: Colors.stitch.outline,
  },
});
