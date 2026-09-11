import { apiClient } from './client';
import { BackendEvent, BackendImpactSummary } from './types';

export interface CreateEventParams {
  type: 'TRAFFIC' | 'WEATHER' | 'ROAD_CLOSURE' | 'VEHICLE_BREAKDOWN' | 'CASCADING_BREAKDOWN' | 'PRIORITY_ORDER' | 'VEHICLE_UNAVAILABLE' | 'OTHER';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  location_lat?: number;
  location_lng?: number;
  radius_km?: number;
  vehicle_id?: string;
  order_id?: string;
  metadata?: Record<string, any>;
}

export interface SimulateEventParams {
  type: string;
  title?: string;
  description?: string;
  vehicle_id?: string;
  order_id?: string;
  new_order?: any;
  location_lat?: number;
  location_lng?: number;
  radius_km?: number;
  delay_factor?: number;
  road_closed_segment?: string;
}

export const eventApi = {
  async listEvents(params?: { status?: string; type?: string; limit?: number }): Promise<BackendEvent[]> {
    return apiClient.get<BackendEvent[]>('/events', params);
  },

  async getEvent(eventId: string): Promise<BackendEvent> {
    return apiClient.get<BackendEvent>(`/events/${eventId}`);
  },

  async createEvent(params: CreateEventParams): Promise<BackendEvent> {
    return apiClient.post<BackendEvent>('/events', params);
  },

  async simulateEvent(params: SimulateEventParams): Promise<BackendImpactSummary> {
    return apiClient.post<BackendImpactSummary>('/events/simulate', params);
  },

  async getCurrentWeather(lat = 26.9124, lng = 75.7873): Promise<{
    temperature_c: number;
    condition: string;
    description: string;
    wind_speed_kmh: number;
    humidity_pct: number;
    precipitation_mm: number;
    road_condition: string;
    delay_multiplier: number;
  }> {
    return apiClient.get('/events/weather/current', { lat, lng });
  },
};
