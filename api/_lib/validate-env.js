/**
 * Validation des variables d'environnement
 *
 * Ce module valide que toutes les variables d'environnement requises
 * sont configurees avant le demarrage de l'application.
 *
 * Usage:
 *   import { validateEnv, validateEnvForEndpoint } from './lib/validate-env.js';
 *
 *   // Au demarrage de l'API
 *   const validation = validateEnvForEndpoint('stripe');
 *   if (!validation.valid) {
 *     return res.status(500).json({ error: validation.message });
 *   }
 */

// Configuration des variables requises par fonctionnalite
const ENV_CONFIG = {
  // Variables Airtable (base de donnees)
  airtable: {
    required: [
      'AIRTABLE_TOKEN',
      'AIRTABLE_BASE_ID',
      'AIRTABLE_EVENTS_TABLE_ID'
    ],
    optional: ['AIRTABLE_API_KEY'] // Legacy fallback
  },

  // Variables Stripe (paiements)
  stripe: {
    required: [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_PRO_MONTHLY',
      'STRIPE_PRICE_PRO_YEARLY',
      'STRIPE_PRICE_ENTERPRISE_MONTHLY',
      'STRIPE_PRICE_ENTERPRISE_YEARLY'
    ],
    optional: []
  },

  // Variables Resend (emails)
  email: {
    required: ['RESEND_API_KEY'],
    optional: [
      'EMAIL_FROM_ADDRESS', // Pour domaine custom
      'EMAIL_FROM_NAME'
    ]
  },

  // Variables Clerk (authentification) - cote client
  clerk: {
    required: ['VITE_CLERK_PUBLISHABLE_KEY'],
    optional: ['CLERK_SECRET_KEY']
  },

  // Variables Vercel Blob (upload fichiers)
  blob: {
    required: ['BLOB_READ_WRITE_TOKEN'],
    optional: []
  },

  // Variables frontend exposees (prefixe VITE_)
  frontend: {
    required: [
      'VITE_CLERK_PUBLISHABLE_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY'
    ],
    optional: [
      'VITE_STRIPE_PRICE_PRO_MONTHLY',
      'VITE_STRIPE_PRICE_PRO_YEARLY',
      'VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY',
      'VITE_STRIPE_PRICE_ENTERPRISE_YEARLY'
    ]
  }
};

/**
 * Valide les variables d'environnement pour un endpoint specifique
 * @param {string} endpoint - Le nom de l'endpoint (airtable, stripe, email, clerk, blob)
 * @returns {{ valid: boolean, missing: string[], message: string }}
 */
export function validateEnvForEndpoint(endpoint) {
  const config = ENV_CONFIG[endpoint];

  if (!config) {
    return {
      valid: false,
      missing: [],
      message: `Unknown endpoint configuration: ${endpoint}`
    };
  }

  const missing = [];

  for (const varName of config.required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    return {
      valid: false,
      missing,
      message: `Missing required environment variables for ${endpoint}: ${missing.join(', ')}`
    };
  }

  return {
    valid: true,
    missing: [],
    message: 'All required environment variables are configured'
  };
}

/**
 * Valide toutes les variables d'environnement
 * @returns {{ valid: boolean, results: Object, summary: string }}
 */
export function validateAllEnv() {
  const results = {};
  let allValid = true;
  const summaryParts = [];

  for (const [endpoint, config] of Object.entries(ENV_CONFIG)) {
    const validation = validateEnvForEndpoint(endpoint);
    results[endpoint] = validation;

    if (!validation.valid) {
      allValid = false;
      summaryParts.push(`${endpoint}: ${validation.missing.length} missing`);
    } else {
      summaryParts.push(`${endpoint}: OK`);
    }
  }

  return {
    valid: allValid,
    results,
    summary: summaryParts.join(' | ')
  };
}

/**
 * Recupere une variable d'environnement avec fallback
 * @param {string} primary - Nom de la variable principale
 * @param {string} fallback - Nom de la variable de fallback
 * @returns {string|undefined}
 */
export function getEnvWithFallback(primary, fallback) {
  return process.env[primary] || process.env[fallback];
}

/**
 * Verifie si les variables pour une fonctionnalite sont configurees
 * @param {string} feature - Le nom de la fonctionnalite
 * @returns {boolean}
 */
export function isFeatureConfigured(feature) {
  return validateEnvForEndpoint(feature).valid;
}

/**
 * Log le statut de toutes les variables d'environnement
 * Utile pour le debug en developpement
 */
export function logEnvStatus() {
  console.log('========================================');
  console.log('ENVIRONMENT VARIABLES STATUS');
  console.log('========================================');

  const validation = validateAllEnv();

  for (const [endpoint, result] of Object.entries(validation.results)) {
    const status = result.valid ? 'OK' : 'MISSING';
    const icon = result.valid ? '✓' : '✗';
    console.log(`${icon} ${endpoint.toUpperCase()}: ${status}`);

    if (!result.valid) {
      console.log(`  Missing: ${result.missing.join(', ')}`);
    }
  }

  console.log('========================================');
  console.log(`Overall: ${validation.valid ? 'ALL CONFIGURED' : 'SOME MISSING'}`);
  console.log('========================================');
}

/**
 * Configuration email avec support domaine custom
 * Retourne les parametres pour Resend
 */
export function getEmailConfig() {
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';
  const fromName = process.env.EMAIL_FROM_NAME || 'Synkro';

  return {
    from: `${fromName} <${fromAddress}>`,
    fromAddress,
    fromName,
    isCustomDomain: !fromAddress.includes('@resend.dev')
  };
}

export default {
  validateEnvForEndpoint,
  validateAllEnv,
  getEnvWithFallback,
  isFeatureConfigured,
  logEnvStatus,
  getEmailConfig,
  ENV_CONFIG
};
