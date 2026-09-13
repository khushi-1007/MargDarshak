import React from 'react';
import { AlertTriangle, Radio } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

interface DriverActionFooterProps {
  onOpenReportIssue: () => void;
  onOpenDispatcher: () => void;
}

export const DriverActionFooter: React.FC<DriverActionFooterProps> = ({
  onOpenReportIssue,
  onOpenDispatcher,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-2.5 w-full select-none">
      <button
        onClick={onOpenReportIssue}
        type="button"
        className="py-2.5 px-3 rounded-xl bg-surface-main hover:bg-red-50 text-status-critical font-bold text-xs border border-red-200 shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
      >
        <AlertTriangle className="w-4 h-4 text-status-critical" />
        <span>{t('driver.reportIssue')}</span>
      </button>

      <button
        onClick={onOpenDispatcher}
        type="button"
        className="py-2.5 px-3 rounded-xl bg-surface-main hover:bg-blue-50 text-primary-container font-bold text-xs border border-blue-200 shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
      >
        <Radio className="w-4 h-4 text-primary-container" />
        <span>{t('driver.contactDispatcher')}</span>
      </button>
    </div>
  );
};
