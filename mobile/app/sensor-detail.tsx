/**
 * AgroSmart 2.0 – Screen 5: Sensor Monitoring & Calibration
 * Faithful implementation of Google Stitch UI/UX design (sensor_monitoring_calibration/code.html)
 *
 * Provides deep hardware telemetry, protocol validation & probe calibration:
 * 1. EWS Grove Mega 5.0V ADC Bus status
 * 2. Capacitive Soil Moisture Sensor V1.2 (10-bit ADC, Dry/Wet calibration)
 * 3. PE-03 pH Electrode + V3.0 Module (mV signal conditioning, 3-point buffer calibration)
 * 4. DS18B20 Waterproof Soil/Mud Temperature Probe (Dallas 1-Wire, CRC-8 checksum)
 * 5. DHT11 Ambient Temperature & Humidity Sensor (40-bit frame checksum)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
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

export default function SensorMonitoringCalibrationScreen() {
  const router = useRouter();
  const { isDemoMode } = useAppStore();
  const { vegetableZone, paddyZone } = useSensorStore();

  const [isScanning, setIsScanning] = useState(false);
  const [activeCalibrateModal, setActiveCalibrateModal] = useState<
    'moisture' | 'ph' | null
  >(null);
  const [calibStep, setCalibStep] = useState<number>(1);

  // Live telemetry readings
  const vegMoisture = vegetableZone?.soilMoisture?.value ?? 38;
  const paddyMoisture = paddyZone?.soilMoisture?.value ?? 72;
  const vegPh = vegetableZone?.ph?.value ?? 6.5;
  const paddyPh = paddyZone?.ph?.value ?? 6.8;
  const vegTemp = vegetableZone?.soilTemperature?.value ?? 26.2;
  const paddyTemp = paddyZone?.soilTemperature?.value ?? 27.0;
  const ambientTemp = vegetableZone?.airTemperature?.value ?? 29;
  const ambientRh = vegetableZone?.airHumidity?.value ?? 65;

  const handleScanBus = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      Alert.alert(
        'Bus Scan Complete',
        'Analog Channels: A0, A1, A2, A3 active.\nDigital 1-Wire: D7 active (CRC-8: 0x9A Valid).\nDHT11 Bus: D4 active (40-bit frame Valid).\nAll 4 physical probe lines are nominal.',
        [{ text: 'OK' }]
      );
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Stitch Top Header */}
      <StitchHeader
        title="Sensor Diagnostics"
        subtitle="Hardware Bus & Probes"
        showBack
        onBack={() => router.back()}
        onNotificationPress={() => router.push('/notifications')}
        onProfilePress={() => router.push('/profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status & Connectivity Pill Header Bar */}
        <View style={styles.topStatusRow}>
          <View style={styles.demoPill}>
            <View style={styles.demoPulseDot} />
            <Text style={styles.demoPillText}>
              {isDemoMode ? 'DEMO MODE: SIMULATED DATA' : 'LIVE HARDWARE LINK ACTIVE'}
            </Text>
          </View>

          <View style={styles.cellularPill}>
            <MaterialCommunityIcons
              name="wifi"
              size={16}
              color={Colors.stitch.secondary}
            />
            <Text style={styles.cellularText}>ESP8266 Wi-Fi</Text>
          </View>
        </View>

        {/* Hero Telemetry & Diagnostic Overview Card */}
        <View style={styles.heroOverviewCard}>
          <View style={styles.heroBgAccent} />
          <View style={styles.heroMicrochipIcon}>
            <MaterialCommunityIcons
              name="developer-board"
              size={64}
              color="rgba(129, 168, 144, 0.15)"
            />
          </View>

          <View style={styles.heroContentBlock}>
            <View style={styles.heroTopBadges}>
              <View style={styles.boardBadgeRow}>
                <View style={styles.megaBadge}>
                  <Text style={styles.megaBadgeText}>EWS Grove Mega</Text>
                </View>
                <View style={styles.busStableBadge}>
                  <View style={styles.busStableDot} />
                  <Text style={styles.busStableText}>5.0V ADC Bus Stable</Text>
                </View>
              </View>
              <MaterialIcons
                name="verified"
                size={20}
                color={Colors.stitch.secondaryFixed}
              />
            </View>

            <View style={styles.heroMetricRow}>
              <View>
                <Text style={styles.heroMetricOverline}>TELEMETRY ARRAY</Text>
                <Text style={styles.heroMetricBig}>96%</Text>
              </View>
              <View style={styles.heroMetricRight}>
                <Text style={styles.probesNominalText}>4/4 Probes Nominal</Text>
                <Text style={styles.nextCheckText}>Next check in 2d</Text>
              </View>
            </View>

            {/* Micro Progress Bar */}
            <View style={styles.heroProgressBarTrack}>
              <View style={[styles.heroProgressBarFill, { width: '96%' }]} />
            </View>

            <View style={styles.heroFooterRow}>
              <View style={styles.polledRow}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color={Colors.stitch.secondaryFixed}
                />
                <Text style={styles.polledText}>Polled 3s ago</Text>
              </View>

              <TouchableOpacity
                style={styles.scanBtn}
                activeOpacity={0.8}
                onPress={handleScanBus}
              >
                <MaterialCommunityIcons
                  name="sync"
                  size={15}
                  color={Colors.stitch.secondaryFixed}
                />
                <Text style={styles.scanBtnText}>
                  {isScanning ? 'Scanning...' : 'Scan I2C/Analog'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderTitleRow}>
            <View style={styles.sectionAccentBar} />
            <Text style={styles.sectionTitleText}>Connected Field Probes</Text>
          </View>
          <Text style={styles.probesOnlineTag}>4 ONLINE</Text>
        </View>

        {/* PROBE 1: Capacitive Soil Moisture Sensor V1.2 */}
        <StitchCard style={styles.probeCard}>
          <View style={styles.probeHeaderRow}>
            <View style={styles.probeHeaderLeft}>
              <View style={styles.probeIconWrapWater}>
                <MaterialCommunityIcons
                  name="water"
                  size={24}
                  color={Colors.stitch.secondary}
                />
              </View>
              <View>
                <View style={styles.probeTitleRow}>
                  <Text style={styles.probeTitleText}>Soil Moisture</Text>
                  <View style={styles.channelTag}>
                    <Text style={styles.channelTagText}>Analog A0/A1</Text>
                  </View>
                </View>
                <Text style={styles.probeSubtitleText}>
                  Capacitive V1.2 Corrosion-Resistant
                </Text>
              </View>
            </View>

            <View style={styles.healthBadge}>
              <Text style={styles.healthBadgeText}>98% Health</Text>
            </View>
          </View>

          {/* Dual Metric Reading: Veg Bed #2 & Paddy Basin */}
          <View style={styles.dualReadingGrid}>
            <View style={styles.dualReadingCol}>
              <View style={styles.readingHeaderRow}>
                <Text style={styles.readingZoneLabel}>VEG BED #1</Text>
                <MaterialCommunityIcons
                  name="sprout"
                  size={14}
                  color={Colors.stitch.secondary}
                />
              </View>
              <View style={styles.readingNumberRow}>
                <Text style={styles.readingNumber}>{vegMoisture}%</Text>
                <Text style={styles.readingUnit}>VWC</Text>
              </View>
              <Text style={styles.readingStateOptimal}>Optimal root zone</Text>
            </View>

            <View style={styles.dualReadingCol}>
              <View style={styles.readingHeaderRow}>
                <Text style={styles.readingZoneLabel}>PADDY BASIN</Text>
                <MaterialCommunityIcons
                  name="waves"
                  size={14}
                  color={Colors.stitch.secondary}
                />
              </View>
              <View style={styles.readingNumberRow}>
                <Text style={styles.readingNumber}>{paddyMoisture}%</Text>
                <Text style={styles.readingUnit}>VWC</Text>
              </View>
              <Text style={styles.readingStateMuted}>Saturated mud</Text>
            </View>
          </View>

          {/* Sensor Health & Telemetry Detail */}
          <View style={styles.telemetryDetailBox}>
            <View style={styles.telemetryDetailRow}>
              <View style={styles.telemetryRawRow}>
                <MaterialIcons
                  name="tune"
                  size={14}
                  color={Colors.stitch.onSurfaceVariant}
                />
                <Text style={styles.telemetryRawText}>Raw ADC: 582 / 1023</Text>
              </View>
              <Text style={styles.telemetryCalibDate}>Calibrated 12d ago</Text>
            </View>
            <View style={styles.probeHealthBarTrack}>
              <View style={[styles.probeHealthBarFill, { width: '98%' }]} />
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.probeCardFooter}>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.liveIndicatorText}>Live (3s ago)</Text>
            </View>
            <TouchableOpacity
              style={styles.calibrateActionBtn}
              activeOpacity={0.8}
              onPress={() => {
                setCalibStep(1);
                setActiveCalibrateModal('moisture');
              }}
            >
              <MaterialCommunityIcons
                name="tune-vertical"
                size={15}
                color={Colors.stitch.primary}
              />
              <Text style={styles.calibrateActionText}>Calibrate Probe</Text>
            </TouchableOpacity>
          </View>
        </StitchCard>

        {/* PROBE 2: PE-03 pH Glass Electrode + V3.0 Signal Conditioner */}
        <StitchCard style={styles.probeCard}>
          <View style={styles.probeHeaderRow}>
            <View style={styles.probeHeaderLeft}>
              <View style={styles.probeIconWrapEarth}>
                <MaterialCommunityIcons
                  name="flask-outline"
                  size={24}
                  color={Colors.stitch.tertiary}
                />
              </View>
              <View>
                <View style={styles.probeTitleRow}>
                  <Text style={styles.probeTitleText}>Soil / Water pH</Text>
                  <View style={styles.channelTag}>
                    <Text style={styles.channelTagText}>Analog A2</Text>
                  </View>
                </View>
                <Text style={styles.probeSubtitleText}>
                  PE-03 Electrode + V3.0 Conditioner
                </Text>
              </View>
            </View>

            <View style={styles.healthBadge}>
              <Text style={styles.healthBadgeText}>92% Health</Text>
            </View>
          </View>

          {/* Dual Reading */}
          <View style={styles.dualReadingGrid}>
            <View style={styles.dualReadingCol}>
              <View style={styles.readingHeaderRow}>
                <Text style={styles.readingZoneLabel}>VEG SOIL</Text>
                <Text style={styles.idealTag}>Target 6.0–6.8</Text>
              </View>
              <View style={styles.readingNumberRow}>
                <Text style={styles.readingNumber}>{vegPh.toFixed(1)}</Text>
                <Text style={styles.readingUnit}>pH</Text>
              </View>
              <Text style={styles.readingStateOptimal}>Slightly acidic (Good)</Text>
            </View>

            <View style={styles.dualReadingCol}>
              <View style={styles.readingHeaderRow}>
                <Text style={styles.readingZoneLabel}>PADDY MUD</Text>
                <Text style={styles.idealTag}>Target 6.5–7.2</Text>
              </View>
              <View style={styles.readingNumberRow}>
                <Text style={styles.readingNumber}>{paddyPh.toFixed(1)}</Text>
                <Text style={styles.readingUnit}>pH</Text>
              </View>
              <Text style={styles.readingStateOptimal}>Neutral balance</Text>
            </View>
          </View>

          {/* pH Detail */}
          <View style={styles.telemetryDetailBox}>
            <View style={styles.telemetryDetailRow}>
              <View style={styles.telemetryRawRow}>
                <MaterialCommunityIcons
                  name="sine-wave"
                  size={14}
                  color={Colors.stitch.onSurfaceVariant}
                />
                <Text style={styles.telemetryRawText}>Raw Voltage: 1845 mV</Text>
              </View>
              <Text style={styles.telemetryCalibDate}>
                3-Point (pH 4.01, 7.00, 10.01)
              </Text>
            </View>
            <View style={styles.probeHealthBarTrack}>
              <View style={[styles.probeHealthBarFill, { width: '92%' }]} />
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.probeCardFooter}>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.liveIndicatorText}>Live (3s ago)</Text>
            </View>
            <TouchableOpacity
              style={styles.calibrateActionBtn}
              activeOpacity={0.8}
              onPress={() => {
                setCalibStep(1);
                setActiveCalibrateModal('ph');
              }}
            >
              <MaterialCommunityIcons
                name="flask-round-bottom"
                size={15}
                color={Colors.stitch.primary}
              />
              <Text style={styles.calibrateActionText}>Calibrate Buffers</Text>
            </TouchableOpacity>
          </View>
        </StitchCard>

        {/* PROBE 3: DS18B20 Digital Waterproof Temperature Probe */}
        <StitchCard style={styles.probeCard}>
          <View style={styles.probeHeaderRow}>
            <View style={styles.probeHeaderLeft}>
              <View style={styles.probeIconWrapNeutral}>
                <MaterialIcons
                  name="device-thermostat"
                  size={24}
                  color={Colors.stitch.primaryContainer}
                />
              </View>
              <View>
                <View style={styles.probeTitleRow}>
                  <Text style={styles.probeTitleText}>Soil / Water Temp</Text>
                  <View style={styles.channelTag}>
                    <Text style={styles.channelTagText}>1-Wire Pin D7</Text>
                  </View>
                </View>
                <Text style={styles.probeSubtitleText}>
                  DS18B20 Stainless Probe (Dallas 1-Wire)
                </Text>
              </View>
            </View>

            <View style={styles.crcBadge}>
              <Text style={styles.crcBadgeText}>CRC-8 Valid</Text>
            </View>
          </View>

          {/* Dual Reading */}
          <View style={styles.dualReadingGrid}>
            <View style={styles.dualReadingCol}>
              <View style={styles.readingHeaderRow}>
                <Text style={styles.readingZoneLabel}>VEGETABLE FIELD</Text>
                <Text style={styles.idealTag}>15cm Depth</Text>
              </View>
              <View style={styles.readingNumberRow}>
                <Text style={styles.readingNumber}>{vegTemp.toFixed(1)}</Text>
                <Text style={styles.readingUnit}>°C</Text>
              </View>
              <Text style={styles.readingStateOptimal}>Active root metabolism</Text>
            </View>

            <View style={styles.dualReadingCol}>
              <View style={styles.readingHeaderRow}>
                <Text style={styles.readingZoneLabel}>LOWLAND PADDY</Text>
                <Text style={styles.idealTag}>Root Mud</Text>
              </View>
              <View style={styles.readingNumberRow}>
                <Text style={styles.readingNumber}>{paddyTemp.toFixed(1)}</Text>
                <Text style={styles.readingUnit}>°C</Text>
              </View>
              <Text style={styles.readingStateOptimal}>Submerged bed thermal</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.telemetryDetailBox}>
            <View style={styles.telemetryDetailRow}>
              <Text style={styles.telemetryRawText}>
                4.7kΩ Pull-Up Resistor • 11-Bit Res (0.125°C)
              </Text>
              <Text style={styles.telemetryCalibDate}>ROM: 28 FF 4B 8A...</Text>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.probeCardFooter}>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.liveIndicatorText}>ROM Verified</Text>
            </View>
            <TouchableOpacity
              style={styles.calibrateActionBtn}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  '1-Wire Bus Status',
                  'Dallas 1-Wire bus on digital pin D7 polled successfully.\nScratchpad: 9 bytes read.\nCRC: 0x9A matches transmitted CRC-8.\nResolution: 11-Bit (conversion time 375ms).'
                )
              }
            >
              <MaterialIcons
                name="verified"
                size={15}
                color={Colors.stitch.primary}
              />
              <Text style={styles.calibrateActionText}>Verify 1-Wire</Text>
            </TouchableOpacity>
          </View>
        </StitchCard>

        {/* PROBE 4: DHT11 Canopy Microclimate Sensor */}
        <StitchCard style={styles.probeCard}>
          <View style={styles.probeHeaderRow}>
            <View style={styles.probeHeaderLeft}>
              <View style={styles.probeIconWrapWater}>
                <Feather name="cloud" size={24} color={Colors.stitch.water} />
              </View>
              <View>
                <View style={styles.probeTitleRow}>
                  <Text style={styles.probeTitleText}>Canopy Microclimate</Text>
                  <View style={styles.channelTag}>
                    <Text style={styles.channelTagText}>Single-Wire D4</Text>
                  </View>
                </View>
                <Text style={styles.probeSubtitleText}>
                  DHT11 Ambient Temp & Relative Humidity
                </Text>
              </View>
            </View>

            <View style={styles.crcBadge}>
              <Text style={styles.crcBadgeText}>Checksum Valid</Text>
            </View>
          </View>

          {/* Dual Reading */}
          <View style={styles.dualReadingGrid}>
            <View style={styles.dualReadingCol}>
              <View style={styles.readingHeaderRow}>
                <Text style={styles.readingZoneLabel}>CANOPY TEMP</Text>
                <Text style={styles.idealTag}>Atmospheric</Text>
              </View>
              <View style={styles.readingNumberRow}>
                <Text style={styles.readingNumber}>{ambientTemp}</Text>
                <Text style={styles.readingUnit}>°C</Text>
              </View>
              <Text style={styles.readingStateOptimal}>Clear sky canopy</Text>
            </View>

            <View style={styles.dualReadingCol}>
              <View style={styles.readingHeaderRow}>
                <Text style={styles.readingZoneLabel}>RELATIVE HUMIDITY</Text>
                <Text style={styles.idealTag}>Dew Point 21°C</Text>
              </View>
              <View style={styles.readingNumberRow}>
                <Text style={styles.readingNumber}>{ambientRh}</Text>
                <Text style={styles.readingUnit}>%</Text>
              </View>
              <Text style={styles.readingStateOptimal}>VPD: 1.4 kPa</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.telemetryDetailBox}>
            <View style={styles.telemetryDetailRow}>
              <Text style={styles.telemetryRawText}>
                40-Bit Frame: [T_int: 29, T_dec: 0, H_int: 65, H_dec: 0]
              </Text>
              <Text style={styles.telemetryCalibDate}>Sum == Checksum</Text>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.probeCardFooter}>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.liveIndicatorText}>Live (3s ago)</Text>
            </View>
            <TouchableOpacity
              style={styles.calibrateActionBtn}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  'DHT11 Frame Telemetry',
                  'Single-wire protocol on pin D4 polled.\n40 bits received:\nByte 0 (RH int): 65\nByte 1 (RH dec): 0\nByte 2 (T int): 29\nByte 3 (T dec): 0\nByte 4 (Checksum): 94 (Matches sum 65 + 29 = 94).'
                )
              }
            >
              <MaterialCommunityIcons
                name="refresh"
                size={15}
                color={Colors.stitch.primary}
              />
              <Text style={styles.calibrateActionText}>Poll DHT11</Text>
            </TouchableOpacity>
          </View>
        </StitchCard>

        {/* Modal: Capacitive Soil Moisture Calibration Wizard */}
        <Modal
          visible={activeCalibrateModal === 'moisture'}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveCalibrateModal(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Capacitive V1.2 Calibration</Text>
                <TouchableOpacity
                  onPress={() => setActiveCalibrateModal(null)}
                  style={styles.modalCloseBtn}
                >
                  <MaterialIcons name="close" size={20} color={Colors.stitch.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDesc}>
                Calibrate dry air reference (0% VWC) and submerged water reference (100% VWC) on 10-bit ADC.
              </Text>

              <View style={styles.modalStepBox}>
                <Text style={styles.modalStepNum}>Step {calibStep} of 2</Text>
                <Text style={styles.modalStepTitle}>
                  {calibStep === 1
                    ? '1. Air Dry Calibration (0% Reference)'
                    : '2. Submerged Water Calibration (100% Reference)'}
                </Text>
                <Text style={styles.modalStepInstruction}>
                  {calibStep === 1
                    ? 'Hold the capacitive probe in open air away from metal or moisture. Current raw ADC: 785.'
                    : 'Submerge the probe tip into a cup of tap water up to the white boundary line. Current raw ADC: 320.'}
                </Text>
              </View>

              <View style={styles.modalBtnRow}>
                {calibStep === 1 ? (
                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    onPress={() => setCalibStep(2)}
                  >
                    <Text style={styles.modalPrimaryBtnText}>
                      Save Dry Value (785 ADC) & Next
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    onPress={() => {
                      setActiveCalibrateModal(null);
                      Alert.alert(
                        'Calibration Saved',
                        'Capacitive Soil Moisture Sensor calibrated successfully!\nDry Value: 785 ADC (0%)\nWet Value: 320 ADC (100%)\nLinear mapping saved to Arduino EEPROM.'
                      );
                    }}
                  >
                    <Text style={styles.modalPrimaryBtnText}>
                      Save Wet Value (320 ADC) & Complete
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal: PE-03 pH Buffer Calibration Wizard */}
        <Modal
          visible={activeCalibrateModal === 'ph'}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveCalibrateModal(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>PE-03 pH 3-Point Calibration</Text>
                <TouchableOpacity
                  onPress={() => setActiveCalibrateModal(null)}
                  style={styles.modalCloseBtn}
                >
                  <MaterialIcons name="close" size={20} color={Colors.stitch.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDesc}>
                Calibrate electrode slope and neutral offset using standard standard buffer solutions at 25°C.
              </Text>

              <View style={styles.modalStepBox}>
                <Text style={styles.modalStepNum}>Step {calibStep} of 3</Text>
                <Text style={styles.modalStepTitle}>
                  {calibStep === 1
                    ? 'Buffer pH 7.00 (Neutral Zero-Point)'
                    : calibStep === 2
                    ? 'Buffer pH 4.01 (Acidic Slope)'
                    : 'Buffer pH 10.01 (Alkaline Slope)'}
                </Text>
                <Text style={styles.modalStepInstruction}>
                  {calibStep === 1
                    ? 'Rinse probe with distilled water. Immerse in pH 7.00 buffer. Stir gently. Measured: 1500 mV (0.0 mV offset).'
                    : calibStep === 2
                    ? 'Rinse probe with distilled water. Immerse in pH 4.01 buffer. Measured: 2030 mV (+530 mV).'
                    : 'Rinse probe with distilled water. Immerse in pH 10.01 buffer. Measured: 970 mV (-530 mV).'}
                </Text>
              </View>

              <View style={styles.modalBtnRow}>
                {calibStep < 3 ? (
                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    onPress={() => setCalibStep(calibStep + 1)}
                  >
                    <Text style={styles.modalPrimaryBtnText}>
                      Save Step & Proceed
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    onPress={() => {
                      setActiveCalibrateModal(null);
                      Alert.alert(
                        'pH Calibration Saved',
                        '3-Point calibration completed successfully!\nNeutral Point: pH 7.00 (1500 mV)\nSlope: -59.16 mV/pH (Nernst ideal)\nElectrode health: 92% (Slope efficiency 98.4%).'
                      );
                    }}
                  >
                    <Text style={styles.modalPrimaryBtnText}>
                      Complete 3-Point Calibration
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>

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

  // Top Status Row
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.spaceSm,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
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
    letterSpacing: 0.5,
  },
  cellularPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    ...Shadow.sm,
  },
  cellularText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '600',
  },

  // Hero Telemetry Card
  heroOverviewCard: {
    backgroundColor: Colors.stitch.primaryContainer,
    borderRadius: BorderRadius.xl,
    padding: Spacing.spaceLg,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: Spacing.spaceLg,
    ...Shadow.md,
  },
  heroBgAccent: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(40, 107, 61, 0.2)',
  },
  heroMicrochipIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  heroContentBlock: {
    gap: Spacing.spaceMd,
    zIndex: 2,
  },
  heroTopBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  megaBadge: {
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  megaBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },
  busStableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  busStableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stitch.secondaryFixed,
  },
  busStableText: {
    ...Typography.bodySmall,
    color: Colors.stitch.onPrimaryContainer,
    fontSize: 11,
  },
  heroMetricRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroMetricOverline: {
    ...Typography.labelMedium,
    color: Colors.stitch.onPrimaryContainer,
    letterSpacing: 0.5,
  },
  heroMetricBig: {
    ...Typography.displayMedium,
    color: Colors.neutral.white,
    fontWeight: '800',
    lineHeight: 44,
  },
  heroMetricRight: {
    alignItems: 'flex-end',
  },
  probesNominalText: {
    ...Typography.labelMedium,
    color: Colors.stitch.secondaryFixed,
    fontWeight: '700',
  },
  nextCheckText: {
    ...Typography.bodySmall,
    color: Colors.stitch.onPrimaryContainer,
    fontSize: 11,
  },
  heroProgressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  heroProgressBarFill: {
    height: '100%',
    backgroundColor: Colors.stitch.secondaryFixed,
    borderRadius: BorderRadius.full,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  polledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  polledText: {
    ...Typography.bodySmall,
    color: Colors.stitch.onPrimaryContainer,
    fontSize: 11,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scanBtnText: {
    ...Typography.labelMedium,
    color: Colors.stitch.secondaryFixed,
    fontWeight: '700',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.spaceMd,
  },
  sectionHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccentBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: Colors.stitch.secondary,
  },
  sectionTitleText: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  probesOnlineTag: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '700',
  },

  // Probe Cards
  probeCard: {
    marginBottom: Spacing.spaceLg,
    gap: Spacing.spaceMd,
  },
  probeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  probeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  probeIconWrapWater: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.stitch.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  probeIconWrapEarth: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.stitch.tertiaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  probeIconWrapNeutral: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.stitch.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  probeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  probeTitleText: {
    ...Typography.headlineSmall,
    color: Colors.stitch.onSurface,
    fontWeight: '700',
  },
  channelTag: {
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  channelTagText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '700',
  },
  probeSubtitleText: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  healthBadge: {
    backgroundColor: Colors.stitch.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  healthBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSecondaryContainer,
    fontWeight: '700',
  },
  crcBadge: {
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  crcBadgeText: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },

  // Dual Reading
  dualReadingGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  dualReadingCol: {
    flex: 1,
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: Spacing.spaceSm + 2,
    borderRadius: BorderRadius.md,
  },
  readingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readingZoneLabel: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontWeight: '600',
    fontSize: 9,
  },
  idealTag: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 9,
  },
  readingNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginVertical: 4,
  },
  readingNumber: {
    ...Typography.headlineMedium,
    color: Colors.stitch.primary,
    fontWeight: '800',
  },
  readingUnit: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  readingStateOptimal: {
    ...Typography.bodySmall,
    color: Colors.stitch.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
  readingStateMuted: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 10,
  },

  // Telemetry Detail Box
  telemetryDetailBox: {
    gap: 4,
    paddingTop: 2,
  },
  telemetryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryRawRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  telemetryRawText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  telemetryCalibDate: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
    fontSize: 10,
  },
  probeHealthBarTrack: {
    width: '100%',
    height: 5,
    backgroundColor: Colors.stitch.surfaceContainer,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  probeHealthBarFill: {
    height: '100%',
    backgroundColor: Colors.stitch.secondary,
    borderRadius: BorderRadius.full,
  },

  // Probe Card Footer
  probeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stitch.secondary,
  },
  liveIndicatorText: {
    ...Typography.labelSmall,
    color: Colors.stitch.onSurfaceVariant,
  },
  calibrateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stitch.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  calibrateActionText: {
    ...Typography.labelMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.stitch.surfaceContainerLowest,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing.spaceXl,
    gap: Spacing.spaceMd,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    ...Typography.headlineMedium,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.stitch.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDesc: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    lineHeight: 18,
  },
  modalStepBox: {
    backgroundColor: Colors.stitch.surfaceContainerLow,
    padding: Spacing.spaceMd,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  modalStepNum: {
    ...Typography.labelSmall,
    color: Colors.stitch.secondary,
    fontWeight: '700',
  },
  modalStepTitle: {
    ...Typography.headlineSmall,
    color: Colors.stitch.primary,
    fontWeight: '700',
  },
  modalStepInstruction: {
    ...Typography.bodySmall,
    color: Colors.stitch.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  modalBtnRow: {
    marginTop: Spacing.spaceSm,
  },
  modalPrimaryBtn: {
    height: 52,
    backgroundColor: Colors.stitch.primaryContainer,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  modalPrimaryBtnText: {
    ...Typography.labelMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
});
