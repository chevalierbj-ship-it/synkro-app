/**
 * Configuration i18next pour Synkro
 * Support multilingue : Français (défaut) + Anglais
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import des traductions
import fr from '../locales/fr/translation.json';
import en from '../locales/en/translation.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en }
};

i18n
  // Détection automatique de la langue du navigateur
  .use(LanguageDetector)
  // Intégration avec React
  .use(initReactI18next)
  // Initialisation
  .init({
    resources,
    fallbackLng: 'fr', // Français par défaut
    supportedLngs: ['fr', 'en'],

    // Options de détection de langue
    detection: {
      // Ordre de détection : localStorage > navigator > htmlTag
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Clé de stockage dans localStorage
      lookupLocalStorage: 'synkro_language',
      // Cache la langue détectée dans localStorage
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React gère déjà l'échappement XSS
    },

    // Mode debug en développement
    debug: import.meta.env.DEV,
  });

export default i18n;
