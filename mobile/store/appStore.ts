import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_MODE_DEFAULT } from '../constants';
import { UserProfile, AppNotification } from '../types';
import { loginUser } from '../services/api';

const TOKEN_KEY = '@agrosmart:token';
const DEFAULT_DEVICE_ID = 'agrosmart-mega-001';

interface AppState {
  isDemoMode: boolean;
  isAuthenticated: boolean;
  token: string | null;
  deviceId: string;
  user: UserProfile | null;
  notifications: AppNotification[];
  unreadCount: number;

  setDemoMode: (value: boolean) => void;
  setAuthenticated: (value: boolean, user?: UserProfile) => void;
  addNotification: (notification: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;

  /** Sign in: calls backend, persists token in AsyncStorage */
  login: (email: string, password: string) => Promise<void>;

  /** Sign out: clears token from memory and AsyncStorage */
  logout: () => Promise<void>;

  /** Load persisted token on app startup */
  checkAuth: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  isDemoMode: DEMO_MODE_DEFAULT,
  isAuthenticated: false,
  token: null,
  deviceId: DEFAULT_DEVICE_ID,
  user: null,
  notifications: [],
  unreadCount: 0,

  setDemoMode: (value) => set({ isDemoMode: value }),

  setAuthenticated: (value, user) =>
    set({ isAuthenticated: value, user: user ?? null }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 100),
      unreadCount: state.unreadCount + 1,
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

  login: async (email, password) => {
    const { access_token } = await loginUser(email, password);
    await AsyncStorage.setItem(TOKEN_KEY, access_token);
    set({ token: access_token, isAuthenticated: true, isDemoMode: false });
  },

  logout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    set({ token: null, isAuthenticated: false, user: null, isDemoMode: true });
  },

  checkAuth: async () => {
    try {
      const stored = await AsyncStorage.getItem(TOKEN_KEY);
      if (stored) {
        set({ token: stored, isAuthenticated: true, isDemoMode: false });
      }
    } catch {
      // AsyncStorage unavailable — stay in demo mode
    }
  },
}));
