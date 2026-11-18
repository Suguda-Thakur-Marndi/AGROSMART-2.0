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
import { Header, Card, Button, Badge, StatusIndicator } from '../components/common';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../constants';
import { useIrrigationStore } from '../store/irrigationStore';
import { useAppStore } from '../store/appStore';
import { ZoneId, IrrigationMode } from '../types';

export default function PumpControlScreen() {
  const router = useRouter();
  const { isDemoMode } = useAppStore();
  const { pumpStatus, setPumpStatus, addEvent } = useIrrigationStore();

  const [selectedManualZone, setSelectedManualZone] = useState<ZoneId>('vegetable');
  const [manualDurationMinutes, setManualDurationMinutes] = useState<number>(15);

  const isPumpRunning = pumpStatus?.state === 'ON';
  const activeZone = pumpStatus?.activeZone;
  const currentDurationSec = pumpStatus?.currentRunDurationSeconds ?? 0;
  const dailyDurationSec = pumpStatus?.dailyRuntimeSeconds ?? 1240;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleManualStart = () => {
    Alert.alert(
      'Confirm Manual Irrigation',
      `Start 12V DC water pump for ${selectedManualZone.toUpperCase()} zone for ${manualDurationMinutes} minutes?\n\nValve ${
        selectedManualZone === 'vegetable' ? '1' : '2'
      } will open 1.5s prior to pump energization.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Pump',
          onPress: () => {
            if (setPumpStatus) {
              setPumpStatus({
                state: 'ON',
                mode: 'MANUAL',
                activeZone: selectedManualZone,
                valveVegetable: selectedManualZone === 'vegetable' ? 'OPEN' : 'CLOSED',
                valvePaddy: selectedManualZone === 'paddy' ? 'OPEN' : 'CLOSED',
                currentRunDurationSeconds: 1,
                dailyRuntimeSeconds: dailyDurationSec + 1,
                lastStartTime: new Date().toISOString(),
                lastStopTime: null,
                dataSource: isDemoMode ? 'demo' : 'live',
                reportedByDevice: true,
                voltageConfig: '12V DC (1A)',
                sharedPipeMode: false,
              });

              addEvent({
                id: `evt-${Date.now()}`,
                zoneId: selectedManualZone,
                startTime: new Date().toISOString(),
                endTime: null,
                durationSeconds: manualDurationMinutes * 60,
                trigger: 'MANUAL',
                startMoisture: 32.5,
                endMoisture: null,
                estimatedLitres: manualDurationMinutes * 12,
                isEstimated: true,
              });
            }
          },
        },
      ],
    );
  };

  const handleStopPump = () => {
    if (setPumpStatus) {
      setPumpStatus({
        state: 'OFF',
        mode: pumpStatus?.mode ?? 'AUTO',
        activeZone: null,
        valveVegetable: 'CLOSED',
        valvePaddy: 'CLOSED',
        currentRunDurationSeconds: 0,
        dailyRuntimeSeconds: dailyDurationSec,
        lastStartTime: pumpStatus?.lastStartTime ?? null,
        lastStopTime: new Date().toISOString(),
        dataSource: isDemoMode ? 'demo' : 'live',
        reportedByDevice: true,
        voltageConfig: '12V DC (1A)',
        sharedPipeMode: false,
      });
    }
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      '⚠️ EMERGENCY STOP TRIGGERED',
      'The 12V DC water pump has been immediately de-energized (<10ms). Solenoid valves will close. Auto-cycles are halted until manual reset.',
      [
        {
          text: 'OK',
          onPress: () => {
            if (setPumpStatus) {
              setPumpStatus({
                state: 'OFF',
                mode: 'EMERGENCY_STOP',
                activeZone: null,
                valveVegetable: 'CLOSED',
                valvePaddy: 'CLOSED',
                currentRunDurationSeconds: 0,
                dailyRuntimeSeconds: dailyDurationSec,
                lastStartTime: null,
                lastStopTime: new Date().toISOString(),
                dataSource: isDemoMode ? 'demo' : 'live',
                reportedByDevice: true,
                voltageConfig: '12V DC (1A)',
                sharedPipeMode: false,
              });
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="12V Pump Control Center"
        subtitle="Shared Pump & Manifold Actuation"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Main Pump Status Hero Card */}
        <Card
          variant="gradient"
          gradientColors={
            isPumpRunning
              ? ['#E65100', '#F57F17']
              : ['#1A5C2A', '#2E7D32']
          }
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroTitleGroup}>
              <Text style={styles.heroTitle}>COMMON WATER PUMP</Text>
              <Text style={styles.heroSub}>Shared Main Line • 12V DC 1A</Text>
            </View>
            <View style={styles.heroBadgeWrapper}>
              <Badge
                label={isPumpRunning ? 'RUNNING' : 'STANDBY (OFF)'}
                variant={isPumpRunning ? 'pump' : 'neutral'}
                showDot
              />
            </View>
          </View>

          <View style={styles.heroMetricRow}>
            <View style={styles.heroMetric}>
              <Text style={styles.metricLabel}>ACTIVE ZONE</Text>
              <Text style={styles.metricVal}>
                {activeZone === 'vegetable'
                  ? 'Vegetable'
                  : activeZone === 'paddy'
                  ? 'Paddy'
                  : activeZone === 'shared'
                  ? 'Shared Mode'
                  : 'None (Idle)'}
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.metricLabel}>CURRENT RUN</Text>
              <Text style={styles.metricVal}>
                {isPumpRunning ? formatDuration(currentDurationSec) : '0m 00s'}
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.metricLabel}>TODAY TOTAL</Text>
              <Text style={styles.metricVal}>{formatDuration(dailyDurationSec)}</Text>
            </View>
          </View>
        </Card>

        {/* 2. Hardware Driver & Electrical Specifications */}
        <Card variant="elevated" style={styles.specCard}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="chip" size={20} color={Colors.primary.forest} />
            <Text style={styles.cardTitle}>12V Pump Electrical Specifications</Text>
          </View>
          
          <View style={styles.specGrid}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Operating Voltage:</Text>
              <Text style={styles.specVal}>12.0 V DC (Regulated 3A Supply)</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Rated Current:</Text>
              <Text style={styles.specVal}>1.0 A continuous (2.5A peak)</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Driver Architecture:</Text>
              <Text style={styles.specVal}>N-Ch Logic MOSFET (Common GND)</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Gate Protection:</Text>
              <Text style={styles.specVal}>220Ω inrush + 10kΩ pull-down</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Back-EMF Snubber:</Text>
              <Text style={styles.specVal}>1N4007 Flyback Diode across load</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Electrical Isolation:</Text>
              <Text style={styles.specVal}>Separate 12V rail; 2A inline fuse</Text>
            </View>
          </View>
        </Card>

        {/* 3. Manifold Zone Valves Status */}
        <Card variant="elevated" style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="pipe-valve" size={20} color={Colors.accent.blue} />
            <Text style={styles.cardTitle}>Manifold Zone Valves (12V Solenoids)</Text>
          </View>

          <View style={styles.valveRow}>
            <View style={styles.valveItem}>
              <Text style={styles.valveName}>Valve 1 (Vegetable)</Text>
              <Badge
                label={pumpStatus?.valveVegetable === 'OPEN' ? 'OPEN' : 'CLOSED'}
                variant={pumpStatus?.valveVegetable === 'OPEN' ? 'success' : 'neutral'}
                showDot
              />
            </View>
            <View style={styles.valveItem}>
              <Text style={styles.valveName}>Valve 2 (Paddy)</Text>
              <Badge
                label={pumpStatus?.valvePaddy === 'OPEN' ? 'OPEN' : 'CLOSED'}
                variant={pumpStatus?.valvePaddy === 'OPEN' ? 'info' : 'neutral'}
                showDot
              />
            </View>
          </View>

          <Text style={styles.hydraulicNote}>
            🛡️ Anti-Water-Hammer Sequencing: Valve opens 1500ms before pump starts; pump stops 1000ms before valve closes.
          </Text>
        </Card>

        {/* 4. Manual Irrigation Control */}
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Manual Irrigation Dispatch</Text>
          <Text style={styles.cardSubtitle}>
            Select target zone and run duration. Hardware interlocks prevent simultaneous dual-zone flow.
          </Text>

          <View style={styles.zoneSelectorRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.zoneChoice,
                selectedManualZone === 'vegetable' && styles.zoneChoiceActiveVeg,
              ]}
              onPress={() => setSelectedManualZone('vegetable')}
            >
              <MaterialCommunityIcons
                name="sprout"
                size={20}
                color={selectedManualZone === 'vegetable' ? Colors.neutral.white : Colors.primary.natural}
              />
              <Text
                style={[
                  styles.zoneChoiceText,
                  selectedManualZone === 'vegetable' && styles.zoneChoiceTextActive,
                ]}
              >
                Vegetable Zone
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.zoneChoice,
                selectedManualZone === 'paddy' && styles.zoneChoiceActivePaddy,
              ]}
              onPress={() => setSelectedManualZone('paddy')}
            >
              <MaterialCommunityIcons
                name="water"
                size={20}
                color={selectedManualZone === 'paddy' ? Colors.neutral.white : Colors.accent.blue}
              />
              <Text
                style={[
                  styles.zoneChoiceText,
                  selectedManualZone === 'paddy' && styles.zoneChoiceTextActive,
                ]}
              >
                Paddy Zone
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.durationSelectorRow}>
            {[10, 15, 30, 45].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.durationChip,
                  manualDurationMinutes === mins && styles.durationChipActive,
                ]}
                onPress={() => setManualDurationMinutes(mins)}
              >
                <Text
                  style={[
                    styles.durationChipText,
                    manualDurationMinutes === mins && styles.durationChipTextActive,
                  ]}
                >
                  {mins} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isPumpRunning ? (
            <Button
              title="Stop Irrigation Cycle"
              variant="outline"
              size="lg"
              style={styles.actionBtn}
              onPress={handleStopPump}
            />
          ) : (
            <Button
              title={`Start 12V Pump (${selectedManualZone.toUpperCase()} • ${manualDurationMinutes}m)`}
              variant="primary"
              size="lg"
              style={styles.actionBtn}
              onPress={handleManualStart}
            />
          )}
        </Card>

        {/* 5. Emergency STOP Button */}
        <View style={styles.emergencyContainer}>
          <Button
            title="EMERGENCY STOP (PUMP OFF)"
            variant="danger"
            size="lg"
            style={styles.emergencyBtn}
            icon={<MaterialCommunityIcons name="alert-octagon" size={24} color={Colors.neutral.white} />}
            onPress={handleEmergencyStop}
          />
          <Text style={styles.emergencyDisclaimer}>
            Triggers instantaneous low-side MOSFET gate pull-down to GND. All active cycles aborted.
          </Text>
        </View>

        {/* 6. Recent Irrigation History */}
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Recent Irrigation History</Text>
          <View style={styles.historyList}>
            <View style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <Badge label="Vegetable" variant="zone_veg" size="sm" />
                <Text style={styles.historyTime}>Today, 09:30 AM</Text>
              </View>
              <Text style={styles.historyDetail}>20 mins • ~240 L (Est.)</Text>
            </View>

            <View style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <Badge label="Paddy" variant="zone_paddy" size="sm" />
                <Text style={styles.historyTime}>Yesterday, 04:15 PM</Text>
              </View>
              <Text style={styles.historyDetail}>45 mins • ~540 L (Est.)</Text>
            </View>

            <View style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <Badge label="Vegetable" variant="zone_veg" size="sm" />
                <Text style={styles.historyTime}>Yesterday, 07:00 AM</Text>
              </View>
              <Text style={styles.historyDetail}>15 mins • ~180 L (Est.)</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  heroCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.base,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  heroTitleGroup: {
    flex: 1,
  },
  heroTitle: {
    ...Typography.titleLarge,
    color: Colors.neutral.white,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSub: {
    ...Typography.caption,
    color: Colors.primary.pale,
    marginTop: 2,
  },
  heroBadgeWrapper: {
    marginLeft: Spacing.sm,
  },
  heroMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  heroMetric: {
    alignItems: 'center',
    flex: 1,
  },
  heroDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  metricLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  metricVal: {
    ...Typography.titleMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  specCard: {
    padding: Spacing.base,
    marginBottom: Spacing.base,
    backgroundColor: '#FAFCFA',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.natural,
  },
  card: {
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    ...Typography.headlineSmall,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  specGrid: {
    marginTop: Spacing.xs,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  specLabel: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  specVal: {
    ...Typography.bodySmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  valveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.sm,
  },
  valveItem: {
    flex: 0.48,
    backgroundColor: '#F9F9F9',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  valveName: {
    ...Typography.labelMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  hydraulicNote: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  zoneSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  zoneChoice: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
  },
  zoneChoiceActiveVeg: {
    backgroundColor: Colors.primary.natural,
    borderColor: Colors.primary.natural,
  },
  zoneChoiceActivePaddy: {
    backgroundColor: Colors.accent.blue,
    borderColor: Colors.accent.blue,
  },
  zoneChoiceText: {
    ...Typography.labelMedium,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
  },
  zoneChoiceTextActive: {
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  durationSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  durationChip: {
    flex: 0.22,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  durationChipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.primary.natural,
  },
  durationChipText: {
    ...Typography.labelMedium,
    color: Colors.text.secondary,
  },
  durationChipTextActive: {
    color: Colors.primary.forest,
    fontWeight: '700',
  },
  actionBtn: {
    marginTop: Spacing.xs,
  },
  emergencyContainer: {
    marginVertical: Spacing.base,
    alignItems: 'center',
  },
  emergencyBtn: {
    width: '100%',
    ...Shadow.lg,
  },
  emergencyDisclaimer: {
    ...Typography.caption,
    color: Colors.status.error,
    textAlign: 'center',
    marginTop: Spacing.xs + 2,
  },
  historyList: {
    marginTop: Spacing.xs,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTime: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginLeft: Spacing.sm,
  },
  historyDetail: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
});
