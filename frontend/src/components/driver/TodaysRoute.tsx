import React from 'react';
import { CheckCircle2, Circle, MapPin, Clock, ArrowRight, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

interface TodaysRouteProps {
  onOpenFullRoute: () => void;
}

export const TodaysRoute: React.FC<TodaysRouteProps> = ({ onOpenFullRoute }) => {
  const { activeDriverRoute, activeDriver, currentStopIndex } = useFleet();

  const stops = activeDriverRoute?.stops || [];

  return (
    <div className="bg-surface-main rounded-2xl border border-border-subtle shadow-xs p-4 flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-deep-navy">Today's Route</h2>
            <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold">
              {activeDriverRoute?.id ? (activeDriverRoute.id.length > 8 ? 'R-01' : activeDriverRoute.id) : 'R-V01'}
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            {stops.filter((s) => s.completed).length} of {stops.length} stops completed
          </p>
        </div>

        <span className="text-[11px] font-mono text-text-secondary bg-surface-container px-2 py-0.5 rounded">
          {activeDriverRoute?.totalDistanceKm || 24.6} km
        </span>
      </div>

      {/* Vertical Timeline List */}
      <div className="flex-1 overflow-y-auto py-3 pr-1 flex flex-col gap-3 min-h-[320px] max-h-[560px]">
        {/* 1. Depot Start Stop */}
        <div className="flex items-start gap-3 relative">
          {/* Vertical connecting line */}
          <div className="absolute left-3.5 top-6 bottom-0 w-0.5 bg-emerald-300" />

          {/* Indicator Dot */}
          <div className="w-7 h-7 rounded-full bg-status-success text-white flex items-center justify-center shrink-0 z-10 shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>

          {/* Card */}
          <div className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-deep-navy">1. Depot (Start)</span>
              <span className="text-[10px] font-mono text-text-muted">08:00 AM</span>
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5 truncate">
              {activeDriver.depot || 'Sitapura Logistics Hub, Jaipur'}
            </p>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-status-success">
              <span>Completed</span>
            </div>
          </div>
        </div>

        {/* Dynamic Stops */}
        {stops.map((stop, index) => {
          const isCurrent = index === currentStopIndex;
          const isCompleted = stop.completed;
          const isUpcoming = !isCompleted && !isCurrent;
          const displaySeq = index + 2;

          return (
            <div key={`${stop.orderId || index}-${index}`} className="flex items-start gap-3 relative">
              {/* Timeline Connector Line */}
              {index < stops.length - 1 && (
                <div
                  className={`absolute left-3.5 top-6 bottom-0 w-0.5 ${
                    isCompleted ? 'bg-emerald-300' : 'bg-slate-200'
                  }`}
                />
              )}

              {/* Status Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs shadow-xs transition-all ${
                  isCompleted
                    ? 'bg-status-success text-white'
                    : isCurrent
                    ? 'bg-primary-container text-white ring-4 ring-blue-100 animate-pulse'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span>{displaySeq}</span>
                )}
              </div>

              {/* Stop Card */}
              <div
                className={`flex-1 p-2.5 rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? 'bg-blue-50/80 border-primary-container shadow-xs ring-1 ring-primary/20'
                    : isCompleted
                    ? 'bg-slate-50/70 border-slate-200/80'
                    : 'bg-white border-border-subtle hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-deep-navy truncate">
                      {stop.orderId || `Stop #${displaySeq}`}
                    </span>
                    {stop.isPriority && (
                      <span className="px-1.5 py-0.2 rounded bg-red-100 text-status-critical font-mono text-[9px] font-bold">
                        URGENT
                      </span>
                    )}
                    {stop.absorbedFromVehicleId && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-100 text-ai-intelligence font-mono text-[9px] font-bold">
                        ABSORBED
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-text-muted shrink-0">
                    {stop.eta}
                  </span>
                </div>

                <p className="font-semibold text-deep-navy text-[11px] mt-1 truncate">
                  {stop.name}
                </p>
                <p className="text-[10px] text-text-muted truncate mt-0.5">
                  {stop.address}
                </p>

                {/* Status indicator tag */}
                <div className="mt-1.5 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-status-success/15 text-status-success'
                        : isCurrent
                        ? 'bg-primary-container text-white font-bold'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? 'Completed' : isCurrent ? 'Current Stop' : 'Upcoming'}
                  </span>

                  {isCurrent && (
                    <span className="text-[10px] font-bold text-primary-container flex items-center gap-1">
                      <Navigation className="w-2.5 h-2.5" /> Next Destination
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Final Depot End Stop */}
        <div className="flex items-start gap-3 relative">
          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 z-10 text-xs font-bold">
            <span>{stops.length + 2}</span>
          </div>

          <div className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-deep-navy">Depot (Return)</span>
              <span className="text-[10px] font-mono text-text-muted">05:00 PM</span>
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5 truncate">
              {activeDriver.depot || 'Sitapura Logistics Hub, Jaipur'}
            </p>
            <div className="mt-1 text-[10px] text-text-muted font-medium">
              Upcoming • Final Hub Check-in
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action: VIEW FULL ROUTE */}
      <div className="pt-3 border-t border-border-subtle mt-auto">
        <button
          onClick={onOpenFullRoute}
          type="button"
          className="w-full py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container text-deep-navy text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 shadow-xs"
        >
          <span>VIEW FULL ROUTE</span>
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
        </button>
      </div>
    </div>
  );
};
