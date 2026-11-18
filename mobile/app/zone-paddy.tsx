/**
 * AgroSmart 2.0 – Screen 4: Lowland Paddy Field Monitoring
 * Faithful implementation of Google Stitch UI/UX design (paddy_field_monitoring/code.html)
 *
 * Dedicated telemetry for Plot B:
 * - Standing water level (4.2 cm, Target 3.0-5.0 cm)
 * - Anaerobic mud substrate saturation (72% VWC)
 * - PE-03 pH sensor profile in flooded root zone
 * - DS18B20 waterproof temperature probe in mud layer (@ 10cm)
 * - Microclimate canopy ambient (DHT11)
 * - Valve 2 flood inflow controls with 30-min timer
 * - Standing water depth trend chart
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
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius, Shadow } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { StitchHeader } from '../components/navigation/StitchHeader';
import { StitchCard } from '../components/cards/StitchCard';
import { useSensorStore } from '../store/sensorStore';
import { useIrrigationStore } from '../store/irrigationStore';
import { useAppStore } from '../store/appStore';

const PADDY_BANNER_URI =
  'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=800&q=80';

export default function PaddyFieldMonitoringScreen() {
  const router = useRouter();
  const { isDemoMode } = useAppStore();
  const { paddyZone } = useSensorStore();
  const { pumpStatus, addCommand } = useIrrigationStore();

  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d'>('24h');
  const [isFloodQueued, setIsFloodQueued] = useState(false);

  // Live telemetry with Stitch design fallbacks
  const moisture = paddyZone?.soilMoisture?.value ?? 72;
  const ph = paddyZone?.ph?.value ?? 6.8;
  const mudTemp = paddyZone?.soilTemperature?.value ?? 27.0;
  const ambientRh = paddyZone?.airHumidity?.value ?? 68;
  const ambientTemp = paddyZone?.airTemperature?.value ?? 29;
  const standingWaterCm = 4.2;

  const handleRequestFlood = () => {
    setIsFloodQueued(true);
    addCommand({
      commandId: `cmd_paddy_${Date.now()}`,
      type: 'PUMP_ON',
      targetZone: 'paddy',
      issuedAt: new Date().toISOString(),
      status: 'PENDING',
    });
    Alert.alert(
      'Flood Inflow Initiated',
      'Plot B requested 30-minute flood inflow. Solenoid Valve 2 will open and the shared 12V pump will sequence safely following hydraulic lock rules.',
      [{ text: 'OK' }]
    );
  };

  // Mini gauge math for 72% saturation (radius = 18, circumference ≈ 113.1)
  const miniRadius = 18;
  const miniCircumference = 2 * Math.PI * miniRadius;
  const miniStrokeOffset =
    miniCircumference - (moisture / 100) * miniCircumference;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Stitch Top Header */}
      <StitchHeader
        title="Paddy Field"
        subtitle="Plot B • Zone 2"
        showBack
        onBack={() => router.back()}
        onNotificationPress={() => router.push('/notifications')}
        onProfilePress={() => router.push('/profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation & Context Sub-Header */}
        <View style={styles.topContextSection}>
          <View style={styles.topPillRow}>
            <TouchableOpacity
              style={styles.backPill}
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <MaterialIcons
                name="arrow-back"
                size={16}
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
            <Text style={styles.plotTitleText}>Plot B: Lowland Paddy Field</Text>
            <Text style={styles.plotSubtitleText}>
              <Text style={styles.cropHighlight}>Wetland Rice (Khao Dawk Mali 105)</Text> • Tillering Stage
            </Text>

            <View style={styles.badgeRow}>
              <View style={styles.nodeBadge}>
                <MaterialCommunityIcons
                  name="developer-board"
                  size={12}
                  color={Colors.stitch.secondary}
                />
                <Text style={styles.nodeBadgeText}>
                  Arduino Mega IoT • Node #2
                </Text>
              </View>

              <View style={styles.syncedBadge}>
                <View style={styles.syncedDot} />
                <Text style={styles.syncedBadgeText}>Telemetry Synced</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Hero Water Depth & Saturation Card */}
        <StitchCard style={styles.heroPondingCard}>
          {/* Visual Ponding / Aerial Paddy Scene Header */}
          <ImageBackground
            source={{ uri: PADDY_BANNER_URI }}
            style={styles.heroBanner}
            imageStyle={styles.heroBannerImage}
          >
            <View style={styles.bannerGradientOverlay} />

            {/* Inset Badge on Hero Image */}
            <View style={styles.pondingStateBadge}>
              <MaterialCommunityIcons
                name="water"
                size={16}
                color={Colors.stitch.water}
              />
              <Text style={styles.pondingStateText}>
                Ponding State: Saturated
              </Text>
            </View>

            {/* Bottom Overlay Metrics */}
            <View style={styles.bannerMetricsBottom}>
              <View>
                <Text style={styles.standingLevelOverline}>
                  STANDING WATER LEVEL
                </Text>
                <View style={styles.depthMetricRow}>
                  <Text style={styles.depthValue}>{standingWaterCm}</Text>
                  <Text style={styles.depthUnit}>cm</Text>
                </View>
              </View>

              <View style={styles.targetDepthBox}>
                <Text style={styles.targetDepthOverline}>Target Depth</Text>
                <Text style={styles.targetDepthValue}>3.0 — 5.0 cm</Text>
              </View>
            </View>
          </ImageBackground>

          {/* Gauge Metrics Strip */}
          <View style={styles.gaugeStripContainer}>
            {/* Water ripple status row */}
            <View style={styles.mudStatusBox}>
              <View style={styles.mudStatusLeft}>
                {/* Tactile Water Gauge Ring */}
                <View style={styles.miniGaugeBox}>
                  <Svg width={52} height={52} viewBox="0 0 44 44">
                    <Circle
                      cx="22"
                      cy="22"
                      r={miniRadius}
                      stroke={Colors.stitch.surfaceContainerHighest}
                      strokeWidth="4.5"
                      fill="none"
                    />
                    <Circle
                      cx="22"
                      cy="22"
                      r={miniRadius}
                      stroke={Colors.stitch.water}
                      strokeWidth="4.5"
                      strokeDasharray={`${miniCircumference}`}
                      strokeDashoffset={miniStrokeOffset}
                      strokeLinecap="round"
                      fill="none"
                      transform="rotate(-90 22 22)"
                    />
                  </Svg>
                  <View style={styles.miniGaugeCenterLabel}>
                    <Text style={styles.miniGaugeNumber}>{moisture}%</Text>
                  </View>
                </View>

                <View>
                  <Text style={styles.mudStatusTitle}>Soil Moisture</Text>
                  <Text style={styles.mudStatusDesc}>
                    Anaerobic mud layer fully flooded
                  </Text>
                </View>
              </View>

              <View style={styles.optimalPill}>
                <Text style={styles.optimalPillText}>Optimal</Text>
              </View>
            </View>

            {/* Time Filter Tab Bar */}
            <View style={styles.timeFilterTabBar}>
              {(['24h', '7d', '30d'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.timeFilterTab,
                    timeFilter === filter && styles.timeFilterTabActive,
                  ]}
                  onPress={() => setTimeFilter(filter)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.timeFilterTabText,
                      timeFilter === filter && styles.timeFilterTabTextActive,
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
        </StitchCard>

        {/* Telemetry Metrics Matrix (2x2 Grid) */}
        <View style={styles.matrixSection}>
          <View style={styles.matrixHeaderRow}>
            <Text style={styles.matrixTitle}>Paddy Biosensors</Text>
            <Text style={styles.matrixSubheader}>NODE #2 ONLINE</Text>
          </View>

          <View style={styles.matrixGrid}>
            {/* 1. Mud pH Sensor */}
            <StitchCard style={styles.bentoCard}>
              <View style={styles.bentoHeaderRow}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="flask-outline"
                    size={18}
                    color={Colors.stitch.primaryContainer}
                  />
                </View>
                <View style={styles.probeTag}>
                  <Text style={styles.probeTagText}>PE-03</Text>
                </View>
              </View>

              <View style={styles.bentoValBlock}>
                <Text style={styles.bentoLabelText}>Mud pH Profile</Text>
                <View style={styles.bentoNumRow}>
                  <Text style={styles.bentoNumText}>{ph.toFixed(1)}</Text>
                  <Text style={styles.bentoUnitText}>pH</Text>
                </View>
                <Text style={styles.bentoDescText}>
                  Neutral anaerobic bed (Ideal 6.5–7.2)
                </Text>
              </View>
            </StitchCard>

            {/* 2. Root Mud Temperature */}
            <StitchCard style={styles.bentoCard}>
              <View style={styles.bentoHeaderRow}>
                <View style={styles.iconCircle}>
                  <MaterialIcons
                    name="device-thermostat"
                    size={18}
                    color={Colors.stitch.primaryContainer}
                  />
                </View>
                <View style={styles.probeTag}>
                  <Text style={styles.probeTagText}>DS18B20</Text>
                </View>
              </View>

              <View style={styles.bentoValBlock}>
                <Text style={styles.bentoLabelText}>Root Bed @ 10cm</Text>
                <View style={styles.bentoNumRow}>
                  <Text style={styles.bentoNumText}>{mudTemp.toFixed(1)}</Text>
                  <Text style={styles.bentoUnitText}>°C</Text>
                </View>
                <Text style={styles.bentoDescText}>
                  Submerged probe nominal (22–30°C)
                </Text>
              </View>
            </StitchCard>

            {/* 3. Microclimate Canopy (DHT11) */}
            <StitchCard style={styles.bentoCard}>
              <View style={styles.bentoHeaderRow}>
                <View style={styles.iconCircle}>
                  <Feather
                    name="wind"
                    size={18}
                    color={Colors.stitch.primaryContainer}
                  />
                </View>
                <View style={styles.probeTag}>
                  <Text style={styles.probeTagText}>DHT11</Text>
                </View>
              </View>

              <View style={styles.bentoValBlock}>
                <Text style={styles.bentoLabelText}>Ambient Canopy</Text>
                <View style={styles.bentoNumRow}>
                  <Text style={styles.bentoNumText}>{ambientTemp}°C</Text>
                  <Text style={styles.bentoUnitText}>/ {ambientRh}%</Text>
                </View>
                <Text style={styles.bentoDescText}>
                  Warm ambient humidity for tillering
                </Text>
              </View>
            </StitchCard>

            {/* 4. Solenoid Valve #2 State */}
            <StitchCard style={styles.bentoCard}>
              <View style={styles.bentoHeaderRow}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="valve"
                    size={18}
                    color={Colors.stitch.primaryContainer}
                  />
                </View>
                <View style={styles.probeTag}>
                  <Text style={styles.probeTagText}>Relay #3</Text>
                </View>
              </View>

              <View style={styles.bentoValBlock}>
                <Text style={styles.bentoLabelText}>Inflow Valve #2</Text>
                <View style={styles.bentoNumRow}>
                  <Text style={styles.bentoNumText}>Resting</Text>
                </View>
                <Text style={styles.bentoDescText}>
                  Sequential interlock idle • Closed
                </Text>
              </View>
            </StitchCard>
          </View>
        </View>

        {/* 24-Hour Standing Water Depth Trend (Inline SVG Chart) */}
        <StitchCard style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={styles.chartOverline}>HYDRAULIC WATER PROFILE</Text>
              <Text style={styles.chartTitle}>Standing Depth Trend (cm)</Text>
            </View>

            <View style={styles.depthBoundaryTag}>
              <Text style={styles.depthBoundaryText}>Target: 3.0–5.0 cm</Text>
            </View>
          </View>

          <View style={styles.svgChartContainer}>
            <Svg width="100%" height={140} viewBox="0 0 320 140">
              <Defs>
                <LinearGradient id="paddyDepthGrad" x1="0" x2="0" y1="0" y2="1">
                  <Stop offset="0%" stopColor="#559FC1" stopOpacity="0.4" />
                  <Stop offset="100%" stopColor="#559FC1" stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              {/* Min & Max Depth Boundary Lines */}
              <Line
                x1="0"
                y1="35"
                x2="320"
                y2="35"
                stroke={Colors.stitch.secondary}
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <SvgText x="4" y="31" fill={Colors.stitch.secondary} fontSize="9" fontWeight="700">
                MAX STANDING LEVEL (5.0 cm)
              </SvgText>

              <Line
                x1="0"
                y1="95"
                x2="320"
                y2="95"
                stroke={Colors.stitch.error}
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <SvgText x="4" y="91" fill={Colors.stitch.error} fontSize="9" fontWeight="700">
                MIN DEPTH FLOOD TRIGGER (3.0 cm)
              </SvgText>

              {/* Water Area Polygon */}
              <Polygon
                points="0,140 0,55 80,50 160,52 240,48 320,53 320,140"
                fill="url(#paddyDepthGrad)"
              />

              {/* Water Depth Curve Polyline */}
              <Polyline
                points="0,55 80,50 160,52 240,48 320,53"
                fill="none"
                stroke="#559FC1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Points */}
              <Circle cx="0" cy="55" r="3.5" fill="#FFFEF9" stroke="#559FC1" strokeWidth="2" />
              <Circle cx="80" cy="50" r="3.5" fill="#FFFEF9" stroke="#559FC1" strokeWidth="2" />
              <Circle cx="160" cy="52" r="3.5" fill="#FFFEF9" stroke="#559FC1" strokeWidth="2" />
              <Circle cx="240" cy="48" r="3.5" fill="#FFFEF9" stroke="#559FC1" strokeWidth="2" />
              <Circle cx="320" cy="53" r="4.5" fill="#559FC1" stroke="#FFFEF9" strokeWidth="2" />
            </Svg>

            <View style={styles.chartTimeAxis}>
              <Text style={styles.axisText}>06:00 (4.1 cm)</Text>
              <Text style={styles.axisText}>12:00 (4.3 cm)</Text>
              <Text style={styles.axisText}>18:00 (4.2 cm)</Text>
            </View>
          </View>
        </StitchCard>

        {/* Recent Inflow Activity Card */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeaderRow}>
            <Text style={styles.activityTitle}>Recent Flood Cycles</Text>
            <Text style={styles.activitySubheader}>SOL-VALVE #2</Text>
          </View>

          <StitchCard style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityItemLeft}>
                <View style={styles.activityIconWrap}>
                  <MaterialCommunityIcons
                    name="waves"
                    size={20}
                    color={Colors.stitch.onSecondaryContainer}
                  />
                </View>
                <View>
                  <Text style={styles.activityItemTime}>Yesterday, 07:00 AM</Text>
                  <Text style={styles.activityItemDesc}>
                    30 min cycle • Shared 12V Pump
                  </Text>
                </View>
              </View>
              <View style={styles.activityItemRight}>
                <Text style={styles.activityDeliveredText}>~360 L</Text>
                <Text style={styles.activityDeliveredSub}>Delivered (Est.)</Text>
              </View>
            </View>
          </StitchCard>
        </View>

        {/* Action Controls CTAs */}
        <View style={styles.bottomCtaRow}>
          <TouchableOpacity
            style={styles.calibrateBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/sensor-detail')}
          >
            <MaterialIcons
              name="tune"
              size={18}
              color={Colors.stitch.primary}
            />
            <Text style={styles.calibrateBtnText}>Layer Thresholds</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.flushBtn, isFloodQueued && styles.flushBtnActive]}
            activeOpacity={0.85}
            onPress={handleRequestFlood}
          >
            <MaterialCommunityIcons
              name="water-pump"
              size={18}
              color={Colors.stitch.secondaryFixed}
            />
            <Text style={styles.flushBtnText}>
              {isFloodQueued ? 'Queued (30m)' : 'Request 30-Min Flood'}
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
  cropHighlight: {
    color: Colors.stitch.secondary,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  nodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  nodeBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  syncedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stitch.secondary,
  },
  syncedBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },

  // Hero Card
  heroPondingCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.spaceLg,
  },
  heroBanner: {
    width: '100%',
    height: 176,
    justifyContent: 'space-between',
    padding: Spacing.spaceMd,
  },
  heroBannerImage: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  bannerGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 39, 23, 0.45)',
  },
  pondingStateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 254, 249, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Shadow.sm,
    zIndex: 2,
  },
  pondingStateText: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  bannerMetricsBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  standingLevelOverline: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondaryFixed,
    letterSpacing: 0.5,
  },
  depthMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  depthValue: {
    ...Typography.displayLarge,
    color: Colors.neutral.white,
    fontWeight: '800',
    lineHeight: 52,
  },
  depthUnit: {
    ...Typography.headlineMedium,
    color: Colors.stitch.secondaryFixed,
    fontWeight: '600',
  },
  targetDepthBox: {
    backgroundColor: 'rgba(255, 254, 249, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignItems: 'flex-end',
  },
  targetDepthOverline: {
    ...Typography.labelSmall,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
  },
  targetDepthValue: {
    ...Typography.labelMedium,
    color: Colors.stitch.secondaryFixed,
    fontWeight: '700',
  },

  // Gauge Strip
  gaugeStripContainer: {
    padding: Spacing.spaceLg,
    gap: Spacing.spaceMd,
  },
  mudStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: Spacing.spaceMd,
    borderRadius: BorderRadius.md,
  },
  mudStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniGaugeBox: {
    position: 'relative',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniGaugeCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniGaugeNumber: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  mudStatusTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  mudStatusDesc: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 11,
  },
  optimalPill: {
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  optimalPillText: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },
  timeFilterTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.stitch.surfaceContainer,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  timeFilterTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  timeFilterTabActive: {
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    ...Shadow.sm,
  },
  timeFilterTabText: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '500',
  },
  timeFilterTabTextActive: {
    color: Colors.stitch.primary,
    fontWeight: '700',
  },

  // Matrix Section
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
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.stitch.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  probeTag: {
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  probeTagText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontSize: 9,
    fontWeight: '700',
  },
  bentoValBlock: {
    marginTop: 2,
  },
  bentoLabelText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  bentoNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 2,
  },
  bentoNumText: {
    ...Typography.metricLarge,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  bentoUnitText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  bentoDescText: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
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
  depthBoundaryTag: {
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  depthBoundaryText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  svgChartContainer: {
    width: '100%',
    marginTop: Spacing.spaceSm,
  },
  chartTimeAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  axisText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },

  // Recent Inflow Activity
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
