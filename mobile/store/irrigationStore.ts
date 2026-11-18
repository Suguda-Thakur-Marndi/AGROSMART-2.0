import { create } from 'zustand';
import {
  PumpStatus,
  IrrigationZoneConfig,
  IrrigationCommand,
  IrrigationEvent,
} from '../types';
import { IRRIGATION_DEFAULTS } from '../constants';
import { sendIrrigationCommand, fetchIrrigationSessions } from '../services/api';

interface IrrigationState {
  pumpStatus: PumpStatus | null;
  vegetableConfig: IrrigationZoneConfig;
  paddyConfig: IrrigationZoneConfig;
  recentCommands: IrrigationCommand[];
  recentEvents: IrrigationEvent[];
  pendingCommand: IrrigationCommand | null;
  sessions: unknown[];

  setPumpStatus: (status: PumpStatus) => void;
  setVegetableConfig: (config: Partial<IrrigationZoneConfig>) => void;
  setPaddyConfig: (config: Partial<IrrigationZoneConfig>) => void;
  addCommand: (command: IrrigationCommand) => void;
  updateCommandStatus: (commandId: string, update: Partial<IrrigationCommand>) => void;
  addEvent: (event: IrrigationEvent) => void;
  setPendingCommand: (command: IrrigationCommand | null) => void;

  /** Send an irrigation command to the backend */
  sendCommand: (
    deviceId: string,
    command: string,
    payload: Record<string, unknown>,
    token: string,
  ) => Promise<{ id: string; status: string } | null>;

  /** Fetch past irrigation sessions from the backend */
  fetchSessions: (deviceId: string, token: string) => Promise<void>;
}

const defaultVegetableConfig: IrrigationZoneConfig = {
  zoneId: 'vegetable',
  ...IRRIGATION_DEFAULTS.vegetable,
  isEnabled: true,
};

const defaultPaddyConfig: IrrigationZoneConfig = {
  zoneId: 'paddy',
  ...IRRIGATION_DEFAULTS.paddy,
  isEnabled: true,
};

export const useIrrigationStore = create<IrrigationState>((set) => ({
  pumpStatus: null,
  vegetableConfig: defaultVegetableConfig,
  paddyConfig: defaultPaddyConfig,
  recentCommands: [],
  recentEvents: [],
  pendingCommand: null,
  sessions: [],

  setPumpStatus: (status) => set({ pumpStatus: status }),

  setVegetableConfig: (config) =>
    set((state) => ({ vegetableConfig: { ...state.vegetableConfig, ...config } })),

  setPaddyConfig: (config) =>
    set((state) => ({ paddyConfig: { ...state.paddyConfig, ...config } })),

  addCommand: (command) =>
    set((state) => ({
      recentCommands: [command, ...state.recentCommands].slice(0, 50),
    })),

  updateCommandStatus: (commandId, update) =>
    set((state) => ({
      recentCommands: state.recentCommands.map((c) =>
        c.commandId === commandId ? { ...c, ...update } : c,
      ),
    })),

  addEvent: (event) =>
    set((state) => ({
      recentEvents: [event, ...state.recentEvents].slice(0, 100),
    })),

  setPendingCommand: (command) => set({ pendingCommand: command }),

  sendCommand: async (deviceId, command, payload, token) => {
    const result = await sendIrrigationCommand(deviceId, command, payload, token);
    return result;
  },

  fetchSessions: async (deviceId, token) => {
    const sessions = await fetchIrrigationSessions(deviceId, token);
    set({ sessions });
  },
}));
