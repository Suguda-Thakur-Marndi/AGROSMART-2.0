import { create } from 'zustand';
import {
  PumpStatus,
  IrrigationZoneConfig,
  IrrigationCommand,
  IrrigationEvent,
} from '../types';
import { IRRIGATION_DEFAULTS } from '../constants';

interface IrrigationState {
  pumpStatus: PumpStatus | null;
  vegetableConfig: IrrigationZoneConfig;
  paddyConfig: IrrigationZoneConfig;
  recentCommands: IrrigationCommand[];
  recentEvents: IrrigationEvent[];
  pendingCommand: IrrigationCommand | null;

  setPumpStatus: (status: PumpStatus) => void;
  setVegetableConfig: (config: Partial<IrrigationZoneConfig>) => void;
  setPaddyConfig: (config: Partial<IrrigationZoneConfig>) => void;
  addCommand: (command: IrrigationCommand) => void;
  updateCommandStatus: (commandId: string, update: Partial<IrrigationCommand>) => void;
  addEvent: (event: IrrigationEvent) => void;
  setPendingCommand: (command: IrrigationCommand | null) => void;
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
}));
