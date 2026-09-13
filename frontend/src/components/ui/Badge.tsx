import React from 'react';
import { useTranslation } from '../../context/LanguageContext';

interface BadgeProps {
  status: string;
  type?: 'vehicle' | 'sla' | 'priority' | 'generic';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, type = 'generic', className = '' }) => {
  const { t } = useTranslation();
  let style = 'bg-surface-container text-text-secondary';
  let dotColor = 'bg-text-secondary';

  const s = status.toUpperCase();

  if (s === 'ON_ROUTE' || s === 'AVAILABLE' || s === 'ON_TIME' || s === 'DELIVERED') {
    style = 'bg-status-success/15 text-status-success';
    dotColor = 'bg-status-success';
  } else if (s === 'AT_RISK' || s === 'HIGH' || s === 'WARNING' || s === 'DEGRADED') {
    style = 'bg-status-warning/15 text-status-warning';
    dotColor = 'bg-status-warning';
  } else if (s === 'BROKEN_DOWN' || s === 'LATE' || s === 'UNSERVICEABLE' || s === 'CRITICAL' || s === 'INFEASIBLE') {
    style = 'bg-error-container text-status-critical';
    dotColor = 'bg-status-critical';
  } else if (s === 'STANDBY' || s === 'REOPTIMISED') {
    style = 'bg-purple-100 text-ai-intelligence';
    dotColor = 'bg-ai-intelligence';
  }

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  const displayText = t(`status.${s}`, formatText(status));

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase ${style} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{displayText}</span>
    </span>
  );
};
