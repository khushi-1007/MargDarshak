import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Badge } from '../components/ui/Badge';
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
} from 'lucide-react';

export const Routes: React.FC = () => {
  const { routes, vehicles, openRouteComparisonForIncident } = useFleet();
  const [selectedRouteVehicleId, setSelectedRouteVehicleId] = useState<string>('V01');

  const activeRoute = routes.find((r) => r.vehicleId === selectedRouteVehicleId) || routes[0];
  const activeVehicle = vehicles.find((v) => v.id === activeRoute.vehicleId);

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

        <button
          onClick={() => openRouteComparisonForIncident()}
          className="h-8 px-3.5 rounded-lg bg-ai-intelligence hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Compare Before vs After Plan</span>
        </button>
      </div>

      {/* Vehicle Route Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {vehicles.map((v) => {
          const isSelected = v.id === selectedRouteVehicleId;
          const route = routes.find((r) => r.vehicleId === v.id);

          return (
            <button
              key={v.id}
              onClick={() => setSelectedRouteVehicleId(v.id)}
              className={`p-3 rounded-xl border text-left min-w-[200px] transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-primary-container text-white border-primary-container shadow-xs'
                  : 'bg-surface-main text-deep-navy border-border-subtle hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs"
                  style={{ backgroundColor: v.color, color: '#ffffff' }}
                >
                  {v.id}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold truncate max-w-[100px]">{v.driverName}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-text-muted'}`}>
                    {route?.stops.length || 0} stops • {route?.totalDistanceKm || 0} km
                  </span>
                </div>
              </div>
              <Badge status={v.status} type="vehicle" />
            </button>
          );
        })}
      </div>

      {/* Route Detail Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 8 cols: Sequence Itinerary Timeline */}
        <div className="lg:col-span-8 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <RouteIcon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-deep-navy">
                Sequence Manifest: Vehicle {activeRoute.vehicleId} ({activeRoute.driverName})
              </h2>
            </div>
            {activeRoute.status === 'REOPTIMISED' && (
              <span className="px-2 py-0.5 rounded bg-purple-100 text-ai-intelligence text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Re-optimised Corridor
              </span>
            )}
          </div>

          {activeRoute.updatedReason && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-950 font-medium">
              ⚡ <strong>Route Updated:</strong> {activeRoute.updatedReason}
            </div>
          )}

          {/* Sequential Timeline */}
          <div className="space-y-3 relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-container">
            {activeRoute.stops.map((stop, idx) => {
              const isAbsorbed = !!stop.absorbedFromVehicleId;

              return (
                <div
                  key={idx}
                  className={`relative p-4 rounded-xl border transition-all ${
                    isAbsorbed
                      ? 'bg-purple-50/70 border-purple-300 shadow-xs'
                      : stop.completed
                      ? 'bg-surface-container-low/60 border-border-subtle opacity-75'
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
                        : 'bg-primary-container text-white'
                    }`}
                  >
                    {stop.stopNumber}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-deep-navy">{stop.name}</span>
                        {stop.orderId && (
                          <span className="font-mono text-[10px] bg-surface-container px-1.5 py-0.2 rounded font-semibold text-text-secondary">
                            {stop.orderId}
                          </span>
                        )}
                        {isAbsorbed && (
                          <span className="bg-ai-intelligence text-white text-[9px] font-bold uppercase px-1.5 py-0.2 rounded">
                            Absorbed from {stop.absorbedFromVehicleId}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5">{stop.address}</p>
                      <span className="font-mono text-[10px] text-text-muted mt-1 inline-block">
                        Coords: {stop.lat.toFixed(4)}° N, {stop.lng.toFixed(4)}° E
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-deep-navy">{stop.eta}</div>
                      <span
                        className={`text-[10px] font-semibold ${
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
        </div>

        {/* Right 4 cols: Cost & Energy Expenditure Breakdown */}
        <div className="lg:col-span-4 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
            <h3 className="text-xs font-bold text-deep-navy uppercase tracking-wider">
              Route Economics (₹)
            </h3>
            <span className="font-mono text-xs font-bold text-primary">
              ₹{activeRoute.estimatedCostInr.toLocaleString()} Total
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-border-subtle/60">
              <span className="text-text-secondary">Fuel & Energy:</span>
              <span className="font-mono font-bold text-deep-navy">₹{activeRoute.fuelCostInr}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle/60">
              <span className="text-text-secondary">Driver Wages (Shift):</span>
              <span className="font-mono font-bold text-deep-navy">₹{activeRoute.driverWageInr}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle/60">
              <span className="text-text-secondary">Municipal Toll Allocations:</span>
              <span className="font-mono font-bold text-deep-navy">₹{activeRoute.tollCostInr}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle/60">
              <span className="text-text-secondary">Total Trajectory Distance:</span>
              <span className="font-mono font-bold text-deep-navy">{activeRoute.totalDistanceKm} km</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle/60">
              <span className="text-text-secondary">SLA Compliance Window:</span>
              <span className="font-mono font-bold text-status-success">{activeRoute.slaCompliancePct}%</span>
            </div>
          </div>

          <button
            onClick={() => openRouteComparisonForIncident()}
            className="w-full mt-2 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-deep-navy text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Inspect Route Diff</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
