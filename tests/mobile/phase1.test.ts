import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Test imports
import { Colors } from '../../mobile/constants/Colors.ts';
import { Spacing, BorderRadius, Shadow } from '../../mobile/constants/Spacing.ts';
import { Typography, FontSize } from '../../mobile/constants/Typography.ts';
import {
  isValidReading,
  getMoistureLabel,
  getPHLabel,
  formatSensorValue,
  getMoistureColor,
} from '../../mobile/utils/sensorHelpers.ts';
import {
  generateDemoSensorReading,
  generateDemoZoneData,
  generateDemoPumpStatus,
  generateDemoWaterSummary,
} from '../../mobile/utils/demoData.ts';
import { IRRIGATION_DEFAULTS, SENSOR_LIMITS } from '../../mobile/constants/index.ts';
import { useAppStore } from '../../mobile/store/appStore.ts';
import { useIrrigationStore } from '../../mobile/store/irrigationStore.ts';
import { useSensorStore } from '../../mobile/store/sensorStore.ts';

describe('Phase 1 - Design System & Color Tokens', () => {
  test('Primary brand palette is correctly defined with expected hex values', () => {
    assert.equal(Colors.primary.forest, '#183D2B'); // Stitch primaryContainer
    assert.equal(Colors.primary.natural, '#286B3D'); // Stitch secondary
    assert.equal(Colors.neutral.white, '#FFFFFF');
    assert.equal(Colors.stitch.error, '#BA1A1A'); // Stitch error
  });

  test('Spacing and border radius tokens conform to 4px/8px grid scale', () => {
    assert.equal(Spacing.xs, 4);
    assert.equal(Spacing.sm, 8);
    assert.equal(Spacing.md, 12);
    assert.equal(Spacing.base, 16);
    assert.equal(Spacing.lg, 20);
    assert.equal(Spacing.xl, 28); // Stitch 1.75rem = 28px
    assert.equal(BorderRadius.lg, 16);
    assert.equal(BorderRadius.full, 9999);
  });

  test('Typography scale provides complete hierarchy', () => {
    assert.ok(Typography.displayLarge.fontSize >= 40);
    assert.ok(Typography.headlineLarge.fontSize >= 24);
    assert.ok(Typography.bodyLarge.fontSize === 16);
    assert.ok(Typography.caption.fontSize <= 10);
  });
});

describe('Phase 1 - Sensor Validation & Utility Functions', () => {
  test('Sensor value limits correctly validate bounded ranges', () => {
    assert.equal(
      isValidReading({
        id: '1',
        deviceId: 'dev',
        zoneId: 'vegetable',
        sensorType: 'soil_moisture',
        value: 45,
        unit: '%',
        status: 'online',
        dataSource: 'live',
        timestamp: new Date().toISOString(),
        isValid: true,
      }),
      true,
    );

    assert.equal(
      isValidReading({
        id: '2',
        deviceId: 'dev',
        zoneId: 'vegetable',
        sensorType: 'soil_moisture',
        value: 120, // out of range
        unit: '%',
        status: 'online',
        dataSource: 'live',
        timestamp: new Date().toISOString(),
        isValid: true,
      }),
      false,
    );
  });

  test('Moisture label correctly classifies moisture percentages', () => {
    assert.equal(getMoistureLabel(15), 'Very Dry');
    assert.equal(getMoistureLabel(30), 'Dry');
    assert.equal(getMoistureLabel(45), 'Optimal');
    assert.equal(getMoistureLabel(65), 'Moist');
    assert.equal(getMoistureLabel(85), 'Saturated');
  });

  test('pH label correctly categorizes acidity/alkalinity', () => {
    assert.equal(getPHLabel(4.0), 'Very Acidic');
    assert.equal(getPHLabel(5.5), 'Acidic');
    assert.equal(getPHLabel(6.5), 'Slightly Acidic');
    assert.equal(getPHLabel(7.2), 'Neutral');
    assert.equal(getPHLabel(8.0), 'Slightly Alkaline');
    assert.equal(getPHLabel(9.5), 'Alkaline');
  });

  test('formatSensorValue formats precision appropriately per sensor type', () => {
    assert.equal(formatSensorValue(6.789, 'ph'), '6.79');
    assert.equal(formatSensorValue(27.432, 'soil_temperature'), '27.4');
    assert.equal(formatSensorValue(45.6, 'soil_moisture'), '46');
  });
});

describe('Phase 1 - Hydraulic Configuration & Safety Defaults', () => {
  test('Vegetable zone thresholds enforce proper ON/OFF hysteresis', () => {
    const { onThreshold, offThreshold, maxRuntimeMinutes, minOffTimeMinutes } =
      IRRIGATION_DEFAULTS.vegetable;

    assert.equal(onThreshold, 35);
    assert.equal(offThreshold, 55);
    assert.ok(
      offThreshold > onThreshold,
      'OFF threshold must be strictly greater than ON threshold for hysteresis',
    );
    assert.ok(
      maxRuntimeMinutes > 0 && maxRuntimeMinutes <= 60,
      'Max runtime must be bounded',
    );
    assert.ok(minOffTimeMinutes >= 5, 'Minimum off time must protect the pump');
  });

  test('Paddy zone thresholds reflect flood-tolerant crop requirements', () => {
    const { onThreshold, offThreshold, maxRuntimeMinutes } = IRRIGATION_DEFAULTS.paddy;

    assert.equal(onThreshold, 60);
    assert.equal(offThreshold, 80);
    assert.ok(
      offThreshold > onThreshold,
      'Paddy OFF threshold must exceed ON threshold',
    );
    assert.ok(maxRuntimeMinutes >= 30, 'Paddy requires extended runtime');
  });
});

describe('Phase 1 - Demo Data Integrity & Separation', () => {
  test('All generated demo readings are explicitly tagged with dataSource="demo"', () => {
    const moistureReading = generateDemoSensorReading('soil_moisture', 'vegetable');
    assert.equal(moistureReading.dataSource, 'demo');
    assert.ok(moistureReading.id.startsWith('demo-'));

    const vegZone = generateDemoZoneData('vegetable');
    assert.equal(vegZone.dataSource, 'demo');
    assert.equal(vegZone.soilMoisture?.dataSource, 'demo');
    assert.equal(vegZone.ph?.dataSource, 'demo');
  });

  test('Water usage accounting recognizes lack of physical flow sensor', () => {
    const waterSummary = generateDemoWaterSummary();
    assert.equal(waterSummary.today.total.isEstimated, true);
    assert.equal(waterSummary.today.vegetable.isEstimated, true);
    assert.equal(waterSummary.today.paddy.isEstimated, true);
    assert.ok(
      waterSummary.today.total.pumpFlowRateLPM > 0,
      'Calculated water usage requires calibrated pump flow rate',
    );
  });
});

describe('Phase 1 - State Management & Zustand Store Initialization', () => {
  test('appStore initializes with LIVE mode enabled (isDemoMode: false) by default', () => {
    const { isDemoMode, unreadCount, notifications } = useAppStore.getState();
    assert.equal(isDemoMode, false, 'LIVE mode must be the default operational mode');
    assert.equal(unreadCount, 0);
    assert.equal(notifications.length, 0);
  });

  test('appStore adds notification and increments unreadCount', () => {
    useAppStore.getState().addNotification({
      id: 'test-notif-1',
      type: 'warning',
      title: 'Low Moisture',
      body: 'Vegetable field moisture dropped below 35%',
      timestamp: new Date().toISOString(),
      read: false,
    });

    const state = useAppStore.getState();
    assert.equal(state.unreadCount, 1);
    assert.equal(state.notifications.length, 1);
    assert.equal(state.notifications[0].title, 'Low Moisture');

    // Clean up
    useAppStore.getState().clearNotifications();
    assert.equal(useAppStore.getState().unreadCount, 0);
  });

  test('irrigationStore initializes with correct dual-zone configs and pump stopped', () => {
    const { pumpStatus, vegetableConfig, paddyConfig } = useIrrigationStore.getState();
    assert.equal(pumpStatus, null);
    assert.equal(vegetableConfig.zoneId, 'vegetable');
    assert.equal(vegetableConfig.onThreshold, 35);
    assert.equal(vegetableConfig.offThreshold, 55);
    assert.equal(paddyConfig.zoneId, 'paddy');
    assert.equal(paddyConfig.onThreshold, 60);
    assert.equal(paddyConfig.offThreshold, 80);
  });

  test('sensorStore initializes without errors and tracks device status', () => {
    const { device, vegetableZone, paddyZone, error } = useSensorStore.getState();
    assert.equal(device, null);
    assert.equal(vegetableZone, null);
    assert.equal(paddyZone, null);
    assert.equal(error, null);

    useSensorStore.getState().setDevice({
      deviceId: 'AGRO-TEST-001',
      firmwareVersion: '2.0.0',
      hardwarePlatform: 'EWS_ARDUINO_MEGA',
      cellularModule: 'A7672S',
      connectionStatus: 'connecting',
      protocol: 'CELLULAR',
      lastHeartbeat: null,
      lastTelemetryReceived: null,
    });

    assert.equal(useSensorStore.getState().device?.deviceId, 'AGRO-TEST-001');
    assert.equal(
      useSensorStore.getState().device?.hardwarePlatform,
      'EWS_ARDUINO_MEGA',
    );
  });
});

