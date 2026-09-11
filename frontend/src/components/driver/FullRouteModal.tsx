import React from 'react';
import { X, MapPin, CheckCircle2, Clock, Route as RouteIcon, Truck, Building2 } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

interface FullRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullRouteModal: React.FC<FullRouteModalProps> = ({ isOpen, onClose }) => {
  const { activeDriverRoute, activeDriver, activeDriverVehicle } = useFleet();

  if (!isOpen) return null;

  const stops = activeDriverRoute?.stops || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="bg-surface-main w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center">
              <RouteIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Full Shift Route Itinerary</h3>
              <p className="text-[11px] text-slate-400">
                Vehicle: {activeDriverVehicle?.id} ({activeDriverVehicle?.name}) • Pilot: {activeDriver.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Route Metrics Summary Bar */}
        <div className="grid grid-cols-4 gap-2 px-6 py-3 bg-surface-container-low border-b border-border-subtle text-xs">
          <div>
            <span className="text-text-muted text-[10px] uppercase font-semibold">Total Distance</span>
            <div className="font-mono font-bold text-deep-navy text-sm">
              {activeDriverRoute?.totalDistanceKm || 24.6} km
            </div>
          </div>
          <div>
            <span className="text-text-muted text-[10px] uppercase font-semibold">Stops Manifest</span>
            <div className="font-mono font-bold text-deep-navy text-sm">{stops.length + 2} Legs</div>
          </div>
          <div>
            <span className="text-text-muted text-[10px] uppercase font-semibold">Est. Drive Time</span>
            <div className="font-mono font-bold text-deep-navy text-sm">
              {activeDriverRoute?.totalDurationMinutes || 145} mins
            </div>
          </div>
          <div>
            <span className="text-text-muted text-[10px] uppercase font-semibold">SLA Compliance</span>
            <div className="font-mono font-bold text-status-success text-sm">98.4%</div>
          </div>
        </div>

        {/* Stops List */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
          {/* Depot Start */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-status-success text-white flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <div>
                <span className="font-bold text-deep-navy">1. Depot Departure</span>
                <p className="text-[11px] text-text-secondary mt-0.5">{activeDriver.depot}</p>
              </div>
            </div>
            <span className="font-mono text-text-muted text-xs">08:00 AM</span>
          </div>

          {/* Stops */}
          {stops.map((stop, idx) => (
            <div
              key={`full-${stop.orderId || idx}-${idx}`}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                stop.completed
                  ? 'bg-slate-50/80 border-slate-200'
                  : 'bg-white border-border-subtle hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    stop.completed
                      ? 'bg-status-success text-white'
                      : 'bg-primary-container text-white'
                  }`}
                >
                  {stop.completed ? '✓' : idx + 2}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-deep-navy truncate">
                      {stop.orderId || `Leg #${idx + 2}`}
                    </span>
                    <span className="font-bold text-deep-navy truncate">— {stop.name}</span>
                    {stop.isPriority && (
                      <span className="px-1.5 py-0.2 rounded bg-status-critical/15 text-status-critical font-bold text-[9px]">
                        URGENT
                      </span>
                    )}
                    {stop.absorbedFromVehicleId && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-100 text-ai-intelligence font-bold text-[9px]">
                        Absorbed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5 truncate">{stop.address}, Jaipur</p>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 pl-3">
                <span className="font-mono font-bold text-deep-navy text-xs">{stop.eta}</span>
                <span
                  className={`text-[10px] font-semibold mt-0.5 ${
                    stop.completed ? 'text-status-success' : 'text-primary'
                  }`}
                >
                  {stop.completed ? 'Completed' : 'Pending'}
                </span>
              </div>
            </div>
          ))}

          {/* Depot Return */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                {stops.length + 2}
              </div>
              <div>
                <span className="font-bold text-deep-navy">Final Return to Depot</span>
                <p className="text-[11px] text-text-secondary mt-0.5">{activeDriver.depot}</p>
              </div>
            </div>
            <span className="font-mono text-text-muted text-xs">05:00 PM</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-border-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-deep-navy font-bold text-xs transition-colors"
          >
            Close Manifest
          </button>
        </div>
      </div>
    </div>
  );
};
