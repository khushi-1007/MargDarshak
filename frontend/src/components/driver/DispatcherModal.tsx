import React, { useState } from 'react';
import { Radio, Phone, X, ShieldCheck, Check, MessageSquare, Send } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

interface DispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DispatcherModal: React.FC<DispatcherModalProps> = ({ isOpen, onClose }) => {
  const { dispatcher, activeDriver } = useFleet();

  const [message, setMessage] = useState<string>('');
  const [msgSent, setMsgSent] = useState<boolean>(false);
  const [copiedRadio, setCopiedRadio] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMsgSent(true);
    setTimeout(() => {
      setMsgSent(false);
      setMessage('');
      onClose();
    }, 1500);
  };

  const handleCopyRadio = () => {
    navigator.clipboard.writeText(dispatcher.radioChannel);
    setCopiedRadio(true);
    setTimeout(() => setCopiedRadio(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="bg-surface-main w-full max-w-md rounded-2xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Central Dispatch Desk</h3>
              <p className="text-[11px] text-slate-400">Jaipur Route Management Tower</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Dispatcher Profile Card */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                VS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-deep-navy text-sm">{dispatcher.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-status-success/15 text-status-success font-semibold text-[10px]">
                    ● {dispatcher.status}
                  </span>
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">{dispatcher.role}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{dispatcher.hub}</div>
              </div>
            </div>
          </div>

          {/* Quick Channels */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] text-text-muted uppercase font-semibold">
                Direct Hotline
              </span>
              <div className="font-mono font-bold text-deep-navy mt-1">{dispatcher.phone}</div>
              <a
                href={`tel:${dispatcher.phone}`}
                className="mt-2 text-center py-1.5 rounded-lg bg-primary-container text-white text-[11px] font-bold hover:bg-primary transition-colors"
              >
                Call Hotline
              </a>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] text-text-muted uppercase font-semibold">
                Radio Channel
              </span>
              <div className="font-mono font-bold text-deep-navy mt-1 truncate">
                {dispatcher.radioChannel}
              </div>
              <button
                onClick={handleCopyRadio}
                className="mt-2 text-center py-1.5 rounded-lg bg-white border border-border-subtle text-deep-navy text-[11px] font-bold hover:bg-slate-100 transition-colors"
              >
                {copiedRadio ? 'Channel Copied!' : 'Copy Frequency'}
              </button>
            </div>
          </div>

          {/* Instant Dispatcher Message */}
          <form onSubmit={handleSendMessage} className="flex flex-col gap-2 pt-1 border-t border-border-subtle">
            <label className="font-semibold text-deep-navy flex items-center justify-between">
              <span>Quick Telemetry Ping / Message</span>
              <span className="text-[10px] font-normal text-text-muted">
                From {activeDriver.name}
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Arrived at Gate 2, waiting for security sign-off..."
                className="flex-1 px-3 py-2 rounded-xl border border-border-subtle bg-bg-canvas text-deep-navy text-xs focus:ring-2 focus:ring-primary-container focus:outline-none"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="px-3 py-2 rounded-xl bg-primary-container hover:bg-primary text-white font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
            {msgSent && (
              <span className="text-[11px] font-semibold text-status-success flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> Message transmitted to Central Dispatch Tower!
              </span>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
