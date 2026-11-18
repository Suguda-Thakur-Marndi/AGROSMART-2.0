export type SensorStatus = 'online' | 'offline' | 'error' | 'uncalibrated';
export type ZoneId = 'vegetable' | 'paddy';
export type DataSource = 'live' | 'demo' | 'cached';

export interface SensorReading {
  id: string;
  deviceId: string;
  zoneId: ZoneId | null;
  sensorType: SensorType;
  value: number;
  unit: string;
  status: SensorStatus;
  dataSource: DataSource;
  timestamp: string; // ISO 8601
  isValid: boolean;
  errorCode?: string;
}

export type SensorType =
  | 'soil_moisture'
  | 'ph'
  | 'soil_temperature'
  | 'air_temperature'
  | 'air_humidity';

export interface SoilMoistureSensor extends SensorReading {
  sensorType: 'soil_moisture';
  rawAnalogValue?: number;
  dryReference?: number;
  wetReference?: number;
  calibrated: boolean;
}

export interface PHSensor extends SensorReading {
  sensorType: 'ph';
  calibrationPoints?: number;
  calibrationDate?: string;
  calibrated: boolean;
}

export interface TemperatureSensor extends SensorReading {
  sensorType: 'soil_temperature' | 'air_temperature';
  protocol?: 'OneWire' | 'DHT';
}

export interface HumiditySensor extends SensorReading {
  sensorType: 'air_humidity';
  protocol?: 'DHT';
}

export interface SensorConfig {
  sensorId: string;
  sensorType: SensorType;
  zoneAssignment: ZoneId | 'shared' | null;
  isEnabled: boolean;
  calibration?: SensorCalibration;
}

export interface SensorCalibration {
  dryValue?: number;    // for moisture
  wetValue?: number;    // for moisture
  ph4Voltage?: number;  // for pH
  ph7Voltage?: number;  // for pH
  ph10Voltage?: number; // for pH
  calibratedAt?: string;
}

export interface ZoneSensorData {
  zoneId: ZoneId;
  zoneName: string;
  soilMoisture: SoilMoistureSensor | null;
  ph: PHSensor | null;
  soilTemperature: TemperatureSensor | null;
  airTemperature: TemperatureSensor | null;
  airHumidity: HumiditySensor | null;
  lastUpdated: string;
  dataSource: DataSource;
}
