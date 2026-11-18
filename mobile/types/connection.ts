/**
 * AgroSmart 2.0 – Connection Types & State Definitions
 * Supports Wi-Fi (ESP8266 AT UART) and Bluetooth (BLE / SPP Classic)
 */

export type ConnectionType = 'none' | 'wifi' | 'bluetooth';

export type ConnectionState =
  | 'NOT_CONNECTED'
  | 'SCANNING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'CONNECTION_FAILED'
  | 'RECONNECTING';

export interface WifiNetwork {
  ssid: string;
  rssi: number; // dBm e.g. -55
  isSecure: boolean;
  channel?: number;
}

export interface WifiConfig {
  ssid: string;
  password?: string;
  ipAddress?: string;
  port?: number;
  signalRssi?: number;
  gateway?: string;
}

export interface BluetoothDevice {
  id: string; // MAC address or UUID
  name: string;
  rssi: number; // dBm
  type: 'BLE' | 'CLASSIC';
  address?: string;
  isPaired?: boolean;
  serviceUuid?: string;
}

export interface ConnectionStatusInfo {
  type: ConnectionType;
  state: ConnectionState;
  label: string; // e.g. "Connected via Wi-Fi" or "Connected via Bluetooth"
  connectedDeviceName?: string;
  ipAddress?: string;
  signalStrength?: number; // RSSI dBm
  lastHandshake?: string;
  latencyMs?: number;
  error?: string | null;
  isDemoMode: boolean;
}

export interface CommandAck {
  success: boolean;
  commandId: string;
  action: string;
  timestamp: string;
  acknowledgedBy: ConnectionType;
  message?: string;
  executionTimeMs?: number;
}

export interface OutgoingIrrigationCommand {
  commandId: string;
  action: 'START' | 'STOP' | 'EMERGENCY_STOP' | 'SET_AUTO' | 'SET_MANUAL';
  zone?: 'vegetable' | 'paddy';
  durationSeconds?: number;
  timestamp: string;
  authToken?: string;
}
