export type DeviceConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'unknown';
export type CommunicationProtocol = 'HTTP' | 'MQTT' | 'CELLULAR';

export interface DeviceInfo {
  deviceId: string;
  firmwareVersion: string;
  hardwarePlatform: 'EWS_ARDUINO_MEGA'; // Only supported platform
  cellularModule: 'A7672S';
  connectionStatus: DeviceConnectionStatus;
  protocol: CommunicationProtocol;
  signalStrength?: number; // dBm, from A7672S AT+CSQ
  lastHeartbeat: string | null;
  lastTelemetryReceived: string | null;
  ipAddress?: string;
  imei?: string;
  operatorName?: string;
  uptime?: number; // seconds
}

export interface DeviceHeartbeat {
  deviceId: string;
  timestamp: string;
  firmwareVersion: string;
  uptime: number;
  freeMemory?: number;
  signalStrength?: number;
  errorFlags?: string[];
}

export interface DeviceTelemetry {
  deviceId: string;
  timestamp: string;
  sensors: Record<string, number | null>;
  pumpState: string;
  valveStates: Record<string, string>;
  irrigationMode: string;
  errorFlags?: string[];
}
