/**
 * AgroSmart 2.0 — WebSocket Service
 * Wraps the native WebSocket with auto-reconnect and JSON parsing.
 */

import { WS_BASE } from './api';

const RECONNECT_DELAY_MS = 5000;

export class AgroSmartWebSocket {
  private deviceId: string;
  private onMessage: (data: unknown) => void;
  private onStatusChange: (connected: boolean) => void;

  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  constructor(
    deviceId: string,
    onMessage: (data: unknown) => void,
    onStatusChange: (connected: boolean) => void,
  ) {
    this.deviceId = deviceId;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
  }

  connect(): void {
    this.shouldReconnect = true;
    this._open();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this._clearTimer();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.onStatusChange(false);
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  private _open(): void {
    const url = `${WS_BASE}/${encodeURIComponent(this.deviceId)}`;

    try {
      const ws = new WebSocket(url);
      this.socket = ws;

      ws.onopen = () => {
        this.onStatusChange(true);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data: unknown = JSON.parse(event.data as string);
          this.onMessage(data);
        } catch {
          // non-JSON frame — ignore
        }
      };

      ws.onerror = () => {
        // onerror is always followed by onclose; handled there
      };

      ws.onclose = () => {
        this.socket = null;
        this.onStatusChange(false);
        if (this.shouldReconnect) {
          this._scheduleReconnect();
        }
      };
    } catch {
      // construction failed (bad URL etc.)
      this.onStatusChange(false);
      if (this.shouldReconnect) {
        this._scheduleReconnect();
      }
    }
  }

  private _scheduleReconnect(): void {
    this._clearTimer();
    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect) {
        this._open();
      }
    }, RECONNECT_DELAY_MS);
  }

  private _clearTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
