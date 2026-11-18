/**
 * AgroSmart 2.0 – Screen 3: Vegetable Field Monitoring
 * Faithful implementation of Google Stitch UI/UX design (vegetable_field_monitoring/code.html)
 *
 * Dedicated agronomic telemetry for Plot A:
 * - Capacitive V1.2 soil moisture gauge with 35% auto-trigger alert
 * - PE-03 pH sensor reading with buffer health
 * - DS18B20 digital soil probe (15cm depth)
 * - DHT11 canopy microclimate (Temp, RH, VPD)
 * - 24-hour telemetry trend hydro-chart
 * - Recent irrigation event log with estimated volumetric delivery
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
import Svg, {
  Circle,
  Line,
  Polygon,
  Polyline,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius, Shadow } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { StitchHeader } from '../components/navigation/StitchHeader';
import { StitchCard } from '../components/cards/StitchCard';
import { useSensorStore } from '../store/sensorStore';
import { useIrrigationStore } from '../store/irrigationStore';
import { useAppStore } from '../store/appStore';

export default function VegetableFieldMonitoringScreen() {
  const router = useRouter();
  const { isDemoMode } = useAppStore();
  const { vegetableZone } = useSensorStore();
  const { pumpStatus, addCommand } = useIrrigationStore();

  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d'>('24h');
  const [isDripQueued, setIsDripQueued] = useState(false);

  // Live telemetry with Stitch design fallbacks
  const moisture = vegetableZone?.soilMoisture?.value ?? 38;
  const ph = vegetableZone?.ph?.value ?? 6.5;
  const temp = vegetableZone?.soilTemperature?.value ?? 26.2;
  const canopyTemp = vegetableZone?.airTemperature?.value ?? 29;
  const canopyRh = vegetableZone?.airHumidity?.value ?? 65;

  const handleRequestDrip = () => {
    setIsDripQueued(true);
    addCommand({
      commandId: `cmd_veg_${Date.now()}`,
      type: 'PUMP_ON',
      targetZone: 'vegetable',
      issuedAt: new Date().toISOString(),
      status: 'PENDING',
    });
    Alert.alert(
      'Drip Cycle Initiated',
      'Plot A requested 15-minute drip irrigation. The shared 12V pump will start after Solenoid Valve 1 opens (1500ms lead time).',
      [{ text: 'OK' }]
    );
  };

  // Circular gauge math (radius = 66, circumference = 2 * PI * 66 ≈ 414.7)
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (moisture / 100) * circumference;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Stitch Top Header */}
      <StitchHeader
        title="Vegetable Field"
        subtitle="Plot A • Zone 1"
        showBack
        onBack={() => router.back()}
        onNotificationPress={() => router.push('/notifications')}
        onProfilePress={() => router.push('/profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Plot Header & Diagnostic State */}
        <View style={styles.topContextSection}>
          <View style={styles.topPillRow}>
            <TouchableOpacity
              style={styles.backPill}
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <MaterialIcons
                name="arrow-back"
                size={18}
                color={Colors.stitch.primary}
              />
              <Text style={styles.backPillText}>Back to Farm</Text>
            </TouchableOpacity>

            <View style={styles.demoModePill}>
              <View style={styles.demoPulseDot} />
              <Text style={styles.demoModePillText}>
                {isDemoMode ? 'DEMO MODE: SIMULATED DATA' : 'LIVE HARDWARE LINK'}
              </Text>
            </View>
          </View>

          <View style={styles.plotTitleBlock}>
            <View style={styles.plotTitleRow}>
              <Text style={styles.plotTitleText}>Plot A: Vegetable Field</Text>
              <MaterialIcons
                name="verified"
                size={20}
                color={Colors.stitch.secondary}
              />
            </View>
            <Text style={styles.plotSubtitleText}>
              Organic Tomatoes & Bell Peppers • Drip Irrigation Line #2
            </Text>

            {/* Sensor Node Tag Badge */}
            <View style={styles.sensorNodeBadge}>
              <MaterialCommunityIcons
                name="memory"
                size={16}
                color={Colors.stitch.secondary}
              />
              <Text style={styles.sensorNodeBadgeText}>
                Capacitive V1.2 + PE-03 pH + DS18B20
              </Text>
            </View>
          </View>
        </View>

        {/* Hero Moisture Gauge & Range Card */}
        <StitchCard style={styles.heroGaugeCard}>
          <View style={styles.gaugeCardHeader}>
            <View>
              <Text style={styles.gaugeOverline}>VOLUMETRIC WATER CONTENT</Text>
              <Text style={styles.gaugeTitle}>Soil Moisture Status</Text>
            </View>

            {/* Range Time Filters */}
            <View style={styles.timeFilterContainer}>
              {(['24h', '7d', '30d'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.timeFilterBtn,
                    timeFilter === filter && styles.timeFilterBtnActive,
                  ]}
                  onPress={() => setTimeFilter(filter)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.timeFilterText,
                      timeFilter === filter && styles.timeFilterTextActive,
                    ]}
                  >
                    {filter === '24h'
                      ? '24 Hours'
                      : filter === '7d'
                      ? '7 Days'
                      : '30 Days'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Center Radial Circular Gauge */}
          <View style={styles.centerGaugeContainer}>
            <View style={styles.gaugeSvgBox}>
              <Svg width={180} height={180} viewBox="0 0 160 160">
                {/* Background Track */}
                <Circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={Colors.stitch.surfaceContainer}
                  strokeWidth="13"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Safe Target Zone Arc Reference (35% to 60%) */}
                <Circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={Colors.stitch.secondaryFixed}
                  strokeWidth="4"
                  strokeDasharray="103, 414"
                  strokeDashoffset="-145"
                  fill="none"
                  transform="rotate(-90 80 80)"
                />

                {/* Live Value Arc */}
                <Circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={
                    moisture < 35
                      ? Colors.stitch.error
                      : moisture <= 60
                      ? Colors.stitch.secondary
                      : Colors.stitch.water
                  }
                  strokeWidth="13"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 80 80)"
                />
              </Svg>

              {/* Center Metric Label */}
              <View style={styles.gaugeCenterLabel}>
                <MaterialCommunityIcons
                  name="water"
                  size={24}
                  color={Colors.stitch.water}
                />
                <View style={styles.metricValRow}>
                  <Text style={styles.gaugeMetricNumber}>{moisture}</Text>
                  <Text style={styles.gaugeMetricPercent}>%</Text>
                </View>
                <Text style={styles.gaugeTargetHint}>Target: 35–60%</Text>
              </View>
            </View>

            {/* Real-time Alert Status Pill */}
            <View style={styles.alertStatusPill}>
              <View style={styles.alertPingDot} />
              <Text style={styles.alertStatusText}>
                {moisture <= 38
                  ? 'Approaching auto-irrigation threshold (35%)'
                  : 'Moisture within optimal agronomic band'}
              </Text>
            </View>
          </View>

          {/* Threshold Progress Reference Bar */}
          <View style={styles.thresholdProgressBox}>
            <View style={styles.thresholdLegendRow}>
              <Text style={styles.thresholdLegendText}>
                Wilting Floor: <Text style={styles.boldRed}>35%</Text>
              </Text>
              <Text style={styles.thresholdLegendText}>
                Current: <Text style={styles.boldPrimary}>{moisture}%</Text>
              </Text>
              <Text style={styles.thresholdLegendText}>
                Saturation: <Text style={styles.boldGreen}>60%</Text>
              </Text>
            </View>

            <View style={styles.thresholdBarTrack}>
              {/* Floor warning band (0 - 35%) */}
              <View style={[styles.thresholdFloorBand, { width: '35%' }]} />
              {/* Optimal band (35 - 60%) */}
              <View style={[styles.thresholdOptimalBand, { left: '35%', width: '25%' }]} />
              {/* Active Indicator Thumb */}
              <View
                style={[
                  styles.thresholdThumb,
                  {
                    left: `${Math.min(96, Math.max(2, moisture))}%`,
                    backgroundColor:
                      moisture < 35
                        ? Colors.stitch.error
                        : Colors.stitch.secondary,
                  },
                ]}
              />
            </View>
          </View>
        </StitchCard>

        {/* Telemetry Metrics Matrix (4 Bento Cards) */}
        <View style={styles.matrixSection}>
          <View style={styles.matrixHeaderRow}>
            <Text style={styles.matrixTitle}>Micro-Telemetry Array</Text>
            <Text style={styles.matrixSubheader}>4 PROBES LIVE</Text>
          </View>

          <View style={styles.matrixGrid}>
            {/* 1. Soil pH (PE-03) */}
            <StitchCard style={styles.bentoCard}>
              <View style={styles.bentoHeaderRow}>
                <MaterialCommunityIcons
                  name="flask-outline"
                  size={20}
                  color={Colors.stitch.secondary}
                />
                <View style={styles.optimalPill}>
                  <Text style={styles.optimalPillText}>Optimal</Text>
                </View>
              </View>

              <View style={styles.bentoValBlock}>
                <Text style={styles.bentoSensorLabel}>Soil pH (PE-03)</Text>
                <View style={styles.bentoNumberRow}>
                  <Text style={styles.bentoNumberText}>{ph.toFixed(1)}</Text>
                  <Text style={styles.bentoUnitText}>pH</Text>
                </View>
              </View>

              <View style={styles.bentoFooterStrip}>
                <Text style={styles.bentoFooterText}>Target: 6.0 – 6.8</Text>
                <Text style={styles.bentoFooterGreen}>Calibrated: 4d ago</Text>
              </View>
            </StitchCard>

            {/* 2. Soil Temp (DS18B20) */}
            <StitchCard style={styles.bentoCard}>
              <View style={styles.bentoHeaderRow}>
                <MaterialIcons
                  name="device-thermostat"
                  size={20}
                  color={Colors.stitch.tertiaryContainer}
                />
                <View style={styles.neutralPill}>
                  <Text style={styles.neutralPillText}>15cm Depth</Text>
                </View>
              </View>

              <View style={styles.bentoValBlock}>
                <Text style={styles.bentoSensorLabel}>Soil Temp (DS18B20)</Text>
                <View style={styles.bentoNumberRow}>
                  <Text style={styles.bentoNumberText}>{temp.toFixed(1)}</Text>
                  <Text style={styles.bentoUnitText}>°C</Text>
                </View>
              </View>

              <View style={styles.bentoFooterStrip}>
                <Text style={styles.bentoFooterText}>Root Metabolism</Text>
                <Text style={styles.bentoFooterGreen}>Nominal (20–28°C)</Text>
              </View>
            </StitchCard>

            {/* 3. Air Microclimate (DHT11) */}
            <StitchCard style={styles.bentoCard}>
              <View style={styles.bentoHeaderRow}>
                <MaterialCommunityIcons
                  name="weather-partly-cloudy"
                  size={20}
                  color={Colors.stitch.water}
                />
                <Text style={styles.dhtTagText}>DHT11 Grove</Text>
              </View>

              <View style={styles.bentoValBlock}>
                <Text style={styles.bentoSensorLabel}>Ambient Vapor & RH</Text>
                <View style={styles.bentoNumberRow}>
                  <Text style={styles.bentoNumberText}>{canopyTemp}°C</Text>
                  <Text style={styles.bentoUnitText}>/ {canopyRh}%</Text>
                </View>
              </View>

              <View style={styles.bentoFooterStrip}>
                <Text style={styles.bentoFooterText}>Dew Point: 21°C</Text>
                <Text style={styles.bentoFooterText}>VPD: 1.4 kPa</Text>
              </View>
            </StitchCard>

            {/* 4. Irrigation Queue Status */}
            <StitchCard style={styles.bentoCard}>
              <View style={styles.bentoHeaderRow}>
                <MaterialIcons
                  name="alt-route"
                  size={20}
                  color={Colors.stitch.secondary}
                />
                <View style={styles.pulseDotWrap}>
                  <View style={styles.pulseDotInner} />
                </View>
              </View>

              <View style={styles.bentoValBlock}>
                <Text style={styles.bentoSensorLabel}>Queue Priority</Text>
                <Text style={styles.bentoHighlightText}>Next on Pump</Text>
              </View>

              <View style={styles.bentoFooterStrip}>
                <Text style={styles.bentoFooterText}>Shared 12V DC Pump</Text>
                <Text style={styles.bentoFooterPrimary}>Est. 17:30 or &lt;35%</Text>
              </View>
            </StitchCard>
          </View>
        </View>

        {/* 24-Hour Telemetry Trend (Inline SVG Chart) */}
        <StitchCard style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={styles.chartOverline}>
                MOISTURE DEPLETION & THERMAL DRIFT
              </Text>
              <Text style={styles.chartTitle}>24h Telemetry Trend</Text>
            </View>

            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColorDot,
                    { backgroundColor: Colors.stitch.water },
                  ]}
                />
                <Text style={styles.legendText}>Moisture</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColorDot,
                    { backgroundColor: Colors.stitch.warningAmber },
                  ]}
                />
                <Text style={styles.legendText}>Temp</Text>
              </View>
            </View>
          </View>

          {/* Inline SVG Chart Canvas */}
          <View style={styles.svgChartContainer}>
            <Svg width="100%" height={150} viewBox="0 0 320 150">
              <Defs>
                <LinearGradient id="vegMoistureGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#559FC1" stopOpacity="0.35" />
                  <Stop offset="100%" stopColor="#559FC1" stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              {/* Grid Lines */}
              <Line
                x1="0"
                y1="25"
                x2="320"
                y2="25"
                stroke="#E3E7DC"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <Line
                x1="0"
                y1="65"
                x2="320"
                y2="65"
                stroke="#E3E7DC"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <Line
                x1="0"
                y1="105"
                x2="320"
                y2="105"
                stroke="#E3E7DC"
                strokeWidth="1"
                strokeDasharray="4,4"
              />

              {/* 35% Floor Auto-Irrigation Baseline */}
              <Line
                x1="0"
                y1="112"
                x2="320"
                y2="112"
                stroke={Colors.stitch.error}
                strokeWidth="1.5"
                strokeDasharray="6,3"
              />
              <SvgText
                x="4"
                y="108"
                fill={Colors.stitch.error}
                fontSize="9"
                fontWeight="700"
              >
                AUTO-IRRIGATION BASELINE (35%)
              </SvgText>

              {/* Moisture Gradient Area Polygon */}
              <Polygon
                points="0,150 0,40 80,55 160,70 240,95 320,105 320,150"
                fill="url(#vegMoistureGrad)"
              />

              {/* Moisture Trend Polyline */}
              <Polyline
                points="0,40 80,55 160,70 240,95 320,105"
                fill="none"
                stroke="#559FC1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Temperature Trend Dashed Polyline */}
              <Polyline
                points="0,110 80,95 160,50 240,40 320,60"
                fill="none"
                stroke="#D97706"
                strokeWidth="2"
                strokeDasharray="4,4"
                strokeLinecap="round"
              />

              {/* Data Plot Circles for Moisture */}
              <Circle cx="0" cy="40" r="3.5" fill="#FFFEF9" stroke="#559FC1" strokeWidth="2" />
              <Circle cx="80" cy="55" r="3.5" fill="#FFFEF9" stroke="#559FC1" strokeWidth="2" />
              <Circle cx="160" cy="70" r="3.5" fill="#FFFEF9" stroke="#559FC1" strokeWidth="2" />
              <Circle cx="240" cy="95" r="3.5" fill="#FFFEF9" stroke="#559FC1" strokeWidth="2" />
              <Circle cx="320" cy="105" r="4.5" fill="#D97706" stroke="#FFFEF9" strokeWidth="2" />
            </Svg>

            {/* Timeline X-Axis Labels */}
            <View style={styles.chartTimeAxis}>
              <View style={styles.timeAxisCol}>
                <Text style={styles.axisTimeText}>06:00</Text>
                <Text style={styles.axisValText}>45%</Text>
              </View>
              <View style={styles.timeAxisCol}>
                <Text style={styles.axisTimeText}>10:00</Text>
                <Text style={styles.axisValText}>42%</Text>
              </View>
              <View style={styles.timeAxisCol}>
                <Text style={styles.axisTimeText}>14:00</Text>
                <Text style={styles.axisValText}>39%</Text>
              </View>
              <View style={styles.timeAxisCol}>
                <Text style={[styles.axisTimeText, { color: Colors.stitch.warningAmber }]}>
                  18:00 (Now)
                </Text>
                <Text style={[styles.axisValText, { color: Colors.stitch.warningAmber }]}>
                  38%
                </Text>
              </View>
            </View>
          </View>
        </StitchCard>

        {/* Recent Irrigation Activity Log */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeaderRow}>
            <Text style={styles.activityTitle}>Recent Irrigation Activity</Text>
            <Text style={styles.activitySubheader}>SOL-VALVE #1</Text>
          </View>

          <StitchCard style={styles.activityCard}>
            {/* Event 1 */}
            <View style={styles.activityItem}>
              <View style={styles.activityItemLeft}>
                <View style={styles.activityIconWrap}>
                  <MaterialCommunityIcons
                    name="water"
                    size={20}
                    color={Colors.stitch.onSecondaryContainer}
                  />
                </View>
                <View>
                  <Text style={styles.activityItemTime}>Today, 06:15 AM</Text>
                  <Text style={styles.activityItemDesc}>
                    6 min cycle • Shared 12V Pump
                  </Text>
                </View>
              </View>
              <View style={styles.activityItemRight}>
                <Text style={styles.activityDeliveredText}>~45 L</Text>
                <Text style={styles.activityDeliveredSub}>Delivered (Est.)</Text>
              </View>
            </View>

            {/* Event 2 */}
            <View style={styles.activityItem}>
              <View style={styles.activityItemLeft}>
                <View style={styles.activityIconNeutral}>
                  <MaterialIcons
                    name="schedule"
                    size={20}
                    color={Colors.stitch.onSurfaceVariant}
                  />
                </View>
                <View>
                  <Text style={styles.activityItemTime}>Yesterday, 05:45 PM</Text>
                  <Text style={styles.activityItemDesc}>
                    8 min cycle • Shared 12V Pump
                  </Text>
                </View>
              </View>
              <View style={styles.activityItemRight}>
                <Text style={styles.activityDeliveredNeutral}>~60 L</Text>
                <Text style={styles.activityDeliveredSub}>Delivered (Est.)</Text>
              </View>
            </View>
          </StitchCard>
        </View>

        {/* Action Controls & Calibration CTAs */}
        <View style={styles.bottomCtaRow}>
          <TouchableOpacity
            style={styles.calibrateBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/sensor-detail')}
          >
            <MaterialIcons
              name="build"
              size={18}
              color={Colors.stitch.primary}
            />
            <Text style={styles.calibrateBtnText}>Calibrate Sensors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.flushBtn, isDripQueued && styles.flushBtnActive]}
            activeOpacity={0.85}
            onPress={handleRequestDrip}
          >
            <MaterialCommunityIcons
              name="valve"
              size={18}
              color={Colors.stitch.secondaryFixed}
            />
            <Text style={styles.flushBtnText}>
              {isDripQueued ? 'Queued (15m)' : 'Request 15-Min Drip'}
            </Text>
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

  // Top Section
  topContextSection: {
    marginBottom: Spacing.spaceLg,
  },
  topPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.spaceSm,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  backPillText: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '600',
  },
  demoModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.tertiaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  demoPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stitch.onTertiaryFixed,
  },
  demoModePillText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onTertiaryFixed,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  plotTitleBlock: {
    marginTop: 4,
  },
  plotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plotTitleText: {
    ...Typography.headlineMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  plotSubtitleText: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    marginTop: 2,
  },
  sensorNodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainerHigh,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    marginTop: 8,
    gap: 6,
  },
  sensorNodeBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '600',
  },

  // Hero Gauge Card
  heroGaugeCard: {
    marginBottom: Spacing.spaceLg,
  },
  gaugeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.spaceSm,
  },
  gaugeOverline: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  gaugeTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  timeFilterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.stitch.surfaceContainer,
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  timeFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  timeFilterBtnActive: {
    backgroundColor: Colors.stitch.primary,
  },
  timeFilterText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  timeFilterTextActive: {
    color: Colors.neutral.white,
    fontWeight: '700',
  },

  centerGaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.spaceMd,
  },
  gaugeSvgBox: {
    position: 'relative',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  gaugeMetricNumber: {
    ...Typography.metricXl,
    color: Colors.stitch.primary,
    fontWeight: '800',
  },
  gaugeMetricPercent: {
    ...Typography.headlineSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '600',
    marginLeft: 2,
  },
  gaugeTargetHint: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    marginTop: 2,
  },

  alertStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.spaceSm,
    gap: 6,
  },
  alertPingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stitch.warningAmber,
  },
  alertStatusText: {
    ...Typography.labelSmall,
    color: '#92400E',
    fontWeight: '600',
  },

  // Threshold Progress Reference Bar
  thresholdProgressBox: {
    backgroundColor: Colors.stitch.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: Spacing.spaceMd,
    marginTop: Spacing.spaceSm,
    gap: 8,
  },
  thresholdLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thresholdLegendText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  boldRed: {
    color: Colors.stitch.error,
    fontWeight: '700',
  },
  boldPrimary: {
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  boldGreen: {
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  thresholdBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.surfaceContainerHigh,
    position: 'relative',
    overflow: 'hidden',
  },
  thresholdFloorBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(186, 26, 26, 0.25)',
  },
  thresholdOptimalBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: Colors.stitch.secondaryContainer,
  },
  thresholdThumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 8,
    borderRadius: 4,
    transform: [{ translateX: -4 }],
  },

  // Bento Matrix Section
  matrixSection: {
    marginBottom: Spacing.spaceLg,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.spaceSm,
  },
  matrixTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  matrixSubheader: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  matrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.gutterSm,
  },
  bentoCard: {
    width: '48%',
    padding: Spacing.spaceMd,
    gap: 8,
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optimalPill: {
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  optimalPillText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },
  neutralPill: {
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  neutralPillText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '600',
  },
  dhtTagText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '700',
  },
  pulseDotWrap: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.stitch.secondaryFixedDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stitch.secondary,
  },
  bentoValBlock: {
    marginTop: 2,
  },
  bentoSensorLabel: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  bentoNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 2,
  },
  bentoNumberText: {
    ...Typography.metricLarge,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  bentoUnitText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  bentoHighlightText: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  bentoFooterStrip: {
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: 6,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  bentoFooterText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 10,
  },
  bentoFooterGreen: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
  bentoFooterPrimary: {
    ...Typography.labelSmall,
    color: Colors.stitch.primary,
    fontSize: 10,
    fontWeight: '600',
  },

  // Chart Card
  chartCard: {
    marginBottom: Spacing.spaceLg,
    gap: Spacing.spaceSm,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  chartOverline: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  chartTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  svgChartContainer: {
    width: '100%',
    marginTop: Spacing.spaceSm,
  },
  chartTimeAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  timeAxisCol: {
    alignItems: 'center',
  },
  axisTimeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  axisValText: {
    ...Typography.labelSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },

  // Recent Irrigation Activity
  activitySection: {
    marginBottom: Spacing.spaceLg,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.spaceSm,
  },
  activityTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  activitySubheader: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  activityCard: {
    padding: Spacing.spaceSm,
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  activityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.stitch.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconNeutral: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.stitch.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityItemTime: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  activityItemDesc: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 11,
  },
  activityItemRight: {
    alignItems: 'flex-end',
  },
  activityDeliveredText: {
    ...Typography.labelMedium,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  activityDeliveredNeutral: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSurface,
    fontWeight: '600',
  },
  activityDeliveredSub: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 9,
  },

  // Action Buttons
  bottomCtaRow: {
    flexDirection: 'row',
    gap: Spacing.gutterSm,
    marginBottom: Spacing.spaceSm,
  },
  calibrateBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.stitch.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadow.sm,
  },
  calibrateBtnText: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  flushBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.stitch.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadow.sm,
  },
  flushBtnActive: {
    backgroundColor: Colors.stitch.primary,
  },
  flushBtnText: {
    ...Typography.labelMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
});
