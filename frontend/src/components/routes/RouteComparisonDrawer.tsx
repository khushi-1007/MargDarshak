import React from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  X,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Clock,
  ShieldCheck,
  Fuel,
  GitCompare,
} from 'lucide-react';

export const RouteComparisonDrawer: React.FC = () => {
  const {
    routeComparisonOpen,
    setRouteComparisonOpen,
    routeComparisonData,
  } = useFleet();

  if (!routeComparisonOpen || !routeComparisonData) return null;

  const {
    incidentTitle,
    reason,
    originalRoute,
    optimisedRoute,
    delta,
  } = routeComparisonData;

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Dark Backdrop */}
      <div
        onClick={() => setRouteComparisonOpen(false)}
        className="fixed inset-0 bg-nav-command/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Surface */}
      <div className="relative w-full max-w-xl bg-surface-main h-full shadow-2xl flex flex-col justify-between z-10 overflow-hidden border-l border-border-subtle animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 bg-surface-container-low border-b border-border-subtle flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-status-critical text-white text-[10px] font-bold uppercase tracking-wider">
                INCIDENT RESPONSE AUDIT
              </span>
              <span className="font-mono text-[11px] text-text-muted">ID: DIS-JP-094</span>
            </div>
            <h3 className="text-base font-bold text-deep-navy mt-1">{incidentTitle}</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Deterministic Multi-Constraint VRP Reassignment Delta
            </p>
          </div>
          <button
            onClick={() => setRouteComparisonOpen(false)}
            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-container hover:text-deep-navy transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
          {/* Algorithmic Justification */}
          <div className="p-3.5 rounded-xl bg-purple-50/90 border border-purple-200 text-purple-950 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-ai-intelligence text-xs">
              <Brain className="w-4 h-4" />
              <span>Algorithmic Solver Decision Logic:</span>
            </div>
            <p className="text-xs leading-relaxed text-deep-navy">{reason}</p>
          </div>

          {/* Before vs After Visual Comparison Tiles */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              Operational Trajectory Delta
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Previous / Before State */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col gap-2">
                <span className="text-[10px] font-bold text-status-critical uppercase tracking-wider">
                  ORIGINAL PLAN (STALLED)
                </span>
                <div className="font-mono text-xs text-deep-navy font-semibold">
                  {originalRoute.sequence.map((seq, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-text-muted">•</span>
                      <span className={seq.includes('Stall') ? 'text-status-critical font-bold' : ''}>{seq}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border-subtle/60 text-[11px] space-y-0.5 text-text-secondary">
                  <div>Distance: <strong className="text-deep-navy font-mono">{originalRoute.distanceKm} km</strong></div>
                  <div>Duration: <strong className="text-deep-navy font-mono">{originalRoute.durationMin} mins</strong></div>
                  <div className="text-status-critical font-semibold">Potential SLA Breaches: {originalRoute.slaBreaches}</div>
                </div>
              </div>

              {/* After / Optimised State */}
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-ai-intelligence uppercase tracking-wider">
                  OPTIMISED PLAN (DISPATCHED)
                </span>
                <div className="font-mono text-xs text-deep-navy font-semibold">
                  {optimisedRoute.sequence.map((seq, i) => (
                    <div key={i} className="flex items-center gap-1 text-purple-950">
                      <span className="text-ai-intelligence">•</span>
                      <span>{seq}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-purple-200/60 text-[11px] space-y-0.5 text-text-secondary">
                  <div>Distance: <strong className="text-deep-navy font-mono">{optimisedRoute.distanceKm} km</strong></div>
                  <div>Duration: <strong className="text-deep-navy font-mono">{optimisedRoute.durationMin} mins</strong></div>
                  <div className="text-status-success font-semibold">Guaranteed SLA Breaches: {optimisedRoute.slaBreaches}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quantitative Audit Delta Metrics Grid */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              Auditable Impact Summary
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle text-center">
                <span className="text-[10px] text-text-muted uppercase block">Distance Delta</span>
                <span className="text-sm font-bold font-mono text-deep-navy mt-0.5 block">
                  +{delta.distanceDeltaKm} km
                </span>
                <span className="text-[10px] text-text-muted">Detour path</span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-800 uppercase block">Delay Avoided</span>
                <span className="text-sm font-bold font-mono text-status-success mt-0.5 block">
                  -{delta.delayAvoidedMinutes} mins
                </span>
                <span className="text-[10px] text-status-success">100% SLA Saved</span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-low border border-border-subtle text-center">
                <span className="text-[10px] text-text-muted uppercase block">Marginal Cost</span>
                <span className="text-sm font-bold font-mono text-deep-navy mt-0.5 block">
                  ₹{delta.marginalCostInr}
                </span>
                <span className="text-[10px] text-text-muted">Fuel & Wages</span>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-center">
                <span className="text-[10px] text-purple-800 uppercase block">Driver Window</span>
                <span className="text-sm font-bold text-ai-intelligence mt-0.5 block truncate">
                  {delta.driverWindowStatus}
                </span>
                <span className="text-[10px] text-purple-800">Legal Shift</span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Computational Progression Tree */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              Deterministic Engine Steps
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-status-success">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>1. Telemetry fault signal ingested & verified</span>
              </div>
              <div className="flex items-center gap-2 text-status-success">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>2. Cold-chain & capacity limits validated on neighbor units</span>
              </div>
              <div className="flex items-center gap-2 text-ai-intelligence font-semibold">
                <Brain className="w-4 h-4 shrink-0" />
                <span>3. Candidate path re-weighting with spatial avoidances</span>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>4. Updated routing instructions broadcast to driver mobile cab</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-container-low border-t border-border-subtle flex items-center justify-end gap-2.5">
          <button
            onClick={() => setRouteComparisonOpen(false)}
            className="px-4 py-2 rounded-xl bg-white hover:bg-surface-container text-deep-navy text-xs font-semibold border border-border-subtle transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              setRouteComparisonOpen(false);
              alert('Operational dispatch committed. Driver route manifests updated.');
            }}
            className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Commit & Dispatch Drivers</span>
          </button>
        </div>
      </div>
    </div>
  );
};
