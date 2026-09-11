export type VehicleStatus = 
  | 'AVAILABLE' 
  | 'ON_ROUTE' 
  | 'AT_CAPACITY' 
  | 'AT_RISK' 
  | 'BROKEN_DOWN' 
  | 'STANDBY';

export type LoadType = 'GENERAL' | 'COLD_CHAIN' | 'HAZMAT' | 'FRAGILE' | 'EXPRESS';

export interface Vehicle {
  id: string; // e.g. 'V01' or UUID
  shortId?: string; // e.g. 'V01'
  name: string; // e.g. 'Tata 407 SFC'
  licensePlate: string; // e.g. 'RJ-14-UB-2041'
  driverName: string; // e.g. 'Rajesh Kumar'
  driverPhone: string;
  driverId: string;
  status: VehicleStatus;
  capacityKg: number;
  currentLoadKg: number;
  maxStops: number;
  currentStopsCount: number;
  currentZone: string;
  loadEligibility: LoadType[];
  shiftHoursLimit: number;
  shiftHoursUsed: number;
  remainingHours: number;
  fuelEfficiencyKmpl: number;
  currentSpeedKmh: number;
  batteryPct: number;
  tirePressurePsi: number;
  telemetrySynced: boolean;
  assignedOrderIds: string[];
  color: string; // Hex color for polylines/markers
  currentLat?: number;
  currentLng?: number;
}
