import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './localisation/en.json';
import fr from './localisation/fr.json';
import ru from './localisation/ru.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ru: {translation :ru}
    },
    lng: 'en', 
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
