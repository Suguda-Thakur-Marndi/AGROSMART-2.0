/**
 * AgroSmart 2.0 – Screen: Settings & Farm Profile
 * Faithful implementation of Google Stitch UI/UX design
 *
 * Provides:
 * - Farm Operator profile card
 * - Hardware system specs (EWS Grove Mega, A7672S, 12V 1A DC Pump)
 * - Demo mode toggle (simulated data vs live hardware)
 * - Navigation shortcuts to Connectivity, Calibration, Pump, and Water Accounting
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { StitchHeader } from '../../components/navigation/StitchHeader';
import { StitchCard } from '../../components/cards/StitchCard';
import { useAppStore } from '../../store/appStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { isDemoMode, setDemoMode } = useAppStore();

  const handleToggleDemoMode = (val: boolean) => {
    setDemoMode(val);
    Alert.alert(
      val ? 'Demo Mode Enabled' : 'Live Hardware Mode Enabled',
      val
        ? 'The application is now using realistic simulated telemetry for demonstration purposes.'
        : 'The application is now connected to live hardware. Measurements reflect real physical sensor probes.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Stitch Top Header */}
      <StitchHeader
        title="Settings & Profile"
        subtitle="System Architecture"
        onNotificationPress={() => router.push('/notifications')}
        onProfilePress={() => {}}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Farmer Operator Profile Card */}
        <StitchCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <MaterialCommunityIcons
                name="account"
                size={32}
                color={Colors.stitch.secondaryContainer}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.farmerName}>Farm Operator</Text>
                <View style={styles.operatorBadge}>
                  <Text style={styles.operatorBadgeText}>Master Admin</Text>
                </View>
              </View>
              <Text style={styles.farmLocationText}>
                AgroSmart Dual-Zone Farm • Plot A & B
              </Text>
              <Text style={styles.hardwareAuthorityText}>
                Arduino Mega IoT Hardware Authority Active
              </Text>
            </View>
          </View>
        </StitchCard>

        {/* System Simulation & Demo Control */}
        <StitchCard style={styles.modeCard}>
          <View style={styles.modeRow}>
            <View style={styles.modeInfo}>
              <View style={styles.modeTitleRow}>
                <MaterialCommunityIcons
                  name="database-sync"
                  size={20}
                  color={Colors.stitch.secondary}
                />
                <Text style={styles.modeTitle}>Demo Mode Simulation</Text>
              </View>
              <Text style={styles.modeDesc}>
                Toggle between simulated agricultural scenarios and live physical probe telemetry.
              </Text>
            </View>
            <Switch
              value={isDemoMode}
              onValueChange={handleToggleDemoMode}
              trackColor={{
                false: Colors.stitch.surfaceContainerHighest,
                true: Colors.stitch.secondaryContainer,
              }}
              thumbColor={
                isDemoMode ? Colors.stitch.secondary : Colors.stitch.outline
              }
            />
          </View>
        </StitchCard>

        {/* Hardware System Specifications Card */}
        <StitchCard style={styles.specsCard}>
          <View style={styles.specsHeader}>
            <MaterialCommunityIcons
              name="developer-board"
              size={20}
              color={Colors.stitch.primary}
            />
            <Text style={styles.specsTitle}>Hardware Inventory & Bus</Text>
          </View>

          <View style={styles.specsList}>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>MAIN CONTROLLER</Text>
              <Text style={styles.specValue}>EWS Arduino Mega IoT (ATmega2560)</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>CELLULAR GATEWAY</Text>
              <Text style={styles.specValue}>A7672S 4G LTE (UART Serial1)</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>SHARED PUMP</Text>
              <Text style={styles.specValue}>12V DC, 1A (MOSFET Driven, 15 L/min)</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>VALVE MANIFOLD</Text>
              <Text style={styles.specValue}>Dual 12V Solenoids (Sequential Lock)</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>POWER SUPPLY</Text>
              <Text style={styles.specValue}>12V 3A Regulated (Common Ground)</Text>
            </View>
          </View>
        </StitchCard>

        {/* System Navigation & Maintenance Links */}
        <View style={styles.shortcutsSection}>
          <Text style={styles.shortcutsHeader}>Hardware Hub Navigation</Text>

          <TouchableOpacity
            style={styles.navItemCard}
            activeOpacity={0.85}
            onPress={() => router.push('/connection')}
          >
            <View style={styles.navIconWrap}>
              <MaterialCommunityIcons
                name="wifi-sync"
                size={24}
                color={Colors.stitch.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Device Connection (Wi-Fi & Bluetooth)</Text>
              <Text style={styles.navSubtitle}>
                Pair via direct Bluetooth or connect through Wi-Fi farm gateway
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={Colors.stitch.onSurfaceVariant}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItemCard}
            activeOpacity={0.85}
            onPress={() => router.push('/sensor-detail')}
          >
            <View style={styles.navIconWrap}>
              <MaterialCommunityIcons
                name="tune-vertical"
                size={22}
                color={Colors.stitch.tertiary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Probe Calibration & Diagnostics</Text>
              <Text style={styles.navSubtitle}>
                Capacitive V1.2 Dry/Wet and PE-03 pH 3-point calibration
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={Colors.stitch.onSurfaceVariant}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItemCard}
            activeOpacity={0.85}
            onPress={() => router.push('/pump-control')}
          >
            <View style={styles.navIconWrap}>
              <MaterialCommunityIcons
                name="water-pump"
                size={22}
                color={Colors.stitch.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>12V Pump Control Center</Text>
              <Text style={styles.navSubtitle}>
                Sequential lead/lag timers, emergency stop & duration picker
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={Colors.stitch.onSurfaceVariant}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItemCard}
            activeOpacity={0.85}
            onPress={() => router.push('/water-management')}
          >
            <View style={styles.navIconWrap}>
              <MaterialCommunityIcons
                name="chart-timeline-variant"
                size={22}
                color={Colors.stitch.water}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Water Accounting & Reports</Text>
              <Text style={styles.navSubtitle}>
                Volume delivered by zone based on calibrated runtime
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={Colors.stitch.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        {/* Footer Build Tag */}
        <View style={styles.footerBuildTag}>
          <Text style={styles.footerText}>AgroSmart 2.0 • Build 2026.11-rc2</Text>
          <Text style={styles.footerSub}>EWS Mega Firmware: v2.4.1-avr-release</Text>
        </View>

        <View style={{ height: Spacing.space2xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.stitch.surfaceContainerLow,
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Spacing.spaceSm,
    paddingBottom: Spacing.space2xl,
  },

  // Profile Card
  profileCard: {
    backgroundColor: Colors.stitch.primaryContainer,
    borderRadius: BorderRadius.xl,
    padding: Spacing.spaceLg,
    marginBottom: Spacing.spaceLg,
    ...Shadow.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spaceMd,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  farmerName: {
    ...Typography.headlineMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  operatorBadge: {
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  operatorBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },
  farmLocationText: {
    ...Typography.bodySmall,
    color: Colors.stitch.onPrimaryContainer,
    marginTop: 2,
  },
  hardwareAuthorityText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondaryFixed,
    marginTop: 4,
  },

  // Mode Card
  modeCard: {
    marginBottom: Spacing.spaceLg,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeInfo: {
    flex: 1,
    marginRight: Spacing.spaceMd,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  modeDesc: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },

  // Specs Card
  specsCard: {
    marginBottom: Spacing.spaceLg,
    gap: Spacing.spaceMd,
  },
  specsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specsTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  specsList: {
    gap: 8,
  },
  specItem: {
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: Spacing.spaceSm + 2,
    borderRadius: BorderRadius.sm,
  },
  specLabel: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  specValue: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
    marginTop: 2,
  },

  // Shortcuts Section
  shortcutsSection: {
    gap: 10,
    marginBottom: Spacing.spaceLg,
  },
  shortcutsHeader: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  navItemCard: {
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.spaceMd,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.stitch.border,
    ...Shadow.sm,
  },
  navIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.stitch.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  navSubtitle: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },

  // Footer Build Tag
  footerBuildTag: {
    alignItems: 'center',
    paddingVertical: Spacing.spaceMd,
  },
  footerText: {
    ...Typography.labelMedium,
    color: Colors.stitch.outline,
    fontWeight: '600',
  },
  footerSub: {
    ...Typography.labelSmall,
    color: Colors.stitch.outlineVariant,
    marginTop: 2,
  },
});
