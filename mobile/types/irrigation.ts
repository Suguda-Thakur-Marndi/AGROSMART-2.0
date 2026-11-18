import { ZoneId, DataSource } from './sensor';

export type IrrigationMode = 'AUTO' | 'MANUAL' | 'EMERGENCY_STOP';
export type PumpState = 'ON' | 'OFF' | 'STARTING' | 'STOPPING' | 'FAULT';
export type ValveState = 'OPEN' | 'CLOSED' | 'UNKNOWN';
export type IrrigationZoneState = 'IDLE' | 'REQUESTING' | 'IRRIGATING' | 'COOLDOWN' | 'FAULT';
export type SchedulingPolicy = 'SEQUENTIAL' | 'PRIORITY_VEGETABLE' | 'PRIORITY_PADDY';
export type CommandStatus = 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'CONFIRMED' | 'FAILED' | 'TIMEOUT';

export interface PumpElectricalConfig {
  voltage: '12V DC';
  ratedCurrentAmps: 1.0;
  powerSupplyRating: '12V 3A Regulated';
  driverType: 'Logic-Level N-Channel MOSFET';
  gateResistorOhms: 220;
  gatePullDownOhms: 10000;
  inlineFuseRating: '2A Slow-Blow';
}

export interface PumpStatus {
  state: PumpState;
  mode: IrrigationMode;
  activeZone: ZoneId | 'shared' | null;
  valveVegetable: ValveState;
  valvePaddy: ValveState;
  currentRunDurationSeconds: number;
  dailyRuntimeSeconds: number;
  lastStartTime: string | null;
  lastStopTime: string | null;
  dataSource: DataSource;
  reportedByDevice: boolean; // true = device confirmed, false = command-only assumption
  voltageConfig?: string;    // e.g. '12V DC (1A)'
  sharedPipeMode?: boolean;
}

export interface IrrigationZoneConfig {
  zoneId: ZoneId;
  onThreshold: number;
  offThreshold: number;
  maxRuntimeMinutes: number;
  minOffTimeMinutes: number;
  isEnabled: boolean;
}

export interface IrrigationCommand {
  commandId: string;
  type: 'PUMP_ON' | 'PUMP_OFF' | 'EMERGENCY_STOP' | 'SET_MODE' | 'SET_ZONE' | 'SET_CONFIG';
  targetZone?: ZoneId;
  mode?: IrrigationMode;
  payload?: Record<string, unknown>;
  issuedAt: string;
  status: CommandStatus;
  acknowledgedAt?: string;
  confirmedAt?: string;
  errorMessage?: string;
}

export interface IrrigationEvent {
  id: string;
  zoneId: ZoneId;
  startTime: string;
  endTime: string | null;
  durationSeconds: number;
  trigger: 'AUTO' | 'MANUAL' | 'EMERGENCY_STOP';
  startMoisture: number | null;
  endMoisture: number | null;
  estimatedLitres: number | null;
  isEstimated: boolean; // true if no flow sensor
}

export interface IrrigationSchedule {
  id: string;
  zoneId: ZoneId;
  scheduledStartTime: string; // HH:MM
  durationMinutes: number;
  daysOfWeek: number[]; // 0=Sun, 6=Sat
  isEnabled: boolean;
}
