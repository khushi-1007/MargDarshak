import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { api } from '../../services/api';
import {
  Bot,
  X,
  Send,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  constraintsChecked?: string[];
  confidencePct?: number;
  timestamp: string;
}

export const OperationsAssistantModal: React.FC = () => {
  const { aiAssistantModalOpen, setAiAssistantModalOpen } = useFleet();

  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      text: 'Hello Rajesh. I am the MargDarshak AI Operations Explainer. I interpret deterministic OR-Tools vehicle routing decisions, constraint validations, and recovery recommendations. How can I assist your dispatch team today?',
      constraintsChecked: ['OR-Tools v9.6 Solver State Linked', 'Fleet Telemetry Stream Active'],
      confidencePct: 99.2,
      timestamp: '11:00 AM',
    },
  ]);

  if (!aiAssistantModalOpen) return null;

  const quickPills = [
    'Why did V01 absorb Orders #1008 & #1012?',
    'What is the cheapest recovery option for cascading breakdown?',
    'Which orders currently have less than 20m SLA buffer?',
    'Why did the route avoid Tonk Road?',
    'What happens if Vehicle V02 also breaks down?',
  ];

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.askOperationsAssistant(queryText);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        constraintsChecked: res.constraintsChecked,
        confidencePct: res.confidencePct,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        onClick={() => setAiAssistantModalOpen(false)}
        className="fixed inset-0 bg-nav-command/60 backdrop-blur-sm transition-opacity"
      />

      {/* Surface */}
      <div className="relative bg-surface-main rounded-2xl shadow-2xl border border-border-subtle w-full max-w-2xl h-[620px] z-10 flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-surface-container-low border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ai-intelligence text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-deep-navy">MargDarshak Operations Copilot</h3>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-ai-intelligence text-[10px] font-mono font-bold">
                  OR-LLM EXPLAINER
                </span>
              </div>
              <p className="text-[11px] text-text-muted">
                Mathematical routing logic translated into natural operational explanations
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiAssistantModalOpen(false)}
            className="p-1 rounded text-text-muted hover:text-deep-navy hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3.5 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary-container text-white rounded-br-xs shadow-xs'
                    : 'bg-surface-container-low border border-border-subtle text-deep-navy rounded-bl-xs'
                }`}
              >
                <p>{msg.text}</p>

                {msg.constraintsChecked && (
                  <div className="mt-2.5 pt-2 border-t border-purple-200/50 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ai-intelligence block">
                      Hard Constraints Validated by Engine:
                    </span>
                    {msg.constraintsChecked.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                        <CheckCircle2 className="w-3 h-3 text-status-success shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono text-text-muted mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 text-ai-intelligence max-w-xs text-xs">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Querying OR-Tools state & generating explanation...</span>
            </div>
          )}
        </div>

        {/* Preset Question Pills */}
        <div className="px-4 py-2 bg-surface border-t border-border-subtle/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPills.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(pill)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-surface-container border border-border-subtle text-[11px] text-text-secondary hover:text-deep-navy whitespace-nowrap transition-colors"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-surface-container-low border-t border-border-subtle flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk(inputQuery)}
            placeholder="Ask dispatcher assistant (e.g. Why did V01 absorb orders?)..."
            className="flex-1 h-9 px-3.5 rounded-xl border border-border-subtle bg-white text-deep-navy text-xs focus:outline-none focus:ring-2 focus:ring-ai-intelligence"
          />
          <button
            onClick={() => handleAsk(inputQuery)}
            disabled={!inputQuery.trim() || loading}
            className="h-9 px-4 rounded-xl bg-ai-intelligence hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
