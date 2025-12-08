/**
 * API consolidée pour les statistiques et analytics
 * - GET ?type=stats : Statistiques de base (plan, limites, permissions)
 * - GET ?type=detailed : Analytics détaillées (événements, participants, tendances)
 * - GET sans type : Retourne les deux
 */

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, type } = req.query;

  // Validation
  if (!email) {
    return res.status(400).json({
      error: 'Email manquant',
      message: 'Le paramètre email est requis'
    });
  }

  if (!AIRTABLE_BASE_ID || (!AIRTABLE_TOKEN && !AIRTABLE_API_KEY)) {
    console.error('Variables d\'environnement Airtable manquantes');
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  try {
    // Utiliser AIRTABLE_TOKEN ou AIRTABLE_API_KEY
    const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;

    const clerkUserId = req.query.clerkUserId || null;

    switch (type) {
      case 'stats':
        return await getUserStats(email, authToken, res);
      case 'detailed':
        return await getDetailedAnalytics(email, authToken, res, clerkUserId);
      default:
        // Retourner les deux
        const stats = await getUserStatsData(email, authToken);
        const analytics = await getDetailedAnalyticsData(email, authToken, clerkUserId);
        return res.status(200).json({
          success: true,
          stats,
          analytics
        });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
}

// Récupérer les statistiques utilisateur de base
async function getUserStats(email, authToken, res) {
  const data = await getUserStatsData(email, authToken);
  return res.status(200).json(data);
}

async function getUserStatsData(email, authToken) {
  // Récupérer l'utilisateur depuis Airtable
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users?filterByFormula={email}='${email}'`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  if (!response.ok) {
    console.error('Erreur Airtable:', await response.text());
    throw new Error('Erreur de connexion à la base de données');
  }

  const data = await response.json();

  // Si l'utilisateur n'existe pas, retourner des stats par défaut
  if (!data.records || data.records.length === 0) {
    return {
      email,
      plan: 'gratuit',
      eventsCreatedThisMonth: 0,
      eventsLimit: 5,
      canRemoveBranding: false,
      canExportData: false,
      canCustomizeColors: false,
      canAccessAnalytics: false,
      isNewUser: true
    };
  }

  const user = data.records[0].fields;

  // Construire les permissions basées sur le plan
  const plan = user.plan || 'gratuit';
  const isPro = plan === 'pro';
  const isEnterprise = plan === 'entreprise';
  const isPremium = isPro || isEnterprise;

  // Retourner les statistiques complètes
  return {
    email: user.email,
    clerk_user_id: user.clerk_user_id || null,
    plan,
    eventsCreatedThisMonth: user.events_created_this_month || 0,
    eventsLimit: isPremium ? 'illimité' : (user.events_limit || 5),
    lastEventDate: user.last_event_date || null,
    createdAt: user.created_at || null,
    theme_color: user.theme_color || 'violet',
    hide_branding: user.hide_branding || false,

    // Permissions basées sur le plan
    canRemoveBranding: isPremium,
    canExportData: isPremium,
    canCustomizeColors: isPremium,
    canAccessAnalytics: isPremium,
    canUploadLogo: isEnterprise,
    canHaveCustomDomain: isEnterprise,

    // Informations additionnelles
    isNewUser: false,
    remainingEvents: isPremium ? 'illimité' : Math.max(0, (user.events_limit || 5) - (user.events_created_this_month || 0))
  };
}

// Récupérer les analytics détaillées
async function getDetailedAnalytics(email, authToken, res, clerkUserId = null) {
  const data = await getDetailedAnalyticsData(email, authToken, clerkUserId);
  return res.status(200).json({
    success: true,
    analytics: data
  });
}

async function getDetailedAnalyticsData(email, authToken, clerkUserId = null) {
  let events = [];

  if (clerkUserId) {
    // Utiliser le système de permissions pour récupérer tous les événements accessibles
    try {
      const { getAccessibleEvents } = await import('./middleware/auth.js');
      const accessibleEvents = await getAccessibleEvents(clerkUserId);
      events = accessibleEvents;
    } catch (error) {
      console.error('Error loading accessible events, falling back to email filter:', error);
      // Fallback vers la méthode par email
      const eventsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Events?filterByFormula=organizerEmail="${email}"`;
      const eventsResponse = await fetch(eventsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        events = eventsData.records || [];
      }
    }
  } else {
    // Récupérer tous les événements de l'utilisateur par email (ancienne méthode)
    const eventsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Events?filterByFormula=organizerEmail="${email}"`;
    const eventsResponse = await fetch(eventsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!eventsResponse.ok) {
      throw new Error('Erreur lors de la récupération des événements');
    }

    const eventsData = await eventsResponse.json();
    events = eventsData.records || [];
  }

  // Calculer les analytics
  return calculateAnalytics(events);
}

function calculateAnalytics(events) {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      totalParticipants: 0,
      averageResponseRate: 0,
      averageResponseTime: 0,
      bestDay: 'N/A',
      bestDayPercentage: 0,
      monthlyTrend: [],
      topEventTypes: []
    };
  }

  let totalParticipants = 0;
  let totalResponded = 0;
  let totalExpected = 0;
  const dayCount = { 'Lundi': 0, 'Mardi': 0, 'Mercredi': 0, 'Jeudi': 0, 'Vendredi': 0, 'Samedi': 0, 'Dimanche': 0 };
  const eventTypeCount = {};
  const monthlyEvents = {};

  events.forEach(event => {
    const fields = event.fields;

    // Comptage participants
    if (fields.totalResponded) {
      totalResponded += fields.totalResponded;
    }
    if (fields.expectedParticipants) {
      totalExpected += fields.expectedParticipants;
    }

    // Comptage par type
    if (fields.type) {
      eventTypeCount[fields.type] = (eventTypeCount[fields.type] || 0) + 1;
    }

    // Analyse des dates confirmées
    if (fields.confirmedDate) {
      try {
        const date = new Date(fields.confirmedDate);
        const dayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][date.getDay()];
        dayCount[dayName]++;

        // Trend mensuel
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyEvents[monthKey] = (monthlyEvents[monthKey] || 0) + 1;
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }

    // Participants dans les réponses
    if (fields.participants) {
      try {
        const participants = JSON.parse(fields.participants);
        totalParticipants += participants.length;
      } catch (e) {
        // Ignorer si pas valide
      }
    }
  });

  // Calculer le meilleur jour
  let bestDay = 'Samedi';
  let maxCount = 0;
  Object.entries(dayCount).forEach(([day, count]) => {
    if (count > maxCount) {
      maxCount = count;
      bestDay = day;
    }
  });

  const totalDays = Object.values(dayCount).reduce((a, b) => a + b, 0);
  const bestDayPercentage = totalDays > 0 ? Math.round((maxCount / totalDays) * 100) : 0;

  // Taux de réponse moyen
  const averageResponseRate = totalExpected > 0
    ? Math.round((totalResponded / totalExpected) * 100)
    : 0;

  // Top types d'événements
  const topEventTypes = Object.entries(eventTypeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  // Trend mensuel (6 derniers mois)
  const monthlyTrend = Object.entries(monthlyEvents)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, count]) => ({
      month: formatMonth(month),
      count
    }));

  return {
    totalEvents: events.length,
    totalParticipants: totalParticipants || totalResponded,
    averageResponseRate,
    averageResponseTime: '2.4h', // Placeholder - nécessiterait tracking timestamps
    bestDay,
    bestDayPercentage,
    monthlyTrend,
    topEventTypes
  };
}

function formatMonth(monthKey) {
  const [year, month] = monthKey.split('-');
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
}
