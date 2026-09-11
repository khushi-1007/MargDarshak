import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle2, Truck, ShieldAlert } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { IssueType, IssueSeverity } from '../../types/driver';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose }) => {
  const { reportDriverIssue, activeDriver } = useFleet();

  const [issueType, setIssueType] = useState<IssueType>('Vehicle Issue');
  const [severity, setSeverity] = useState<IssueSeverity>('Medium');
  const [description, setDescription] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    await reportDriverIssue({
      type: issueType,
      severity,
      description: description.trim(),
    });
    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDescription('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="bg-surface-main w-full max-w-md rounded-2xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-status-critical flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Report Operational Issue</h3>
              <p className="text-[11px] text-slate-400">
                Logged to Fleet Control Tower • Driver: {activeDriver.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-status-success flex items-center justify-center shadow-md animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-base text-deep-navy">Issue Logged Successfully</h4>
            <p className="text-xs text-text-secondary max-w-xs">
              Incident ticket broadcast to Fleet Manager console. Dynamic re-routing and roadside support initiated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
            {/* Issue Type */}
            <div>
              <label className="font-semibold text-deep-navy block mb-1.5">
                Issue Type <span className="text-status-critical">*</span>
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                className="w-full h-10 px-3 rounded-xl border border-border-subtle bg-bg-canvas text-deep-navy font-medium focus:ring-2 focus:ring-primary-container focus:outline-none"
              >
                <option value="Vehicle Issue">Vehicle Issue (Engine / Tire / Cooling)</option>
                <option value="Delivery Issue">Delivery Issue (Customer Unavailable / Door Locked)</option>
                <option value="Road Issue">Road Issue (Waterlogging / Road Block / Jam)</option>
                <option value="Customer Issue">Customer Issue (Refused Consignment)</option>
                <option value="Other">Other Operational Incident</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="font-semibold text-deep-navy block mb-1.5">
                Severity Level <span className="text-status-critical">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Low', 'Medium', 'High', 'Critical'] as IssueSeverity[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      severity === lvl
                        ? lvl === 'Critical'
                          ? 'bg-red-600 text-white border-red-700 shadow-xs'
                          : lvl === 'High'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-primary-container text-white border-primary shadow-xs'
                        : 'bg-surface-container-low text-deep-navy border-border-subtle hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="font-semibold text-deep-navy block mb-1.5">
                Incident Description <span className="text-status-critical">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Engine temperature rising near Tonk Road flyover; request coolant check or relief standby..."
                className="w-full p-3 rounded-xl border border-border-subtle bg-bg-canvas text-deep-navy placeholder:text-text-muted focus:ring-2 focus:ring-primary-container focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Submit & Cancel */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-deep-navy font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="flex-1 py-2.5 rounded-xl bg-status-critical hover:bg-red-700 text-white font-bold shadow-xs transition-all disabled:opacity-50 active:scale-98"
              >
                {isSubmitting ? 'Logging...' : 'Submit Incident Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
