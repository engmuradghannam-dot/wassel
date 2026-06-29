import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import ur from './locales/ur.json';
import hi from './locales/hi.json';
import tr from './locales/tr.json';
import id from './locales/id.json';
import zh from './locales/zh.json';
import es from './locales/es.json';
import ru from './locales/ru.json';
import de from './locales/de.json';

export const LANGUAGES = [
  { code:'ar', name:'Arabic',     nativeName:'العربية',  flag:'🇸🇦', dir:'rtl' },
  { code:'en', name:'English',    nativeName:'English',  flag:'🇬🇧', dir:'ltr' },
  { code:'fr', name:'French',     nativeName:'Français', flag:'🇫🇷', dir:'ltr' },
  { code:'ur', name:'Urdu',       nativeName:'اردو',     flag:'🇵🇰', dir:'rtl' },
  { code:'hi', name:'Hindi',      nativeName:'हिंदी',    flag:'🇮🇳', dir:'ltr' },
  { code:'tr', name:'Turkish',    nativeName:'Türkçe',   flag:'🇹🇷', dir:'ltr' },
  { code:'id', name:'Indonesian', nativeName:'Indonesia',flag:'🇮🇩', dir:'ltr' },
  { code:'zh', name:'Chinese',    nativeName:'中文',      flag:'🇨🇳', dir:'ltr' },
  { code:'es', name:'Spanish',    nativeName:'Español',  flag:'🇪🇸', dir:'ltr' },
  { code:'ru', name:'Russian',    nativeName:'Русский',  flag:'🇷🇺', dir:'ltr' },
  { code:'de', name:'German',     nativeName:'Deutsch',  flag:'🇩🇪', dir:'ltr' },
];

const RTL_LANGS = ['ar', 'ur'];

// Apply language direction + font hints to <html>
export const applyLangToDOM = (code) => {
  const isRTL = RTL_LANGS.includes(code);
  document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = code;
  // Force MUI re-render via data attribute
  document.documentElement.setAttribute('data-lang', code);
  document.documentElement.setAttribute('data-dir', isRTL ? 'rtl' : 'ltr');
};

// Change language — persists to localStorage, updates DOM immediately
export const changeLanguage = (code) => {
  localStorage.setItem('wasselLang', code);
  i18n.changeLanguage(code);
  applyLangToDOM(code);
};

// Get current language metadata
export const getCurrentLang = () => {
  const code = i18n.language || localStorage.getItem('wasselLang') || 'ar';
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
};

export const isRTL = (code) => RTL_LANGS.includes(code || i18n.language);

// Read saved language (before i18n initializes)
const savedLang = localStorage.getItem('wasselLang') || 'ar';

// Init i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
      fr: { translation: fr },
      ur: { translation: ur },
      hi: { translation: hi },
      tr: { translation: tr },
      id: { translation: id },
      zh: { translation: zh },
      es: { translation: es },
      ru: { translation: ru },
      de: { translation: de },
    },
    lng: savedLang,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });

// Apply immediately on load
applyLangToDOM(savedLang);

// Re-apply whenever language changes
i18n.on('languageChanged', applyLangToDOM);

export default i18n;
