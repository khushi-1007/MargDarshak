import { apiClient } from './client';
import { BackendDriver } from './types';

export const driverApi = {
  async listDrivers(status?: string): Promise<BackendDriver[]> {
    return apiClient.get<BackendDriver[]>('/drivers', status ? { status } : undefined);
  },

  async getDriver(driverId: string): Promise<BackendDriver> {
    return apiClient.get<BackendDriver>(`/drivers/${driverId}`);
  },

  async updateDriver(driverId: string, data: Partial<BackendDriver>): Promise<BackendDriver> {
    return apiClient.patch<BackendDriver>(`/drivers/${driverId}`, data);
  },
};
