/**
 * Middleware de Rate Limiting pour les APIs Vercel
 *
 * Implemente un rate limiting simple basee sur l'IP avec un store en memoire.
 * Note: Pour une solution plus robuste en production, utilisez Vercel KV ou Redis.
 *
 * Usage:
 *   import { rateLimit, rateLimitMiddleware } from './lib/rate-limit.js';
 *
 *   // Dans votre handler
 *   const rateLimitResult = rateLimitMiddleware(req, res, {
 *     limit: 10,
 *     windowMs: 60000 // 1 minute
 *   });
 *   if (rateLimitResult.limited) {
 *     return res.status(429).json({ error: 'Too many requests' });
 *   }
 */

// Store en memoire (reset a chaque cold start de la fonction)
// Pour une solution persistante, utilisez Vercel KV ou Redis
const requestCounts = new Map();

// Nettoie les entrees expirees periodiquement
const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

/**
 * Configuration par defaut pour differents endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // Creation d'evenements - limite stricte
  createEvent: {
    limit: 10,
    windowMs: 60 * 1000, // 10 par minute
    message: 'Trop de creations d\'evenements. Veuillez patienter.'
  },

  // Votes - limite moderee
  vote: {
    limit: 30,
    windowMs: 60 * 1000, // 30 par minute
    message: 'Trop de votes enregistres. Veuillez patienter.'
  },

  // Envoi d'emails - limite stricte
  email: {
    limit: 5,
    windowMs: 60 * 1000, // 5 par minute
    message: 'Trop d\'emails envoyes. Veuillez patienter.'
  },

  // Upload de fichiers - limite stricte
  upload: {
    limit: 5,
    windowMs: 60 * 1000, // 5 par minute
    message: 'Trop de fichiers telecharges. Veuillez patienter.'
  },

  // API generale - limite moderee
  default: {
    limit: 100,
    windowMs: 60 * 1000, // 100 par minute
    message: 'Trop de requetes. Veuillez patienter.'
  },

  // Checkout Stripe - limite tres stricte
  checkout: {
    limit: 3,
    windowMs: 60 * 1000, // 3 par minute
    message: 'Trop de tentatives de paiement. Veuillez patienter.'
  }
};

/**
 * Extrait l'adresse IP du client depuis la requete
 * @param {Object} req - Requete HTTP
 * @returns {string} - Adresse IP du client
 */
export function getClientIp(req) {
  // Vercel ajoute l'IP reelle dans x-forwarded-for
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for peut contenir plusieurs IPs separees par des virgules
    // La premiere est l'IP originale du client
    return forwarded.split(',')[0].trim();
  }

  // Fallback vers x-real-ip ou connection remote address
  return req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Nettoie les entrees expirees du store
 */
function cleanupExpiredEntries() {
  const now = Date.now();

  // Ne nettoie que toutes les CLEANUP_INTERVAL ms
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  lastCleanup = now;

  for (const [key, data] of requestCounts.entries()) {
    if (now - data.windowStart > data.windowMs) {
      requestCounts.delete(key);
    }
  }
}

/**
 * Verifie et applique le rate limiting
 * @param {string} identifier - Identifiant unique (IP + endpoint)
 * @param {Object} config - Configuration du rate limit
 * @returns {Object} - { limited: boolean, remaining: number, resetTime: number }
 */
export function rateLimit(identifier, config = RATE_LIMIT_CONFIGS.default) {
  cleanupExpiredEntries();

  const now = Date.now();
  const key = identifier;

  let data = requestCounts.get(key);

  // Nouvelle fenetre ou premiere requete
  if (!data || now - data.windowStart > config.windowMs) {
    data = {
      count: 1,
      windowStart: now,
      windowMs: config.windowMs
    };
    requestCounts.set(key, data);

    return {
      limited: false,
      remaining: config.limit - 1,
      resetTime: now + config.windowMs,
      totalRequests: 1
    };
  }

  // Incremente le compteur
  data.count++;
  requestCounts.set(key, data);

  const remaining = Math.max(0, config.limit - data.count);
  const resetTime = data.windowStart + config.windowMs;

  return {
    limited: data.count > config.limit,
    remaining,
    resetTime,
    totalRequests: data.count
  };
}

/**
 * Middleware de rate limiting pour les handlers Vercel
 * @param {Object} req - Requete HTTP
 * @param {Object} res - Reponse HTTP
 * @param {Object} options - Options de configuration
 * @returns {Object} - Resultat du rate limiting
 */
export function rateLimitMiddleware(req, res, options = {}) {
  const config = {
    ...RATE_LIMIT_CONFIGS.default,
    ...options
  };

  const ip = getClientIp(req);
  const endpoint = options.endpoint || req.url || 'default';
  const identifier = `${ip}:${endpoint}`;

  const result = rateLimit(identifier, config);

  // Ajoute les headers de rate limit a la reponse
  res.setHeader('X-RateLimit-Limit', config.limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetTime);

  if (result.limited) {
    console.warn(`Rate limit exceeded for ${ip} on ${endpoint}. Total requests: ${result.totalRequests}`);
  }

  return result;
}

/**
 * Applique le rate limiting et retourne une reponse 429 si limite atteinte
 * @param {Object} req - Requete HTTP
 * @param {Object} res - Reponse HTTP
 * @param {string} configName - Nom de la config (createEvent, vote, email, etc.)
 * @returns {boolean} - true si la requete doit etre bloquee
 */
export function applyRateLimit(req, res, configName = 'default') {
  const config = RATE_LIMIT_CONFIGS[configName] || RATE_LIMIT_CONFIGS.default;

  const result = rateLimitMiddleware(req, res, {
    ...config,
    endpoint: configName
  });

  if (result.limited) {
    res.status(429).json({
      error: 'Too many requests',
      message: config.message,
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
    });
    return true;
  }

  return false;
}

/**
 * Wrapper pour proteger un handler avec rate limiting
 * @param {Function} handler - Le handler a proteger
 * @param {string} configName - Nom de la config
 * @returns {Function} - Handler avec rate limiting
 */
export function withRateLimit(handler, configName = 'default') {
  return async (req, res) => {
    if (applyRateLimit(req, res, configName)) {
      return; // Requete bloquee
    }
    return handler(req, res);
  };
}

export default {
  rateLimit,
  rateLimitMiddleware,
  applyRateLimit,
  withRateLimit,
  getClientIp,
  RATE_LIMIT_CONFIGS
};
