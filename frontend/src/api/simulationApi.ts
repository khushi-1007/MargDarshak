import { apiClient } from './client';
import { BackendSimulationResponse } from './types';

export interface SimulationParams {
  scenario_name: string;
  scenario_type: string;
  removed_vehicle_id?: string;
  new_vehicle_capacity_kg?: number;
  new_priority_order?: any;
  road_closure_lat?: number;
  road_closure_lng?: number;
  road_closure_radius_km?: number;
  reduced_driver_hours?: number;
  delivery_window_change?: Record<string, string>;
}

export const simulationApi = {
  async runWhatIfSimulation(params: SimulationParams): Promise<BackendSimulationResponse> {
    return apiClient.post<BackendSimulationResponse>('/simulation', params);
  },
};
