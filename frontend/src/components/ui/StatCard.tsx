import React, { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  trendText?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  progressPct?: number;
  progressColor?: string;
  icon?: ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  badge,
  badgeType = 'neutral',
  trendText,
  trendDirection,
  progressPct,
  progressColor = 'bg-primary-container',
  icon,
}) => {
  const badgeStyles = {
    success: 'bg-status-success/15 text-status-success',
    warning: 'bg-status-warning/15 text-status-warning',
    danger: 'bg-error-container text-status-critical',
    info: 'bg-status-info/15 text-status-info',
    neutral: 'bg-surface-container text-text-secondary',
  };

  return (
    <div className="bg-surface-main p-4 rounded-xl border border-border-subtle shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary uppercase font-semibold tracking-wider">
          {icon && <span className="text-text-muted">{icon}</span>}
          <span>{label}</span>
        </div>
        {badge && (
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${badgeStyles[badgeType]}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-deep-navy font-mono tracking-tight flex items-baseline gap-1">
          <span>{value}</span>
          {unit && <span className="text-xs font-normal text-text-muted">{unit}</span>}
        </div>
        {trendText && (
          <span className={`text-[11px] font-medium flex items-center gap-0.5 ${
            trendDirection === 'up' ? 'text-status-success' : trendDirection === 'down' ? 'text-status-warning' : 'text-text-muted'
          }`}>
            {trendText}
          </span>
        )}
      </div>

      {progressPct !== undefined && (
        <div className="mt-2.5 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
      )}
    </div>
  );
};
