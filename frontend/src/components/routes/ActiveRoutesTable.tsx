import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { Badge } from '../ui/Badge';
import { Truck, Eye, AlertTriangle } from 'lucide-react';

export const ActiveRoutesTable: React.FC = () => {
  const {
    vehicles,
    routes,
    setSelectedVehicleId,
    openRouteComparisonForIncident,
  } = useFleet();

  return (
    <div className="bg-surface-main p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold text-deep-navy">Jaipur Vehicle Operational Roster & Active Routes</h2>
        </div>
        <span className="text-[11px] font-mono text-text-muted">{vehicles.length} Registered Units</span>
      </div>

      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-text-secondary font-semibold uppercase text-[11px] border-b border-border-subtle">
              <th className="py-2.5 px-3">Vehicle</th>
              <th className="py-2.5 px-3">Driver / Pilot</th>
              <th className="py-2.5 px-3">Active Corridor</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Remaining Payload</th>
              <th className="py-2.5 px-3 text-right">Orders</th>
              <th className="py-2.5 px-3 text-right">Cost (₹)</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/50">
            {vehicles.map((v) => {
              const route = routes.find((r) => r.vehicleId === v.id);
              const isBroken = v.status === 'BROKEN_DOWN';

              return (
                <tr
                  key={v.id}
                  className={`hover:bg-surface-container-low transition-colors ${
                    isBroken ? 'bg-error-container/20' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold font-mono text-deep-navy">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: v.color }}
                      />
                      <span>{v.id}</span>
                      {isBroken && (
                        <AlertTriangle className="w-3.5 h-3.5 text-status-critical" />
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-deep-navy">{v.driverName}</span>
                      <span className="text-[10px] text-text-muted">{v.driverId}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary truncate max-w-[160px]">
                    {v.currentZone}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge status={v.status} type="vehicle" />
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-deep-navy">
                    {isBroken ? (
                      <span className="text-status-critical font-bold">0 kg (Stalled)</span>
                    ) : (
                      `${v.capacityKg - v.currentLoadKg} kg`
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-deep-navy">
                    {v.assignedOrderIds.length} stops
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-deep-navy">
                    ₹{route ? route.estimatedCostInr.toLocaleString() : '0'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedVehicleId(v.id)}
                        className="p-1 rounded hover:bg-surface-container text-primary transition-colors"
                        title="Focus Telemetry"
                        type="button"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {isBroken && (
                        <button
                          onClick={() => openRouteComparisonForIncident('VEHICLE_BREAKDOWN')}
                          className="px-2 py-0.5 rounded bg-status-critical text-white text-[10px] font-bold shadow-xs hover:bg-red-700 transition-colors"
                          type="button"
                        >
                          Reroute
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
