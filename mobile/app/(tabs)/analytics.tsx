/**
 * AgroSmart 2.0 – Screen 7: Analytics & Historical Reports
 * Faithful implementation of Google Stitch UI/UX design (analytics_historical_reports/code.html)
 *
 * Provides:
 * - Timeframe selector tab bar (Daily, Weekly, Monthly, Crop Season)
 * - Zone filter chips (All Plots, Plot A: Vegetable, Plot B: Paddy)
 * - Eco-Intelligence Diagnostic / Agronomic AI card
 * - Hydro-chart: Soil moisture vs. Solenoid valve activation pulses (Scalable SVG)
 * - Calibrated water delivery accounting (Vegetable 480 L vs. Paddy 940 L)
 * - Pump runtime & 12V 1A DC electrical energy tracking
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
  Path,
  Line,
  Defs,
  LinearGradient,
  Stop,
  G,
  Circle,
} from 'react-native-svg';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { StitchHeader } from '../../components/navigation/StitchHeader';
import { StitchCard } from '../../components/cards/StitchCard';
import { useIrrigationStore } from '../../store/irrigationStore';
import { useSensorStore } from '../../store/sensorStore';
import { useAppStore } from '../../store/appStore';

export default function AnalyticsHistoricalReportsScreen() {
  const router = useRouter();
  const { isDemoMode } = useAppStore();
  const { pumpStatus } = useIrrigationStore();
  const { vegetableZone, paddyZone } = useSensorStore();

  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'season'>('monthly');
  const [selectedZone, setSelectedZone] = useState<'all' | 'veg' | 'paddy'>('all');
  const [aiApplied, setAiApplied] = useState(false);

  const vegMoisture = vegetableZone?.soilMoisture?.value ?? 38;
  const paddyMoisture = paddyZone?.soilMoisture?.value ?? 72;

  const handleApplyAiRecommendation = () => {
    setAiApplied(true);
    Alert.alert(
      'Schedule Updated',
      'Shifted morning drip irrigation schedule to 06:00 AM to mitigate 29°C canopy drying rate acceleration. New automation profile saved.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Stitch Top Header */}
      <StitchHeader
        title="Analytics & History"
        subtitle="Agronomic Telemetry"
        onNotificationPress={() => router.push('/notifications')}
        onProfilePress={() => router.push('/profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Greeting & Scope Indicator */}
        <View style={styles.scopeHeaderSection}>
          <View style={styles.scopeIndicatorRow}>
            <View style={styles.scopeIndicatorLeft}>
              <MaterialIcons
                name="query-stats"
                size={20}
                color={Colors.stitch.secondary}
              />
              <Text style={styles.scopeIndicatorText}>AGRONOMIC TELEMETRY</Text>
            </View>

            <View style={styles.syncBadge}>
              <View style={styles.syncDot} />
              <Text style={styles.syncBadgeText}>Live Sensor Sync</Text>
            </View>
          </View>

          <View style={styles.pageTitleRow}>
            <Text style={styles.pageTitleText}>Analytics & History</Text>
            <Text style={styles.timeframeSpanText}>Last 30 Days</Text>
          </View>
        </View>

        {/* Timeframe Selector Tab Bar */}
        <View style={styles.timeframeContainer}>
          {(
            [
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'season', label: 'Crop Season' },
            ] as const
          ).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.timeframeTab,
                timeframe === item.id && styles.timeframeTabActive,
              ]}
              onPress={() => setTimeframe(item.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.timeframeTabText,
                  timeframe === item.id && styles.timeframeTabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Zone Filter Chips */}
        <View style={styles.zoneChipsRow}>
          <TouchableOpacity
            style={[
              styles.zoneChip,
              selectedZone === 'all' && styles.zoneChipActive,
            ]}
            onPress={() => setSelectedZone('all')}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="layers"
              size={15}
              color={
                selectedZone === 'all'
                  ? Colors.neutral.white
                  : Colors.stitch.primary
              }
            />
            <Text
              style={[
                styles.zoneChipText,
                selectedZone === 'all' && styles.zoneChipTextActive,
              ]}
            >
              All Plots (2)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.zoneChip,
              selectedZone === 'veg' && styles.zoneChipActive,
            ]}
            onPress={() => setSelectedZone('veg')}
            activeOpacity={0.8}
          >
            <View style={[styles.filterDot, { backgroundColor: Colors.stitch.secondary }]} />
            <Text
              style={[
                styles.zoneChipText,
                selectedZone === 'veg' && styles.zoneChipTextActive,
              ]}
            >
              Plot A: Vegetable
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.zoneChip,
              selectedZone === 'paddy' && styles.zoneChipActive,
            ]}
            onPress={() => setSelectedZone('paddy')}
            activeOpacity={0.8}
          >
            <View style={[styles.filterDot, { backgroundColor: Colors.stitch.water }]} />
            <Text
              style={[
                styles.zoneChipText,
                selectedZone === 'paddy' && styles.zoneChipTextActive,
              ]}
            >
              Plot B: Paddy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Key Agronomic AI Insight Card */}
        <StitchCard style={styles.aiInsightCard}>
          <View style={styles.aiCardGlow} />
          <View style={styles.aiCardContent}>
            <View style={styles.aiIconWrap}>
              <MaterialCommunityIcons
                name="robot"
                size={20}
                color={Colors.stitch.secondary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.aiHeaderRow}>
                <Text style={styles.aiTagText}>ECO-INTELLIGENCE DIAGNOSTIC</Text>
                <Text style={styles.aiTimeText}>2h ago</Text>
              </View>

              <Text style={styles.aiBodyText}>
                <Text style={styles.aiBold}>Plot A soil drying rate accelerated by +12%</Text>{' '}
                due to sustained 29°C canopy temperature. Moisture buffer reached depletion threshold 45 min earlier.
              </Text>

              <View style={styles.aiFooterRow}>
                <View style={styles.shiftCycleRow}>
                  <MaterialIcons
                    name="schedule"
                    size={16}
                    color={Colors.stitch.secondary}
                  />
                  <Text style={styles.shiftCycleText}>
                    Shift drip cycle to 06:00 AM
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.autoApplyBtn, aiApplied && styles.autoApplyBtnDone]}
                  activeOpacity={0.85}
                  onPress={handleApplyAiRecommendation}
                >
                  <Text style={styles.autoApplyBtnText}>
                    {aiApplied ? 'Applied' : 'Auto-Apply'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </StitchCard>

        {/* SECTION 1: Soil Moisture & Valve Activation Curve (SVG Hydro-Chart) */}
        <StitchCard style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <View>
              <View style={styles.chartTitleRow}>
                <MaterialCommunityIcons
                  name="water"
                  size={20}
                  color={Colors.stitch.secondary}
                />
                <Text style={styles.chartTitleText}>
                  Moisture vs. Valve Cycles
                </Text>
              </View>
              <Text style={styles.chartSubtitleText}>
                Depletion curve & auto-recharge response
              </Text>
            </View>

            <View style={styles.targetRangesAlign}>
              <Text style={styles.targetRangesTag}>TARGET RANGES</Text>
              <View style={styles.targetPillRow}>
                <Text style={styles.vegTargetPill}>Veg 35-45%</Text>
                <Text style={styles.paddyTargetPill}>Paddy 70-85%</Text>
              </View>
            </View>
          </View>

          {/* Chart Canvas Box */}
          <View style={styles.hydroChartBox}>
            {/* Chart internal legend */}
            <View style={styles.hydroLegendRow}>
              <View style={styles.hydroLegendLeft}>
                <View style={styles.legendColorGroup}>
                  <View
                    style={[
                      styles.legendColorLine,
                      { backgroundColor: Colors.stitch.water },
                    ]}
                  />
                  <Text style={styles.legendLabelText}>
                    Plot B: Paddy ({paddyMoisture}%)
                  </Text>
                </View>
                <View style={styles.legendColorGroup}>
                  <View
                    style={[
                      styles.legendColorLine,
                      { backgroundColor: Colors.stitch.secondary },
                    ]}
                  />
                  <Text style={styles.legendLabelText}>
                    Plot A: Veg ({vegMoisture}%)
                  </Text>
                </View>
              </View>

              <View style={styles.valveEventsIndicator}>
                <MaterialIcons
                  name="flash-on"
                  size={14}
                  color={Colors.stitch.secondary}
                />
                <Text style={styles.valveEventsText}>Valve Events</Text>
              </View>
            </View>

            {/* Dynamic Scalable SVG Hydro Curve */}
            <Svg width="100%" height={120} viewBox="0 0 320 110">
              <Defs>
                <LinearGradient id="paddyGrad" x1="0" x2="0" y1="0" y2="1">
                  <Stop offset="0%" stopColor="#559FC1" stopOpacity="0.35" />
                  <Stop offset="100%" stopColor="#559FC1" stopOpacity="0.0" />
                </LinearGradient>
                <LinearGradient id="vegGrad" x1="0" x2="0" y1="0" y2="1">
                  <Stop offset="0%" stopColor="#286B3D" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#286B3D" stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              {/* Horizontal Reference Lines */}
              <Line
                x1="0"
                y1="20"
                x2="320"
                y2="20"
                stroke="#C1C8C1"
                strokeWidth="0.8"
                strokeDasharray="3,3"
                opacity="0.6"
              />
              <Line
                x1="0"
                y1="60"
                x2="320"
                y2="60"
                stroke="#C1C8C1"
                strokeWidth="0.8"
                strokeDasharray="3,3"
                opacity="0.6"
              />
              <Line
                x1="0"
                y1="95"
                x2="320"
                y2="95"
                stroke="#C1C8C1"
                strokeWidth="0.8"
                strokeDasharray="3,3"
                opacity="0.6"
              />

              {/* Paddy Area & Line (Plot B) */}
              <Path
                d="M0,32 Q40,28 75,35 T150,22 T220,38 T280,24 L320,30 L320,110 L0,110 Z"
                fill="url(#paddyGrad)"
              />
              <Path
                d="M0,32 Q40,28 75,35 T150,22 T220,38 T280,24 L320,30"
                fill="none"
                stroke="#559FC1"
                strokeLinecap="round"
                strokeWidth="2.5"
              />

              {/* Vegetable Area & Line (Plot A) */}
              <Path
                d="M0,74 Q35,82 70,68 T140,86 T210,65 T280,82 L320,70 L320,110 L0,110 Z"
                fill="url(#vegGrad)"
              />
              <Path
                d="M0,74 Q35,82 70,68 T140,86 T210,65 T280,82 L320,70"
                fill="none"
                stroke="#286B3D"
                strokeLinecap="round"
                strokeWidth="2.5"
              />

              {/* Solenoid Valve Trigger Pulse Markers */}
              <G transform="translate(68, 64)">
                <Circle cx="0" cy="0" r="4" fill="#FFFFFF" stroke="#286B3D" strokeWidth="2" />
                <Line x1="0" y1="4" x2="0" y2="40" stroke="#286B3D" strokeDasharray="2,2" strokeWidth="1" />
              </G>

              <G transform="translate(148, 18)">
                <Circle cx="0" cy="0" r="4" fill="#FFFFFF" stroke="#559FC1" strokeWidth="2" />
                <Line x1="0" y1="4" x2="0" y2="86" stroke="#559FC1" strokeDasharray="2,2" strokeWidth="1" />
              </G>

              <G transform="translate(240, 68)">
                <Circle cx="0" cy="0" r="4" fill="#FFFFFF" stroke="#286B3D" strokeWidth="2" />
                <Line x1="0" y1="4" x2="0" y2="38" stroke="#286B3D" strokeDasharray="2,2" strokeWidth="1" />
              </G>
            </Svg>

            <View style={styles.chartDaysRow}>
              <Text style={styles.dayText}>Day 1</Text>
              <Text style={styles.dayText}>Day 8</Text>
              <Text style={styles.dayText}>Day 15</Text>
              <Text style={styles.dayText}>Day 22</Text>
              <Text style={styles.dayText}>Day 30</Text>
            </View>
          </View>
        </StitchCard>

        {/* SECTION 2: Consumption Breakdown & Water Accounting */}
        <StitchCard style={styles.breakdownCard}>
          <View style={styles.breakdownHeaderRow}>
            <View>
              <Text style={styles.breakdownTitle}>Water Delivery Breakdown</Text>
              <Text style={styles.breakdownSubtitle}>
                Calibrated 15 L/min flow rate accounting
              </Text>
            </View>
            <View style={styles.totalWaterBadge}>
              <Text style={styles.totalWaterText}>1,420 L Total</Text>
            </View>
          </View>

          {/* Visual Split Ratio Bar */}
          <View style={styles.ratioBarTrack}>
            <View style={[styles.ratioBarVeg, { width: '34%' }]} />
            <View style={[styles.ratioBarPaddy, { width: '66%' }]} />
          </View>

          {/* Zone Metrics Row */}
          <View style={styles.zoneDeliveryRow}>
            <View style={styles.zoneDeliveryItem}>
              <View style={styles.zoneLabelWrap}>
                <View style={[styles.zoneSquare, { backgroundColor: Colors.stitch.secondary }]} />
                <Text style={styles.zoneNameText}>Plot A (Vegetable Drip)</Text>
              </View>
              <Text style={styles.zoneVolumeText}>480 L (34%)</Text>
              <Text style={styles.zoneSubtext}>32 min total runtime</Text>
            </View>

            <View style={styles.zoneDeliveryItem}>
              <View style={styles.zoneLabelWrap}>
                <View style={[styles.zoneSquare, { backgroundColor: Colors.stitch.water }]} />
                <Text style={styles.zoneNameText}>Plot B (Paddy Flood)</Text>
              </View>
              <Text style={styles.zoneVolumeText}>940 L (66%)</Text>
              <Text style={styles.zoneSubtext}>63 min total runtime</Text>
            </View>
          </View>

          {/* Pump Electrical Energy Summary */}
          <View style={styles.energySummaryBox}>
            <View style={styles.energyLeft}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={18}
                color={Colors.stitch.secondaryFixed}
              />
              <Text style={styles.energyLabel}>12V 1A Pump Electrical Draw:</Text>
            </View>
            <Text style={styles.energyValue}>~19.0 Wh (1.58 Ah)</Text>
          </View>
        </StitchCard>

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

  // Scope Header
  scopeHeaderSection: {
    marginBottom: Spacing.spaceMd,
  },
  scopeIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scopeIndicatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scopeIndicatorText: {
    ...Typography.labelMedium,
    color: Colors.stitch.secondary,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stitch.secondary,
  },
  syncBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  pageTitleText: {
    ...Typography.headlineMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  timeframeSpanText: {
    ...Typography.bodySmall,
    color: Colors.stitch.outline,
  },

  // Timeframe Selector
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.stitch.surfaceContainer,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.spaceSm,
    ...Shadow.sm,
  },
  timeframeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  timeframeTabActive: {
    backgroundColor: Colors.stitch.primaryContainer,
    ...Shadow.sm,
  },
  timeframeTabText: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSurfaceVariant,
  },
  timeframeTabTextActive: {
    color: Colors.neutral.white,
    fontWeight: '700',
  },

  // Zone Chips Row
  zoneChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.spaceLg,
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.stitch.border,
    ...Shadow.sm,
  },
  zoneChipActive: {
    backgroundColor: Colors.stitch.primaryContainer,
    borderColor: Colors.stitch.primaryContainer,
  },
  zoneChipText: {
    ...Typography.labelMedium,
    color: Colors.stitch.onSurfaceVariant,
  },
  zoneChipTextActive: {
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // AI Diagnostic Card
  aiInsightCard: {
    marginBottom: Spacing.spaceLg,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.stitch.border,
  },
  aiCardGlow: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(172, 243, 185, 0.4)',
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.spaceSm,
    zIndex: 2,
  },
  aiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(40, 107, 61, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiTagText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  aiTimeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.outline,
  },
  aiBodyText: {
    ...Typography.bodyMedium,
    color: Colors.stitch.onSurface,
    marginTop: 4,
    lineHeight: 20,
  },
  aiBold: {
    fontWeight: '700',
    color: Colors.stitch.primary,
  },
  aiFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.spaceSm,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.stitch.surfaceContainerHigh,
  },
  shiftCycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shiftCycleText: {
    ...Typography.labelMedium,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  autoApplyBtn: {
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    ...Shadow.sm,
  },
  autoApplyBtnDone: {
    backgroundColor: Colors.stitch.surfaceContainer,
  },
  autoApplyBtnText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
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
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartTitleText: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  chartSubtitleText: {
    ...Typography.bodySmall,
    color: Colors.stitch.outline,
    marginTop: 2,
  },
  targetRangesAlign: {
    alignItems: 'flex-end',
  },
  targetRangesTag: {
    ...Typography.labelSmall,
    color: Colors.stitch.outline,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  targetPillRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  vegTargetPill: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  paddyTargetPill: {
    ...Typography.labelSmall,
    color: Colors.stitch.water,
    fontWeight: '700',
  },
  hydroChartBox: {
    backgroundColor: 'rgba(246, 244, 234, 0.6)',
    borderRadius: BorderRadius.md,
    padding: Spacing.spaceSm,
    marginTop: 4,
  },
  hydroLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hydroLegendLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  legendColorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColorLine: {
    width: 10,
    height: 4,
    borderRadius: 2,
  },
  legendLabelText: {
    ...Typography.labelSmall,
    color: Colors.stitch.outline,
  },
  valveEventsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  valveEventsText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  chartDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  dayText: {
    ...Typography.labelSmall,
    color: Colors.stitch.outline,
    fontSize: 9,
  },

  // Breakdown Card
  breakdownCard: {
    marginBottom: Spacing.spaceLg,
    gap: Spacing.spaceMd,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  breakdownTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  breakdownSubtitle: {
    ...Typography.bodySmall,
    color: Colors.stitch.outline,
    marginTop: 2,
  },
  totalWaterBadge: {
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  totalWaterText: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  ratioBarTrack: {
    width: '100%',
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.stitch.surfaceContainerHighest,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  ratioBarVeg: {
    height: '100%',
    backgroundColor: Colors.stitch.secondary,
  },
  ratioBarPaddy: {
    height: '100%',
    backgroundColor: Colors.stitch.water,
  },
  zoneDeliveryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  zoneDeliveryItem: {
    flex: 1,
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: Spacing.spaceSm + 2,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  zoneLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoneSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  zoneNameText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 10,
  },
  zoneVolumeText: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '800',
    marginTop: 2,
  },
  zoneSubtext: {
    ...Typography.bodySmall,
    color: Colors.stitch.outline,
    fontSize: 10,
  },
  energySummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.stitch.primaryContainer,
    padding: Spacing.spaceSm + 2,
    borderRadius: BorderRadius.md,
  },
  energyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  energyLabel: {
    ...Typography.labelSmall,
    color: Colors.stitch.onPrimaryContainer,
  },
  energyValue: {
    ...Typography.labelMedium,
    color: Colors.stitch.secondaryFixed,
    fontWeight: '700',
  },
});
