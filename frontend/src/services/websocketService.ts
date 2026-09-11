/**
 * Robust Centralized WebSocket Service for MargDarshak Real-Time Operational Fleet Stream.
 * Handles auto-reconnect, exponential backoff, ping/pong heartbeats, error recovery,
 * and event subscription.
 */

export type WebSocketStatus = 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';

export interface FleetWebSocketMessage<T = any> {
  type: string;
  timestamp: string;
  data: T;
}

type MessageHandler = (message: FleetWebSocketMessage) => void;
type StatusHandler = (status: WebSocketStatus) => void;

class FleetWebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private status: WebSocketStatus = 'OFFLINE';
  private reconnectAttempts = 0;
  private maxReconnectDelay = 10000;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private statusListeners: Set<StatusHandler> = new Set();
  private intentionalClose = false;

  constructor() {
    const wsEnv = ((import.meta as any).env?.VITE_WS_URL as string) || '';
    if (wsEnv) {
      this.url = wsEnv;
    } else {
      const apiEnv = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:8000';
      const parsed = new URL(apiEnv);
      const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      this.url = `${protocol}//${parsed.host}/ws/fleet`;
    }
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.intentionalClose = false;
    this.setStatus('RECONNECTING');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('CONNECTED');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        if (event.data === 'pong') {
          return;
        }

        try {
          const parsed = JSON.parse(event.data);
          const type = parsed.type;
          if (type) {
            // Notify specific listeners
            const specific = this.listeners.get(type);
            if (specific) {
              specific.forEach((cb) => cb(parsed));
            }
            // Notify wildcard listeners
            const wildcard = this.listeners.get('*');
            if (wildcard) {
              wildcard.forEach((cb) => cb(parsed));
            }
          }
        } catch {
          // Ignore malformed or raw text messages
        }
      };

      this.ws.onerror = () => {
        // Will trigger onclose and schedule reconnect
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.ws = null;
        if (!this.intentionalClose) {
          this.setStatus('RECONNECTING');
          this.scheduleReconnect();
        } else {
          this.setStatus('OFFLINE');
        }
      };
    } catch {
      this.setStatus('RECONNECTING');
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.intentionalClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('OFFLINE');
  }

  private setStatus(newStatus: WebSocketStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((fn) => fn(newStatus));
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  on(eventType: string, callback: MessageHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return un-subscribe function
    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
      }
    };
  }

  onStatusChange(callback: StatusHandler): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }
}

export const fleetWebSocket = new FleetWebSocketService();
