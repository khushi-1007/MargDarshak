export interface Driver {
  id: string; // e.g. 'D01'
  name: string; // e.g. 'Rajesh Kumar'
  phone: string; // e.g. '+91 98290 14820'
  avatarUrl?: string;
  vehicleId: string; // e.g. 'V01'
  status: 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY';
  shiftStartTime: string;
  shiftEndTime: string;
  hoursUsed: number;
  hoursLimit: number;
  depot: string; // 'Sitapura Logistics Hub, Jaipur'
}

export type IssueType = 'Vehicle Issue' | 'Delivery Issue' | 'Road Issue' | 'Customer Issue' | 'Other';
export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface DriverIssue {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  timestamp: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
}

export interface WeatherData {
  temperatureC: number;
  condition: string;
  impact: string;
  location: string;
  updatedAt: string;
}

export interface DispatcherContact {
  name: string;
  role: string;
  hub: string;
  phone: string;
  radioChannel: string;
  status: 'ONLINE' | 'BUSY';
}

export interface DriverKpis {
  completedDeliveries: number;
  totalDeliveries: number;
  remainingDeliveries: number;
  totalDistanceTodayKm: number;
  estimatedTotalDistanceKm: number;
  estimatedCompletionTime: string;
  onTrackStatus: 'On Track' | 'Delayed' | 'Ahead';
  vehicleStatus: 'Healthy' | 'Warning' | 'Breakdown' | 'Re-routing';
  weather: WeatherData;
}
