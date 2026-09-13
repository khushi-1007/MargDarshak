import React, { useState, useEffect } from 'react';
import { useFleet } from '../context/FleetContext';
import { useTranslation } from '../context/LanguageContext';
import { api } from '../services/api';
import { WhatIfKnobs, WhatIfScenarioComparison } from '../types/scenario';
import {
  FlaskConical,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Brain,
  TrendingDown,
  TrendingUp,
  Bolt,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

const formatDelta = (diff: number) => {
  if (diff > 0) return `+₹${diff.toLocaleString()}`;
  if (diff < 0) return `-₹${Math.abs(diff).toLocaleString()}`;
  return '₹0';
};

export const WhatIf: React.FC = () => {
  const { triggerDisruption, executeRecoveryAction } = useFleet();
  const { t } = useTranslation();

  const [knobs, setKnobs] = useState<WhatIfKnobs>({
    removeVehicleV04: true,
    addStandbyV05: false,
    addUrgentOrder: false,
    simulateRoadClosure: false,
    tightenDeliveryWindows: false,
    fuelCostMultiplier: 1.0,
    overtimeLimitHours: 2.0,
    slaPenaltyPerBreachInr: 400,
  });

  const [comparison, setComparison] = useState<WhatIfScenarioComparison | null>(null);
  const [computing, setComputing] = useState<boolean>(false);

  useEffect(() => {
    async function recompute() {
      setComputing(true);
      const res = await api.runWhatIfScenario(knobs);
      setComparison(res);
      setComputing(false);
    }
    recompute();
  }, [knobs]);

  const handleApplyToLive = () => {
    const ok = window.confirm(
      'SECURITY CONFIRMATION:\n\nYou are about to apply this simulated plan to the LIVE Rajasthan Logistics fleet dispatch queue. Proceed with deployment?'
    );
    if (ok) {
      if (knobs.removeVehicleV04) {
        triggerDisruption('CASCADING_BREAKDOWN');
      }
      if (knobs.addStandbyV05) {
        executeRecoveryAction('STANDBY_V05');
      }
      alert('Simulated scenario applied to active fleet operations.');
    }
  };

  const handleReset = () => {
    setKnobs({
      removeVehicleV04: false,
      addStandbyV05: false,
      addUrgentOrder: false,
      simulateRoadClosure: false,
      tightenDeliveryWindows: false,
      fuelCostMultiplier: 1.0,
      overtimeLimitHours: 2.0,
      slaPenaltyPerBreachInr: 400,
    });
  };

  if (!comparison) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-ai-intelligence/15 border border-ai-intelligence/30 flex items-center justify-center">
          <FlaskConical className="w-7 h-7 text-ai-intelligence animate-pulse" />
        </div>
        <div>
          <h2 className="text-base font-bold text-deep-navy">Computing What-If Simulation Sandbox</h2>
          <p className="text-xs text-text-secondary mt-1">Executing Google OR-Tools constraint solver on fleet baseline...</p>
        </div>
      </div>
    );
  }

  const { baseline, simulated, recommendation, mitigationStrategy } = comparison;

  return (
    <div className="p-6 max-w-[1720px] mx-auto w-full flex flex-col gap-5 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-ai-intelligence/15 text-ai-intelligence font-mono text-[11px] font-bold uppercase">
              DECISION TWIN LABORATORY
            </span>
            <span className="text-xs font-mono text-text-muted">• RUN #SIM-2024-8849</span>
          </div>
          <h1 className="text-xl font-bold text-deep-navy tracking-tight mt-1">
            {t('whatIf.title', 'What-If Simulator — Operational Decision Sandbox')}
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Stress-test vehicle downtime, unexpected priority spikes, and road network disruptions before committing to live drivers
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="h-8 px-3.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-deep-navy text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('common.reset', 'Reset Scenario')}</span>
          </button>

          <button
            onClick={handleApplyToLive}
            className="h-8 px-3.5 rounded-lg bg-status-critical hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Bolt className="w-3.5 h-3.5" />
            <span>Apply to Live Fleet</span>
          </button>
        </div>
      </div>

      {/* Interactive Simulation Knobs Bar */}
      <div className="bg-surface-main p-5 rounded-2xl border border-border-subtle shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-deep-navy uppercase tracking-wider">
              {t('whatIf.scenariosHeader', 'Active Simulation Knobs & Injection Vectors')}
            </span>
            <span className="text-[10px] font-mono bg-surface-container px-2 py-0.5 rounded text-text-muted">
              Jaipur Metro Grid
            </span>
          </div>
          {computing && (
            <span className="text-xs font-mono text-ai-intelligence flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-ai-intelligence animate-ping" />
              Solving VRP...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Knob 1: Remove Vehicle V04 */}
          <label className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
            knobs.removeVehicleV04
              ? 'bg-red-50/80 border-red-300'
              : 'bg-surface-container-low border-border-subtle hover:bg-surface-container'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-status-critical uppercase tracking-wider">
                Down Vehicle
              </span>
              <input
                type="checkbox"
                checked={knobs.removeVehicleV04}
                onChange={(e) => setKnobs({ ...knobs, removeVehicleV04: e.target.checked })}
                className="rounded text-status-critical focus:ring-0 cursor-pointer"
              />
            </div>
            <span className="text-xs font-bold text-deep-navy">Remove Vehicle V04</span>
            <span className="text-[10px] font-mono text-text-muted">Tata Ace • RJ-14-PA-6712</span>
          </label>

          {/* Knob 2: Add Standby V05 */}
          <label className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
            knobs.addStandbyV05
              ? 'bg-emerald-50/80 border-emerald-300'
              : 'bg-surface-container-low border-border-subtle hover:bg-surface-container'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-status-success uppercase tracking-wider">
                Depot Buffer
              </span>
              <input
                type="checkbox"
                checked={knobs.addStandbyV05}
                onChange={(e) => setKnobs({ ...knobs, addStandbyV05: e.target.checked })}
                className="rounded text-status-success focus:ring-0 cursor-pointer"
              />
            </div>
            <span className="text-xs font-bold text-deep-navy">Add Standby V05</span>
            <span className="text-[10px] font-mono text-text-muted">Eicher Pro 2049 • Sitapura</span>
          </label>

          {/* Knob 3: Urgent Priority Order */}
          <label className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
            knobs.addUrgentOrder
              ? 'bg-amber-50/80 border-amber-300'
              : 'bg-surface-container-low border-border-subtle hover:bg-surface-container'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-status-warning uppercase tracking-wider">
                Dynamic Order
              </span>
              <input
                type="checkbox"
                checked={knobs.addUrgentOrder}
                onChange={(e) => setKnobs({ ...knobs, addUrgentOrder: e.target.checked })}
                className="rounded text-status-warning focus:ring-0 cursor-pointer"
              />
            </div>
            <span className="text-xs font-bold text-deep-navy">Add Urgent Order</span>
            <span className="text-[10px] font-mono text-text-muted">+45kg Fortis Malviya Nagar</span>
          </label>

          {/* Knob 4: Road Closure */}
          <label className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
            knobs.simulateRoadClosure
              ? 'bg-red-50/80 border-red-300'
              : 'bg-surface-container-low border-border-subtle hover:bg-surface-container'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-status-critical uppercase tracking-wider">
                Chokepoint
              </span>
              <input
                type="checkbox"
                checked={knobs.simulateRoadClosure}
                onChange={(e) => setKnobs({ ...knobs, simulateRoadClosure: e.target.checked })}
                className="rounded text-status-critical focus:ring-0 cursor-pointer"
              />
            </div>
            <span className="text-xs font-bold text-deep-navy">Close Tonk Road</span>
            <span className="text-[10px] font-mono text-text-muted">Flyover Bypass Maintenance</span>
          </label>

          {/* Knob 5: Strict Delivery Windows */}
          <label className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
            knobs.tightenDeliveryWindows
              ? 'bg-purple-50/80 border-purple-300'
              : 'bg-surface-container-low border-border-subtle hover:bg-surface-container'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-ai-intelligence uppercase tracking-wider">
                Strict SLA
              </span>
              <input
                type="checkbox"
                checked={knobs.tightenDeliveryWindows}
                onChange={(e) => setKnobs({ ...knobs, tightenDeliveryWindows: e.target.checked })}
                className="rounded text-ai-intelligence focus:ring-0 cursor-pointer"
              />
            </div>
            <span className="text-xs font-bold text-deep-navy">Tighten Delivery SLA</span>
            <span className="text-[10px] font-mono text-text-muted">±30m reduced to ±10m buffer</span>
          </label>
        </div>
      </div>

      {/* AI Heuristic Directive Banner */}
      <div className="bg-gradient-to-r from-nav-command via-[#161c30] to-nav-command text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-3xl">
          <div className="w-10 h-10 rounded-xl bg-ai-intelligence/30 flex items-center justify-center shrink-0 mt-0.5">
            <Brain className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-ai-intelligence text-white text-[10px] font-bold uppercase tracking-wider">
                AI HEURISTIC DIRECTIVE
              </span>
              <span className="text-[11px] font-mono text-slate-400">High Confidence (94.2%)</span>
            </div>
            <p className="text-xs text-slate-100 font-medium leading-relaxed mt-1">{recommendation}</p>
            <p className="text-[11px] text-slate-300 mt-0.5">{mitigationStrategy}</p>
          </div>
        </div>

        <button
          onClick={() => setKnobs({ ...knobs, addStandbyV05: true })}
          className="h-8 px-4 rounded-xl bg-ai-intelligence hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap shrink-0"
        >
          Simulate Standby V05
        </button>
      </div>

      {/* Side-by-Side Plan Comparison (Baseline vs Simulated) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CARD A: Baseline */}
        <div className="bg-surface-main rounded-2xl p-5 border border-border-subtle shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-secondary-container" />
                <h3 className="text-sm font-bold text-deep-navy uppercase tracking-tight">
                  Plan A: Baseline Operations
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-status-success/15 text-status-success text-xs font-semibold">
                100% Feasible
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3">
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Operating Cost</span>
                <span className="text-xl font-bold font-mono text-deep-navy mt-1 block">
                  ₹{baseline.totalCostInr.toLocaleString()}
                </span>
                <span className="text-[10px] text-text-muted font-mono">Budget target ok</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Total Distance</span>
                <span className="text-xl font-bold font-mono text-deep-navy mt-1 block">
                  {baseline.totalDistanceKm} km
                </span>
                <span className="text-[10px] text-text-muted font-mono">Jaipur aggregate</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Late Orders / SLA</span>
                <span className="text-xl font-bold font-mono text-status-success mt-1 block">
                  {baseline.lateOrdersCount} ({baseline.onTimeSlaPct}%)
                </span>
                <span className="text-[10px] text-text-muted font-mono">1 minor window breach</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Fleet Utilisation</span>
                <span className="text-xl font-bold font-mono text-deep-navy mt-1 block">
                  {baseline.fleetUtilizationPct}%
                </span>
                <span className="text-[10px] text-status-success font-semibold">Safe operating zone</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Active Vehicles</span>
                <span className="text-xl font-bold font-mono text-deep-navy mt-1 block">
                  {baseline.activeVehiclesCount} units
                </span>
                <span className="text-[10px] text-text-muted font-mono">V01, V02, V03, V04</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Overtime Exposure</span>
                <span className="text-xl font-bold font-mono text-deep-navy mt-1 block">
                  {baseline.overtimeHours} hrs
                </span>
                <span className="text-[10px] text-status-success font-semibold">Standard shift legal</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
            <span className="font-mono text-[11px]">Snapshot: Current Live Dispatch (09:30 IST)</span>
            <span className="text-status-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active in-field
            </span>
          </div>
        </div>

        {/* CARD B: Simulated */}
        <div className="bg-surface-main rounded-2xl p-5 border border-border-subtle shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-status-critical animate-pulse" />
                <h3 className="text-sm font-bold text-deep-navy uppercase tracking-tight">
                  Plan B: Simulated Scenario
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                simulated.feasibilityStatus === 'FEASIBLE'
                  ? 'bg-status-success/15 text-status-success'
                  : 'bg-error-container text-status-critical'
              }`}>
                {simulated.feasibilityStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3">
              <div className="p-3 rounded-xl bg-surface-container-low">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-text-muted">Operating Cost</span>
                  {simulated.totalCostInr !== baseline.totalCostInr && (
                    <span className={`text-[10px] font-bold font-mono ${
                      simulated.totalCostInr > baseline.totalCostInr ? 'text-status-critical' : 'text-status-success'
                    }`}>
                      {formatDelta(simulated.totalCostInr - baseline.totalCostInr)}
                    </span>
                  )}
                </div>
                <span className="text-xl font-bold font-mono text-deep-navy mt-1 block">
                  ₹{simulated.totalCostInr.toLocaleString()}
                </span>
                <span className="text-[10px] text-text-muted font-mono">Simulated net delta</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-text-muted">Total Distance</span>
                  {simulated.totalDistanceKm !== baseline.totalDistanceKm && (
                    <span className={`text-[10px] font-bold font-mono ${
                      simulated.totalDistanceKm > baseline.totalDistanceKm ? 'text-status-warning' : 'text-status-success'
                    }`}>
                      {simulated.totalDistanceKm > baseline.totalDistanceKm
                        ? `+${(simulated.totalDistanceKm - baseline.totalDistanceKm).toFixed(1)} km`
                        : `-${(baseline.totalDistanceKm - simulated.totalDistanceKm).toFixed(1)} km`}
                    </span>
                  )}
                </div>
                <span className="text-xl font-bold font-mono text-deep-navy mt-1 block">
                  {simulated.totalDistanceKm} km
                </span>
                <span className="text-[10px] text-text-muted font-mono">Detour exposure</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-text-muted">Late Orders / SLA</span>
                  <span className="text-[10px] font-bold text-status-critical font-mono">
                    {simulated.lateOrdersCount} late
                  </span>
                </div>
                <span className={`text-xl font-bold font-mono mt-1 block ${
                  simulated.onTimeSlaPct < 90 ? 'text-status-critical' : 'text-status-success'
                }`}>
                  {simulated.onTimeSlaPct}%
                </span>
                <span className="text-[10px] text-text-muted font-mono">Predicted customer SLA</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Fleet Utilisation</span>
                <span className={`text-xl font-bold font-mono mt-1 block ${
                  simulated.fleetUtilizationPct > 90 ? 'text-status-critical' : 'text-deep-navy'
                }`}>
                  {simulated.fleetUtilizationPct}%
                </span>
                <span className="text-[10px] text-text-muted font-mono">
                  {simulated.fleetUtilizationPct > 90 ? 'Severe strain' : 'Nominal capacity'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Active Vehicles</span>
                <span className="text-xl font-bold font-mono text-deep-navy mt-1 block">
                  {simulated.activeVehiclesCount} units
                </span>
                <span className="text-[10px] text-text-muted font-mono">
                  {knobs.removeVehicleV04 && !knobs.addStandbyV05
                    ? 'V04 offline'
                    : knobs.addStandbyV05 && !knobs.removeVehicleV04
                    ? 'V05 added'
                    : knobs.removeVehicleV04 && knobs.addStandbyV05
                    ? 'V04 replaced by V05'
                    : 'Full deployment'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Overtime Exposure</span>
                <span className={`text-xl font-bold font-mono mt-1 block ${
                  simulated.overtimeHours > 2.0 ? 'text-status-critical' : 'text-deep-navy'
                }`}>
                  {simulated.overtimeHours} hrs
                </span>
                <span className="text-[10px] text-text-muted font-mono">Driver fatigue limit</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
            <span className="font-mono text-[11px]">Computed by OR-Tools v9.6</span>
            <span className="text-ai-intelligence font-semibold flex items-center gap-1">
              Sandbox Isolated (Not in production)
            </span>
          </div>
        </div>
      </div>

      {/* Financial & Risk Cost Delta Breakdown Table */}
      <div className="bg-surface-main rounded-2xl p-5 border border-border-subtle shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <h3 className="text-xs font-bold text-deep-navy uppercase tracking-wider">
            Cost & SLA Financial Delta Analysis (INR ₹)
          </h3>
          <span className="text-[11px] font-mono text-text-muted">
            Variance: {formatDelta(simulated.totalCostInr - baseline.totalCostInr)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-text-secondary font-semibold uppercase text-[11px] border-b border-border-subtle">
                <th className="py-2.5 px-3">Expense Component</th>
                <th className="py-2.5 px-3 text-right">Baseline Plan</th>
                <th className="py-2.5 px-3 text-right">Simulated Plan</th>
                <th className="py-2.5 px-3 text-right">Variance Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 font-mono text-xs">
              <tr className="hover:bg-surface-container-low">
                <td className="py-2.5 px-3 text-deep-navy font-sans font-medium">Fuel & Energy Burn</td>
                <td className="py-2.5 px-3 text-right text-text-muted">₹{baseline.fuelCostInr.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right text-deep-navy">₹{simulated.fuelCostInr.toLocaleString()}</td>
                <td className={`py-2.5 px-3 text-right font-bold ${
                  simulated.fuelCostInr > baseline.fuelCostInr ? 'text-status-warning' : 'text-status-success'
                }`}>
                  {formatDelta(simulated.fuelCostInr - baseline.fuelCostInr)}
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low">
                <td className="py-2.5 px-3 text-deep-navy font-sans font-medium">Driver Wages & Overtime</td>
                <td className="py-2.5 px-3 text-right text-text-muted">₹{baseline.wagesInr.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right text-deep-navy">₹{simulated.wagesInr.toLocaleString()}</td>
                <td className={`py-2.5 px-3 text-right font-bold ${
                  simulated.wagesInr > baseline.wagesInr ? 'text-status-critical' : 'text-status-success'
                }`}>
                  {formatDelta(simulated.wagesInr - baseline.wagesInr)}
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low">
                <td className="py-2.5 px-3 text-deep-navy font-sans font-medium">Asset Maintenance Allocation</td>
                <td className="py-2.5 px-3 text-right text-text-muted">₹{baseline.maintenanceInr.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right text-deep-navy">₹{simulated.maintenanceInr.toLocaleString()}</td>
                <td className={`py-2.5 px-3 text-right font-bold ${
                  simulated.maintenanceInr > baseline.maintenanceInr ? 'text-status-warning' : 'text-status-success'
                }`}>
                  {formatDelta(simulated.maintenanceInr - baseline.maintenanceInr)}
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low bg-error-container/20">
                <td className="py-2.5 px-3 text-status-critical font-sans font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Contractual SLA Breach Penalties</span>
                </td>
                <td className="py-2.5 px-3 text-right text-text-muted">₹{baseline.slaPenaltyInr}</td>
                <td className="py-2.5 px-3 text-right text-status-critical font-bold">₹{simulated.slaPenaltyInr}</td>
                <td className="py-2.5 px-3 text-right text-status-critical font-bold">
                  {formatDelta(simulated.slaPenaltyInr - baseline.slaPenaltyInr)}
                </td>
              </tr>
              <tr className="bg-surface-container font-bold text-deep-navy">
                <td className="py-3 px-3 font-sans">NET TOTAL EXPENDITURE</td>
                <td className="py-3 px-3 text-right">₹{baseline.totalCostInr.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-status-critical">₹{simulated.totalCostInr.toLocaleString()}</td>
                <td className={`py-3 px-3 text-right font-bold ${
                  simulated.totalCostInr > baseline.totalCostInr ? 'text-status-critical' : 'text-status-success'
                }`}>
                  {formatDelta(simulated.totalCostInr - baseline.totalCostInr)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
