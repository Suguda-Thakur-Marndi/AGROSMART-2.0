import { create } from 'zustand';
import { DEMO_MODE_DEFAULT } from '../constants';
import { UserProfile, AppNotification } from '../types';

interface AppState {
  isDemoMode: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  notifications: AppNotification[];
  unreadCount: number;

  setDemoMode: (value: boolean) => void;
  setAuthenticated: (value: boolean, user?: UserProfile) => void;
  addNotification: (notification: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isDemoMode: DEMO_MODE_DEFAULT,
  isAuthenticated: false,
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
}));
