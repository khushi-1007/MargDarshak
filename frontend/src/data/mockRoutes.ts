import { Route } from '../types/route';

export const initialRoutes: Route[] = [
  {
    id: 'R-V01',
    vehicleId: 'V01',
    driverName: 'Rajesh Kumar',
    status: 'ACTIVE',
    totalDistanceKm: 24.6,
    totalDurationMinutes: 145,
    stops: [
      { stopNumber: 1, orderId: '#1001', name: 'Sindhi Camp Logistics Hub', address: 'Station Road', lat: 26.9239, lng: 75.8038, eta: '10:45 AM', completed: true },
      { stopNumber: 2, orderId: '#1003', name: 'Sodala Trading Corporation', address: 'Ajmer Road', lat: 26.9022, lng: 75.7767, eta: '11:40 AM', completed: false },
      { stopNumber: 3, orderId: '#1006', name: 'Mansarovar Tech Hub', address: 'Shipra Path', lat: 26.8529, lng: 75.7675, eta: '12:35 PM', completed: false },
      { stopNumber: 4, orderId: '#1010', name: 'Tonk Road Commerce', address: 'Laxmi Mandir', lat: 26.8839, lng: 75.8052, eta: '01:45 PM', completed: false }
    ],
    waypoints: [
      [26.9239, 75.8038],
      [26.9150, 75.7950],
      [26.9022, 75.7767],
      [26.8780, 75.7720],
      [26.8529, 75.7675],
      [26.8680, 75.7910],
      [26.8839, 75.8052]
    ],
    estimatedCostInr: 3120,
    fuelCostInr: 1680,
    driverWageInr: 1200,
    tollCostInr: 240,
    slaCompliancePct: 98.0,
    capacityUtilizationPct: 48.8,
  },
  {
    id: 'R-V02',
    vehicleId: 'V02',
    driverName: 'Amit Sharma',
    status: 'ACTIVE',
    totalDistanceKm: 31.8,
    totalDurationMinutes: 170,
    stops: [
      { stopNumber: 1, orderId: '#1002', name: 'Vaishali Supermarket Mart', address: 'Amrapali Circle', lat: 26.9089, lng: 75.7483, eta: '11:15 AM', completed: false },
      { stopNumber: 2, orderId: '#1004', name: 'Vidhyadhar Nagar Depot', address: 'Sector 2', lat: 26.9648, lng: 75.7785, eta: '12:10 PM', completed: false },
      { stopNumber: 3, orderId: '#1007', name: 'MI Road Luxury Electronics', address: 'Jayanti Market', lat: 26.9186, lng: 75.8122, eta: '12:55 PM', completed: false },
      { stopNumber: 4, orderId: '#1014', name: 'Ajmer Express Cargo', address: '200 Ft Bypass', lat: 26.8872, lng: 75.7298, eta: '02:30 PM', completed: false }
    ],
    waypoints: [
      [26.9089, 75.7483],
      [26.9350, 75.7600],
      [26.9648, 75.7785],
      [26.9380, 75.7990],
      [26.9186, 75.8122],
      [26.8990, 75.7620],
      [26.8872, 75.7298]
    ],
    estimatedCostInr: 3450,
    fuelCostInr: 1950,
    driverWageInr: 1300,
    tollCostInr: 200,
    slaCompliancePct: 96.5,
    capacityUtilizationPct: 82.5,
  },
  {
    id: 'R-V03',
    vehicleId: 'V03',
    driverName: 'Suresh Meena',
    status: 'ACTIVE',
    totalDistanceKm: 18.2,
    totalDurationMinutes: 110,
    stops: [
      { stopNumber: 1, orderId: '#1008', name: 'Apex Healthcare Hospital Clinic', address: 'C-Scheme Sector 4', lat: 26.9112, lng: 75.8011, eta: '12:15 PM', completed: false, isPriority: true },
      { stopNumber: 2, orderId: '#1012', name: 'Raj Cold Storage', address: 'Bais Godam', lat: 26.9038, lng: 75.7915, eta: '12:45 PM', completed: false },
      { stopNumber: 3, orderId: '#1016', name: 'Civil Lines Gourmet', address: 'Jacob Road', lat: 26.9094, lng: 75.7891, eta: '01:15 PM', completed: false }
    ],
    waypoints: [
      [26.9112, 75.8011],
      [26.9038, 75.7915],
      [26.9094, 75.7891]
    ],
    estimatedCostInr: 2480,
    fuelCostInr: 1380,
    driverWageInr: 950,
    tollCostInr: 150,
    slaCompliancePct: 92.0,
    capacityUtilizationPct: 33.0,
  },
  {
    id: 'R-V04',
    vehicleId: 'V04',
    driverName: 'Imran Khan',
    status: 'ACTIVE',
    totalDistanceKm: 27.5,
    totalDurationMinutes: 155,
    stops: [
      { stopNumber: 1, orderId: '#1005', name: 'Raja Park Boutiques', address: 'Dhruv Marg', lat: 26.8974, lng: 75.8291, eta: '12:00 PM', completed: false },
      { stopNumber: 2, orderId: '#1009', name: 'Malviya Nagar Calgiri', address: 'Sector 4', lat: 26.8585, lng: 75.8198, eta: '01:10 PM', completed: false },
      { stopNumber: 3, orderId: '#1011', name: 'Jawahar Circle Biotech', address: 'Sector 9', lat: 26.8402, lng: 75.8021, eta: '02:20 PM', completed: false },
      { stopNumber: 4, orderId: '#1015', name: 'World Trade Park', address: 'JLN Marg', lat: 26.8536, lng: 75.8048, eta: '02:40 PM', completed: false }
    ],
    waypoints: [
      [26.8974, 75.8291],
      [26.8790, 75.8240],
      [26.8585, 75.8198],
      [26.8402, 75.8021],
      [26.8536, 75.8048]
    ],
    estimatedCostInr: 3400,
    fuelCostInr: 1854,
    driverWageInr: 1350,
    tollCostInr: 196,
    slaCompliancePct: 95.0,
    capacityUtilizationPct: 80.0,
  }
];
