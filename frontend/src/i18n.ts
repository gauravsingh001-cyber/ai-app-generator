import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: {
          logout: 'Logout',
          login: 'Login',
          actions: 'Actions',
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          upload_csv: 'Upload CSV',
          add_new: 'Add New',
          welcome: 'Welcome',
        }
      },
      hi: {
        translation: {
          logout: 'लॉग आउट',
          login: 'लॉग इन',
          actions: 'क्रियाएँ',
          save: 'सहेजें',
          cancel: 'रद्द करें',
          delete: 'हटाएं',
          edit: 'संपादित करें',
          upload_csv: 'CSV अपलोड करें',
          add_new: 'नया जोड़ें',
          welcome: 'स्वागत हे',
        }
      }
    }
  });

export default i18n;
