import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useFleet } from '../../context/FleetContext';
import { EventSimulationModal } from '../events/EventSimulationModal';
import { RouteComparisonDrawer } from '../routes/RouteComparisonDrawer';
import { OperationsAssistantModal } from '../ai/OperationsAssistantModal';
import { CascadingFailureBanner } from '../events/CascadingFailureBanner';
import { Brain, CheckCircle2, Sparkles } from 'lucide-react';

export const Shell: React.FC = () => {
  const {
    isOptimising,
    optimisationStep,
    optimisationMessage,
    lastOptimisationResult,
    cascadingFailureActive,
  } = useFleet();

  return (
    <div className="min-h-screen bg-bg-canvas text-deep-navy font-sans antialiased flex">
      {/* Persistent Left Command Rail */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="pl-60 flex-1 flex flex-col min-w-0">
        <Header />

        <main className="w-full pt-16 min-h-screen flex flex-col">
          {/* Dynamic Computational Solver Banner */}
          {isOptimising && (
            <div className="bg-ai-intelligence text-white px-6 py-2 shadow-sm transition-all duration-300 flex items-center justify-between z-30">
              <div className="flex items-center gap-2.5 text-xs">
                <Brain className="w-4 h-4 text-purple-200 animate-spin" />
                <span className="font-semibold">
                  Dynamic Re-solver Active:{' '}
                  <span className="font-mono text-purple-200">Step {optimisationStep} of 4</span> —{' '}
                  {optimisationMessage}
                </span>
              </div>
              <div className="flex items-center gap-2 text-purple-200 text-xs font-mono">
                <span className="h-2 w-2 rounded-full bg-status-success animate-ping" />
                <span>Deterministic OR-Tools v9.6</span>
              </div>
            </div>
          )}

          {/* Cascading Failure Notice & Decision Support Banner */}
          {cascadingFailureActive && <CascadingFailureBanner />}

          {/* Nested Page Views */}
          <div className="flex-1 w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <EventSimulationModal />
      <RouteComparisonDrawer />
      <OperationsAssistantModal />
    </div>
  );
};
