import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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

const SUPPORTED = { ar, en, fr, ur, hi, tr, id, zh, es, ru, de };

const saved = localStorage.getItem('wasselLang') || 'ar';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(
      Object.entries(SUPPORTED).map(([k, v]) => [k, { translation: v }])
    ),
    lng: saved,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'wasselLang',
      caches: ['localStorage']
    }
  });

// Set RTL/LTR on html element
const setDir = (lang) => {
  const rtlLangs = ['ar', 'ur'];
  document.documentElement.dir = rtlLangs.includes(lang) ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};
setDir(saved);
i18n.on('languageChanged', setDir);

export const LANGUAGES = [
  { code:'ar', name:'العربية',    nativeName:'العربية',    flag:'🇸🇦', dir:'rtl' },
  { code:'en', name:'English',    nativeName:'English',    flag:'🇬🇧', dir:'ltr' },
  { code:'fr', name:'Français',   nativeName:'Français',   flag:'🇫🇷', dir:'ltr' },
  { code:'ur', name:'اردو',       nativeName:'اردو',       flag:'🇵🇰', dir:'rtl' },
  { code:'hi', name:'Hindi',      nativeName:'हिंदी',      flag:'🇮🇳', dir:'ltr' },
  { code:'tr', name:'Türkçe',     nativeName:'Türkçe',     flag:'🇹🇷', dir:'ltr' },
  { code:'id', name:'Indonesia',  nativeName:'Indonesia',  flag:'🇮🇩', dir:'ltr' },
  { code:'zh', name:'Chinese',    nativeName:'中文',        flag:'🇨🇳', dir:'ltr' },
  { code:'es', name:'Español',    nativeName:'Español',    flag:'🇪🇸', dir:'ltr' },
  { code:'ru', name:'Russian',    nativeName:'Русский',    flag:'🇷🇺', dir:'ltr' },
  { code:'de', name:'Deutsch',    nativeName:'Deutsch',    flag:'🇩🇪', dir:'ltr' },
];

export const changeLanguage = (code) => {
  i18n.changeLanguage(code);
  localStorage.setItem('wasselLang', code);
  const lang = LANGUAGES.find(l => l.code === code);
  if (lang) {
    document.documentElement.dir  = lang.dir;
    document.documentElement.lang = code;
  }
};

export default i18n;
