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
      const now = new Date().toISOString();

      // Normalize vegetable zone telemetry
      const vz = sensorState.vegetableZone || {
        zoneId: 'vegetable' as const,
        zoneName: 'Plot A: Vegetable Field',
        soilMoisture: null,
        ph: null,
        soilTemperature: null,
        airTemperature: null,
        airHumidity: null,
        lastUpdated: now,
        dataSource: 'live' as const,
      };

      const updatedVz = { ...vz, lastUpdated: now, dataSource: 'live' as const };

      if (data.soilMoistureVeg !== undefined && data.soilMoistureVeg !== null) {
        const isOffline = data.soilMoistureVeg < 0;
        updatedVz.soilMoisture = {
          id: 'sensor-soil-veg-01',
          deviceId: 'agrosmart-mega-01',
          zoneId: 'vegetable',
          sensorType: 'soil_moisture',
          value: isOffline ? 0 : data.soilMoistureVeg,
          unit: '%',
          status: isOffline ? 'offline' : 'online',
          dataSource: 'live',
          timestamp: now,
          isValid: !isOffline,
          calibrated: true,
        };
      }

      if (data.ph !== undefined && data.ph !== null) {
        const isOffline = data.ph < 0;
        updatedVz.ph = {
          id: 'sensor-ph-01',
          deviceId: 'agrosmart-mega-01',
          zoneId: 'vegetable',
          sensorType: 'ph',
          value: isOffline ? 0 : data.ph,
          unit: 'pH',
          status: isOffline ? 'offline' : 'online',
          dataSource: 'live',
          timestamp: now,
          isValid: !isOffline,
          calibrated: true,
        };
      }

      if (data.temperatureSoil !== undefined && data.temperatureSoil !== null) {
        const isOffline = data.temperatureSoil < -50;
        updatedVz.soilTemperature = {
          id: 'sensor-temp-soil-01',
          deviceId: 'agrosmart-mega-01',
          zoneId: 'vegetable',
          sensorType: 'soil_temperature',
          value: isOffline ? 0 : data.temperatureSoil,
          unit: '°C',
          status: isOffline ? 'offline' : 'online',
          dataSource: 'live',
          timestamp: now,
          isValid: !isOffline,
        };
      }

      if (data.temperatureCanopy !== undefined && data.temperatureCanopy !== null) {
        const isOffline = data.temperatureCanopy < -50;
        updatedVz.airTemperature = {
          id: 'sensor-temp-air-01',
          deviceId: 'agrosmart-mega-01',
          zoneId: 'vegetable',
          sensorType: 'air_temperature',
          value: isOffline ? 0 : data.temperatureCanopy,
          unit: '°C',
          status: isOffline ? 'offline' : 'online',
          dataSource: 'live',
          timestamp: now,
          isValid: !isOffline,
        };
      }

      if (data.humidity !== undefined && data.humidity !== null) {
        const isOffline = data.humidity < 0;
        updatedVz.airHumidity = {
          id: 'sensor-hum-air-01',
          deviceId: 'agrosmart-mega-01',
          zoneId: 'vegetable',
          sensorType: 'air_humidity',
          value: isOffline ? 0 : data.humidity,
          unit: '%',
          status: isOffline ? 'offline' : 'online',
          dataSource: 'live',
          timestamp: now,
          isValid: !isOffline,
        };
      }

      sensorState.setVegetableZone(updatedVz);

      // Normalize paddy zone telemetry (supports single-sensor or dual-sensor setup)
      const pz = sensorState.paddyZone || {
        zoneId: 'paddy' as const,
        zoneName: 'Plot B: Lowland Paddy Field',
        soilMoisture: null,
        ph: null,
        soilTemperature: null,
        airTemperature: null,
        airHumidity: null,
        lastUpdated: now,
        dataSource: 'live' as const,
      };

      const updatedPz = { ...pz, lastUpdated: now, dataSource: 'live' as const };

      if (data.soilMoisturePaddy !== undefined && data.soilMoisturePaddy !== null && data.soilMoisturePaddy >= 0) {
        updatedPz.soilMoisture = {
          id: 'sensor-soil-paddy-01',
          deviceId: 'agrosmart-mega-01',
          zoneId: 'paddy',
          sensorType: 'soil_moisture',
          value: data.soilMoisturePaddy,
          unit: '%',
          status: 'online',
          dataSource: 'live',
          timestamp: now,
          isValid: true,
          calibrated: true,
        };
      } else {
        // Physical sensor not connected or single-sensor setup
        updatedPz.soilMoisture = null;
      }

      // Shared environment sensors for paddy
      updatedPz.ph = updatedVz.ph;
      updatedPz.soilTemperature = updatedVz.soilTemperature;
      updatedPz.airTemperature = updatedVz.airTemperature;
      updatedPz.airHumidity = updatedVz.airHumidity;

      sensorState.setPaddyZone(updatedPz);
      sensorState.updateLastUpdated();

      // Push real-time notification alerts if thresholds exceeded
      import('../../store/appStore').then(({ useAppStore }) => {
        const appState = useAppStore.getState();
        if (data.soilMoistureVeg !== undefined && data.soilMoistureVeg >= 0 && data.soilMoistureVeg < 35) {
          appState.addNotification({
            id: `alert_moist_veg_${Date.now()}`,
            type: 'warning',
            title: 'Low Soil Moisture (Vegetable)',
            body: `Plot A moisture is ${data.soilMoistureVeg.toFixed(1)}% (below 35% threshold).`,
            timestamp: now,
            read: false,
            zoneId: 'vegetable',
          });
        }
        if (data.ph !== undefined && data.ph > 0 && (data.ph < 5.5 || data.ph > 7.5)) {
          appState.addNotification({
            id: `alert_ph_${Date.now()}`,
            type: 'warning',
            title: 'Soil pH Anomaly',
            body: `Soil pH measured ${data.ph.toFixed(2)} (outside optimal 5.5–7.5 range).`,
            timestamp: now,
            read: false,
          });
        }
      }).catch(() => {});

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
