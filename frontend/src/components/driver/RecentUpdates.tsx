import React from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Truck,
  Sparkles,
  CloudRain,
  ShieldAlert,
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { useTranslation } from '../../context/LanguageContext';
import { DisruptionEvent } from '../../types/event';

export const RecentUpdates: React.FC = () => {
  const { events } = useFleet();
  const { t } = useTranslation();

  const getEventIcon = (event: DisruptionEvent) => {
    if (event.title.includes('Delivered')) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />;
    }
    switch (event.type) {
      case 'VEHICLE_BREAKDOWN':
        return <Truck className="w-3.5 h-3.5 text-status-critical" />;
      case 'TRAFFIC':
      case 'ROAD_CLOSURE':
        return <AlertTriangle className="w-3.5 h-3.5 text-status-warning" />;
      case 'WEATHER':
        return <CloudRain className="w-3.5 h-3.5 text-status-info" />;
      case 'URGENT_ORDER':
        return <Sparkles className="w-3.5 h-3.5 text-ai-intelligence" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-text-secondary" />;
    }
  };

  // Display top 6 events
  const displayEvents = events.slice(0, 6);

  return (
    <div className="bg-surface-main rounded-2xl border border-border-subtle shadow-xs p-4 flex flex-col gap-2.5 select-none">
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-text-secondary" />
          <h3 className="text-xs font-bold text-deep-navy uppercase tracking-wider">
            {t('driver.recentUpdates')}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-status-success font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-ping" />
          {t('driver.liveStream')}
        </span>
      </div>

      {/* Events List */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px] pr-1">
        {displayEvents.map((evt) => (
          <div
            key={evt.id}
            className="p-2 rounded-xl bg-surface-container-low/70 border border-border-subtle/80 flex items-start gap-2.5 text-xs transition-colors hover:bg-surface-container-low"
          >
            <div className="mt-0.5 shrink-0">{getEventIcon(evt)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-deep-navy text-[11px] truncate">
                  {t(('events.' + evt.type) as any, evt.title)}
                </span>
                <span className="text-[10px] font-mono text-text-muted shrink-0">
                  {evt.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                {evt.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
