import { apiClient } from './client';
import { BackendRoute, BackendRouteStop } from './types';

export interface StopStatusUpdateParams {
  status: 'PENDING' | 'IN_TRANSIT' | 'ARRIVED' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  actual_arrival?: string;
  actual_departure?: string;
  actual_distance_km?: number;
  actual_cost?: number;
}

export const routeApi = {
  async listRoutes(status?: string, optimisationRunId?: string): Promise<BackendRoute[]> {
    return apiClient.get<BackendRoute[]>('/routes', {
      status,
      optimisation_run_id: optimisationRunId,
    });
  },

  async getRoute(routeId: string): Promise<BackendRoute> {
    return apiClient.get<BackendRoute>(`/routes/${routeId}`);
  },

  async getRouteVersions(routeId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/routes/${routeId}/versions`);
  },

  async updateStopStatus(stopId: string, params: StopStatusUpdateParams): Promise<BackendRouteStop> {
    return apiClient.patch<BackendRouteStop>(`/routes/stops/${stopId}`, params);
  },
};
