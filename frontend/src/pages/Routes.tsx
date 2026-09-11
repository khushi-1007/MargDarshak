import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from '../context/FleetContext';
import { Badge } from '../components/ui/Badge';
import { FleetMap } from '../components/map/FleetMap';
import {
  Route as RouteIcon,
  MapPin,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Fuel,
  Coins,
  Gauge,
  Navigation,
  Package,
  ThermometerSnowflake,
  ListOrdered,
  Map as MapIcon,
} from 'lucide-react';

export const Routes: React.FC = () => {
  const navigate = useNavigate();
  const {
    routes,
    vehicles,
    orders,
    selectedVehicleId,
    setSelectedVehicleId,
    openRouteComparisonForIncident,
  } = useFleet();

  const [selectedRouteVehicleId, setSelectedRouteVehicleId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'MANIFEST' | 'MAP'>('MANIFEST');

  // Fallback cleanly to first vehicle if none selected or invalid
  const activeVehicle =
    vehicles.find((v) => v.id === selectedRouteVehicleId || v.shortId === selectedRouteVehicleId) ||
    vehicles[0];

  const activeRoute = routes.find(
    (r) =>
      r.vehicleId === activeVehicle?.id ||
      r.vehicleId === activeVehicle?.shortId ||
      r.vehicleId === activeVehicle?.licensePlate
  );

  const isVehicleBroken = activeVehicle?.status === 'BROKEN_DOWN';

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedRouteVehicleId(vehicleId);
    setSelectedVehicleId(vehicleId);
  };

  return (
    <div className="p-6 max-w-[1720px] mx-auto w-full flex flex-col gap-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px] font-bold">
              SPATIAL ROUTING
            </span>
            <span className="text-xs font-medium text-text-muted">• OR-Tools Deterministic Sequence</span>
          </div>
          <h1 className="text-xl font-bold text-deep-navy tracking-tight mt-1">
            Active Routes & Waypoint Sequences
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Turn-by-turn stop schedules, detour penalties, and vehicle load redistribution audits
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented View Mode Toggle: In-Page Live Map vs Sequence Manifest */}
          <div className="flex items-center p-1 rounded-xl bg-surface-container border border-border-subtle">
            <button
              onClick={() => setViewMode('MANIFEST')}
              className={`h-7 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'MANIFEST'
                  ? 'bg-white dark:bg-surface-main text-deep-navy shadow-xs'
                  : 'text-text-secondary hover:text-deep-navy'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-primary" />
              <span>Manifest View</span>
            </button>
            <button
              onClick={() => {
                setViewMode('MAP');
                if (activeVehicle) setSelectedVehicleId(activeVehicle.id);
              }}
              className={`h-7 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'MAP'
                  ? 'bg-white dark:bg-surface-main text-deep-navy shadow-xs'
                  : 'text-text-secondary hover:text-deep-navy'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-primary" />
              <span>Live Route Map</span>
            </button>
          </div>

          <button
            onClick={() => openRouteComparisonForIncident(isVehicleBroken ? 'VEHICLE_BREAKDOWN' : undefined)}
            className="h-8 px-3.5 rounded-lg bg-ai-intelligence hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare Before vs After Plan</span>
          </button>
        </div>
      </div>

      {/* Vehicle Route Selector Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
        {vehicles.map((v, idx) => {
          const isSelected = v.id === (activeVehicle?.id || selectedRouteVehicleId);
          const route = routes.find(
            (r) => r.vehicleId === v.id || r.vehicleId === v.shortId || r.vehicleId === v.licensePlate
          );
          const unitCode = v.shortId || `V0${idx + 1}`;

          return (
            <button
              key={v.id}
              onClick={() => handleSelectVehicle(v.id)}
              className={`p-3 rounded-xl border text-left min-w-[215px] shrink-0 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-primary-container text-white border-primary-container shadow-xs'
                  : 'bg-surface-main text-deep-navy border-border-subtle hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs shrink-0"
                  style={{ backgroundColor: v.color || '#2563eb', color: '#ffffff' }}
                >
                  {unitCode}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold whitespace-nowrap">{v.driverName}</span>
                  <span className={`text-[10px] font-mono whitespace-nowrap ${isSelected ? 'text-blue-100' : 'text-text-muted'}`}>
                    {v.status === 'BROKEN_DOWN'
                      ? 'Stalled • Absorbed'
                      : `${route?.stops.length || 0} stops • ${route?.totalDistanceKm || 0} km`}
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <Badge status={v.status} type="vehicle" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Route Detail Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 8 cols: Sequence Itinerary Timeline OR Embedded Live Route Map */}
        <div className="lg:col-span-8 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <RouteIcon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-deep-navy">
                {viewMode === 'MAP' ? 'Live Map Trajectory: ' : 'Sequence Manifest: '}
                Vehicle {activeVehicle?.shortId || 'V01'} · {activeVehicle?.licensePlate} ({activeVehicle?.driverName})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {activeRoute?.status === 'REOPTIMISED' && (
                <span className="px-2 py-0.5 rounded bg-purple-100 text-ai-intelligence text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Re-optimised Corridor
                </span>
              )}
              <button
                onClick={() => setViewMode(viewMode === 'MANIFEST' ? 'MAP' : 'MANIFEST')}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-deep-navy text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                {viewMode === 'MANIFEST' ? (
                  <>
                    <MapIcon className="w-3 h-3 text-primary" />
                    <span>Show Map</span>
                  </>
                ) : (
                  <>
                    <ListOrdered className="w-3 h-3 text-primary" />
                    <span>Show Stops</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Breakdown / Stalled Notice Banner for V03 */}
          {isVehicleBroken && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-status-critical shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-status-critical">
                    Vehicle {activeVehicle?.shortId} Stalled — Active Route Redirection Applied
                  </strong>
                  <p className="text-[11px] text-red-900 mt-0.5">
                    Mechanical stall detected via CAN-Bus. Assigned delivery consignments have been algorithmically absorbed by neighboring fleet units to prevent SLA breaches.
                  </p>
                </div>
              </div>
              <button
                onClick={() => openRouteComparisonForIncident('VEHICLE_BREAKDOWN')}
                className="px-3 py-1.5 rounded-lg bg-status-critical text-white text-xs font-bold hover:bg-red-700 transition-colors shrink-0 shadow-xs cursor-pointer text-center"
              >
                Inspect Absorption Plan
              </button>
            </div>
          )}

          {activeRoute?.updatedReason && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-950 font-medium">
              ⚡ <strong>Route Updated:</strong> {activeRoute.updatedReason}
            </div>
          )}

          {/* Conditional View: Live Map or Sequential Itinerary */}
          {viewMode === 'MAP' ? (
            <div className="w-full rounded-xl overflow-hidden border border-border-subtle shadow-xs">
              <FleetMap />
            </div>
          ) : activeRoute && activeRoute.stops.length > 0 ? (
            <div className="space-y-3 relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-container">
              {activeRoute.stops.map((stop, idx) => {
                const isAbsorbed = !!stop.absorbedFromVehicleId;
                const isDepot = stop.name.toLowerCase().includes('depot');
                const matchedOrder = orders.find(
                  (o) => o.id === stop.orderId || o.id === stop.backendOrderId
                );

                return (
                  <div
                    key={idx}
                    className={`relative p-4 rounded-xl border transition-all ${
                      isAbsorbed
                        ? 'bg-purple-50/70 border-purple-300 shadow-xs'
                        : stop.completed
                        ? 'bg-surface-container-low/60 border-border-subtle opacity-85'
                        : 'bg-surface-main border-border-subtle hover:border-primary/40'
                    }`}
                  >
                    {/* Waypoint number pin */}
                    <div
                      className={`absolute -left-[27px] top-4 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] border-2 border-white shadow-xs ${
                        isAbsorbed
                          ? 'bg-ai-intelligence text-white'
                          : stop.completed
                          ? 'bg-status-success text-white'
                          : isDepot
                          ? 'bg-surface-container-high text-deep-navy'
                          : 'bg-primary-container text-white'
                      }`}
                    >
                      {stop.stopNumber}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-deep-navy">{stop.name}</span>
                          {stop.orderId && (
                            <span className="font-mono text-[10px] bg-surface-container px-2 py-0.5 rounded font-semibold text-text-secondary">
                              {stop.orderId}
                            </span>
                          )}
                          {isDepot && (
                            <span className="text-[10px] bg-surface-container text-text-secondary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                              Central Logistics Hub
                            </span>
                          )}
                          {matchedOrder?.loadType === 'COLD_CHAIN' && (
                            <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                              <ThermometerSnowflake className="w-3 h-3" /> Cold Chain (2°–8°C)
                            </span>
                          )}
                          {isAbsorbed && (
                            <span className="bg-ai-intelligence text-white text-[9px] font-bold uppercase px-1.5 py-0.2 rounded">
                              Absorbed from {stop.absorbedFromVehicleId}
                            </span>
                          )}
                        </div>

                        <div className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                          <MapPin className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
                          <span>{stop.address}</span>
                        </div>

                        <div className="flex items-center gap-3 pt-0.5">
                          <span className="font-mono text-[10px] text-text-muted">
                            Coords: {stop.lat.toFixed(4)}° N, {stop.lng.toFixed(4)}° E
                          </span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-semibold"
                          >
                            <span>Open in Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-xs text-deep-navy">{stop.eta}</div>
                        <span
                          className={`text-[10px] font-semibold block mt-0.5 ${
                            stop.completed ? 'text-status-success' : 'text-text-muted'
                          }`}
                        >
                          {stop.completed ? 'Fulfilled ✓' : 'Estimated Arrival'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-container-low rounded-xl border border-border-subtle text-text-muted space-y-2">
              <Truck className="w-8 h-8 mx-auto text-text-muted" />
              <p className="text-xs font-semibold text-deep-navy">No active manifest currently assigned to this unit.</p>
              <p className="text-[11px] text-text-secondary">
                Vehicle is either on standby reserve or recovering from maintenance.
              </p>
            </div>
          )}
        </div>

        {/* Right 4 cols: Cost & Energy Expenditure Breakdown */}
        <div className="lg:col-span-4 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
            <h3 className="text-xs font-bold text-deep-navy uppercase tracking-wider">
              Route Economics (₹)
            </h3>
            <span className="font-mono text-xs font-bold text-primary">
              ₹{(activeRoute?.estimatedCostInr || 0).toLocaleString()} Total
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-border-subtle/60">
              <span className="text-text-secondary">Fuel & Energy:</span>
              <span className="font-mono font-bold text-deep-navy">₹{activeRoute?.fuelCostInr || 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle/60">
              <span className="text-text-secondary">Driver Wages (Shift):</span>
              <span className="font-mono font-bold text-deep-navy">₹{activeRoute?.driverWageInr || 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle/60">
              <span className="text-text-secondary">Municipal Toll Allocations:</span>
              <span className="font-mono font-bold text-deep-navy">₹{activeRoute?.tollCostInr || 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle/60">
              <span className="text-text-secondary">Total Trajectory Distance:</span>
              <span className="font-mono font-bold text-deep-navy">{activeRoute?.totalDistanceKm || 0} km</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle/60">
              <span className="text-text-secondary">SLA Compliance Window:</span>
              <span className="font-mono font-bold text-status-success">
                {activeRoute?.slaCompliancePct || 98}%
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle/60">
              <span className="text-text-secondary">Planned Trajectory Duration:</span>
              <span className="font-mono font-bold text-deep-navy">
                {activeRoute?.totalDurationMinutes || Math.round((activeRoute?.totalDistanceKm || 0) * 5.2)} mins
              </span>
            </div>
          </div>

          <button
            onClick={() => openRouteComparisonForIncident(isVehicleBroken ? 'VEHICLE_BREAKDOWN' : undefined)}
            className="w-full mt-2 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-deep-navy text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Inspect Route Diff</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
