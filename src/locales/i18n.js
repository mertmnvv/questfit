import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './en.json';
import tr from './tr.json';

// Telefonun dilini al
const deviceLocale = getLocales()?.[0]?.languageCode || 'tr';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      tr: { translation: tr },
    },
    lng: deviceLocale === 'tr' ? 'tr' : 'en', // Türkçe ise Türkçe, diğer her şey İngilizce
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
