export interface RouteStop {
  stopNumber: number;
  orderId?: string;       // external_order_id for display (e.g. ORD-1016)
  backendOrderId?: string; // real UUID for API calls
  stopId?: string;        // route_stop.id for direct status update
  name: string;
  address: string;
  lat: number;
  lng: number;
  eta: string;
  completed: boolean;
  absorbedFromVehicleId?: string;
  isPriority?: boolean;
}

export interface Route {
  id: string; // e.g. 'R-V01'
  vehicleId: string;
  driverName: string;
  status: 'ACTIVE' | 'REOPTIMISED' | 'DISRUPTED' | 'COMPLETED';
  totalDistanceKm: number;
  totalDurationMinutes: number;
  stops: RouteStop[];
  waypoints: [number, number][]; // [lat, lng] coordinates for leaflet polylines
  estimatedCostInr: number;
  fuelCostInr: number;
  driverWageInr: number;
  tollCostInr: number;
  slaCompliancePct: number;
  capacityUtilizationPct: number;
  updatedReason?: string;
  previousDistanceKm?: number;
  previousDurationMinutes?: number;
}
