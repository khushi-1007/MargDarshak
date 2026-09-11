import React, { useState } from 'react';
import {
  CheckCircle2,
  Navigation,
  Clock,
  MapPin,
  Building2,
  Phone,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

export const CurrentStopCard: React.FC = () => {
  const {
    activeDriverRoute,
    currentStopIndex,
    activeOrder,
    markOrderDelivered,
  } = useFleet();

  const [isDelivering, setIsDelivering] = useState<boolean>(false);
  const [navigating, setNavigating] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  const stops = activeDriverRoute?.stops || [];
  const currentStop =
    currentStopIndex !== -1 && stops[currentStopIndex]
      ? stops[currentStopIndex]
      : stops[stops.length - 1];

  const handleMarkDelivered = async () => {
    if (!currentStop || !currentStop.orderId) return;
    setIsDelivering(true);
    await markOrderDelivered(currentStop.orderId);
    setIsDelivering(false);
    setConfirmModalOpen(false);
  };

  if (!currentStop) {
    return (
      <div className="bg-surface-main p-4 rounded-2xl border border-border-subtle shadow-xs text-center text-xs text-text-muted">
        All scheduled stops completed for today's shift. Head back to depot!
      </div>
    );
  }

  return (
    <div className="bg-surface-main rounded-2xl border border-border-subtle shadow-xs p-4 flex flex-col gap-3 select-none">
      {/* Header with Title & ETA Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
          <h3 className="text-xs font-bold text-deep-navy uppercase tracking-wider">
            Current Stop Details
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-primary-container font-mono text-[10px] font-bold">
            Stop {currentStopIndex + 1} of {stops.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-status-success font-semibold text-xs border border-emerald-200/60">
          <Clock className="w-3.5 h-3.5" />
          <span>ETA: {currentStop.eta} • On Schedule</span>
        </div>
      </div>

      {/* Main Order & Consignee Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-surface-container-low rounded-xl border border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-deep-navy text-sm">
              {currentStop.orderId || '#ORD-CURRENT'}
            </span>
            {currentStop.isPriority && (
              <span className="px-1.5 py-0.2 rounded bg-status-critical/15 text-status-critical font-bold text-[10px]">
                PRIORITY
              </span>
            )}
            {currentStop.absorbedFromVehicleId && (
              <span className="px-1.5 py-0.2 rounded bg-purple-100 text-ai-intelligence font-bold text-[10px]">
                Absorbed from {currentStop.absorbedFromVehicleId}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-deep-navy mt-1">
            <Building2 className="w-3.5 h-3.5 text-primary-container" />
            <span>{currentStop.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-text-secondary" />
            <span>{currentStop.address}, Jaipur</span>
          </div>
        </div>

        <div className="flex flex-col justify-center text-xs space-y-1 md:border-l md:border-slate-200 md:pl-4">
          <div className="text-text-muted text-[11px]">Consignment Specs</div>
          <div className="font-semibold text-deep-navy">
            {activeOrder?.loadType === 'COLD_CHAIN'
              ? '❄️ Cold Chain Pharma (2°-8°C)'
              : 'Standard Freight Delivery'}
          </div>
          <div className="text-[11px] text-text-secondary">
            Time Window: {activeOrder?.timeWindowStart || '11:00 AM'} –{' '}
            {activeOrder?.timeWindowEnd || '01:00 PM'}
          </div>
        </div>
      </div>

      {/* Navigation In-Progress Banner (if navigating) */}
      {navigating && (
        <div className="bg-primary text-white p-2.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-white animate-spin" />
            <span className="font-semibold">
              Live Voice Guidance: Head North-East on Statue Circle for 350m
            </span>
          </div>
          <button
            onClick={() => setNavigating(false)}
            className="text-white/80 hover:text-white underline text-[11px]"
          >
            End Nav
          </button>
        </div>
      )}

      {/* Action Buttons: MARK AS DELIVERED & NAVIGATE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={() => setConfirmModalOpen(true)}
          disabled={isDelivering || currentStop.completed}
          className="py-2.5 px-4 rounded-xl bg-status-success hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {currentStop.completed
              ? 'Order Already Delivered ✓'
              : isDelivering
              ? 'Processing Delivery...'
              : 'MARK AS DELIVERED'}
          </span>
        </button>

        <button
          onClick={() => setNavigating(!navigating)}
          className="py-2.5 px-4 rounded-xl bg-primary-container hover:bg-primary text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <Navigation className="w-4 h-4" />
          <span>{navigating ? 'Pause Guidance' : 'NAVIGATE TO STOP'}</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-main w-full max-w-sm rounded-2xl shadow-xl border border-border-subtle p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-status-success">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-deep-navy">Confirm Consignment Handover</h4>
                <p className="text-xs text-text-muted">Order ID: {currentStop.orderId}</p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              Confirm that packages for <strong className="text-deep-navy">{currentStop.name}</strong> have been verified by the recipient. This will immediately update the Fleet Control Tower.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-deep-navy text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkDelivered}
                className="flex-1 py-2 rounded-xl bg-status-success hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
              >
                Confirm Delivered
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
