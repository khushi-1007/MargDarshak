import React from 'react';
import { AlertTriangle, Radio } from 'lucide-react';

interface DriverActionFooterProps {
  onOpenReportIssue: () => void;
  onOpenDispatcher: () => void;
}

export const DriverActionFooter: React.FC<DriverActionFooterProps> = ({
  onOpenReportIssue,
  onOpenDispatcher,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2.5 w-full select-none">
      <button
        onClick={onOpenReportIssue}
        type="button"
        className="py-2.5 px-3 rounded-xl bg-surface-main hover:bg-red-50 text-status-critical font-bold text-xs border border-red-200 shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
      >
        <AlertTriangle className="w-4 h-4 text-status-critical" />
        <span>REPORT ISSUE</span>
      </button>

      <button
        onClick={onOpenDispatcher}
        type="button"
        className="py-2.5 px-3 rounded-xl bg-surface-main hover:bg-blue-50 text-primary-container font-bold text-xs border border-blue-200 shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
      >
        <Radio className="w-4 h-4 text-primary-container" />
        <span>CONTACT DISPATCHER</span>
      </button>
    </div>
  );
};
