import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import ar from './locales/ar.json';

export type AppLocale = 'en' | 'ar';

const STORAGE_KEY = 'soc.locale';

export function getStoredLocale(): AppLocale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'ar' || stored === 'en') return stored;
  return 'en';
}

export function applyDocumentLocale(locale: AppLocale): void {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
  localStorage.setItem(STORAGE_KEY, locale);
}

export const i18n = createI18n({
  legacy: false,
  locale: getStoredLocale(),
  fallbackLocale: 'en',
  messages: { en, ar },
});

applyDocumentLocale(getStoredLocale());
