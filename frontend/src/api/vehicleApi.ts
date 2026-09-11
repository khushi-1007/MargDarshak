import { apiClient } from './client';
import { BackendVehicle, BackendImpactSummary } from './types';

export const vehicleApi = {
  async listVehicles(status?: string): Promise<BackendVehicle[]> {
    return apiClient.get<BackendVehicle[]>('/vehicles', status ? { status } : undefined);
  },

  async getVehicle(vehicleId: string): Promise<BackendVehicle> {
    return apiClient.get<BackendVehicle>(`/vehicles/${vehicleId}`);
  },

  async triggerBreakdown(
    vehicleId: string,
    reason = 'Alternator mechanical failure in transit',
    lat?: number,
    lng?: number
  ): Promise<BackendImpactSummary> {
    return apiClient.post<BackendImpactSummary>(`/vehicles/${vehicleId}/breakdown`, {
      reason,
      current_lat: lat,
      current_lng: lng,
    });
  },

  async restoreVehicle(vehicleId: string): Promise<BackendVehicle> {
    return apiClient.post<BackendVehicle>(`/vehicles/${vehicleId}/restore`);
  },

  async updateVehicle(vehicleId: string, data: Partial<BackendVehicle>): Promise<BackendVehicle> {
    return apiClient.patch<BackendVehicle>(`/vehicles/${vehicleId}`, data);
  },
};
