import { LoadType } from './fleet';

export type OrderPriority = 'CRITICAL' | 'HIGH' | 'STANDARD';

export type OrderSLAStatus = 'ON_TIME' | 'AT_RISK' | 'LATE' | 'UNSERVICEABLE' | 'DELIVERED';

export interface Order {
  id: string; // e.g. '#1008'
  consignee: string; // e.g. 'Apex Healthcare'
  address: string; // e.g. 'C-Scheme, Sector 4'
  zone: string; // e.g. 'Jaipur Central / West'
  pincode: string; // e.g. '302001'
  lat: number;
  lng: number;
  weightKg: number;
  volumeM3?: number;
  priority: OrderPriority;
  loadType: LoadType;
  timeWindowStart: string; // '11:30 AM'
  timeWindowEnd: string; // '12:30 PM'
  eta: string; // '12:15 PM'
  slaStatus: OrderSLAStatus;
  slaBufferMinutes: number;
  assignedVehicleId: string; // 'V01'
  originalVehicleId?: string; // 'V03' if reassigned
  reassigned?: boolean;
  reassignmentReason?: string;
  notes?: string;
}
