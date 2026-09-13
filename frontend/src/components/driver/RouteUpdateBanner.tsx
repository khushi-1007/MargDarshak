import React from 'react';
import { Sparkles, CheckCircle2, Sliders, X, Timer, ShoppingCart } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { useTranslation } from '../../context/LanguageContext';

export const RouteUpdateBanner: React.FC = () => {
  const {
    activeDriverRoute,
    routeUpdateAlertDismissed,
    routeUpdateAccepted,
    acceptUpdatedRoute,
    dismissRouteUpdateAlert,
    openRouteComparisonForIncident,
  } = useFleet();
  const { t } = useTranslation();

  // Show banner if route was re-optimised and alert is not dismissed
  if (routeUpdateAlertDismissed || activeDriverRoute?.status !== 'REOPTIMISED') {
    return null;
  }

  return (
    <div className="w-full bg-ai-intelligence text-white rounded-2xl shadow-md p-4 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2 select-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white uppercase">
                {t('driver.routeDynamicallyUpdated')}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wide uppercase text-white">
                {t('statuses.active')}
              </span>
            </div>
            <p className="text-xs text-purple-100 mt-0.5 leading-relaxed">
              {activeDriverRoute.updatedReason ||
                'Heavy congestion logged on Tonk Road + absorbed payload from stalled fleet unit V03.'}
            </p>
          </div>
        </div>

        <button
          onClick={dismissRouteUpdateAlert}
          className="text-purple-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Delta Badges */}
      <div className="grid grid-cols-2 gap-2 p-2 bg-white/10 rounded-xl">
        <div className="flex items-center gap-2 px-2 py-1">
          <Timer className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="text-xs font-bold text-white">{t('driver.savesTime')}</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1">
          <ShoppingCart className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="text-xs font-semibold text-white">{t('driver.absorbedConsignments')}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={acceptUpdatedRoute}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-ai-intelligence text-xs font-bold shadow-xs active:scale-95 transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{routeUpdateAccepted ? `${t('driver.routeAccepted')} ✓` : t('driver.acceptRoute')}</span>
        </button>

        <button
          onClick={() => openRouteComparisonForIncident('VEHICLE_BREAKDOWN')}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{t('driver.reviewChanges')}</span>
        </button>
      </div>
    </div>
  );
};
