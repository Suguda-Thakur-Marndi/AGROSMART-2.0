import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../../constants';
import { StitchCard } from './StitchCard';

interface PumpStatusCardProps {
  isRunning: boolean;
  mode?: string;
  nextQueue?: string;
  runtimeToday?: string;
  onRunPress?: () => void;
  onEmergencyStopPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const PumpStatusCard: React.FC<PumpStatusCardProps> = ({
  isRunning,
  mode = 'Automatic',
  nextQueue = 'Vegetable Plot',
  runtimeToday = '18 mins',
  onRunPress,
  onEmergencyStopPress,
  style,
}) => {
  return (
    <StitchCard style={[styles.container, style]}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.leftGroup}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isRunning
                  ? Colors.stitch.secondaryContainer
                  : Colors.stitch.surfaceContainer,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="fan"
              size={22}
              color={isRunning ? Colors.stitch.secondary : Colors.stitch.primary}
            />
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.cardTitle}>Shared 12V DC Pump</Text>
            <Text style={styles.cardSub}>Rated: 1A • Logic: Arduino Mega</Text>
          </View>
        </View>

        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isRunning
                ? '#FFF8E1'
                : Colors.stitch.surfaceContainer,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isRunning
                  ? Colors.stitch.warningAmber
                  : Colors.stitch.outline,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color: isRunning
                  ? Colors.stitch.warningAmber
                  : Colors.stitch.onSurfaceVariant,
              },
            ]}
          >
            {isRunning ? 'RUNNING' : 'STANDBY'}
          </Text>
        </View>
      </View>

      {/* 3-Column Stats Matrix */}
      <View style={styles.statsMatrix}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Current Mode</Text>
          <Text style={styles.statVal}>{mode}</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Next Queue</Text>
          <Text style={[styles.statVal, { color: Colors.stitch.secondary }]}>
            {nextQueue}
          </Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Runtime Today</Text>
          <Text style={styles.statVal}>{runtimeToday}</Text>
        </View>
      </View>

      {/* Action Buttons: Run Pump (3 min) + STOP */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onRunPress}
          style={styles.runBtn}
        >
          <MaterialCommunityIcons
            name="power"
            size={18}
            color={Colors.neutral.white}
          />
          <Text style={styles.runBtnText}>
            {isRunning ? 'Running Cycle...' : 'Run Pump (3 min)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onEmergencyStopPress}
          style={styles.stopBtn}
        >
          <MaterialCommunityIcons
            name="shield-alert-outline"
            size={18}
            color={Colors.neutral.white}
          />
          <Text style={styles.stopBtnText}>STOP</Text>
        </TouchableOpacity>
      </View>
    </StitchCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.spaceMd,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.spaceSm,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.spaceSm,
  },
  titleCol: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.headlineSm,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  cardSub: {
    ...Typography.labelSm,
    color: Colors.stitch.outline,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.spaceSm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...Typography.labelSm,
    fontWeight: '700',
  },
  statsMatrix: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: Spacing.spaceSm + 2,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.spaceXs,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.labelSm,
    fontSize: 9,
    color: Colors.stitch.outline,
    marginBottom: 2,
  },
  statVal: {
    ...Typography.labelMd,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spaceSm,
    marginTop: Spacing.spaceSm,
  },
  runBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.sm,
  },
  runBtnText: {
    ...Typography.labelMd,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  stopBtn: {
    height: 48,
    paddingHorizontal: Spacing.spaceLg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...Shadow.sm,
  },
  stopBtnText: {
    ...Typography.labelSm,
    color: Colors.neutral.white,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
