import { IConnectionProvider } from './types';
import { WifiConnectionProvider } from './WifiConnectionProvider';
import { BluetoothConnectionProvider } from './BluetoothConnectionProvider';
import {
  ConnectionType,
  ConnectionState,
  ConnectionStatusInfo,
  OutgoingIrrigationCommand,
  CommandAck,
} from '../../types/connection';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private wifiProvider: WifiConnectionProvider;
  private bluetoothProvider: BluetoothConnectionProvider;
  private activeType: ConnectionType = 'none';
  private statusListeners: Set<(status: ConnectionStatusInfo) => void> = new Set();
  private telemetryListeners: Set<(telemetry: any) => void> = new Set();

  private constructor() {
    this.wifiProvider = new WifiConnectionProvider();
    this.bluetoothProvider = new BluetoothConnectionProvider();

    this.wifiProvider.onStateChange((state) => this.handleProviderStateChange('wifi', state));
    this.bluetoothProvider.onStateChange((state) => this.handleProviderStateChange('bluetooth', state));

    this.wifiProvider.onTelemetry((data) => this.handleTelemetry('wifi', data));
    this.bluetoothProvider.onTelemetry((data) => this.handleTelemetry('bluetooth', data));
  }

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  getActiveType(): ConnectionType {
    return this.activeType;
  }

  getActiveProvider(): IConnectionProvider | null {
    if (this.activeType === 'wifi') return this.wifiProvider;
    if (this.activeType === 'bluetooth') return this.bluetoothProvider;
    return null;
  }

  getWifiProvider(): WifiConnectionProvider {
    return this.wifiProvider;
  }

  getBluetoothProvider(): BluetoothConnectionProvider {
    return this.bluetoothProvider;
  }

  async connect(type: ConnectionType, config?: any): Promise<boolean> {
    // Safety: Only one active connection controls the device at a time
    if (this.activeType !== 'none' && this.activeType !== type) {
      await this.disconnect();
    }

    this.activeType = type;
    this.notifyStatus();

    let success = false;
    if (type === 'wifi') {
      success = await this.wifiProvider.connect(config);
    } else if (type === 'bluetooth') {
      success = await this.bluetoothProvider.connect(config);
    }

    if (!success) {
      this.activeType = 'none';
    }
    this.notifyStatus();
    return success;
  }

  async disconnect(): Promise<void> {
    if (this.activeType === 'wifi') {
      await this.wifiProvider.disconnect();
    } else if (this.activeType === 'bluetooth') {
      await this.bluetoothProvider.disconnect();
    }
    this.activeType = 'none';
    this.notifyStatus();
  }

  async reconnect(): Promise<boolean> {
    if (this.activeType === 'wifi') {
      return this.wifiProvider.reconnect();
    } else if (this.activeType === 'bluetooth') {
      return this.bluetoothProvider.reconnect();
    }
    return false;
  }

  async scan(type: ConnectionType): Promise<any[]> {
    if (type === 'wifi') {
      return this.wifiProvider.scan();
    } else if (type === 'bluetooth') {
      return this.bluetoothProvider.scan();
    }
    return [];
  }

  async sendCommand(command: OutgoingIrrigationCommand): Promise<CommandAck> {
    const provider = this.getActiveProvider();
    if (!provider || provider.getState() !== 'CONNECTED') {
      throw new Error(`Device not connected. Active transport is ${this.activeType.toUpperCase()}.`);
    }
    return provider.sendCommand(command);
  }

  getStatus(): ConnectionStatusInfo {
    const provider = this.getActiveProvider();
    const state: ConnectionState = provider ? provider.getState() : 'NOT_CONNECTED';

    let label = 'Not Connected';
    if (state === 'CONNECTED') {
      label = this.activeType === 'wifi' ? 'Connected via Wi-Fi' : 'Connected via Bluetooth';
    } else if (state === 'CONNECTING') {
      label = `Connecting via ${this.activeType === 'wifi' ? 'Wi-Fi' : 'Bluetooth'}...`;
    } else if (state === 'SCANNING') {
      label = `Scanning for ${this.activeType === 'wifi' ? 'Wi-Fi' : 'Bluetooth'}...`;
    } else if (state === 'RECONNECTING') {
      label = `Reconnecting via ${this.activeType === 'wifi' ? 'Wi-Fi' : 'Bluetooth'}...`;
    } else if (state === 'CONNECTION_FAILED') {
      label = 'Connection Failed';
    }

    const details = provider ? provider.getConnectionDetails() : {};

    return {
      type: this.activeType,
      state,
      label,
      connectedDeviceName: details.device?.name || (this.activeType === 'wifi' ? details.ssid : undefined),
      ipAddress: details.ipAddress,
      signalStrength: details.rssi || details.device?.rssi,
      lastHandshake: state === 'CONNECTED' ? new Date().toISOString() : undefined,
      isDemoMode: false,
    };
  }

  onStatusChange(callback: (status: ConnectionStatusInfo) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.getStatus());
    return () => this.statusListeners.delete(callback);
  }

  onTelemetry(callback: (telemetry: any) => void): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  private handleProviderStateChange(type: ConnectionType, _state: ConnectionState) {
    if (this.activeType === type) {
      this.notifyStatus();
    }
  }

  private handleTelemetry(type: ConnectionType, data: any) {
    if (this.activeType === type) {
      this.telemetryListeners.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error('ConnectionManager telemetry listener error:', e);
        }
      });
    }
  }

  private notifyStatus() {
    const status = this.getStatus();
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (e) {
        console.error('ConnectionManager status listener error:', e);
      }
    });
  }
}

export const connectionManager = ConnectionManager.getInstance();
