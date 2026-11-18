import {
  ConnectionType,
  ConnectionState,
  OutgoingIrrigationCommand,
  CommandAck,
} from '../../types/connection';

export interface IConnectionProvider {
  getType(): ConnectionType;
  getState(): ConnectionState;
  connect(config?: Record<string, any>): Promise<boolean>;
  disconnect(): Promise<void>;
  reconnect(): Promise<boolean>;
  scan(): Promise<any[]>;
  sendCommand(command: OutgoingIrrigationCommand): Promise<CommandAck>;
  onTelemetry(callback: (telemetry: any) => void): () => void;
  onStateChange(callback: (state: ConnectionState) => void): () => void;
  getSignalStrength(): Promise<number | undefined>;
  getConnectionDetails(): Record<string, any>;
  isHardwareAvailable(): boolean;
}
