import { Vehicle, VehicleStatus } from '../types/fleet';
import { Order, OrderPriority, OrderSLAStatus } from '../types/order';
import { Route, RouteStop } from '../types/route';
import { DisruptionEvent, DisruptionType, EventSeverity } from '../types/event';
import { Driver, DriverIssue, WeatherData, DispatcherContact } from '../types/driver';
import { DashboardMetrics } from '../services/api';
import {
  BackendVehicle,
  BackendDriver,
  BackendOrder,
  BackendRoute,
  BackendRouteStop,
  BackendEvent,
  BackendOverviewMetrics,
} from './types';

const VEHICLE_COLORS = ['#16a34a', '#2563eb', '#dc2626', '#9333ea', '#0ea5e9', '#f59e0b'];

export function normalizeVehicle(
  v: BackendVehicle,
  driver?: BackendDriver,
  orderIds: string[] = [],
  index = 0,
  zone?: string
): Vehicle {
  let status: VehicleStatus = 'AVAILABLE';
  if (v.status === 'BREAKDOWN') status = 'BROKEN_DOWN';
  else if (v.status === 'ON_ROUTE' || v.status === 'ASSIGNED') status = 'ON_ROUTE';
  else if (v.status === 'UNAVAILABLE') status = 'STANDBY';

  const driverHours = driver?.max_work_hours || 8.0;
  const remainingHours = driver?.hours_remaining !== undefined ? driver.hours_remaining : 8.0;
  const usedHours = Number(Math.max(0, driverHours - remainingHours).toFixed(1));

  const shortId = `V0${index + 1}`;

  return {
    id: v.id,
    shortId,
    name: `${v.vehicle_type.replace(/_/g, ' ')} (${v.vehicle_number})`,
    licensePlate: v.vehicle_number,
    driverName: driver?.name || 'Unassigned',
    driverPhone: driver?.phone || '+91-9829000000',
    driverId: driver?.id || v.driver_id || '',
    status,
    capacityKg: v.capacity_kg,
    currentLoadKg: v.current_load_kg,
    maxStops: 12,
    currentStopsCount: orderIds.length,
    currentZone: zone || (status === 'BROKEN_DOWN' ? 'Depot Bay 3 (Repair)' : 'Jaipur Central Corridor'),
    loadEligibility: ['GENERAL', 'COLD_CHAIN', 'EXPRESS'],
    shiftHoursLimit: driverHours,
    shiftHoursUsed: usedHours,
    remainingHours,
    fuelEfficiencyKmpl: v.fuel_type === 'ELECTRIC' ? 0 : 14.5,
    currentSpeedKmh: status === 'ON_ROUTE' ? 38 : 0,
    batteryPct: v.fuel_type === 'ELECTRIC' ? 88 : 100,
    tirePressurePsi: 32,
    telemetrySynced: true,
    assignedOrderIds: orderIds,
    color: VEHICLE_COLORS[index % VEHICLE_COLORS.length],
    currentLat: v.current_lat ?? undefined,
    currentLng: v.current_lng ?? undefined,
  };
}

export function normalizeOrder(o: BackendOrder, stop?: BackendRouteStop): Order {
  let priority: OrderPriority = 'STANDARD';
  if (o.priority === 'CRITICAL') priority = 'CRITICAL';
  else if (o.priority === 'HIGH') priority = 'HIGH';

  let slaStatus: OrderSLAStatus = 'ON_TIME';
  if (o.status === 'DELIVERED') slaStatus = 'DELIVERED';
  else if (o.status === 'DELAYED') slaStatus = 'LATE';
  else if (o.status === 'AT_RISK') slaStatus = 'AT_RISK';
  else if (o.status === 'CANCELLED') slaStatus = 'UNSERVICEABLE';

  return {
    id: o.external_order_id || o.id,
    consignee: o.customer_name,
    address: o.delivery_address,
    zone: 'Jaipur District',
    pincode: '302001',
    lat: o.delivery_lat,
    lng: o.delivery_lng,
    weightKg: o.weight_kg,
    priority,
    loadType: 'GENERAL',
    timeWindowStart: o.window_start,
    timeWindowEnd: o.window_end,
    eta: stop?.planned_arrival || o.window_start || '12:00 PM',
    slaStatus,
    slaBufferMinutes: 20,
    assignedVehicleId: o.assigned_vehicle_id || '',
    originalVehicleId: undefined,
    reassigned: false,
    notes: o.customer_phone ? `Phone: ${o.customer_phone}` : undefined,
  };
}

export function normalizeRouteStop(
  s: BackendRouteStop,
  order?: BackendOrder,
  index = 1,
  totalStops = 1
): RouteStop {
  const seq = s.stop_sequence ?? index;
  const isDepotStart = !s.order_id && (seq === 0 || index === 1);
  const isDepotEnd = !s.order_id && (index === totalStops || seq > 0);

  let stopName = order?.customer_name;
  let address = order?.delivery_address;
  let ordId: string | undefined = order?.external_order_id || s.order_id || undefined;

  if (isDepotStart && !order) {
    stopName = 'Jaipur Hub Depot (Origin Dispatch)';
    address = 'Jaipur Central Logistics Hub, Transport Nagar, Jaipur';
    ordId = undefined;
  } else if (isDepotEnd && !order) {
    stopName = 'Jaipur Hub Depot (Return & Reconciliation)';
    address = 'Jaipur Central Logistics Hub, Transport Nagar, Jaipur';
    ordId = undefined;
  } else if (!stopName) {
    stopName = ordId ? `Delivery: ${ordId}` : `Waypoint #${seq}`;
    address = address || 'Jaipur Commercial Sector';
  }

  return {
    stopNumber: seq,
    orderId: ordId,
    backendOrderId: order?.id || s.order_id || undefined, // real UUID for API
    stopId: s.id,                                          // route_stop.id for direct PATCH
    name: stopName,
    address: address || 'Jaipur Central Hub',
    lat: order?.delivery_lat || 26.9124,
    lng: order?.delivery_lng || 75.7873,
    eta: s.planned_arrival || '12:00 PM',
    completed: s.status === 'COMPLETED' || order?.status === 'DELIVERED' || (order as any)?.sla_status === 'DELIVERED',
    absorbedFromVehicleId: undefined,
    isPriority: order?.priority === 'CRITICAL' || order?.priority === 'HIGH',
  };
}

export function normalizeRoute(
  r: BackendRoute,
  ordersMap: Map<string, BackendOrder>,
  driverName = 'Driver'
): Route {
  const rawStops = r.stops || [];
  const stops: RouteStop[] = rawStops.map((s, idx) => {
    const ord = s.order_id ? ordersMap.get(s.order_id) : undefined;
    return normalizeRouteStop(s, ord, idx + 1, rawStops.length);
  });

  // Extract waypoints from stops
  const waypoints: [number, number][] = [
    [26.9124, 75.7873], // Default Jaipur hub start
    ...stops.map((s): [number, number] => [s.lat, s.lng]),
  ];

  let status: 'ACTIVE' | 'REOPTIMISED' | 'DISRUPTED' | 'COMPLETED' = 'ACTIVE';
  if (r.status === 'COMPLETED') status = 'COMPLETED';
  else if (r.status === 'IN_PROGRESS' || r.status === 'ACTIVE') status = 'ACTIVE';

  // Compute SLA compliance dynamically based on late delivery penalty or delayed stops
  const penalty = r.late_delivery_penalty || 0;
  const slaCompliancePct = penalty > 0
    ? Math.max(72, Math.round(100 - (penalty / 35)))
    : (stops.length > 0 ? 98.2 : 100.0);

  // Compute capacity utilization dynamically if orders are mapped
  let totalOrderWeight = 0;
  stops.forEach((s) => {
    if (s.orderId) {
      const ord = ordersMap.get(s.orderId);
      if (ord?.weight_kg) totalOrderWeight += ord.weight_kg;
    }
  });
  const capacityUtilizationPct = totalOrderWeight > 0 ? Math.min(100, Number(((totalOrderWeight / 65) * 100).toFixed(1))) : 78.5;

  return {
    id: r.id,
    vehicleId: r.vehicle_id,
    driverName,
    status,
    totalDistanceKm: Number((r.total_distance_km || 0).toFixed(1)),
    totalDurationMinutes: Math.round(r.total_duration_minutes || 0),
    stops,
    waypoints,
    estimatedCostInr: Math.round(r.total_cost || 0),
    fuelCostInr: Math.round(r.expected_fuel_cost || 0),
    driverWageInr: Math.max(0, Math.round((r.total_cost || 0) - (r.expected_fuel_cost || 0) - (r.expected_toll_cost || 0))),
    tollCostInr: Math.round(r.expected_toll_cost || 0),
    slaCompliancePct,
    capacityUtilizationPct,
  };
}

export function normalizeEvent(e: BackendEvent): DisruptionEvent {
  let severity: EventSeverity = 'INFO';
  if (e.severity === 'CRITICAL') severity = 'CRITICAL';
  else if (e.severity === 'HIGH' || e.severity === 'MEDIUM') severity = 'WARNING';

  let type: DisruptionType = 'TRAFFIC';
  const validTypes = ['TRAFFIC', 'WEATHER', 'URGENT_ORDER', 'VEHICLE_BREAKDOWN', 'CASCADING_BREAKDOWN', 'ROAD_CLOSURE'];
  if (validTypes.includes(e.type)) {
    type = e.type as DisruptionType;
  } else if (e.type === 'PRIORITY_ORDER') {
    type = 'URGENT_ORDER';
  }

  const timestamp = e.created_at
    ? new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  const affectedVehicles = e.vehicle_id ? [e.vehicle_id] : (e.event_metadata?.affected_vehicles || []);
  const affectedOrders = e.order_id ? [e.order_id] : (e.event_metadata?.affected_orders || []);

  return {
    id: e.id,
    type,
    title: e.title,
    description: e.description,
    location: e.location_lat && e.location_lng ? `${e.location_lat.toFixed(4)}, ${e.location_lng.toFixed(4)}` : 'Jaipur Corridor',
    timestamp,
    severity,
    affectedVehicleIds: affectedVehicles,
    affectedOrderIds: affectedOrders,
    impactDelayMinutes: e.event_metadata?.eta_delta_minutes || 14,
    impactCostInr: e.event_metadata?.cost_delta || 120,
    resolved: e.status === 'RESOLVED',
    reoptimisationTriggered: true,
    recoveryRecommendation: e.event_metadata?.mitigation_recommendations?.[0],
    lat: e.location_lat ?? undefined,
    lng: e.location_lng ?? undefined,
    radiusKm: e.radius_km ?? 1.5,
    speedPenaltyFactor: e.event_metadata?.delay_factor || e.event_metadata?.speed_penalty_factor || 1.4,
  };
}

export function normalizeDriver(d: BackendDriver, vehicleId = ''): Driver {
  const hoursUsed = Number(Math.max(0, d.max_work_hours - d.hours_remaining).toFixed(1));
  let status: 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY' = 'ON_DUTY';
  if (d.status === 'RESTING') status = 'ON_BREAK';
  else if (d.status === 'OFF_DUTY') status = 'OFF_DUTY';

  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    vehicleId,
    status,
    shiftStartTime: '08:00 AM',
    shiftEndTime: '04:00 PM',
    hoursUsed,
    hoursLimit: d.max_work_hours,
    depot: 'Jaipur Central Logistics Hub (Transport Nagar)',
  };
}

export function normalizeMetrics(
  overview?: BackendOverviewMetrics | null,
  activeVehiclesCount = 5,
  totalVehiclesCount = 5
): DashboardMetrics {
  if (!overview) {
    return {
      totalOperatingCostInr: 12450,
      onTimeSlaPct: 96.0,
      activeVehiclesCount,
      totalVehiclesCount,
      totalOrdersCount: 20,
      lateOrdersCount: 1,
      fleetUtilizationPct: 82.0,
      totalDistanceKm: 312,
      reoptimisationsCount: 1,
      pendingPickupCount: 3,
      disruptedVehiclesCount: 0,
      savedCostInr: 2180,
    };
  }

  return {
    totalOperatingCostInr: Math.round(overview.total_operating_cost || 12450),
    onTimeSlaPct: Number((overview.on_time_delivery_pct || 96.0).toFixed(1)),
    activeVehiclesCount: overview.active_vehicles || activeVehiclesCount,
    totalVehiclesCount,
    totalOrdersCount: overview.total_orders || 20,
    lateOrdersCount: overview.total_sla_violations || 0,
    fleetUtilizationPct: 82.0,
    totalDistanceKm: Math.round(overview.total_distance_km || 312),
    reoptimisationsCount: 2,
    pendingPickupCount: overview.pending_deliveries || 0,
    disruptedVehiclesCount: overview.active_events_count || 0,
    savedCostInr: Math.round((overview.total_operating_cost || 12450) * 0.15),
  };
}
