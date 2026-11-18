import { create } from 'zustand';
import { ZoneSensorData, DeviceInfo, DeviceConnectionStatus } from '../types';

interface SensorState {
  vegetableZone: ZoneSensorData | null;
  paddyZone: ZoneSensorData | null;
  device: DeviceInfo | null;
  lastUpdated: string | null;
  isPolling: boolean;
  error: string | null;

  setVegetableZone: (data: ZoneSensorData) => void;
  setPaddyZone: (data: ZoneSensorData) => void;
  setDevice: (device: DeviceInfo) => void;
  setDeviceStatus: (status: DeviceConnectionStatus) => void;
  setPolling: (value: boolean) => void;
  setError: (error: string | null) => void;
  updateLastUpdated: () => void;
}

export const useSensorStore = create<SensorState>((set) => ({
  vegetableZone: null,
  paddyZone: null,
  device: null,
  lastUpdated: null,
  isPolling: false,
  error: null,

  setVegetableZone: (data) => set({ vegetableZone: data }),
  setPaddyZone: (data) => set({ paddyZone: data }),
  setDevice: (device) => set({ device }),
  setDeviceStatus: (status) =>
    set((state) => ({
      device: state.device ? { ...state.device, connectionStatus: status } : null,
    })),
  setPolling: (value) => set({ isPolling: value }),
  setError: (error) => set({ error }),
  updateLastUpdated: () => set({ lastUpdated: new Date().toISOString() }),
}));
