import React from 'react';
import { Languages, Globe } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { Language } from '../../i18n';

interface LanguageSelectorProps {
  theme?: 'light' | 'dark';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  theme = 'light',
  className = '',
}) => {
  const { language, setLanguage, t } = useTranslation();

  const isDark = theme === 'dark';

  return (
    <div
      className={`inline-flex items-center gap-1.5 h-8 px-2 rounded-lg border text-xs select-none shrink-0 transition-all ${
        isDark
          ? 'bg-slate-800/90 border-slate-700 text-slate-200 shadow-xs'
          : 'bg-surface-container-low border-border-subtle text-deep-navy shadow-xs'
      } ${className}`}
      role="group"
      aria-label={language === 'hi' ? 'भाषा चयनकर्ता' : 'Language selector'}
    >
      <div className="flex items-center gap-1 pl-1 pr-0.5 text-text-muted">
        <Languages className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-primary'}`} aria-hidden="true" />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          aria-pressed={language === 'en'}
          className={`px-2 py-0.5 rounded-md font-medium text-xs transition-all cursor-pointer ${
            language === 'en'
              ? isDark
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'bg-primary text-white font-bold shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              : 'text-text-muted hover:text-deep-navy hover:bg-surface-container'
          }`}
          title="Switch to English"
        >
          English
        </button>

        <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-border-subtle'}`}>|</span>

        <button
          type="button"
          onClick={() => setLanguage('hi')}
          aria-pressed={language === 'hi'}
          className={`px-2 py-0.5 rounded-md font-medium text-xs transition-all cursor-pointer ${
            language === 'hi'
              ? isDark
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'bg-primary text-white font-bold shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              : 'text-text-muted hover:text-deep-navy hover:bg-surface-container'
          }`}
          title="हिन्दी में बदलें"
        >
          हिन्दी
        </button>
      </div>
    </div>
  );
};
