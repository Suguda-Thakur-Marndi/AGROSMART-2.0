/**
 * AgroSmart 2.0 – Screen 2: Farm Overview
 * Faithful implementation of Google Stitch UI/UX design (farm_overview/code.html)
 *
 * Provides holistic overview of dual crop zones:
 * - Microclimate canopy header (DHT11 ambient)
 * - Plot A: Vegetable Field (0.5 ha, Capacitive V1.2, PE-03 pH, DS18B20)
 * - Plot B: Lowland Paddy Field (1.2 ha, Submerged standing layer, Anaerobic bed)
 * - Shared 12V DC Pump & Solenoid Valve Sequential Link
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { StitchHeader } from '../../components/navigation/StitchHeader';
import { StitchCard } from '../../components/cards/StitchCard';
import { useSensorStore } from '../../store/sensorStore';
import { useIrrigationStore } from '../../store/irrigationStore';
import { useAppStore } from '../../store/appStore';

// High-resolution agricultural imagery matching Stitch design
const VEG_BANNER_URI =
  'https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80';
const PADDY_BANNER_URI =
  'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=800&q=80';

export default function FarmOverviewScreen() {
  const router = useRouter();
  const { isDemoMode } = useAppStore();
  const { vegetableZone, paddyZone } = useSensorStore();
  const { pumpStatus, addCommand } = useIrrigationStore();

  const [requestedPlotA, setRequestedPlotA] = useState(false);
  const [requestedPlotB, setRequestedPlotB] = useState(false);

  // Extract live sensor readings with Stitch fallbacks
  const vegMoisture = vegetableZone?.soilMoisture?.value ?? 38;
  const vegPh = vegetableZone?.ph?.value ?? 6.5;
  const vegTemp = vegetableZone?.soilTemperature?.value ?? 26.2;
  const ambientRh = vegetableZone?.airHumidity?.value ?? 65;
  const ambientTemp = vegetableZone?.airTemperature?.value ?? 29;

  const paddyMoisture = paddyZone?.soilMoisture?.value ?? 72;
  const paddyPh = paddyZone?.ph?.value ?? 6.8;
  const paddyTemp = paddyZone?.soilTemperature?.value ?? 27.0;

  const isPumpRunning = pumpStatus?.state === 'ON';

  const handleRequestPlotA = () => {
    setRequestedPlotA(!requestedPlotA);
    addCommand({
      commandId: `cmd_${Date.now()}`,
      type: 'PUMP_ON',
      targetZone: 'vegetable',
      issuedAt: new Date().toISOString(),
      status: 'PENDING',
    });
    Alert.alert(
      'Plot A Irrigation Queued',
      'Vegetable drip line requested for 15 minutes. Solenoid Valve 1 will open once the shared 12V pump starts after lead delay.',
      [{ text: 'OK' }]
    );
  };

  const handleRequestPlotB = () => {
    setRequestedPlotB(!requestedPlotB);
    addCommand({
      commandId: `cmd_${Date.now()}`,
      type: 'PUMP_ON',
      targetZone: 'paddy',
      issuedAt: new Date().toISOString(),
      status: 'PENDING',
    });
    Alert.alert(
      'Plot B Irrigation Queued',
      'Lowland paddy flood requested for 30 minutes. Solenoid Valve 2 will sequence safely following hydraulic lock rules.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <StitchHeader
        title="Farm Overview"
        subtitle="2 Agricultural Zones Under Autonomous Control"
        onNotificationPress={() => router.push('/notifications')}
        onProfilePress={() => router.push('/profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Demo Mode Pill & Telemetry Status Banner */}
        <View style={styles.statusBannerRow}>
          <View style={styles.demoPill}>
            <View style={styles.demoPingDot}>
              <View style={styles.demoPulseDot} />
            </View>
            <Text style={styles.demoPillText}>
              {isDemoMode ? 'DEMO MODE: SIMULATED DATA ACTIVE' : 'LIVE HARDWARE LINK ACTIVE'}
            </Text>
          </View>

          <View style={styles.cellularPill}>
            <MaterialIcons name="cell-tower" size={13} color={Colors.stitch.secondary} />
            <Text style={styles.cellularText}>A7672S 4G</Text>
          </View>
        </View>

        {/* Microclimate Header Strip */}
        <View style={styles.microclimateStrip}>
          <View style={styles.microclimateLeft}>
            <View style={styles.sunIconWrap}>
              <MaterialIcons name="wb-sunny" size={22} color={Colors.stitch.primary} />
            </View>
            <View>
              <View style={styles.microclimateTempRow}>
                <Text style={styles.microclimateTemp}>{ambientTemp}°C</Text>
                <Text style={styles.microclimateCondition}>Clear Canopy</Text>
              </View>
              <Text style={styles.microclimateSensorTag}>
                DHT11 Canopy Module • Field Ambient
              </Text>
            </View>
          </View>

          <View style={styles.microclimateRight}>
            <Text style={styles.telemetryTag}>TELEMETRY</Text>
            <View style={styles.telemetrySyncRow}>
              <MaterialCommunityIcons
                name="sync"
                size={14}
                color={Colors.stitch.secondary}
              />
              <Text style={styles.telemetrySyncText}>Live 2s</Text>
            </View>
          </View>
        </View>

        {/* Page Introduction & Sector Summary */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeadline}>Active Crop Zones</Text>
            <Text style={styles.sectionSubtitle}>
              2 Sectors Under Autonomous Micro-Management
            </Text>
          </View>
          <View style={styles.totalAreaBadge}>
            <MaterialIcons
              name="layers"
              size={16}
              color={Colors.stitch.secondary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.totalAreaText}>1.7 ha Total</Text>
          </View>
        </View>

        {/* ZONE 1: Plot A - Vegetable Field */}
        <StitchCard style={styles.zoneCard}>
          {/* Image Banner with Organic Overlays */}
          <ImageBackground
            source={{ uri: VEG_BANNER_URI }}
            style={styles.zoneBanner}
            imageStyle={styles.zoneBannerImage}
          >
            {/* Dark Gradient Overlay */}
            <View style={styles.bannerGradientOverlay} />

            {/* Top Badges */}
            <View style={styles.bannerTopRow}>
              <View style={styles.areaChip}>
                <MaterialCommunityIcons
                  name="sprout"
                  size={14}
                  color={Colors.stitch.secondary}
                />
                <Text style={styles.areaChipText}>Plot A • 0.5 Hectares</Text>
              </View>

              <View style={styles.warningChip}>
                <MaterialIcons name="warning" size={12} color={Colors.stitch.onErrorContainer} />
                <Text style={styles.warningChipText}>Needs Water Soon</Text>
              </View>
            </View>

            {/* Bottom Overlay Labels */}
            <View style={styles.bannerBottomRow}>
              <View>
                <Text style={styles.cropTitle}>Vegetable Field</Text>
                <Text style={styles.cropSubtitle}>Tomatoes, Lettuce & Leafy Greens</Text>
              </View>
              <View style={styles.thresholdAlignRight}>
                <Text style={styles.thresholdTag}>Threshold</Text>
                <Text style={styles.thresholdValue}>Trigger at 35%</Text>
              </View>
            </View>
          </ImageBackground>

          {/* Zone 1 Telemetry & Action Block */}
          <View style={styles.zoneContentBlock}>
            {/* Moisture Progress Bar Strip */}
            <View style={styles.moistureStrip}>
              <View style={styles.moistureHeaderRow}>
                <View style={styles.iconLabelRow}>
                  <MaterialCommunityIcons
                    name="water"
                    size={18}
                    color={Colors.stitch.secondary}
                  />
                  <Text style={styles.moistureLabelText}>
                    Soil Moisture (Capacitive V1.2)
                  </Text>
                </View>
                <Text style={styles.moistureMetricLarge}>{vegMoisture}%</Text>
              </View>

              {/* Progress track */}
              <View style={styles.progressTrack}>
                {/* 35% Threshold Line */}
                <View style={[styles.thresholdIndicator, { left: '35%' }]} />
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, Math.max(0, vegMoisture))}%`,
                      backgroundColor:
                        vegMoisture < 35
                          ? Colors.stitch.error
                          : Colors.stitch.secondary,
                    },
                  ]}
                />
              </View>

              <View style={styles.progressFooterRow}>
                <Text style={styles.progressFooterText}>Critical: 25%</Text>
                <View style={styles.approachingRow}>
                  <MaterialIcons
                    name="arrow-downward"
                    size={11}
                    color={Colors.stitch.error}
                  />
                  <Text style={styles.approachingText}>Approaching 35%</Text>
                </View>
                <Text style={styles.progressFooterText}>Target: 55-65%</Text>
              </View>
            </View>

            {/* Telemetry 3-Grid */}
            <View style={styles.telemetry3Grid}>
              {/* 1. Soil pH */}
              <View style={styles.telemetryCol}>
                <MaterialCommunityIcons
                  name="flask-outline"
                  size={18}
                  color={Colors.stitch.onSurfaceVariant}
                />
                <Text style={styles.telemetryColLabel}>SOIL PH</Text>
                <Text style={styles.telemetryColValue}>{vegPh.toFixed(1)}</Text>
                <Text style={styles.telemetryColStatus}>PE-03 Optimal</Text>
              </View>

              {/* 2. Soil Temp */}
              <View style={styles.telemetryCol}>
                <MaterialIcons
                  name="thermostat"
                  size={18}
                  color={Colors.stitch.onSurfaceVariant}
                />
                <Text style={styles.telemetryColLabel}>SOIL TEMP</Text>
                <Text style={styles.telemetryColValue}>{vegTemp.toFixed(1)}°C</Text>
                <Text style={styles.telemetryColStatusMuted}>15cm Depth</Text>
              </View>

              {/* 3. Canopy RH */}
              <View style={styles.telemetryCol}>
                <MaterialCommunityIcons
                  name="water-percent"
                  size={18}
                  color={Colors.stitch.onSurfaceVariant}
                />
                <Text style={styles.telemetryColLabel}>CANOPY RH</Text>
                <Text style={styles.telemetryColValue}>{ambientRh}%</Text>
                <Text style={styles.telemetryColStatus}>DHT11 Steady</Text>
              </View>
            </View>

            {/* Sequential Queue Notice */}
            <View style={styles.queueNoticeBox}>
              <View style={styles.queueNoticeLeft}>
                <MaterialIcons
                  name="schema"
                  size={18}
                  color={Colors.stitch.secondary}
                />
                <Text style={styles.queueNoticeText}>Next in Irrigation Queue</Text>
              </View>
              <View style={styles.queueBadge}>
                <Text style={styles.queueBadgeText}>Sequential Relay</Text>
              </View>
            </View>

            {/* Quick Action Area */}
            <View style={styles.actionButtonRow}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                activeOpacity={0.85}
                onPress={() => router.push('/zone-vegetable')}
              >
                <Text style={styles.primaryActionText}>Field Monitoring</Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={16}
                  color={Colors.neutral.white}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tactileRequestButton,
                  requestedPlotA && styles.tactileRequestActive,
                ]}
                activeOpacity={0.85}
                onPress={handleRequestPlotA}
              >
                <MaterialCommunityIcons
                  name="water-pump"
                  size={18}
                  color={Colors.stitch.onSecondaryContainer}
                />
                <Text style={styles.tactileRequestText}>
                  {requestedPlotA ? 'Queued' : 'Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </StitchCard>

        {/* ZONE 2: Plot B - Lowland Paddy Field */}
        <StitchCard style={styles.zoneCard}>
          {/* Image Banner with Organic Overlays */}
          <ImageBackground
            source={{ uri: PADDY_BANNER_URI }}
            style={styles.zoneBanner}
            imageStyle={styles.zoneBannerImage}
          >
            <View style={styles.bannerGradientOverlay} />

            {/* Top Badges */}
            <View style={styles.bannerTopRow}>
              <View style={styles.areaChip}>
                <MaterialCommunityIcons
                  name="grass"
                  size={14}
                  color={Colors.stitch.secondary}
                />
                <Text style={styles.areaChipText}>Plot B • 1.2 Hectares</Text>
              </View>

              <View style={styles.optimalChip}>
                <MaterialIcons
                  name="check-circle"
                  size={12}
                  color={Colors.stitch.onSecondaryContainer}
                />
                <Text style={styles.optimalChipText}>Submerged & Optimal</Text>
              </View>
            </View>

            {/* Bottom Overlay Labels */}
            <View style={styles.bannerBottomRow}>
              <View>
                <Text style={styles.cropTitle}>Lowland Paddy Field</Text>
                <Text style={styles.cropSubtitle}>Wetland Rice • Khao Dawk Mali 105</Text>
              </View>
              <View style={styles.thresholdAlignRight}>
                <Text style={styles.thresholdTag}>Water Layer</Text>
                <Text style={styles.thresholdValue}>4.0 cm Standing</Text>
              </View>
            </View>
          </ImageBackground>

          {/* Zone 2 Telemetry & Action Block */}
          <View style={styles.zoneContentBlock}>
            {/* Saturation Progress Bar Strip */}
            <View style={styles.moistureStrip}>
              <View style={styles.moistureHeaderRow}>
                <View style={styles.iconLabelRow}>
                  <MaterialCommunityIcons
                    name="waves"
                    size={18}
                    color={Colors.stitch.secondary}
                  />
                  <Text style={styles.moistureLabelText}>
                    Substrate Saturation (Depth / Mud)
                  </Text>
                </View>
                <Text
                  style={[
                    styles.moistureMetricLarge,
                    { color: Colors.stitch.secondary },
                  ]}
                >
                  {paddyMoisture}%
                </Text>
              </View>

              {/* Progress track */}
              <View style={styles.progressTrack}>
                <View style={[styles.thresholdIndicator, { left: '60%' }]} />
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, Math.max(0, paddyMoisture))}%`,
                      backgroundColor: Colors.stitch.secondary,
                    },
                  ]}
                />
              </View>

              <View style={styles.progressFooterRow}>
                <Text style={styles.progressFooterText}>Min Standing: 60%</Text>
                <View style={styles.approachingRow}>
                  <MaterialIcons
                    name="verified"
                    size={11}
                    color={Colors.stitch.secondary}
                  />
                  <Text
                    style={[
                      styles.approachingText,
                      { color: Colors.stitch.secondary },
                    ]}
                  >
                    4cm Level Maintained
                  </Text>
                </View>
                <Text style={styles.progressFooterText}>Max Spill: 90%</Text>
              </View>
            </View>

            {/* Telemetry 3-Grid */}
            <View style={styles.telemetry3Grid}>
              {/* 1. Water pH */}
              <View style={styles.telemetryCol}>
                <MaterialCommunityIcons
                  name="flask-outline"
                  size={18}
                  color={Colors.stitch.onSurfaceVariant}
                />
                <Text style={styles.telemetryColLabel}>WATER PH</Text>
                <Text style={styles.telemetryColValue}>{paddyPh.toFixed(1)}</Text>
                <Text style={styles.telemetryColStatus}>Neutral Balance</Text>
              </View>

              {/* 2. Mud Temp */}
              <View style={styles.telemetryCol}>
                <MaterialIcons
                  name="device-thermostat"
                  size={18}
                  color={Colors.stitch.onSurfaceVariant}
                />
                <Text style={styles.telemetryColLabel}>MUD TEMP</Text>
                <Text style={styles.telemetryColValue}>{paddyTemp.toFixed(1)}°C</Text>
                <Text style={styles.telemetryColStatusMuted}>DS18B20 Probe</Text>
              </View>

              {/* 3. Ambient RH */}
              <View style={styles.telemetryCol}>
                <Feather
                  name="wind"
                  size={18}
                  color={Colors.stitch.onSurfaceVariant}
                />
                <Text style={styles.telemetryColLabel}>AMBIENT RH</Text>
                <Text style={styles.telemetryColValue}>{ambientRh}%</Text>
                <Text style={styles.telemetryColStatus}>Microclimate</Text>
              </View>
            </View>

            {/* Automation Status */}
            <View style={styles.queueNoticeBox}>
              <View style={styles.queueNoticeLeft}>
                <MaterialCommunityIcons
                  name="power-standby"
                  size={18}
                  color={Colors.stitch.secondary}
                />
                <Text style={styles.queueNoticeText}>
                  Irrigation Idle • Auto Threshold 60%
                </Text>
              </View>
              <View style={styles.standingBadge}>
                <Text style={styles.standingBadgeText}>Standing OK</Text>
              </View>
            </View>

            {/* Quick Action Area */}
            <View style={styles.actionButtonRow}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                activeOpacity={0.85}
                onPress={() => router.push('/zone-paddy')}
              >
                <Text style={styles.primaryActionText}>Field Monitoring</Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={16}
                  color={Colors.neutral.white}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tactileRequestButton,
                  requestedPlotB && styles.tactileRequestActive,
                ]}
                activeOpacity={0.85}
                onPress={handleRequestPlotB}
              >
                <MaterialIcons
                  name="tune"
                  size={18}
                  color={Colors.stitch.primary}
                />
                <Text style={[styles.tactileRequestText, { color: Colors.stitch.primary }]}>
                  {requestedPlotB ? 'Queued' : 'Layer Target'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </StitchCard>

        {/* Hardware Relay Link & Shared Pump Card */}
        <View style={styles.hardwareRelayCard}>
          <View style={styles.hardwareRelayHeader}>
            <View style={styles.hardwareRelayTitleRow}>
              <View style={styles.microchipIconWrap}>
                <MaterialCommunityIcons
                  name="memory"
                  size={18}
                  color={Colors.neutral.white}
                />
              </View>
              <View>
                <Text style={styles.hardwareRelayTitle}>Hardware Relay Link</Text>
                <Text style={styles.hardwareRelaySubtitle}>
                  Arduino Mega Grove Automation
                </Text>
              </View>
            </View>

            <View style={styles.onlineBadge}>
              <Text style={styles.onlineBadgeText}>Online</Text>
            </View>
          </View>

          {/* Pump Info Row */}
          <TouchableOpacity
            style={styles.pumpInfoRow}
            activeOpacity={0.85}
            onPress={() => router.push('/pump-control')}
          >
            <View style={styles.pumpInfoLeft}>
              <View style={styles.pumpIconWrap}>
                <MaterialCommunityIcons
                  name="water-pump"
                  size={20}
                  color={Colors.stitch.secondaryContainer}
                />
              </View>
              <View>
                <Text style={styles.pumpTitle}>Shared 12V 1A DC Pump</Text>
                <Text style={styles.pumpSubtitle}>
                  Dual Solenoid Sequencing Active
                </Text>
              </View>
            </View>

            <View style={styles.pumpInfoRight}>
              <Text style={styles.pumpStatusTag}>
                {isPumpRunning ? 'RUNNING' : 'STANDBY'}
              </Text>
              <Text style={styles.flowRateText}>
                {isPumpRunning ? '12.0 L/min' : '0.0 L/min (Est.)'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Power & Telemetry Footer */}
          <View style={styles.hardwareFooter}>
            <View style={styles.hardwareFooterItem}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={15}
                color={Colors.stitch.secondaryFixed}
              />
              <Text style={styles.hardwareFooterText}>Main Supply 12V Regulated</Text>
            </View>

            <View style={styles.hardwareFooterItem}>
              <MaterialCommunityIcons
                name="router-wireless"
                size={15}
                color={Colors.stitch.secondaryFixed}
              />
              <Text style={styles.hardwareFooterText}>RSSI: -67 dBm</Text>
            </View>
          </View>
        </View>

        {/* Bottom padding for tab bar */}
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

  // Status Banner
  statusBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.spaceSm,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: Spacing.spaceMd,
    paddingVertical: Spacing.spaceXs + 2,
    borderRadius: BorderRadius.full,
  },
  demoPingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.stitch.secondary,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stitch.secondary,
  },
  demoPillText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  cellularPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cellularText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },

  // Microclimate Strip
  microclimateStrip: {
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.spaceMd,
    marginBottom: Spacing.spaceLg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.stitch.border,
    ...Shadow.sm,
  },
  microclimateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spaceMd,
  },
  sunIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.stitch.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  microclimateTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  microclimateTemp: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  microclimateCondition: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSurfaceVariant,
  },
  microclimateSensorTag: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 11,
  },
  microclimateRight: {
    alignItems: 'flex-end',
  },
  telemetryTag: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  telemetrySyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  telemetrySyncText: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurface,
    fontWeight: '600',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.spaceMd,
  },
  sectionHeadline: {
    ...Typography.headlineMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  totalAreaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  totalAreaText: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '600',
  },

  // Zone Card
  zoneCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.spaceLg,
  },
  zoneBanner: {
    width: '100%',
    height: 176,
    justifyContent: 'space-between',
    padding: Spacing.spaceMd,
  },
  zoneBannerImage: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  bannerGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 39, 23, 0.45)',
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 254, 249, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  areaChipText: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  warningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.errorContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  warningChipText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onErrorContainer,
    fontWeight: '700',
  },
  optimalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  optimalChipText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },
  bannerBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  cropTitle: {
    ...Typography.headlineSmall,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  cropSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  thresholdAlignRight: {
    alignItems: 'flex-end',
  },
  thresholdTag: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondaryContainer,
    fontWeight: '700',
  },
  thresholdValue: {
    ...Typography.labelMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },

  // Zone Content Block
  zoneContentBlock: {
    padding: Spacing.spaceLg,
    gap: Spacing.spaceMd,
  },

  // Moisture Progress Bar Strip
  moistureStrip: {
    backgroundColor: Colors.stitch.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: Spacing.spaceMd,
    gap: 6,
  },
  moistureHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moistureLabelText: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '600',
  },
  moistureMetricLarge: {
    ...Typography.metricLarge,
    color: Colors.stitch.primary,
    fontWeight: '800',
  },
  progressTrack: {
    width: '100%',
    height: 12,
    backgroundColor: Colors.stitch.surfaceContainerHighest,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 4,
  },
  thresholdIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.stitch.error,
    zIndex: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressFooterText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  approachingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  approachingText: {
    ...Typography.labelSmall,
    color: Colors.stitch.error,
    fontWeight: '700',
  },

  // Telemetry 3-Grid
  telemetry3Grid: {
    flexDirection: 'row',
    gap: 8,
  },
  telemetryCol: {
    flex: 1,
    backgroundColor: Colors.stitch.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: Spacing.spaceSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryColLabel: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  telemetryColValue: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
    marginVertical: 2,
  },
  telemetryColStatus: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '600',
    fontSize: 10,
  },
  telemetryColStatusMuted: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 10,
  },

  // Queue Notice
  queueNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.stitch.surfaceContainerHigh,
    paddingHorizontal: Spacing.spaceSm,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  queueNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queueNoticeText: {
    ...Typography.bodySmall,
    color: Colors.stitch.primary,
    fontWeight: '500',
  },
  queueBadge: {
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    ...Shadow.sm,
  },
  queueBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  standingBadge: {
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    ...Shadow.sm,
  },
  standingBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },

  // Action Buttons
  actionButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spaceSm,
    paddingTop: Spacing.spaceXs,
  },
  primaryActionButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.stitch.primary,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadow.sm,
  },
  primaryActionText: {
    ...Typography.labelMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  tactileRequestButton: {
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: Colors.stitch.secondaryContainer,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadow.sm,
  },
  tactileRequestActive: {
    backgroundColor: Colors.stitch.secondaryFixedDim,
  },
  tactileRequestText: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },

  // Hardware Relay Link Card
  hardwareRelayCard: {
    backgroundColor: Colors.stitch.primaryContainer,
    borderRadius: BorderRadius.xl,
    padding: Spacing.spaceLg,
    gap: Spacing.spaceSm,
    ...Shadow.md,
  },
  hardwareRelayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hardwareRelayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  microchipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.stitch.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hardwareRelayTitle: {
    ...Typography.headlineSmall,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  hardwareRelaySubtitle: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondaryFixed,
    letterSpacing: 0.5,
  },
  onlineBadge: {
    backgroundColor: 'rgba(255, 254, 249, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  onlineBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondaryContainer,
    fontWeight: '700',
  },
  pumpInfoRow: {
    backgroundColor: 'rgba(0, 39, 23, 0.5)',
    borderRadius: BorderRadius.md,
    padding: Spacing.spaceMd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pumpInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pumpIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pumpTitle: {
    ...Typography.labelMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  pumpSubtitle: {
    ...Typography.bodySmall,
    color: Colors.stitch.onPrimaryContainer,
    fontSize: 11,
  },
  pumpInfoRight: {
    alignItems: 'flex-end',
  },
  pumpStatusTag: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondaryFixedDim,
    letterSpacing: 0.5,
  },
  flowRateText: {
    ...Typography.labelMedium,
    color: Colors.stitch.secondaryContainer,
    fontWeight: '700',
  },
  hardwareFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  hardwareFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hardwareFooterText: {
    ...Typography.bodySmall,
    color: Colors.stitch.onPrimaryContainer,
    fontSize: 11,
  },
});
