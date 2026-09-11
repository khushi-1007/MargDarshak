import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Badge } from '../ui/Badge';
import { Vehicle } from '../../types/fleet';
import {
  Truck,
  Eye,
  AlertTriangle,
  MapPin,
  Clock,
  X,
  Gauge,
  Compass,
  CheckCircle2,
  Navigation,
  DollarSign,
  Fuel,
} from 'lucide-react';

export const ActiveRoutesTable: React.FC = () => {
  const {
    vehicles,
    routes,
    selectedVehicleId,
    setSelectedVehicleId,
    openRouteComparisonForIncident,
  } = useFleet();

  const [inspectingVehicle, setInspectingVehicle] = useState<Vehicle | null>(null);

  // Compute total route cost across all vehicles to guarantee exact parity with Top KPI card
  const totalRoutesCost = vehicles.reduce((sum, v) => {
    const route = routes.find((r) => r.vehicleId === v.id);
    return sum + (route ? route.estimatedCostInr : 0);
  }, 0);

  const handleEyeClick = (v: Vehicle) => {
    if (selectedVehicleId === v.id && inspectingVehicle?.id === v.id) {
      setSelectedVehicleId(null);
      setInspectingVehicle(null);
    } else {
      setSelectedVehicleId(v.id);
      setInspectingVehicle(v);
      // Smoothly scroll to map view so the user immediately sees the focused vehicle
      const mapElem = document.getElementById('fleet-telemetry-map') || document.querySelector('.leaflet-container');
      if (mapElem) {
        mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const inspectingRoute = inspectingVehicle
    ? routes.find((r) => r.vehicleId === inspectingVehicle.id)
    : null;

  return (
    <div className="bg-surface-main p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col relative">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold text-deep-navy">
            Jaipur Vehicle Operational Roster & Active Routes
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-text-muted">
            {vehicles.length} Registered Units
          </span>
          {selectedVehicleId && (
            <button
              onClick={() => {
                setSelectedVehicleId(null);
                setInspectingVehicle(null);
              }}
              className="text-[10px] text-primary hover:underline font-semibold"
            >
              Reset Map Filter
            </button>
          )}
        </div>
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
              const isSelected = selectedVehicleId === v.id;

              return (
                <tr
                  key={v.id}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-primary/10 border-l-4 border-primary font-medium'
                      : isBroken
                      ? 'bg-error-container/20 hover:bg-error-container/30'
                      : 'hover:bg-surface-container-low'
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold font-mono text-deep-navy">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: v.color }}
                      />
                      <span>{v.id}</span>
                      {isBroken && (
                        <AlertTriangle className="w-3.5 h-3.5 text-status-critical shrink-0" />
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
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-deep-navy">
                    ₹{route ? route.estimatedCostInr.toLocaleString() : '0'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleEyeClick(v)}
                        className={`p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white shadow-xs font-bold'
                            : 'hover:bg-surface-container text-primary bg-primary/10'
                        }`}
                        title={isSelected ? 'Vehicle Focused (Click to Close)' : 'Focus Vehicle & Inspect Telematics'}
                        type="button"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {isSelected && <span className="text-[10px] pr-0.5">Tracking</span>}
                      </button>
                      {isBroken && (
                        <button
                          onClick={() => openRouteComparisonForIncident('VEHICLE_BREAKDOWN')}
                          className="px-2 py-1 rounded bg-status-critical text-white text-[10px] font-bold shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
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
          <tfoot className="bg-surface-container-low/90 border-t-2 border-border-subtle font-semibold text-xs">
            <tr>
              <td
                colSpan={6}
                className="py-3 px-3 text-right text-text-secondary uppercase tracking-wider text-[11px]"
              >
                Total Fleet Route Cost:
              </td>
              <td className="py-3 px-3 text-right font-mono text-primary font-extrabold text-sm">
                ₹{totalRoutesCost.toLocaleString()}
              </td>
              <td className="py-3 px-3 text-center text-[10px] text-text-muted font-normal">
                = Operating Cost
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Interactive Vehicle Telematics & Route Inspection Modal */}
      {inspectingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div
            onClick={() => setInspectingVehicle(null)}
            className="fixed inset-0 bg-nav-command/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative bg-surface-main rounded-2xl shadow-2xl border border-border-subtle p-5 w-full max-w-lg z-10 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs"
                  style={{ backgroundColor: inspectingVehicle.color || '#2563EB' }}
                >
                  {inspectingVehicle.id}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-deep-navy">
                      Unit: {inspectingVehicle.licensePlate}
                    </h3>
                    <Badge status={inspectingVehicle.status} type="vehicle" />
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Pilot: <strong className="text-deep-navy">{inspectingVehicle.driverName}</strong> • {inspectingVehicle.currentZone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingVehicle(null)}
                className="p-1 rounded-lg text-text-muted hover:text-deep-navy hover:bg-surface-container transition-colors cursor-pointer"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Telemetry Bento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col">
                <span className="text-[10px] text-text-muted uppercase flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-emerald-600" /> GPS Speed
                </span>
                <span className="font-mono font-bold text-deep-navy text-sm mt-0.5">
                  {inspectingVehicle.status === 'BROKEN_DOWN' ? '0 km/h' : `${inspectingVehicle.currentSpeedKmh || 40} km/h`}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Live CAN-Bus</span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col">
                <span className="text-[10px] text-text-muted uppercase flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-primary" /> Route Cost
                </span>
                <span className="font-mono font-bold text-primary text-sm mt-0.5">
                  ₹{inspectingRoute ? inspectingRoute.estimatedCostInr.toLocaleString() : '0'}
                </span>
                <span className="text-[10px] text-text-muted">OR-Tools VRPTW</span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col">
                <span className="text-[10px] text-text-muted uppercase flex items-center gap-1">
                  <Compass className="w-3 h-3 text-indigo-600" /> Distance
                </span>
                <span className="font-mono font-bold text-deep-navy text-sm mt-0.5">
                  {inspectingRoute?.totalDistanceKm || 0} km
                </span>
                <span className="text-[10px] text-text-muted">{inspectingRoute?.totalDurationMinutes || 0} mins</span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col gap-1">
                <span className="text-[10px] text-text-muted uppercase flex items-center gap-1">
                  <Truck className="w-3 h-3 text-amber-600" /> Payload
                </span>
                <span className="font-mono font-bold text-deep-navy text-sm">
                  {inspectingVehicle.currentLoadKg} / {inspectingVehicle.capacityKg} kg
                </span>
                {/* Mini utilization bar */}
                {(() => {
                  const pct = inspectingVehicle.capacityKg > 0
                    ? Math.min(100, Math.round((inspectingVehicle.currentLoadKg / inspectingVehicle.capacityKg) * 100))
                    : 0;
                  const barColor = pct >= 90 ? 'bg-status-critical' : pct >= 70 ? 'bg-status-warning' : 'bg-emerald-500';
                  const textColor = pct >= 90 ? 'text-status-critical' : pct >= 70 ? 'text-status-warning' : 'text-emerald-600';
                  return (
                    <>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-[10px] font-semibold ${textColor}`}>
                        {pct}% utilized
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Stops Sequence Itinerary */}
            <div>
              <div className="flex items-center justify-between pb-1 text-xs font-bold text-deep-navy">
                <span>Waypoints & Stops Sequence ({inspectingRoute?.stops?.length || 0})</span>
                <span className="text-[11px] font-mono text-text-muted">Jaipur Grid</span>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 mt-1">
                {inspectingRoute?.stops && inspectingRoute.stops.length > 0 ? (
                  inspectingRoute.stops.map((s, idx) => (
                    <div
                      key={s.orderId || `${idx}`}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                        s.completed
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-surface-container-low border-border-subtle text-deep-navy'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-surface-container text-text-secondary font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                          {s.stopNumber}
                        </span>
                        <div>
                          <div className="font-semibold text-xs flex items-center gap-1.5">
                            <span>{s.name}</span>
                            {s.isPriority && (
                              <span className="px-1 py-0.2 rounded bg-status-critical text-white text-[9px] font-bold">
                                PRIORITY
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-text-muted">{s.address}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs shrink-0">
                        <span className="font-bold">{s.eta}</span>
                        <span className="block text-[10px] text-text-muted">
                          {s.completed ? 'Delivered ✓' : 'Scheduled'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-text-muted bg-surface-container-low rounded-lg">
                    Vehicle currently on standby at Jaipur Logistics Depot.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                onClick={() => {
                  setInspectingVehicle(null);
                  const mapElem = document.getElementById('fleet-telemetry-map') || document.querySelector('.leaflet-container');
                  if (mapElem) {
                    mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="py-1.5 px-3 rounded-lg bg-primary text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer hover:bg-primary/90 transition-all"
                type="button"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Track on Live Map</span>
              </button>
              <button
                onClick={() => setInspectingVehicle(null)}
                className="py-1.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-deep-navy text-xs font-semibold transition-colors cursor-pointer"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
