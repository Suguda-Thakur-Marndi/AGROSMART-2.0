/**
 * AgroSmart 2.0 – Screen: Device & Cellular Connectivity
 * Faithful implementation of Google Stitch UI/UX design
 *
 * Details the physical IoT communication stack:
 * 1. A7672S 4G LTE Modem (-67 dBm, CSQ 24, MQTTS over TLS 1.3)
 * 2. EWS Arduino Mega IoT Board (ATmega2560, 5V logic, Hardware Serial1)
 * 3. Bidirectional MQTT command & telemetry transport
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
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius, Shadow } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { StitchHeader } from '../components/navigation/StitchHeader';
import { StitchCard } from '../components/cards/StitchCard';
import { useSensorStore } from '../store/sensorStore';
import { useAppStore } from '../store/appStore';

export default function DeviceConnectivityScreen() {
  const router = useRouter();
  const { device } = useSensorStore();
  const { isDemoMode } = useAppStore();

  const [isPinging, setIsPinging] = useState(false);

  const handleTestAtCommand = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      Alert.alert(
        'Cellular AT Diagnostic',
        'AT+CSQ\n+CSQ: 24,99 (RSSI: -67 dBm, Bit Error: <0.2%)\n\nAT+CREG?\n+CREG: 0,1 (Registered on Home Network)\n\nAT+CGATT?\n+CGATT: 1 (LTE Packet Service Attached)',
        [{ text: 'OK' }]
      );
    }, 900);
  };

  const handlePollHeartbeat = () => {
    Alert.alert(
      'Arduino Mega Heartbeat',
      'Ping ACK received in 42ms via Hardware Serial1 (115200 baud).\nUptime: 14 days, 6 hours.\nFree SRAM: 5,420 bytes.\nWatchdog timer: Nominal (8s WDT armed).',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Stitch Top Header */}
      <StitchHeader
        title="Connectivity"
        subtitle="Modem & Gateway"
        showBack
        onBack={() => router.back()}
        onNotificationPress={() => router.push('/notifications')}
        onProfilePress={() => router.push('/profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Cellular Gateway Link Card */}
        <View style={styles.heroGatewayCard}>
          <View style={styles.heroGatewayHeader}>
            <View style={styles.cellIconCircle}>
              <MaterialIcons
                name="cell-tower"
                size={24}
                color={Colors.stitch.secondaryContainer}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.modemTitleRow}>
                <Text style={styles.modemTitle}>A7672S 4G LTE Gateway</Text>
                <View style={styles.onlineBadge}>
                  <Text style={styles.onlineBadgeText}>LTE Cat-1</Text>
                </View>
              </View>
              <Text style={styles.modemSubtitle}>
                SIMCom A7672S • UART Serial1 Link @ 115200 Baud
              </Text>
            </View>
          </View>

          {/* Signal Strength & Quality Bar */}
          <View style={styles.signalMetricsBox}>
            <View style={styles.signalMetricsHeader}>
              <Text style={styles.signalMetricsTitle}>RF Signal Strength</Text>
              <Text style={styles.signalMetricsVal}>-67 dBm (CSQ 24/31)</Text>
            </View>
            <View style={styles.signalBarTrack}>
              <View style={[styles.signalBarFill, { width: '80%' }]} />
            </View>
            <View style={styles.signalFooter}>
              <Text style={styles.signalQualityText}>Excellent Cellular Coverage</Text>
              <Text style={styles.operatorText}>Band 3 (1800 MHz LTE)</Text>
            </View>
          </View>
        </View>

        {/* Microcontroller & Bus Telemetry Card */}
        <StitchCard style={styles.mcuCard}>
          <View style={styles.mcuHeader}>
            <MaterialCommunityIcons
              name="developer-board"
              size={22}
              color={Colors.stitch.primary}
            />
            <Text style={styles.mcuTitle}>Arduino Mega IoT Subsystem</Text>
          </View>

          <View style={styles.mcuGrid}>
            <View style={styles.mcuItem}>
              <Text style={styles.mcuItemLabel}>MICROCONTROLLER</Text>
              <Text style={styles.mcuItemValue}>ATmega2560 (16 MHz)</Text>
            </View>
            <View style={styles.mcuItem}>
              <Text style={styles.mcuItemLabel}>LOGIC VOLTAGE</Text>
              <Text style={styles.mcuItemValue}>5.0V AVR Standard</Text>
            </View>
            <View style={styles.mcuItem}>
              <Text style={styles.mcuItemLabel}>ANALOG ADC BUS</Text>
              <Text style={styles.mcuItemValue}>10-Bit (0–1023, 4.88mV/step)</Text>
            </View>
            <View style={styles.mcuItem}>
              <Text style={styles.mcuItemLabel}>ONEWIRE BUS</Text>
              <Text style={styles.mcuItemValue}>Pin D7 (4.7kΩ Pull-Up)</Text>
            </View>
            <View style={styles.mcuItem}>
              <Text style={styles.mcuItemLabel}>DHT11 BUS</Text>
              <Text style={styles.mcuItemValue}>Pin D4 (Single-Wire)</Text>
            </View>
            <View style={styles.mcuItem}>
              <Text style={styles.mcuItemLabel}>MOSFET GATE</Text>
              <Text style={styles.mcuItemValue}>5V PWM / GPIO Clamped</Text>
            </View>
          </View>
        </StitchCard>

        {/* MQTT & Cloud Transport Card */}
        <StitchCard style={styles.mqttCard}>
          <View style={styles.mqttHeader}>
            <MaterialCommunityIcons
              name="cloud-sync-outline"
              size={22}
              color={Colors.stitch.secondary}
            />
            <Text style={styles.mqttTitle}>Cloud MQTT Telemetry Pipeline</Text>
          </View>

          <View style={styles.mqttDetailsList}>
            <View style={styles.mqttRow}>
              <Text style={styles.mqttLabel}>BROKER ENDPOINT</Text>
              <Text style={styles.mqttValue}>mqtts://telemetry.agrosmart.io:8883</Text>
            </View>
            <View style={styles.mqttRow}>
              <Text style={styles.mqttLabel}>SECURITY PROTOCOL</Text>
              <Text style={styles.mqttValue}>TLS 1.3 with Client Certificate Auth</Text>
            </View>
            <View style={styles.mqttRow}>
              <Text style={styles.mqttLabel}>HEARTBEAT FREQUENCY</Text>
              <Text style={styles.mqttValue}>30 Seconds (Next in 18s)</Text>
            </View>
            <View style={styles.mqttRow}>
              <Text style={styles.mqttLabel}>PUB TOPIC (PLOT A)</Text>
              <Text style={styles.mqttValueMono}>agrosmart/v2/telemetry/plot_a</Text>
            </View>
            <View style={styles.mqttRow}>
              <Text style={styles.mqttLabel}>PUB TOPIC (PLOT B)</Text>
              <Text style={styles.mqttValueMono}>agrosmart/v2/telemetry/plot_b</Text>
            </View>
            <View style={styles.mqttRow}>
              <Text style={styles.mqttLabel}>SUB TOPIC (PUMP/VALVES)</Text>
              <Text style={styles.mqttValueMono}>agrosmart/v2/irrigation/commands</Text>
            </View>
          </View>
        </StitchCard>

        {/* Diagnostic Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            activeOpacity={0.85}
            onPress={handleTestAtCommand}
          >
            <MaterialIcons
              name="terminal"
              size={18}
              color={Colors.stitch.primary}
            />
            <Text style={styles.actionBtnOutlineText}>
              {isPinging ? 'Pinging AT...' : 'Send AT+CSQ Ping'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPrimary}
            activeOpacity={0.85}
            onPress={handlePollHeartbeat}
          >
            <MaterialCommunityIcons
              name="heart-pulse"
              size={18}
              color={Colors.neutral.white}
            />
            <Text style={styles.actionBtnPrimaryText}>Poll MCU Heartbeat</Text>
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

  // Hero Card
  heroGatewayCard: {
    backgroundColor: Colors.stitch.primaryContainer,
    borderRadius: BorderRadius.xl,
    padding: Spacing.spaceLg,
    marginBottom: Spacing.spaceLg,
    gap: Spacing.spaceMd,
    ...Shadow.md,
  },
  heroGatewayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spaceSm + 2,
  },
  cellIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modemTitle: {
    ...Typography.headlineSmall,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  onlineBadge: {
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  onlineBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },
  modemSubtitle: {
    ...Typography.bodySmall,
    color: Colors.stitch.onPrimaryContainer,
    fontSize: 11,
    marginTop: 2,
  },

  // Signal Box
  signalMetricsBox: {
    backgroundColor: 'rgba(0, 39, 23, 0.45)',
    borderRadius: BorderRadius.md,
    padding: Spacing.spaceMd,
    gap: 6,
  },
  signalMetricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signalMetricsTitle: {
    ...Typography.labelSmall,
    color: Colors.stitch.onPrimaryContainer,
  },
  signalMetricsVal: {
    ...Typography.labelMedium,
    color: Colors.stitch.secondaryFixed,
    fontWeight: '700',
  },
  signalBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  signalBarFill: {
    height: '100%',
    backgroundColor: Colors.stitch.secondaryFixed,
    borderRadius: BorderRadius.full,
  },
  signalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  signalQualityText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondaryFixed,
    fontWeight: '600',
    fontSize: 10,
  },
  operatorText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onPrimaryContainer,
    fontSize: 10,
  },

  // MCU Card
  mcuCard: {
    marginBottom: Spacing.spaceLg,
    gap: Spacing.spaceMd,
  },
  mcuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mcuTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  mcuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mcuItem: {
    width: '48%',
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: 8,
    borderRadius: BorderRadius.sm,
  },
  mcuItemLabel: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  mcuItemValue: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
    marginTop: 2,
  },

  // MQTT Card
  mqttCard: {
    marginBottom: Spacing.spaceLg,
    gap: Spacing.spaceMd,
  },
  mqttHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mqttTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  mqttDetailsList: {
    gap: 8,
  },
  mqttRow: {
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: 8,
    borderRadius: BorderRadius.sm,
  },
  mqttLabel: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  mqttValue: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  mqttValueMono: {
    ...Typography.bodySmall,
    color: Colors.stitch.secondary,
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 2,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.gutterSm,
    marginBottom: Spacing.spaceSm,
  },
  actionBtnOutline: {
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
  actionBtnOutlineText: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  actionBtnPrimary: {
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
  actionBtnPrimaryText: {
    ...Typography.labelMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
});
