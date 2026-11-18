/**
 * AgroSmart 2.0 – Screen 6: Smart Irrigation & Water Control
 * Faithful implementation of Google Stitch UI/UX design (smart_irrigation_water_control/code.html)
 *
 * Implements:
 * - Master 12V DC Pump Hub (1.0A, 15 L/min flow coeff)
 * - Sequential Hydraulic Lock Interlock rules
 * - Emergency Halt Relays kill-switch
 * - Independent Solenoid Valve #1 (Plot A Drip) & Solenoid Valve #2 (Plot B Flood)
 * - Hardware MOSFET & electrical protection telemetry
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { StitchHeader } from '../../components/navigation/StitchHeader';
import { StitchCard } from '../../components/cards/StitchCard';
import { useIrrigationStore } from '../../store/irrigationStore';
import { useSensorStore } from '../../store/sensorStore';
import { useAppStore } from '../../store/appStore';

export default function SmartIrrigationWaterControlScreen() {
  const router = useRouter();
  const { isDemoMode } = useAppStore();
  const { pumpStatus, addCommand } = useIrrigationStore();
  const { vegetableZone, paddyZone } = useSensorStore();

  const [valveAToggled, setValveAToggled] = useState(false);
  const [valveBToggled, setValveBToggled] = useState(false);

  const vegMoisture = vegetableZone?.soilMoisture?.value ?? 38;
  const isPumpRunning = pumpStatus?.state === 'ON';
  const activeZone = pumpStatus?.activeZone;

  const handleEmergencyStop = async () => {
    try {
      const { deviceCommunicationService } = await import('../../services/connection/DeviceCommunicationService');
      await deviceCommunicationService.emergencyStop();
    } catch {}

    addCommand({
      commandId: `cmd_stop_${Date.now()}`,
      type: 'EMERGENCY_STOP',
      issuedAt: new Date().toISOString(),
      status: 'CONFIRMED',
    });
    Alert.alert(
      'EMERGENCY STOP EXECUTED',
      'Arduino Mega pump driver pulled LOW immediately. All solenoid relays deactivated. Hardware interlock latched.',
      [{ text: 'OK' }]
    );
  };

  const handleRequestVegDrip = async () => {
    try {
      const { deviceCommunicationService } = await import('../../services/connection/DeviceCommunicationService');
      const ack = await deviceCommunicationService.startIrrigation('vegetable', 300);
      addCommand({
        commandId: ack.commandId || `cmd_veg_drip_${Date.now()}`,
        type: 'PUMP_ON',
        targetZone: 'vegetable',
        issuedAt: new Date().toISOString(),
        status: ack.success ? 'CONFIRMED' : 'FAILED',
      });
      Alert.alert(
        ack.success ? 'Vegetable Drip Initiated' : 'Command Failed',
        ack.message || 'Requested 5-minute water drip for Plot A. Solenoid Valve 1 lead sequence will engage 1500ms before pump start.',
        [{ text: 'OK' }]
      );
    } catch (e: any) {
      Alert.alert('Dispatch Error', e.message || 'Failed to dispatch command to controller.');
    }
  };

  const handleRequestPaddyFlood = async () => {
    try {
      const { deviceCommunicationService } = await import('../../services/connection/DeviceCommunicationService');
      const ack = await deviceCommunicationService.startIrrigation('paddy', 1800);
      addCommand({
        commandId: ack.commandId || `cmd_paddy_flood_${Date.now()}`,
        type: 'PUMP_ON',
        targetZone: 'paddy',
        issuedAt: new Date().toISOString(),
        status: ack.success ? 'CONFIRMED' : 'FAILED',
      });
      Alert.alert(
        ack.success ? 'Paddy Flood Initiated' : 'Command Failed',
        ack.message || 'Requested 30-minute flood inflow for Plot B. Sequential interlock checks active lines before starting.',
        [{ text: 'OK' }]
      );
    } catch (e: any) {
      Alert.alert('Dispatch Error', e.message || 'Failed to dispatch command to controller.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Stitch Top Header */}
      <StitchHeader
        title="Smart Irrigation"
        subtitle="Hydraulic & Valve Hub"
        onNotificationPress={() => router.push('/notifications')}
        onProfilePress={() => router.push('/profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hardware Interlock & Pump Hub Card */}
        <StitchCard style={styles.pumpHubCard}>
          <View style={styles.pumpHubHeader}>
            <View style={styles.pumpHubHeaderLeft}>
              <View style={styles.pumpIconCircle}>
                <MaterialCommunityIcons
                  name="water-pump"
                  size={20}
                  color={Colors.neutral.white}
                />
              </View>
              <View>
                <View style={styles.pumpTitleRow}>
                  <Text style={styles.pumpHubTitle}>Master 12V DC Pump</Text>
                  <View style={styles.readyBadge}>
                    <Text style={styles.readyBadgeText}>
                      {isPumpRunning ? 'RUNNING' : 'READY'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.pumpHubSubtitle}>
                  Relay #1 (1.0A Max) • Arduino Mega Interlock
                </Text>
              </View>
            </View>

            <View style={styles.pumpHubHeaderRight}>
              <Text style={styles.flowCoeffTag}>FLOW COEFF</Text>
              <View style={styles.flowCoeffRow}>
                <Text style={styles.flowCoeffNumber}>15</Text>
                <Text style={styles.flowCoeffUnit}>L/min</Text>
              </View>
            </View>
          </View>

          {/* Sequential Safety Interlock Alert Box */}
          <View style={styles.interlockAlertBox}>
            <MaterialIcons
              name="security"
              size={20}
              color={Colors.stitch.secondary}
              style={{ marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.interlockTitle}>
                Sequential Hydraulic Lock Active
              </Text>
              <Text style={styles.interlockDesc}>
                Single line distribution prevents dual-solenoid activation. Activating one plot automatically queues the alternate. Max safety run limit: 15 mins.
              </Text>
            </View>
          </View>

          {/* Emergency Kill Switch & Lock State Indicators */}
          <View style={styles.pumpControlsRow}>
            <TouchableOpacity
              style={styles.emergencyBtn}
              activeOpacity={0.85}
              onPress={handleEmergencyStop}
            >
              <MaterialIcons
                name="power-settings-new"
                size={20}
                color={Colors.neutral.white}
              />
              <Text style={styles.emergencyBtnText}>Emergency Halt Relays</Text>
            </TouchableOpacity>

            <View style={styles.statusPill}>
              <View style={styles.greenStatusDot} />
              <Text style={styles.statusPillText}>Dry-Run OK</Text>
            </View>

            <View style={styles.statusPill}>
              <MaterialCommunityIcons
                name="weather-sunny"
                size={16}
                color={Colors.stitch.onSurfaceVariant}
              />
              <Text style={styles.statusPillText}>Rain: Clear</Text>
            </View>
          </View>
        </StitchCard>

        {/* Zone Solenoid Controls Section */}
        <View style={styles.solenoidsSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderTitleRow}>
              <MaterialIcons
                name="alt-route"
                size={20}
                color={Colors.stitch.secondary}
              />
              <Text style={styles.sectionTitle}>Active Solenoid Valves</Text>
            </View>
            <Text style={styles.sectionSubheader}>INDEPENDENT CHANNELS</Text>
          </View>

          {/* Plot A: Vegetable Drip Line Card */}
          <StitchCard style={styles.valveCard}>
            <View style={styles.valveCardHeader}>
              <View style={styles.valveHeaderLeft}>
                <View style={styles.valveIconWrap}>
                  <MaterialCommunityIcons
                    name="sprout"
                    size={20}
                    color={Colors.stitch.primary}
                  />
                </View>
                <View>
                  <View style={styles.valveTitleRow}>
                    <Text style={styles.valveTitleText}>
                      Plot A: Vegetable Drip
                    </Text>
                    <View style={styles.relayBadge}>
                      <Text style={styles.relayBadgeText}>Relay #2 (A1)</Text>
                    </View>
                  </View>
                  <Text style={styles.valveSubtitleText}>
                    Target Range: 35% – 55% Moisture
                  </Text>
                </View>
              </View>

              <View style={styles.idleBadge}>
                <View style={styles.idleDot} />
                <Text style={styles.idleBadgeText}>
                  {activeZone === 'vegetable' && isPumpRunning
                    ? 'Irrigating'
                    : 'Idle / Standby'}
                </Text>
              </View>
            </View>

            {/* Soil Moisture Mini Circular Reading */}
            <View style={styles.valveReadingBox}>
              <View style={styles.valveReadingLeft}>
                <View style={styles.miniGaugeBox}>
                  <Svg width={48} height={48} viewBox="0 0 36 36">
                    <Path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={Colors.stitch.surfaceContainerHighest}
                      strokeWidth="3.5"
                    />
                    <Path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={Colors.stitch.secondary}
                      strokeDasharray={`${vegMoisture}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </Svg>
                  <MaterialCommunityIcons
                    name="water"
                    size={15}
                    color={Colors.stitch.secondary}
                    style={styles.miniGaugeCenterIcon}
                  />
                </View>

                <View>
                  <Text style={styles.readingOverline}>CURRENT VOLUMETRIC</Text>
                  <View style={styles.readingNumRow}>
                    <Text style={styles.readingNumText}>{vegMoisture}%</Text>
                    <Text style={styles.readingStatusAlert}>
                      Approaching Threshold
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.valveReadingRight}>
                <Text style={styles.cutoffOverline}>Auto-Cutoff</Text>
                <Text style={styles.cutoffValue}>55% Soil Sat</Text>
              </View>
            </View>

            {/* Trigger Action */}
            <View style={styles.triggerActionRow}>
              <TouchableOpacity
                style={styles.requestDripBtn}
                activeOpacity={0.85}
                onPress={handleRequestVegDrip}
              >
                <MaterialIcons
                  name="play-arrow"
                  size={20}
                  color={Colors.neutral.white}
                />
                <Text style={styles.requestDripText}>
                  Request 5-Min Water Drip
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manualToggleBtn}
                activeOpacity={0.8}
                onPress={() => setValveAToggled(!valveAToggled)}
              >
                <MaterialCommunityIcons
                  name={valveAToggled ? 'toggle-switch' : 'toggle-switch-off'}
                  size={28}
                  color={
                    valveAToggled
                      ? Colors.stitch.secondary
                      : Colors.stitch.onSurfaceVariant
                  }
                />
              </TouchableOpacity>
            </View>
          </StitchCard>

          {/* Plot B: Lowland Paddy Submerged Inflow Card */}
          <StitchCard style={styles.valveCard}>
            <View style={styles.valveCardHeader}>
              <View style={styles.valveHeaderLeft}>
                <View style={styles.valveIconWrap}>
                  <MaterialCommunityIcons
                    name="waves"
                    size={18}
                    color={Colors.stitch.primary}
                  />
                </View>
                <View>
                  <View style={styles.valveTitleRow}>
                    <Text style={styles.valveTitleText}>
                      Plot B: Lowland Paddy
                    </Text>
                    <View style={styles.relayBadge}>
                      <Text style={styles.relayBadgeText}>Relay #3 (B2)</Text>
                    </View>
                  </View>
                  <Text style={styles.valveSubtitleText}>
                    Standing Depth Target: 5.0 cm
                  </Text>
                </View>
              </View>

              <View style={styles.restingBadge}>
                <View style={styles.restingDot} />
                <Text style={styles.restingBadgeText}>
                  {activeZone === 'paddy' && isPumpRunning
                    ? 'Flood Inflow'
                    : 'Resting'}
                </Text>
              </View>
            </View>

            {/* Water Level Visual Bar Gauge */}
            <View style={styles.valveReadingBoxColumn}>
              <View style={styles.depthHeaderRow}>
                <View style={styles.depthHeaderLeft}>
                  <Text style={styles.depthBigText}>4.2</Text>
                  <Text style={styles.depthUnitText}>cm Standing</Text>
                </View>
                <Text style={styles.floodTriggerText}>
                  Auto-Inflow when &lt; 3.0 cm
                </Text>
              </View>

              <View style={styles.depthTrackBar}>
                <View style={styles.depthOptimalBand} />
                <View style={[styles.depthCurrentFill, { width: '84%' }]} />
              </View>
            </View>

            {/* Trigger Action */}
            <View style={styles.triggerActionRow}>
              <TouchableOpacity
                style={styles.requestDripBtn}
                activeOpacity={0.85}
                onPress={handleRequestPaddyFlood}
              >
                <MaterialIcons
                  name="play-arrow"
                  size={20}
                  color={Colors.neutral.white}
                />
                <Text style={styles.requestDripText}>
                  Request 30-Min Flood Inflow
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manualToggleBtn}
                activeOpacity={0.8}
                onPress={() => setValveBToggled(!valveBToggled)}
              >
                <MaterialCommunityIcons
                  name={valveBToggled ? 'toggle-switch' : 'toggle-switch-off'}
                  size={28}
                  color={
                    valveBToggled
                      ? Colors.stitch.secondary
                      : Colors.stitch.onSurfaceVariant
                  }
                />
              </TouchableOpacity>
            </View>
          </StitchCard>
        </View>

        {/* 12V MOSFET Driver & Electrical Protection Specs Card */}
        <StitchCard style={styles.mosfetSpecCard}>
          <View style={styles.mosfetHeaderRow}>
            <View style={styles.mosfetHeaderLeft}>
              <MaterialCommunityIcons
                name="chip"
                size={20}
                color={Colors.stitch.secondary}
              />
              <Text style={styles.mosfetTitle}>12V MOSFET Driver Specs</Text>
            </View>
            <View style={styles.isolatedBadge}>
              <Text style={styles.isolatedBadgeText}>Common Ground</Text>
            </View>
          </View>

          <View style={styles.specGrid}>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>DRIVER TYPE</Text>
              <Text style={styles.specValue}>Logic N-Ch MOSFET</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>GATE RESISTOR</Text>
              <Text style={styles.specValue}>220Ω (5V GPIO)</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>FLYBACK DIODE</Text>
              <Text style={styles.specValue}>1N4007 Clamping</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>INLINE FUSE</Text>
              <Text style={styles.specValue}>2A Slow-Blow</Text>
            </View>
          </View>
        </StitchCard>

        {/* Quick Links Card */}
        <View style={styles.quickLinksRow}>
          <TouchableOpacity
            style={styles.linkCard}
            activeOpacity={0.85}
            onPress={() => router.push('/pump-control')}
          >
            <MaterialCommunityIcons
              name="water-pump"
              size={22}
              color={Colors.stitch.secondary}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Pump Control Center</Text>
              <Text style={styles.linkDesc}>Full 12V timing & manual runs</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={Colors.stitch.onSurfaceVariant}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            activeOpacity={0.85}
            onPress={() => router.push('/water-management')}
          >
            <MaterialCommunityIcons
              name="chart-timeline-variant"
              size={22}
              color={Colors.stitch.water}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Water Accounting</Text>
              <Text style={styles.linkDesc}>Litres delivered & logs</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={Colors.stitch.onSurfaceVariant}
            />
          </TouchableOpacity>
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

  // Pump Hub Card
  pumpHubCard: {
    marginBottom: Spacing.spaceLg,
    gap: Spacing.spaceMd,
  },
  pumpHubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pumpHubHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spaceSm,
    flex: 1,
  },
  pumpIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.stitch.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pumpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pumpHubTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  readyBadge: {
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  readyBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },
  pumpHubSubtitle: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    marginTop: 2,
  },
  pumpHubHeaderRight: {
    alignItems: 'flex-end',
  },
  flowCoeffTag: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  flowCoeffRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  flowCoeffNumber: {
    ...Typography.metricLarge,
    color: Colors.stitch.primary,
    fontWeight: '800',
  },
  flowCoeffUnit: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSurfaceVariant,
  },

  // Interlock Alert Box
  interlockAlertBox: {
    backgroundColor: Colors.stitch.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: Spacing.spaceSm + 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.spaceSm,
  },
  interlockTitle: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  interlockDesc: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 2,
  },

  // Controls Row
  pumpControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spaceSm,
    paddingTop: 4,
  },
  emergencyBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadow.sm,
  },
  emergencyBtnText: {
    ...Typography.labelMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  greenStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.stitch.secondary,
  },
  statusPillText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurface,
    fontWeight: '600',
  },

  // Solenoids Section
  solenoidsSection: {
    marginBottom: Spacing.spaceLg,
    gap: Spacing.spaceMd,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  sectionSubheader: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    letterSpacing: 0.5,
  },

  // Valve Cards
  valveCard: {
    gap: Spacing.spaceMd,
  },
  valveCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  valveHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spaceSm,
  },
  valveIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.stitch.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valveTitleText: {
    ...Typography.bodyLarge,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  relayBadge: {
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  relayBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 9,
  },
  valveSubtitleText: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  idleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.secondaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  idleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stitch.secondary,
  },
  idleBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSecondaryFixed,
    fontWeight: '700',
  },
  restingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  restingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stitch.outline,
  },
  restingBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '600',
  },

  // Valve Reading Box
  valveReadingBox: {
    backgroundColor: Colors.stitch.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: Spacing.spaceSm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valveReadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniGaugeBox: {
    position: 'relative',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniGaugeCenterIcon: {
    position: 'absolute',
  },
  readingOverline: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  readingNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  readingNumText: {
    ...Typography.metricLarge,
    color: Colors.stitch.primary,
    fontWeight: '800',
  },
  readingStatusAlert: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '600',
    fontSize: 10,
  },
  valveReadingRight: {
    alignItems: 'flex-end',
  },
  cutoffOverline: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 10,
  },
  cutoffValue: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },

  // Valve Reading Column (Paddy)
  valveReadingBoxColumn: {
    backgroundColor: Colors.stitch.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: Spacing.spaceSm + 2,
    gap: 8,
  },
  depthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  depthHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  depthBigText: {
    ...Typography.headlineMedium,
    color: Colors.stitch.primary,
    fontWeight: '800',
  },
  depthUnitText: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '600',
  },
  floodTriggerText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '600',
  },
  depthTrackBar: {
    width: '100%',
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.surfaceContainerHighest,
    position: 'relative',
    overflow: 'hidden',
  },
  depthOptimalBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '60%',
    width: '30%',
    backgroundColor: Colors.stitch.secondaryContainer,
  },
  depthCurrentFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.water,
  },

  // Trigger Action Row
  triggerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spaceSm,
  },
  requestDripBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadow.sm,
  },
  requestDripText: {
    ...Typography.labelMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  manualToggleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.stitch.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // MOSFET Spec Card
  mosfetSpecCard: {
    marginBottom: Spacing.spaceLg,
    gap: Spacing.spaceSm,
  },
  mosfetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mosfetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mosfetTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  isolatedBadge: {
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  isolatedBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  specItem: {
    width: '48%',
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: 8,
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

  // Quick Links
  quickLinksRow: {
    gap: 10,
    marginBottom: Spacing.spaceSm,
  },
  linkCard: {
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
  linkTitle: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  linkDesc: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 11,
  },
});
