export * from './sensor';
export * from './irrigation';
export * from './device';
export * from './water';
export * from './connection';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'irrigation';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  zoneId?: string;
  actionType?: string;
  actionPayload?: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  farmName: string;
  avatarUrl?: string;
  createdAt: string;
}
