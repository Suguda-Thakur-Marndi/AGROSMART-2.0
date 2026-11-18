import { SensorReading, SensorType } from '../types/sensor';
import { SENSOR_LIMITS } from '../constants';

export function isValidReading(reading: SensorReading): boolean {
  const limits = SENSOR_LIMITS[reading.sensorType as keyof typeof SENSOR_LIMITS];
  if (!limits) return true;
  return reading.value >= limits.min && reading.value <= limits.max;
}

export function getMoistureLabel(percentage: number): string {
  if (percentage < 20) return 'Very Dry';
  if (percentage < 35) return 'Dry';
  if (percentage < 55) return 'Optimal';
  if (percentage < 75) return 'Moist';
  return 'Saturated';
}

export function getPHLabel(ph: number): string {
  if (ph < 4.5) return 'Very Acidic';
  if (ph < 6.0) return 'Acidic';
  if (ph < 7.0) return 'Slightly Acidic';
  if (ph < 7.5) return 'Neutral';
  if (ph < 8.5) return 'Slightly Alkaline';
  return 'Alkaline';
}

export function getSensorUnit(type: SensorType): string {
  const units: Record<SensorType, string> = {
    soil_moisture:    '%',
    ph:               'pH',
    soil_temperature: '°C',
    air_temperature:  '°C',
    air_humidity:     '%',
  };
  return units[type] ?? '';
}

export function formatSensorValue(value: number, type: SensorType): string {
  if (type === 'ph') return value.toFixed(2);
  if (type === 'soil_temperature' || type === 'air_temperature') return value.toFixed(1);
  return Math.round(value).toString();
}

export function getMoistureColor(percentage: number): string {
  if (percentage < 20) return '#FF5722';
  if (percentage < 35) return '#FF8F00';
  if (percentage < 55) return '#4CAF50';
  if (percentage < 75) return '#2196F3';
  return '#1565C0';
}
