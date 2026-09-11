import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { Brain, Clock, Info, GitCompare, CheckCircle2 } from 'lucide-react';

export const AIInsightCard: React.FC = () => {
  const {
    lastOptimisationResult,
    setAiAssistantModalOpen,
    openRouteComparisonForIncident,
    cascadingFailureActive,
  } = useFleet();

  return (
    <div className="bg-gradient-to-br from-purple-50/90 via-surface-main to-surface-main p-4 rounded-xl border border-purple-200/80 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-ai-intelligence text-white flex items-center justify-center">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-ai-intelligence">
              AI Decision Explanation Layer
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-purple-100 text-ai-intelligence font-mono text-[10px] font-bold">
            OR-TOOLS SYNCD
          </span>
        </div>

        <p className="mt-2.5 text-xs text-deep-navy leading-relaxed">
          {cascadingFailureActive ? (
            <>
              <strong>Cascading Breakdown Ingested:</strong> Vehicles <span className="text-status-critical font-mono font-bold">V01 & V03</span> are stalled. Remaining fleet capacity requires immediate activation of <strong>Standby V05</strong> to prevent 3 SLA penalties.
            </>
          ) : (
            <>
              <strong>Dynamic Reroute Active:</strong> Vehicle <span className="font-mono text-status-critical font-semibold">V03</span> is stalled near C-Scheme. Cold-chain orders <span className="font-mono text-primary font-bold">#1008</span> & <span className="font-mono text-primary font-bold">#1012</span> were safely absorbed by <strong>V01</strong> (+340kg reserve), and <span className="font-mono text-primary font-bold">#1016</span> by <strong>V04</strong>.
            </>
          )}
        </p>

        {lastOptimisationResult && (
          <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-semibold text-emerald-900">
            <Clock className="w-4 h-4 text-status-success shrink-0" />
            <span>
              Estimated delivery delay reduced by{' '}
              <strong className="text-emerald-950 font-bold">
                {lastOptimisationResult.delayAvoidedMin} minutes
              </strong>{' '}
              after re-optimisation.
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 flex items-center gap-2 border-t border-purple-100">
        <button
          onClick={() => setAiAssistantModalOpen(true)}
          className="flex-1 py-1.5 px-2.5 rounded-lg bg-white hover:bg-surface-container text-deep-navy text-xs font-semibold border border-border-subtle transition-colors flex items-center justify-center gap-1.5"
          type="button"
        >
          <Info className="w-3.5 h-3.5 text-ai-intelligence" />
          <span>Explain in Detail</span>
        </button>

        <button
          onClick={() => openRouteComparisonForIncident()}
          className="flex-1 py-1.5 px-2.5 rounded-lg bg-ai-intelligence hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          type="button"
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Preview Delta</span>
        </button>
      </div>
    </div>
  );
};
