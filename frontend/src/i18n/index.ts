import { en } from './en';
import { hi } from './hi';
import { Language, TranslationDictionary } from './types';

export * from './types';
export { en, hi };

export const translations: Record<Language, TranslationDictionary> = {
  en,
  hi,
};

/**
 * Resolves a nested dotted path key (e.g. 'nav.dashboard') from a dictionary.
 */
export function getTranslation(
  lang: Language,
  path: string,
  fallback?: string
): string {
  const dict = translations[lang] || translations.en;
  const parts = path.split('.');

  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      current = undefined;
      break;
    }
  }

  if (typeof current === 'string') {
    return current;
  }

  // Fallback to English dictionary if current language was Hindi
  if (lang !== 'en') {
    let enCurrent: any = translations.en;
    for (const part of parts) {
      if (enCurrent && typeof enCurrent === 'object' && part in enCurrent) {
        enCurrent = enCurrent[part];
      } else {
        enCurrent = undefined;
        break;
      }
    }
    if (typeof enCurrent === 'string') {
      return enCurrent;
    }
  }

  return fallback !== undefined ? fallback : path;
}
