import { ZoneId } from './sensor';

export interface WaterUsageEstimate {
  zoneId: ZoneId | 'total';
  periodType: 'session' | 'daily' | 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;
  runtimeSeconds: number;
  estimatedLitres: number;
  isEstimated: boolean; // always true without flow sensor
  pumpFlowRateLPM: number; // calibrated pump flow rate in L/min
  dataSource: 'live' | 'demo' | 'calculated';
}

export interface WaterSummary {
  today: {
    total: WaterUsageEstimate;
    vegetable: WaterUsageEstimate;
    paddy: WaterUsageEstimate;
  };
  thisWeek: {
    total: WaterUsageEstimate;
    vegetable: WaterUsageEstimate;
    paddy: WaterUsageEstimate;
  };
  thisMonth: {
    total: WaterUsageEstimate;
    vegetable: WaterUsageEstimate;
    paddy: WaterUsageEstimate;
  };
}

export interface WaterFlowConfig {
  hasFlowSensor: false; // Currently always false per hardware inventory
  calibratedFlowRateLPM: number; // Default: 10 L/min — must be calibrated
  lastCalibratedAt?: string;
}
