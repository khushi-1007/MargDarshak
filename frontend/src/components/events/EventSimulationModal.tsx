import React from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  Zap,
  AlertTriangle,
  CloudRain,
  AlertOctagon,
  PackagePlus,
  Compass,
  X,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const EventSimulationModal: React.FC = () => {
  const {
    simulationModalOpen,
    setSimulationModalOpen,
    triggerDisruption,
    injectPriorityOrder,
    activeJourneyStep,
    advanceJourneyStep,
    resetToBaseline,
    isOptimising,
  } = useFleet();

  if (!simulationModalOpen) return null;

  const journeySteps = [
    { step: 1, title: 'Normal Baseline Operations', desc: '4 active vehicles, 15 orders on track across Jaipur.' },
    { step: 2, title: 'Traffic Disruption', desc: 'Congestion on Malviya Nagar / Calgiri Marg (+14m delay avoided).' },
    { step: 3, title: 'Urgent Order Insertion', desc: 'Emergency consignment P-101 inserted into optimal route.' },
    { step: 4, title: 'Vehicle Breakdown (V03)', desc: 'Stalls near C-Scheme; 3 orders reassigned to V01 & V04.' },
    { step: 5, title: 'Cascading Failure (V01 Stalls)', desc: '2nd breakdown causes infeasibility: 8 on-time, 4 late, 3 unserviceable.' },
    { step: 6, title: 'Recovery via Standby V05', desc: 'Sitapura reserve deployed; 98.2% SLA restored without breach.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        onClick={() => setSimulationModalOpen(false)}
        className="fixed inset-0 bg-nav-command/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Surface */}
      <div className="relative bg-surface-main rounded-2xl shadow-2xl border border-border-subtle p-6 w-full max-w-xl z-10 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ai-intelligence/15 text-ai-intelligence flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-deep-navy">Operational Stress-Testing Lab</h3>
              <p className="text-xs text-text-muted">
                Trigger real-world disruptions to observe MargDarshak deterministic re-solver
              </p>
            </div>
          </div>
          <button
            onClick={() => setSimulationModalOpen(false)}
            className="p-1 rounded text-text-muted hover:text-deep-navy hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guided Hackathon Demo Stepper Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 border border-purple-200 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-ai-intelligence" />
              <span>Full Demo Storyline Controller</span>
            </span>
            <span className="font-mono text-[11px] font-semibold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
              Stage {activeJourneyStep} / 6
            </span>
          </div>
          <p className="text-xs text-purple-950 font-medium">
            {journeySteps[activeJourneyStep - 1]?.title}:{' '}
            <span className="text-purple-800 font-normal">
              {journeySteps[activeJourneyStep - 1]?.desc}
            </span>
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={async () => {
                await advanceJourneyStep();
                setSimulationModalOpen(false);
              }}
              disabled={isOptimising}
              className="flex-1 py-1.5 px-3 bg-ai-intelligence hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Advance to Next Story Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => resetToBaseline()}
              className="py-1.5 px-3 bg-white hover:bg-surface-container text-text-secondary rounded-lg text-xs font-medium border border-purple-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Individual Disruption Event Triggers */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Or Trigger Individual Operational Events
          </span>

          {/* Event 1: Traffic Bottleneck */}
          <button
            onClick={async () => {
              await triggerDisruption('TRAFFIC');
              setSimulationModalOpen(false);
            }}
            className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors border border-transparent hover:border-border-subtle"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-deep-navy">Traffic Disruption (Malviya Nagar)</span>
                <span className="text-[11px] text-text-muted mt-0.5">
                  Simulate speed drop to 12 km/h on Calgiri Marg. Observes +8m delta rerouting.
                </span>
              </div>
            </div>
            <Play className="w-4 h-4 text-primary shrink-0" />
          </button>

          {/* Event 2: Urgent Order Insertion */}
          <button
            onClick={async () => {
              await injectPriorityOrder();
              setSimulationModalOpen(false);
            }}
            className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors border border-transparent hover:border-border-subtle"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-status-critical flex items-center justify-center shrink-0 mt-0.5">
                <PackagePlus className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-deep-navy">Urgent Order Insertion (P-101)</span>
                <span className="text-[11px] text-text-muted mt-0.5">
                  Emergency surgical parts for Fortis Escorts Hospital (Deadline 12:30 PM).
                </span>
              </div>
            </div>
            <Play className="w-4 h-4 text-primary shrink-0" />
          </button>

          {/* Event 3: Vehicle Breakdown V03 */}
          <button
            onClick={async () => {
              await triggerDisruption('VEHICLE_BREAKDOWN');
              setSimulationModalOpen(false);
            }}
            className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors border border-transparent hover:border-border-subtle"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-status-critical flex items-center justify-center shrink-0 mt-0.5">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-deep-navy">Vehicle V03 Breakdown (C-Scheme)</span>
                <span className="text-[11px] text-text-muted mt-0.5">
                  Alternator failure. 3 orders reassigned between V01 and V04.
                </span>
              </div>
            </div>
            <Play className="w-4 h-4 text-status-critical shrink-0" />
          </button>

          {/* Event 4: Cascading Breakdown V01 */}
          <button
            onClick={async () => {
              await triggerDisruption('CASCADING_BREAKDOWN');
              setSimulationModalOpen(false);
            }}
            className="p-3 rounded-xl bg-error-container/40 hover:bg-error-container/70 text-left flex items-center justify-between transition-colors border border-status-critical/30"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-status-critical text-white flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-status-critical">
                  Cascading Failure: 2nd Breakdown (V01)
                </span>
                <span className="text-[11px] text-deep-navy mt-0.5">
                  Overwhelms fleet capacity. Demonstrates Green / Yellow / Red order classification.
                </span>
              </div>
            </div>
            <Play className="w-4 h-4 text-status-critical shrink-0" />
          </button>

          {/* Event 5: Weather Disruption */}
          <button
            onClick={async () => {
              await triggerDisruption('WEATHER');
              setSimulationModalOpen(false);
            }}
            className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-left flex items-center justify-between transition-colors border border-transparent hover:border-border-subtle"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-status-info flex items-center justify-center shrink-0 mt-0.5">
                <CloudRain className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-deep-navy">Heavy Monsoon Ingestion</span>
                <span className="text-[11px] text-text-muted mt-0.5">
                  +15% travel time penalty applied to wet road corridors.
                </span>
              </div>
            </div>
            <Play className="w-4 h-4 text-primary shrink-0" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
          <button
            onClick={() => setSimulationModalOpen(false)}
            className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-deep-navy transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
