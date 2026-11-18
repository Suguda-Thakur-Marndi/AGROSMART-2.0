import { connectionManager, ConnectionManager } from './ConnectionManager';
import {
  ConnectionType,
  OutgoingIrrigationCommand,
  CommandAck,
} from '../../types/connection';
import { useSensorStore } from '../../store/sensorStore';
import { useIrrigationStore } from '../../store/irrigationStore';

export class DeviceCommunicationService {
  private static instance: DeviceCommunicationService;
  private manager: ConnectionManager;

  private constructor() {
    this.manager = connectionManager;

    // Pipe live telemetry into sensorStore and irrigationStore
    this.manager.onTelemetry((telemetry) => {
      this.handleIncomingTelemetry(telemetry);
    });
  }

  static getInstance(): DeviceCommunicationService {
    if (!DeviceCommunicationService.instance) {
      DeviceCommunicationService.instance = new DeviceCommunicationService();
    }
    return DeviceCommunicationService.instance;
  }

  async setConnection(type: ConnectionType, config?: any): Promise<boolean> {
    return this.manager.connect(type, config);
  }

  async disconnect(): Promise<void> {
    return this.manager.disconnect();
  }

  async reconnect(): Promise<boolean> {
    return this.manager.reconnect();
  }

  async startIrrigation(zone: 'vegetable' | 'paddy', durationSeconds: number): Promise<CommandAck> {
    const cmd: OutgoingIrrigationCommand = {
      commandId: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      action: 'START',
      zone,
      durationSeconds,
      timestamp: new Date().toISOString(),
    };
    return this.manager.sendCommand(cmd);
  }

  async stopIrrigation(zone?: 'vegetable' | 'paddy'): Promise<CommandAck> {
    const cmd: OutgoingIrrigationCommand = {
      commandId: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      action: 'STOP',
      zone,
      timestamp: new Date().toISOString(),
    };
    return this.manager.sendCommand(cmd);
  }

  async emergencyStop(): Promise<CommandAck> {
    const cmd: OutgoingIrrigationCommand = {
      commandId: `emerg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      action: 'EMERGENCY_STOP',
      timestamp: new Date().toISOString(),
    };
    return this.manager.sendCommand(cmd);
  }

  private handleIncomingTelemetry(data: any) {
    try {
      const sensorState = useSensorStore.getState();
      const irrigationState = useIrrigationStore.getState();

      if (sensorState.vegetableZone) {
        const vz = sensorState.vegetableZone;
        const updatedVz = { ...vz, lastUpdated: new Date().toISOString() };
        if (vz.soilMoisture && data.soilMoistureVeg !== undefined) {
          updatedVz.soilMoisture = { ...vz.soilMoisture, value: data.soilMoistureVeg } as any;
        }
        if (vz.ph && data.ph !== undefined) {
          updatedVz.ph = { ...vz.ph, value: data.ph } as any;
        }
        if (vz.soilTemperature && data.temperatureSoil !== undefined) {
          updatedVz.soilTemperature = { ...vz.soilTemperature, value: data.temperatureSoil } as any;
        }
        if (vz.airTemperature && data.temperatureCanopy !== undefined) {
          updatedVz.airTemperature = { ...vz.airTemperature, value: data.temperatureCanopy } as any;
        }
        if (vz.airHumidity && data.humidity !== undefined) {
          updatedVz.airHumidity = { ...vz.airHumidity, value: data.humidity } as any;
        }
        sensorState.setVegetableZone(updatedVz);
      }

      if (sensorState.paddyZone && sensorState.paddyZone.soilMoisture && data.soilMoisturePaddy !== undefined) {
        const pz = sensorState.paddyZone;
        sensorState.setPaddyZone({
          ...pz,
          soilMoisture: {
            ...pz.soilMoisture,
            value: data.soilMoisturePaddy,
          } as any,
          lastUpdated: new Date().toISOString(),
        });
      }

      if (data.pumpState && irrigationState.setPumpStatus) {
        irrigationState.setPumpStatus({
          state: data.pumpState === 'ON' ? 'ON' : 'OFF',
          mode: 'AUTO',
          activeZone: data.activeZone === 'VEGETABLE' ? 'vegetable' : data.activeZone === 'PADDY' ? 'paddy' : null,
          valveVegetable: data.activeZone === 'VEGETABLE' ? 'OPEN' : 'CLOSED',
          valvePaddy: data.activeZone === 'PADDY' ? 'OPEN' : 'CLOSED',
          currentRunDurationSeconds: 0,
          dailyRuntimeSeconds: irrigationState.pumpStatus?.dailyRuntimeSeconds ?? 0,
          lastStartTime: null,
          lastStopTime: null,
          dataSource: 'live',
          reportedByDevice: true,
          voltageConfig: '12V DC (1A)',
          sharedPipeMode: false,
        });
      }
    } catch (e) {
      console.error('Error handling incoming telemetry in stores:', e);
    }
  }
}

export const deviceCommunicationService = DeviceCommunicationService.getInstance();
