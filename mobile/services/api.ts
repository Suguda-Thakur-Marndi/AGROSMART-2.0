/**
 * AgroSmart 2.0 — API Service Layer
 * Wraps all FastAPI backend calls using native fetch().
 * All functions handle offline/error gracefully (return null/[]).
 */

import { SensorReading } from '../types/sensor';

// Farm LAN IP
const devHostIp = '192.168.0.200';

export const API_BASE = `http://${devHostIp}:8000/api/v1`;
export const WS_BASE = `ws://${devHostIp}:8000/ws`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function safeGet<T>(url: string, token: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { headers: authHeaders(token) });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string,
): Promise<{ access_token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Login failed: ${err}`);
  }
  return res.json() as Promise<{ access_token: string }>;
}

export async function registerUser(
  email: string,
  password: string,
  full_name: string,
): Promise<{ id: string; email: string }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Register failed: ${err}`);
  }
  return res.json() as Promise<{ id: string; email: string }>;
}

// ─── Telemetry ────────────────────────────────────────────────────────────────

export async function fetchLatestReading(
  deviceId: string,
  token: string,
): Promise<SensorReading | null> {
  return safeGet<SensorReading | null>(
    `${API_BASE}/telemetry/latest/${encodeURIComponent(deviceId)}`,
    token,
    null,
  );
}

export async function fetchSensorHistory(
  deviceId: string,
  token: string,
  hours: number = 24,
): Promise<SensorReading[]> {
  return safeGet<SensorReading[]>(
    `${API_BASE}/telemetry/history/${encodeURIComponent(deviceId)}?hours=${hours}`,
    token,
    [],
  );
}

// ─── Irrigation ───────────────────────────────────────────────────────────────

export async function sendIrrigationCommand(
  deviceId: string,
  command: string,
  payload: Record<string, unknown>,
  token: string,
): Promise<{ id: string; status: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/irrigation/command`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ device_id: deviceId, command, ...payload }),
    });
    if (!res.ok) return null;
    return res.json() as Promise<{ id: string; status: string }>;
  } catch {
    return null;
  }
}

export async function fetchIrrigationSessions(
  deviceId: string,
  token: string,
): Promise<unknown[]> {
  return safeGet<unknown[]>(
    `${API_BASE}/irrigation/sessions/${encodeURIComponent(deviceId)}`,
    token,
    [],
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function fetchWaterSummary(
  deviceId: string,
  token: string,
): Promise<Record<string, unknown> | null> {
  return safeGet<Record<string, unknown> | null>(
    `${API_BASE}/analytics/water-summary/${encodeURIComponent(deviceId)}`,
    token,
    null,
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotifications(token: string): Promise<unknown[]> {
  return safeGet<unknown[]>(`${API_BASE}/notifications`, token, []);
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: authHeaders(token),
    });
  } catch {
    // offline — ignore
  }
}
