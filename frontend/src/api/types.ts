/**
 * Backend FastAPI Pydantic schema representations matching backend models.
 */

export interface BackendVehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  capacity_kg: number;
  current_load_kg: number;
  fuel_type: string;
  cost_per_km: number;
  fuel_cost_per_km: number;
  toll_factor: number;
  overtime_cost_per_minute: number;
  driver_id?: string | null;
  status: 'AVAILABLE' | 'ASSIGNED' | 'ON_ROUTE' | 'BREAKDOWN' | 'UNAVAILABLE';
  current_lat?: number | null;
  current_lng?: number | null;
  available_from?: string | null;
  available_until?: string | null;
  organization_id?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface BackendDriver {
  id: string;
  name: string;
  phone: string;
  max_work_hours: number;
  hours_remaining: number;
  status: 'AVAILABLE' | 'ON_DUTY' | 'OFF_DUTY' | 'RESTING';
  current_lat?: number | null;
  current_lng?: number | null;
  user_id?: string | null;
  organization_id?: string | null;
  created_at: string;
}

export interface BackendOrder {
  id: string;
  external_order_id: string;
  customer_name: string;
  customer_phone: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  delivery_lat: number;
  delivery_lng: number;
  delivery_address: string;
  weight_kg: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  window_start: string;
  window_end: string;
  service_duration_minutes: number;
  required_vehicle_type?: string | null;
  assigned_vehicle_id?: string | null;
  assigned_route_id?: string | null;
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'AT_RISK' | 'CANCELLED';
  created_at: string;
  updated_at?: string | null;
}

export interface BackendRouteStop {
  id: string;
  route_id: string;
  order_id?: string | null;
  stop_sequence: number;
  planned_arrival: string;
  planned_departure: string;
  estimated_wait_minutes: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'ARRIVED' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  distance_from_prev_km: number;
  duration_from_prev_minutes: number;
  actual_arrival?: string | null;
  actual_departure?: string | null;
}

export interface BackendRoute {
  id: string;
  optimisation_run_id?: string | null;
  vehicle_id: string;
  date: string;
  status: 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  total_distance_km: number;
  total_duration_minutes: number;
  total_cost: number;
  expected_fuel_cost: number;
  expected_toll_cost: number;
  expected_overtime_cost: number;
  late_delivery_penalty: number;
  stops: BackendRouteStop[];
  polyline_geometry?: string | null;
  created_at: string;
}

export interface BackendEvent {
  id: string;
  type: 'TRAFFIC' | 'WEATHER' | 'ROAD_CLOSURE' | 'VEHICLE_BREAKDOWN' | 'CASCADING_BREAKDOWN' | 'PRIORITY_ORDER' | 'VEHICLE_UNAVAILABLE' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  location_lat?: number | null;
  location_lng?: number | null;
  radius_km?: number | null;
  vehicle_id?: string | null;
  order_id?: string | null;
  affected_route_id?: string | null;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  event_metadata: Record<string, any>;
  created_at: string;
}

export interface BackendOverviewMetrics {
  total_orders: number;
  active_vehicles: number;
  completed_deliveries: number;
  pending_deliveries: number;
  on_time_delivery_pct: number;
  total_distance_km: number;
  total_operating_cost: number;
  cost_per_delivery: number;
  total_sla_violations: number;
  active_events_count: number;
}

export interface BackendCostMetrics {
  total_cost: number;
  base_distance_cost: number;
  fuel_cost: number;
  toll_cost: number;
  overtime_cost: number;
  late_penalty_cost: number;
  cost_breakdown_by_vehicle: Record<string, number>;
}

export interface BackendImpactSummary {
  event_id?: string | null;
  trigger: string;
  routes_changed: number;
  orders_reassigned: number;
  cost_delta: number;
  distance_delta_km: number;
  eta_delta_minutes: number;
  sla_violations_added: number;
  vehicles_affected: string[];
  affected_orders: string[];
  mitigation_recommendations: string[];
  optimisation_run_id?: string | null;
}

export interface BackendSimulationResponse {
  scenario_name: string;
  scenario_type: string;
  current_plan: {
    total_cost: number;
    total_distance_km: number;
    total_duration_minutes: number;
    late_orders_count: number;
    unassigned_orders_count: number;
    fleet_utilisation_pct: number;
    active_vehicles_count: number;
  };
  simulated_plan: {
    total_cost: number;
    total_distance_km: number;
    total_duration_minutes: number;
    late_orders_count: number;
    unassigned_orders_count: number;
    fleet_utilisation_pct: number;
    active_vehicles_count: number;
  };
  difference: {
    cost_delta: number;
    distance_delta_km: number;
    duration_delta_minutes: number;
    sla_violations_delta: number;
    unassigned_orders_delta: number;
  };
  recommendations: string[];
  simulated_routes_count: number;
}
