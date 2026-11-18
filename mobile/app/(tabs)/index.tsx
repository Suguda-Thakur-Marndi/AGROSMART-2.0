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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants';
import {
  StitchHeader,
  HeroStatusCard,
  StitchCard,
  PumpStatusCard,
  HydroSparkline,
} from '../../components';
import { useAppStore } from '../../store/appStore';
import { useIrrigationStore } from '../../store/irrigationStore';
import { useSensorStore } from '../../store/sensorStore';
import { useConnectionStore } from '../../store/connectionStore';

export default function HomeScreen() {
  const router = useRouter();
  const { isDemoMode } = useAppStore();
  const { pumpStatus, setPumpStatus } = useIrrigationStore();
  const { vegetableZone, paddyZone } = useSensorStore();
  const { statusInfo, connectionState, connectionType } = useConnectionStore();

  const isPumpRunning = pumpStatus?.state === 'ON';
  const vegMoisture = vegetableZone?.soilMoisture?.value ?? (isDemoMode ? 38 : null);
  const paddyMoisture = paddyZone?.soilMoisture?.value ?? (isDemoMode ? 72 : null);
  const vegPH = vegetableZone?.ph?.value ?? (isDemoMode ? 6.5 : null);
  const paddyPH = paddyZone?.ph?.value ?? (isDemoMode ? 6.8 : null);
  const soilTemp = vegetableZone?.soilTemperature?.value ?? (isDemoMode ? 26.2 : null);
  const airTemp = vegetableZone?.airTemperature?.value ?? (isDemoMode ? 29.0 : null);
  const airHumidity = vegetableZone?.airHumidity?.value ?? (isDemoMode ? 65 : null);

  const handleQuickRun = () => {
    Alert.alert(
      'Quick Irrigation Cycle',
      'Start 12V DC water pump for Vegetable Plot (3 minutes)?\n\nSequential valve sequencing will open Valve 1 for 1.5s before pump energizes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              const { deviceCommunicationService } = await import('../../services/connection/DeviceCommunicationService');
              const ack = await deviceCommunicationService.startIrrigation('vegetable', 180);
              if (ack && ack.success) {
                if (setPumpStatus) {
                  setPumpStatus({
                    state: 'ON',
                    mode: 'MANUAL',
                    activeZone: 'vegetable',
                    valveVegetable: 'OPEN',
                    valvePaddy: 'CLOSED',
                    currentRunDurationSeconds: 1,
                    dailyRuntimeSeconds: (pumpStatus?.dailyRuntimeSeconds ?? 1080) + 1,
                    lastStartTime: new Date().toISOString(),
                    lastStopTime: null,
                    dataSource: isDemoMode ? 'demo' : 'live',
                    reportedByDevice: true,
                    voltageConfig: '12V DC (1A)',
                    sharedPipeMode: false,
                  });
                }
              } else {
                Alert.alert('Command Failed', ack?.message || 'Could not reach controller.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Dispatch error');
            }
          },
        },
      ],
    );
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      '⚠️ EMERGENCY SHUTOFF',
      'Instantaneous low-side MOSFET gate pull-down. 12V pump stopped immediately (<10ms).',
      [
        {
          text: 'OK',
          onPress: async () => {
            try {
              const { deviceCommunicationService } = await import('../../services/connection/DeviceCommunicationService');
              await deviceCommunicationService.emergencyStop();
              if (setPumpStatus) {
                setPumpStatus({
                  state: 'OFF',
                  mode: 'EMERGENCY_STOP',
                  activeZone: null,
                  valveVegetable: 'CLOSED',
                  valvePaddy: 'CLOSED',
                  currentRunDurationSeconds: 0,
                  dailyRuntimeSeconds: pumpStatus?.dailyRuntimeSeconds ?? 1080,
                  lastStartTime: null,
                  lastStopTime: new Date().toISOString(),
                  dataSource: isDemoMode ? 'demo' : 'live',
                  reportedByDevice: true,
                  voltageConfig: '12V DC (1A)',
                  sharedPipeMode: false,
                });
              }
            } catch (err: any) {
              Alert.alert('E-STOP Error', err.message || 'E-STOP dispatch failed');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StitchHeader
        title="Home"
        onNotificationPress={() => router.push('/notifications')}
        onProfilePress={() => router.push('/(tabs)/profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Diagnostic & Status Header Card */}
        <HeroStatusCard
          farmerName="Farmer"
          isDemoMode={isDemoMode}
          temperature={airTemp !== null ? Math.round(airTemp) : (isDemoMode ? 29 : null)}
          weatherCondition="Clear"
          lastSyncedText="Synced 2m ago"
          connectionLabel={statusInfo.label}
          onConnectionPress={() => router.push('/connection')}
        />

        {/* Connection Shortcut & Live State Banner */}
        <TouchableOpacity
          style={[
            styles.dashboardConnBanner,
            connectionState === 'CONNECTED'
              ? connectionType === 'wifi'
                ? styles.dashboardConnWifi
                : styles.dashboardConnBt
              : styles.dashboardConnOffline,
          ]}
          onPress={() => router.push('/connection')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={
              connectionState === 'CONNECTED'
                ? connectionType === 'wifi'
                  ? 'wifi'
                  : 'bluetooth'
                : 'link-variant-off'
            }
            size={22}
            color={
              connectionState === 'CONNECTED'
                ? connectionType === 'wifi'
                  ? Colors.stitch.primary
                  : '#0066CC'
                : Colors.stitch.outline
            }
          />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={styles.dashboardConnTitle}>
              {statusInfo.label}
            </Text>
            <Text style={styles.dashboardConnSubtitle}>
              {connectionState === 'CONNECTED'
                ? `Node: ${statusInfo.connectedDeviceName || 'AgroSmart Mega'} • Tap to manage`
                : 'Tap to connect controller via Wi-Fi or Bluetooth'}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={Colors.stitch.outline}
          />
        </TouchableOpacity>

        {/* 2. Live Soil & Air Telemetry Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleGroup}>
            <MaterialCommunityIcons
              name="leak"
              size={20}
              color={Colors.stitch.secondary}
            />
            <Text style={styles.sectionTitle}>Live Soil & Air Telemetry</Text>
          </View>
          <Text style={styles.sectionCount}>4 Sensors Online</Text>
        </View>

        {/* 4-Bento Telemetry Grid */}
        <View style={styles.telemetryGrid}>
          {/* Card 1: Soil Moisture Dual Gauge Card */}
          <StitchCard style={styles.bentoCard}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>MOISTURE V1.2</Text>
              <MaterialCommunityIcons
                name="water"
                size={18}
                color={Colors.stitch.secondary}
              />
            </View>

            <View style={styles.dualGaugeRow}>
              {/* Vegetable mini gauge */}
              <View style={styles.miniGaugeCol}>
                <View style={styles.miniGaugeBox}>
                  <Svg width={48} height={48} viewBox="0 0 36 36">
                    <Path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={Colors.stitch.surfaceContainer}
                      strokeWidth={3.5}
                    />
                    <Path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={Colors.stitch.secondary}
                      strokeDasharray="38, 100"
                      strokeLinecap="round"
                      strokeWidth={3.5}
                    />
                  </Svg>
                  <Text style={styles.miniGaugeNumber}>{vegMoisture !== null ? `${Math.round(vegMoisture)}%` : '--'}</Text>
                </View>
                <Text style={styles.miniGaugeLabel}>Veg Plot</Text>
              </View>

              {/* Paddy mini gauge */}
              <View style={styles.miniGaugeCol}>
                <View style={styles.miniGaugeBox}>
                  <Svg width={48} height={48} viewBox="0 0 36 36">
                    <Path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={Colors.stitch.surfaceContainer}
                      strokeWidth={3.5}
                    />
                    <Path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={Colors.stitch.water}
                      strokeDasharray="72, 100"
                      strokeLinecap="round"
                      strokeWidth={3.5}
                    />
                  </Svg>
                  <Text style={styles.miniGaugeNumber}>{paddyMoisture !== null ? `${Math.round(paddyMoisture)}%` : '--'}</Text>
                </View>
                <Text style={styles.miniGaugeLabel}>Paddy</Text>
              </View>
            </View>

            <View style={styles.bentoFooterPill}>
              <Text style={styles.bentoFooterPillText}>
                {vegMoisture !== null ? 'Capacitive Sensing Active' : 'Awaiting Sensor Telemetry...'}
              </Text>
            </View>
          </StitchCard>

          {/* Card 2: Soil pH Probe Card */}
          <StitchCard style={styles.bentoCard}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>PH ELECTRODE</Text>
              <MaterialCommunityIcons
                name="flask-outline"
                size={18}
                color={Colors.stitch.tertiaryContainer}
              />
            </View>

            <View style={styles.bentoMidCol}>
              <View style={styles.phValueRow}>
                <Text style={styles.bentoHeroNumber}>{vegPH !== null ? vegPH.toFixed(1) : '--'}</Text>
                <View style={styles.phBadge}>
                  <Text style={styles.phBadgeText}>{vegPH !== null ? 'Veg: Ideal' : 'No Signal'}</Text>
                </View>
              </View>
              <View style={styles.phSubRow}>
                <Text style={styles.phSubNumber}>{paddyPH !== null ? paddyPH.toFixed(1) : '--'}</Text>
                <Text style={styles.phSubText}>Paddy field</Text>
              </View>
            </View>

            <View style={styles.microBarTrack}>
              <View style={[styles.microBarFill, { width: '65%' }]} />
            </View>
          </StitchCard>

          {/* Card 3: Soil Temp Probe (DS18B20) */}
          <StitchCard style={styles.bentoCard}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>SOIL TEMP</Text>
              <MaterialCommunityIcons
                name="thermometer"
                size={18}
                color={Colors.stitch.primary}
              />
            </View>

            <View style={styles.bentoMidCol}>
              <View style={styles.tempRow}>
                <Text style={styles.bentoHeroNumber}>{soilTemp !== null ? soilTemp.toFixed(1) : '--'}</Text>
                <Text style={styles.unitSuffix}>°C</Text>
              </View>
              <Text style={styles.bentoSubDetail}>
                DS18B20 Probe • Depth 15cm
              </Text>
            </View>

            <View style={styles.bentoFooterPill}>
              <Text style={styles.bentoFooterPillText}>
                {soilTemp !== null ? 'Optimal Root Range' : 'No Temp Sensor'}
              </Text>
            </View>
          </StitchCard>

          {/* Card 4: Air Microclimate (DHT11) */}
          <StitchCard style={styles.bentoCard}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>AIR MICROCLIMATE</Text>
              <MaterialCommunityIcons
                name="cloud-outline"
                size={18}
                color={Colors.stitch.secondary}
              />
            </View>

            <View style={styles.bentoMidCol}>
              <View style={styles.tempRow}>
                <Text style={styles.bentoHeroNumber}>{airTemp !== null ? `${Math.round(airTemp)}°` : '--'}</Text>
                <Text style={styles.unitSuffix}>{airHumidity !== null ? `/ ${Math.round(airHumidity)}%` : ''}</Text>
              </View>
              <Text style={styles.bentoSubDetail}>
                DHT11 Grove Canopy Module
              </Text>
            </View>

            <View style={styles.bentoFooterPill}>
              <Text style={styles.bentoFooterPillMuted}>
                {airTemp !== null ? 'Dew Point: 21°C' : 'Canopy Sensor Offline'}
              </Text>
            </View>
          </StitchCard>
        </View>

        {/* 3. Shared 12V DC Pump Status Card */}
        <PumpStatusCard
          isRunning={isPumpRunning}
          mode={pumpStatus?.mode === 'MANUAL' ? 'Manual' : 'Automatic'}
          nextQueue="Vegetable Plot"
          runtimeToday={`${Math.floor((pumpStatus?.dailyRuntimeSeconds ?? 0) / 60)} mins`}
          onRunPress={handleQuickRun}
          onEmergencyStopPress={handleEmergencyStop}
        />

        {/* 4. Managed Crop Sectors Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleGroup}>
            <MaterialCommunityIcons
              name="view-grid-outline"
              size={20}
              color={Colors.stitch.secondary}
            />
            <Text style={styles.sectionTitle}>Managed Crop Sectors</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/farm')}
            style={styles.detailsLink}
          >
            <Text style={styles.detailsLinkText}>Details</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={Colors.stitch.secondary}
            />
          </TouchableOpacity>
        </View>

        {/* Zone 1: Vegetable Plot */}
        <StitchCard
          style={styles.cropSectorCard}
          onPress={() => router.push('/zone-vegetable')}
        >
          <View style={styles.cropSectorHeader}>
            <View style={styles.cropSectorLeft}>
              <View style={styles.cropIconBox}>
                <MaterialCommunityIcons
                  name="sprout"
                  size={20}
                  color={Colors.stitch.primary}
                />
              </View>
              <View>
                <Text style={styles.plotHeading}>Plot A: Fresh Vegetables</Text>
                <Text style={styles.plotSub}>Tomatoes & Leafy Greens</Text>
              </View>
            </View>
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>Water Soon</Text>
            </View>
          </View>

          <View style={styles.cropMetricsRow}>
            <Text style={styles.cropMetricText}>
              Moisture: <Text style={styles.boldText}>{vegMoisture !== null ? `${vegMoisture}%` : '--'}</Text> (Floor: 35%)
            </Text>
            <Text style={styles.cropMetricText}>
              pH: <Text style={styles.boldText}>{vegPH !== null ? vegPH.toFixed(1) : '--'}</Text>
            </Text>
            <Text style={styles.cropMetricText}>
              Auto-Run: <Text style={styles.secondaryBoldText}>17:30</Text>
            </Text>
          </View>

          <View style={styles.sectorBarTrack}>
            <View
              style={[
                styles.sectorBarFill,
                { width: `${vegMoisture ?? 0}%`, backgroundColor: Colors.stitch.secondaryFixedDim },
              ]}
            />
          </View>
        </StitchCard>

        {/* Zone 2: Paddy Field */}
        <StitchCard
          style={styles.cropSectorCard}
          onPress={() => router.push('/zone-paddy')}
        >
          <View style={styles.cropSectorHeader}>
            <View style={styles.cropSectorLeft}>
              <View style={styles.cropIconBoxPaddy}>
                <MaterialCommunityIcons
                  name="waves"
                  size={20}
                  color={Colors.stitch.water}
                />
              </View>
              <View>
                <Text style={styles.plotHeading}>Plot B: Lowland Paddy</Text>
                <Text style={styles.plotSub}>Wetland Rice (Khao Dawk)</Text>
              </View>
            </View>
            <View style={styles.submergedBadge}>
              <Text style={styles.submergedBadgeText}>Submerged</Text>
            </View>
          </View>

          <View style={styles.cropMetricsRow}>
            <Text style={styles.cropMetricText}>
              Moisture: <Text style={styles.boldText}>{paddyMoisture !== null ? `${paddyMoisture}%` : '--'}</Text>
            </Text>
            <Text style={styles.cropMetricText}>
              Water Layer: <Text style={styles.secondaryBoldText}>Adequate (4cm)</Text>
            </Text>
            <Text style={styles.cropMetricText}>
              pH: <Text style={styles.boldText}>{paddyPH !== null ? paddyPH.toFixed(1) : '--'}</Text>
            </Text>
          </View>

          <View style={styles.sectorBarTrack}>
            <View
              style={[
                styles.sectorBarFill,
                { width: `${paddyMoisture ?? 0}%`, backgroundColor: Colors.stitch.secondary },
              ]}
            />
          </View>
        </StitchCard>

        {/* 5. Water Management Summary & Trend Chart */}
        <StitchCard style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View style={styles.waterTitleGroup}>
              <View style={styles.waterHeaderTitleRow}>
                <MaterialCommunityIcons
                  name="water"
                  size={20}
                  color={Colors.stitch.secondary}
                />
                <Text style={styles.waterTitle}>Water Usage & 12h Transition</Text>
              </View>
              <Text style={styles.waterSub}>
                Calculated via pump runtime & flow coefficient (Estimated)
              </Text>
            </View>
            <View style={styles.waterRight}>
              <Text style={styles.waterVolume}>
                {isDemoMode
                  ? '~240 L'
                  : pumpStatus?.dailyRuntimeSeconds
                  ? `~${Math.round((pumpStatus.dailyRuntimeSeconds * 2.5) / 60)} L`
                  : '0 L (Est.)'}
              </Text>
              <Text style={styles.waterTag}>Today Total</Text>
            </View>
          </View>

          {/* Plot Split Metric */}
          <View style={styles.splitRow}>
            <View style={styles.splitCol}>
              <View style={[styles.splitDot, { backgroundColor: Colors.stitch.secondaryFixedDim }]} />
              <View>
                <Text style={styles.splitLabel}>Vegetables</Text>
                <Text style={styles.splitVal}>
                  {isDemoMode
                    ? '90 Liters'
                    : pumpStatus?.dailyRuntimeSeconds
                    ? `~${Math.round((pumpStatus.dailyRuntimeSeconds * 1.0) / 60)} L`
                    : '0 L'}
                </Text>
              </View>
            </View>
            <View style={styles.splitCol}>
              <View style={[styles.splitDot, { backgroundColor: Colors.stitch.secondary }]} />
              <View>
                <Text style={styles.splitLabel}>Paddy Field</Text>
                <Text style={styles.splitVal}>
                  {isDemoMode
                    ? '150 Liters'
                    : pumpStatus?.dailyRuntimeSeconds
                    ? `~${Math.round((pumpStatus.dailyRuntimeSeconds * 1.5) / 60)} L`
                    : '0 L'}
                </Text>
              </View>
            </View>
          </View>

          {/* SVG Moisture 12h Area Sparkline */}
          <HydroSparkline height={110} showLegend />
        </StitchCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.stitch.surfaceContainerLow, // #F6F4EA
  },
  scrollContent: {
    padding: Spacing.margin,
    paddingBottom: 40,
    gap: Spacing.spaceLg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...Typography.headlineSm,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  sectionCount: {
    ...Typography.labelSm,
    color: Colors.stitch.outline,
    fontWeight: '600',
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.gutter,
  },
  bentoCard: {
    width: '47.5%',
    minHeight: 140,
    justifyContent: 'space-between',
    padding: Spacing.spaceMd,
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoLabel: {
    ...Typography.labelSm,
    fontSize: 9,
    color: Colors.stitch.outline,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  dualGaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: Spacing.spaceXs,
  },
  miniGaugeCol: {
    alignItems: 'center',
  },
  miniGaugeBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  miniGaugeNumber: {
    position: 'absolute',
    ...Typography.labelSm,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.stitch.primary,
  },
  miniGaugeLabel: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 2,
  },
  bentoFooterPill: {
    backgroundColor: Colors.stitch.surfaceContainerLow,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  bentoFooterPillText: {
    ...Typography.labelSm,
    fontSize: 9,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  bentoFooterPillMuted: {
    ...Typography.labelSm,
    fontSize: 9,
    color: Colors.stitch.outline,
    fontWeight: '600',
  },
  bentoMidCol: {
    marginVertical: Spacing.spaceXs,
  },
  phValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  bentoHeroNumber: {
    ...Typography.metricLg,
    color: Colors.stitch.primary,
    fontWeight: '800',
  },
  phBadge: {
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  phBadgeText: {
    ...Typography.labelSm,
    fontSize: 9,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },
  phSubRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  phSubNumber: {
    ...Typography.headlineSm,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.stitch.onSurfaceVariant,
  },
  phSubText: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.stitch.outline,
  },
  microBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stitch.surfaceContainer,
    overflow: 'hidden',
  },
  microBarFill: {
    height: '100%',
    backgroundColor: Colors.stitch.secondary,
    borderRadius: 3,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  unitSuffix: {
    ...Typography.headlineSm,
    color: Colors.stitch.outline,
    fontSize: 14,
  },
  bentoSubDetail: {
    ...Typography.labelSm,
    fontSize: 9,
    color: Colors.stitch.onSurfaceVariant,
    marginTop: 2,
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsLinkText: {
    ...Typography.labelMd,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  cropSectorCard: {
    padding: Spacing.spaceMd,
  },
  cropSectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.spaceXs,
  },
  cropSectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spaceSm,
    flex: 1,
  },
  cropIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.stitch.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropIconBoxPaddy: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.stitch.waterLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plotHeading: {
    ...Typography.headlineSm,
    fontSize: 15,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  plotSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.stitch.outline,
  },
  alertBadge: {
    backgroundColor: Colors.stitch.tertiaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  alertBadgeText: {
    ...Typography.labelSm,
    color: Colors.stitch.onTertiaryFixed,
    fontWeight: '700',
  },
  submergedBadge: {
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  submergedBadgeText: {
    ...Typography.labelSm,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },
  cropMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.spaceXs,
  },
  cropMetricText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.stitch.onSurfaceVariant,
  },
  boldText: {
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  secondaryBoldText: {
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  sectorBarTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.surfaceContainer,
    overflow: 'hidden',
    marginTop: 4,
  },
  sectorBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  waterCard: {
    padding: Spacing.spaceMd,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.spaceSm,
  },
  waterTitleGroup: {
    flex: 1,
  },
  waterHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waterTitle: {
    ...Typography.headlineSm,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  waterSub: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.stitch.outline,
    marginTop: 2,
  },
  waterRight: {
    alignItems: 'flex-end',
  },
  waterVolume: {
    ...Typography.headlineSm,
    color: Colors.stitch.primary,
    fontWeight: '800',
  },
  waterTag: {
    ...Typography.labelSm,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  splitRow: {
    flexDirection: 'row',
    gap: Spacing.gutter,
    marginVertical: Spacing.spaceXs,
  },
  splitCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: Spacing.spaceSm,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  splitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  splitLabel: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.stitch.outline,
  },
  splitVal: {
    ...Typography.labelMd,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  dashboardConnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1,
  },
  dashboardConnWifi: {
    backgroundColor: Colors.stitch.primaryContainer,
    borderColor: Colors.stitch.primary,
  },
  dashboardConnBt: {
    backgroundColor: '#E3EDF7',
    borderColor: '#0066CC',
  },
  dashboardConnOffline: {
    backgroundColor: Colors.stitch.surfaceContainerHigh,
    borderColor: Colors.stitch.outlineVariant,
  },
  dashboardConnTitle: {
    ...Typography.titleSmall,
    fontWeight: '700',
    color: Colors.stitch.onSurface,
  },
  dashboardConnSubtitle: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
});
