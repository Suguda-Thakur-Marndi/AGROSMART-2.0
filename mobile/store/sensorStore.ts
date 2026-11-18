import { create } from 'zustand';
import { ZoneSensorData, DeviceInfo, DeviceConnectionStatus } from '../types';
import { fetchLatestReading } from '../services/api';
import { AgroSmartWebSocket } from '../services/websocket';

interface SensorState {
  vegetableZone: ZoneSensorData | null;
  paddyZone: ZoneSensorData | null;
  device: DeviceInfo | null;
  lastUpdated: string | null;
  isPolling: boolean;
  error: string | null;
  isDemo: boolean;

  setVegetableZone: (data: ZoneSensorData) => void;
  setPaddyZone: (data: ZoneSensorData) => void;
  setDevice: (device: DeviceInfo) => void;
  setDeviceStatus: (status: DeviceConnectionStatus) => void;
  setPolling: (value: boolean) => void;
  setError: (error: string | null) => void;
  updateLastUpdated: () => void;

  /** Fetch latest telemetry from backend; falls back to demo on failure */
  fetchLatest: (deviceId: string, token: string) => Promise<void>;

  /** Open a WebSocket for live telemetry updates */
  startWebSocket: (deviceId: string) => void;

  /** Close the active WebSocket */
  stopWebSocket: () => void;
}

let _ws: AgroSmartWebSocket | null = null;

export const useSensorStore = create<SensorState>((set, get) => ({
  vegetableZone: null,
  paddyZone: null,
  device: null,
  lastUpdated: null,
  isPolling: false,
  error: null,
  isDemo: false,

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

  fetchLatest: async (deviceId, token) => {
    try {
      const reading = await fetchLatestReading(deviceId, token);
      if (reading) {
        set({ error: null, isDemo: false, lastUpdated: new Date().toISOString() });
      } else {
        // In LIVE mode: do NOT silently fallback to demo data
        set({ error: 'Hardware offline or no telemetry ingested yet' });
      }
    } catch {
      set({ error: 'Cannot connect to hardware or backend API' });
    }
  },

  startWebSocket: (deviceId) => {
    if (_ws) {
      _ws.disconnect();
    }
    _ws = new AgroSmartWebSocket(
      deviceId,
      (data) => {
        set({ lastUpdated: new Date().toISOString(), isDemo: false, error: null });
        void data;
      },
      (connected) => {
        if (!connected) {
          set({ error: 'WebSocket disconnected from live telemetry feed' });
        }
      },
    );
    _ws.connect();
  },

  stopWebSocket: () => {
    if (_ws) {
      _ws.disconnect();
      _ws = null;
    }
  },
}));
