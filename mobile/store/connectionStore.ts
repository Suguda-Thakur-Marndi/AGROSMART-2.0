import { create } from 'zustand';
import {
  ConnectionType,
  ConnectionState,
  ConnectionStatusInfo,
  WifiNetwork,
  WifiConfig,
  BluetoothDevice,
} from '../types/connection';
import { connectionManager } from '../services/connection/ConnectionManager';

interface ConnectionStoreState {
  connectionType: ConnectionType;
  connectionState: ConnectionState;
  statusInfo: ConnectionStatusInfo;
  wifiConfig: WifiConfig;
  selectedBluetoothDevice: BluetoothDevice | null;
  availableWifiNetworks: WifiNetwork[];
  availableBluetoothDevices: BluetoothDevice[];
  isScanning: boolean;
  errorMessage: string | null;

  // Actions
  setWifiConfig: (config: Partial<WifiConfig>) => void;
  setSelectedBluetoothDevice: (device: BluetoothDevice | null) => void;
  scanWifi: () => Promise<WifiNetwork[]>;
  scanBluetooth: () => Promise<BluetoothDevice[]>;
  connectWifi: (config?: WifiConfig) => Promise<boolean>;
  connectBluetooth: (device?: BluetoothDevice) => Promise<boolean>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<boolean>;
}

export const useConnectionStore = create<ConnectionStoreState>((set, get) => {
  // Subscribe to connectionManager status updates
  connectionManager.onStatusChange((status) => {
    set({
      connectionType: status.type,
      connectionState: status.state,
      statusInfo: status,
      errorMessage: status.error || null,
    });
  });

  return {
    connectionType: 'none',
    connectionState: 'NOT_CONNECTED',
    statusInfo: connectionManager.getStatus(),
    wifiConfig: {
      ssid: 'AgroSmart_Farm_AP',
      ipAddress: '192.168.0.200',
      port: 8000,
      signalRssi: -58,
    },
    selectedBluetoothDevice: null,
    availableWifiNetworks: [],
    availableBluetoothDevices: [],
    isScanning: false,
    errorMessage: null,

    setWifiConfig: (config) => {
      set((state) => ({
        wifiConfig: { ...state.wifiConfig, ...config },
      }));
    },

    setSelectedBluetoothDevice: (device) => {
      set({ selectedBluetoothDevice: device });
    },

    scanWifi: async () => {
      set({ isScanning: true, errorMessage: null });
      try {
        const networks = await connectionManager.scan('wifi');
        set({ availableWifiNetworks: networks, isScanning: false });
        return networks;
      } catch (err: any) {
        set({ isScanning: false, errorMessage: err.message });
        return [];
      }
    },

    scanBluetooth: async () => {
      set({ isScanning: true, errorMessage: null });
      try {
        const devices = await connectionManager.scan('bluetooth');
        set({ availableBluetoothDevices: devices, isScanning: false });
        return devices;
      } catch (err: any) {
        set({ isScanning: false, errorMessage: err.message });
        return [];
      }
    },

    connectWifi: async (config) => {
      const cfg = config || get().wifiConfig;
      set({ errorMessage: null });
      const success = await connectionManager.connect('wifi', cfg);
      if (!success) {
        set({ errorMessage: 'Failed to establish Wi-Fi handshake with controller.' });
      }
      return success;
    },

    connectBluetooth: async (device) => {
      const dev = device || get().selectedBluetoothDevice;
      set({ errorMessage: null });
      const success = await connectionManager.connect('bluetooth', dev);
      if (!success) {
        set({ errorMessage: 'Failed to pair or connect via Bluetooth.' });
      }
      return success;
    },

    disconnect: async () => {
      await connectionManager.disconnect();
      set({ errorMessage: null });
    },

    reconnect: async () => {
      set({ errorMessage: null });
      return connectionManager.reconnect();
    },
  };
});
