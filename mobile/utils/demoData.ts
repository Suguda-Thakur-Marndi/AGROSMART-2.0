import {
  SensorReading,
  SensorType,
  SoilMoistureSensor,
  PHSensor,
  TemperatureSensor,
  HumiditySensor,
  ZoneSensorData,
  ZoneId,
  DataSource,
} from '../types/sensor';
import { PumpStatus, PumpState, ValveState } from '../types/irrigation';
import { WaterSummary, WaterUsageEstimate } from '../types/water';
import { AppNotification } from '../types';

export const DEMO_DISCLAIMER = '⚠️ DEMO DATA — Not connected to real hardware';

// ─── Helpers ────────────────────────────────────────────────────────────────

function rand(min: number, max: number, decimals = 1): number {
  const val = Math.random() * (max - min) + min;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

function uuid(): string {
  return 'demo-' + Math.random().toString(36).substr(2, 9);
}

function isoNow(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

// ─── TASK 11 — Public generators ────────────────────────────────────────────

export function generateDemoSensorReading(
  type: SensorType,
  zoneId: ZoneId | null = null,
): SensorReading {
  const dataSource: DataSource = 'demo';

  let value: number;
  let unit: string;

  switch (type) {
    case 'soil_moisture':
      value = zoneId === 'paddy' ? rand(65, 78, 1) : rand(28, 42, 1);
      unit = '%';
      break;
    case 'ph':
      value = zoneId === 'paddy' ? rand(6.5, 7.0, 2) : rand(6.2, 6.8, 2);
      unit = 'pH';
      break;
    case 'soil_temperature':
    case 'air_temperature':
      value = rand(24, 32, 1);
      unit = '°C';
      break;
    case 'air_humidity':
      value = rand(60, 80, 1);
      unit = '%';
      break;
    default:
      value = 0;
      unit = '';
  }

  return {
    id: uuid(),
    deviceId: 'demo-device-001',
    zoneId,
    sensorType: type,
    value,
    unit,
    status: 'online',
    dataSource,
    timestamp: isoNow(),
    isValid: true,
  };
}

export function generateDemoZoneData(zoneId: ZoneId): ZoneSensorData {
  const now = isoNow();

  const soilMoisture: SoilMoistureSensor = {
    ...(generateDemoSensorReading('soil_moisture', zoneId) as SoilMoistureSensor),
    sensorType: 'soil_moisture',
    calibrated: true,
    rawAnalogValue: rand(300, 700, 0),
  };

  const ph: PHSensor = {
    ...(generateDemoSensorReading('ph', zoneId) as PHSensor),
    sensorType: 'ph',
    calibrated: true,
    calibrationPoints: 3,
    calibrationDate: '2024-01-15T10:00:00Z',
  };

  const soilTemperature: TemperatureSensor = {
    ...(generateDemoSensorReading('soil_temperature', zoneId) as TemperatureSensor),
    sensorType: 'soil_temperature',
    protocol: 'OneWire',
  };

  const airTemperature: TemperatureSensor = {
    ...(generateDemoSensorReading('air_temperature', zoneId) as TemperatureSensor),
    sensorType: 'air_temperature',
    protocol: 'DHT',
  };

  const airHumidity: HumiditySensor = {
    ...(generateDemoSensorReading('air_humidity', zoneId) as HumiditySensor),
    sensorType: 'air_humidity',
    protocol: 'DHT',
  };

  return {
    zoneId,
    zoneName: zoneId === 'vegetable' ? 'Vegetable Zone' : 'Paddy Zone',
    soilMoisture,
    ph,
    soilTemperature,
    airTemperature,
    airHumidity,
    lastUpdated: now,
    dataSource: 'demo',
  };
}

export function generateDemoPumpStatus(): PumpStatus {
  const isOn = Math.random() > 0.6;
  const activeZone: ZoneId | null = isOn
    ? Math.random() > 0.5
      ? 'vegetable'
      : 'paddy'
    : null;

  const state: PumpState = isOn ? 'ON' : 'OFF';

  const valveVegetable: ValveState = activeZone === 'vegetable' ? 'OPEN' : 'CLOSED';
  const valvePaddy: ValveState = activeZone === 'paddy' ? 'OPEN' : 'CLOSED';

  const currentRunDurationSeconds = isOn ? Math.floor(rand(60, 1200, 0)) : 0;
  const dailyRuntimeSeconds = Math.floor(rand(600, 3600, 0));

  return {
    state,
    mode: 'AUTO',
    activeZone,
    valveVegetable,
    valvePaddy,
    currentRunDurationSeconds,
    dailyRuntimeSeconds,
    lastStartTime: isOn ? isoNow(-currentRunDurationSeconds * 1000) : isoNow(-3600000),
    lastStopTime: isOn ? null : isoNow(-rand(600000, 3600000, 0)),
    dataSource: 'demo',
    reportedByDevice: false,
    voltageConfig: '12V DC (1A)',
    sharedPipeMode: false,
  };
}

function makeEstimate(
  zoneId: ZoneId | 'total',
  periodType: WaterUsageEstimate['periodType'],
  runtimeSeconds: number,
): WaterUsageEstimate {
  const flowRateLPM = 10;
  const estimatedLitres = (runtimeSeconds / 60) * flowRateLPM;
  const now = new Date();
  return {
    zoneId,
    periodType,
    periodStart: isoNow(-runtimeSeconds * 1000),
    periodEnd: now.toISOString(),
    runtimeSeconds,
    estimatedLitres: Math.round(estimatedLitres * 10) / 10,
    isEstimated: true,
    pumpFlowRateLPM: flowRateLPM,
    dataSource: 'demo',
  };
}

export function generateDemoWaterSummary(): WaterSummary {
  // today
  const todayVegSec = Math.floor(rand(600, 2400, 0));
  const todayPaddySec = Math.floor(rand(900, 3600, 0));
  const todayTotalSec = todayVegSec + todayPaddySec;

  // week
  const weekVegSec = todayVegSec * rand(5, 7, 0);
  const weekPaddySec = todayPaddySec * rand(5, 7, 0);
  const weekTotalSec = weekVegSec + weekPaddySec;

  // month
  const monthVegSec = weekVegSec * rand(3, 5, 0);
  const monthPaddySec = weekPaddySec * rand(3, 5, 0);
  const monthTotalSec = monthVegSec + monthPaddySec;

  return {
    today: {
      total:     makeEstimate('total',     'daily',   todayTotalSec),
      vegetable: makeEstimate('vegetable', 'daily',   todayVegSec),
      paddy:     makeEstimate('paddy',     'daily',   todayPaddySec),
    },
    thisWeek: {
      total:     makeEstimate('total',     'weekly',  weekTotalSec),
      vegetable: makeEstimate('vegetable', 'weekly',  weekVegSec),
      paddy:     makeEstimate('paddy',     'weekly',  weekPaddySec),
    },
    thisMonth: {
      total:     makeEstimate('total',     'monthly', monthTotalSec),
      vegetable: makeEstimate('vegetable', 'monthly', monthVegSec),
      paddy:     makeEstimate('paddy',     'monthly', monthPaddySec),
    },
  };
}

export function generateDemoHistory(days: number = 7): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = Date.now();
  const msPerHour = 3600000;
  const totalHours = days * 24;
  const zones: ZoneId[] = ['vegetable', 'paddy'];
  const types: SensorType[] = ['soil_moisture', 'ph', 'air_temperature', 'air_humidity'];

  for (let h = totalHours; h >= 0; h -= 2) {
    const timestamp = new Date(now - h * msPerHour).toISOString();
    for (const zoneId of zones) {
      for (const type of types) {
        const base = generateDemoSensorReading(type, zoneId);
        readings.push({ ...base, id: uuid(), timestamp });
      }
    }
  }

  return readings;
}

export function generateDemoNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: uuid(),
      type: 'irrigation',
      title: 'Irrigation Started',
      body: 'Vegetable zone irrigation started automatically (moisture: 28%)',
      timestamp: new Date(now - 1800000).toISOString(),
      read: false,
      zoneId: 'vegetable',
      actionType: 'VIEW_ZONE',
      actionPayload: { zoneId: 'vegetable' },
    },
    {
      id: uuid(),
      type: 'success',
      title: 'Irrigation Complete',
      body: 'Paddy zone irrigation complete — moisture reached 76%',
      timestamp: new Date(now - 7200000).toISOString(),
      read: false,
      zoneId: 'paddy',
    },
    {
      id: uuid(),
      type: 'warning',
      title: 'Low Soil Moisture',
      body: 'Vegetable zone moisture at 22% — below threshold of 35%',
      timestamp: new Date(now - 10800000).toISOString(),
      read: true,
      zoneId: 'vegetable',
    },
    {
      id: uuid(),
      type: 'info',
      title: 'Demo Mode Active',
      body: DEMO_DISCLAIMER,
      timestamp: new Date(now - 86400000).toISOString(),
      read: true,
    },
    {
      id: uuid(),
      type: 'error',
      title: 'Sensor Read Error',
      body: 'pH sensor in paddy zone returned an invalid reading — retrying',
      timestamp: new Date(now - 172800000).toISOString(),
      read: true,
      zoneId: 'paddy',
    },
  ];
}
