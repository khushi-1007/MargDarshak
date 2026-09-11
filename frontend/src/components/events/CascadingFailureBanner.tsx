import React from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export const CascadingFailureBanner: React.FC = () => {
  const {
    orderClassification,
    executeRecoveryAction,
    isOptimising,
  } = useFleet();

  const onTimeCount = orderClassification.onTime.length;
  const lateCount = orderClassification.late.length;
  const unserviceableCount = orderClassification.unserviceable.length;

  return (
    <div className="bg-slate-900 text-white border-b-2 border-status-critical px-6 py-4 shadow-xl z-30 select-none">
      <div className="max-w-[1720px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Incident Alert Title & Fleet Status */}
        <div className="flex items-start gap-3 max-w-xl">
          <div className="w-10 h-10 rounded-xl bg-status-critical/20 border border-status-critical text-status-critical flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-status-critical text-white text-[10px] font-bold uppercase tracking-wider">
                CASCADING FLEET DISRUPTION
              </span>
              <span className="text-xs font-mono text-slate-400">V01 ✕ • V03 ✕ • (Only V02 & V04 Operational)</span>
            </div>
            <h2 className="text-sm font-bold text-white mt-1">
              NO FULLY FEASIBLE PLAN EXISTS WITH THE CURRENT FLEET
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Available payload capacity (2,100 kg) cannot service all active customer delivery windows without external interventions.
            </p>
          </div>
        </div>

        {/* Visual Order Classification Badges: Green / Yellow / Red */}
        <div className="flex items-center gap-3">
          {/* Green: On Time */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40">
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">ON TIME</span>
              <span className="text-base font-bold font-mono text-white">{onTimeCount} Orders</span>
            </div>
          </div>

          {/* Yellow: Late But Serviceable */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-950/70 border border-amber-500/40">
            <Clock className="w-4 h-4 text-status-warning shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">LATE SERVICEABLE</span>
              <span className="text-base font-bold font-mono text-white">{lateCount} Orders</span>
            </div>
          </div>

          {/* Red: Unserviceable */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-red-950/80 border border-red-500/60 animate-pulse">
            <XCircle className="w-4 h-4 text-status-critical shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase font-bold text-red-300 tracking-wider">UNSERVICEABLE</span>
              <span className="text-base font-bold font-mono text-white">{unserviceableCount} Orders</span>
            </div>
          </div>
        </div>

        {/* 1-Click Recovery Recommendation Actions */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Primary Recommended Action */}
          <button
            onClick={() => executeRecoveryAction('STANDBY_V05')}
            disabled={isOptimising}
            className="py-2 px-3.5 rounded-xl bg-status-success hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-75"
          >
            <Truck className="w-4 h-4" />
            <div className="flex flex-col text-left leading-tight">
              <span>Deploy Standby V05</span>
              <span className="text-[10px] font-normal text-emerald-100 font-mono">Restores 98.2% SLA (+₹340)</span>
            </div>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          {/* Secondary Mitigation Actions */}
          <button
            onClick={() => executeRecoveryAction('OUTSOURCE')}
            disabled={isOptimising}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>Outsource 3PL (+₹750)</span>
          </button>

          <button
            onClick={() => executeRecoveryAction('OVERTIME')}
            disabled={isOptimising}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <span>Allow Overtime (+1.5h)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
