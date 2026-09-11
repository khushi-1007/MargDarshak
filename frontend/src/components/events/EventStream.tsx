import React from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  Radio,
  AlertTriangle,
  Compass,
  CloudRain,
  PackagePlus,
  AlertOctagon,
  Clock,
  ChevronRight,
} from 'lucide-react';

export const EventStream: React.FC = () => {
  const { events, openRouteComparisonForIncident } = useFleet();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'VEHICLE_BREAKDOWN':
      case 'CASCADING_BREAKDOWN':
        return <AlertOctagon className="w-4 h-4 text-status-critical" />;
      case 'TRAFFIC':
        return <Compass className="w-4 h-4 text-status-warning" />;
      case 'WEATHER':
        return <CloudRain className="w-4 h-4 text-status-info" />;
      case 'URGENT_ORDER':
        return <PackagePlus className="w-4 h-4 text-status-warning" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-status-critical" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-error-container text-status-critical';
      case 'WARNING':
        return 'bg-amber-100 text-amber-900';
      default:
        return 'bg-blue-100 text-blue-900';
    }
  };

  return (
    <div className="bg-surface-main p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary animate-pulse" />
          <h3 className="text-xs font-bold text-deep-navy">Live Operations Event Stream</h3>
        </div>
        <span className="text-[11px] text-text-muted font-mono">Updated 10s ago</span>
      </div>

      <div className="mt-3 flex flex-col gap-2.5 overflow-y-auto max-h-[380px] pr-1">
        {events.map((evt) => (
          <div
            key={evt.id}
            onClick={() => openRouteComparisonForIncident(evt.type)}
            className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-transparent hover:border-border-subtle flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getEventIcon(evt.type)}
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold tracking-wide uppercase ${getSeverityBadge(
                    evt.severity
                  )}`}
                >
                  {evt.severity}
                </span>
              </div>
              <span className="font-mono text-[10px] text-text-muted">{evt.timestamp}</span>
            </div>

            <p className="text-xs font-bold text-deep-navy">{evt.title}</p>
            <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
              {evt.description}
            </p>

            <div className="flex items-center justify-between pt-1 text-[11px] text-primary font-semibold">
              <span>Inspect Delta Impact</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
