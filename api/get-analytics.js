/**
 * API Analytics pour plan Entreprise
 * GET /api/get-analytics.js?email=xxx&period=7d|30d|90d&startDate=xxx&endDate=xxx
 *
 * Retourne des analytics détaillées :
 * - Nombre total d'événements créés
 * - Taux de réponse moyen
 * - Temps moyen de réponse
 * - Top types d'événements
 * - Évolution temporelle (jour par jour ou mois par mois)
 */

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_EVENTS_TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

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

  try {
    const { email, clerkUserId, period, startDate, endDate } = req.query;

    if (!email && !clerkUserId) {
      return res.status(400).json({
        error: 'Email ou clerkUserId requis',
        message: 'Vous devez fournir email ou clerkUserId'
      });
    }

    // 1. Vérifier que l'utilisateur a le plan Entreprise
    const userPlan = await getUserPlan(email, clerkUserId);

    if (userPlan !== 'entreprise') {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Les analytics avancées sont réservées au plan Entreprise',
        currentPlan: userPlan,
        upgradeUrl: '/pricing'
      });
    }

    // 2. Récupérer tous les événements de l'utilisateur
    const events = await getUserEvents(email, clerkUserId);

    // 3. Appliquer les filtres de période
    const filteredEvents = filterEventsByPeriod(events, period, startDate, endDate);

    // 4. Calculer les analytics
    const analytics = calculateEnterpriseAnalytics(filteredEvents, period);

    return res.status(200).json({
      success: true,
      period: period || 'all',
      analytics
    });

  } catch (error) {
    console.error('Error in get-analytics:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

async function getUserPlan(email, clerkUserId) {
  const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;

  let filterFormula = email
    ? `{email}='${email}'`
    : `{clerk_user_id}='${clerkUserId}'`;

  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users?filterByFormula=${filterFormula}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du plan utilisateur');
  }

  const data = await response.json();

  if (!data.records || data.records.length === 0) {
    return 'gratuit'; // Utilisateur non trouvé = gratuit
  }

  return data.records[0].fields.plan || 'gratuit';
}

async function getUserEvents(email, clerkUserId) {
  const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;

  // Si clerkUserId fourni, utiliser le système de permissions
  if (clerkUserId) {
    try {
      const { getAccessibleEvents } = await import('./middleware/auth.js');
      const accessibleEvents = await getAccessibleEvents(clerkUserId);
      return accessibleEvents;
    } catch (error) {
      console.error('Error loading accessible events, falling back to email filter:', error);
    }
  }

  // Fallback vers la méthode par email
  let filterFormula = email
    ? `{organizerEmail}="${email}"`
    : '';

  const eventsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_EVENTS_TABLE_ID}?filterByFormula=${filterFormula}`;

  const response = await fetch(eventsUrl, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des événements');
  }

  const data = await response.json();
  return data.records || [];
}

function filterEventsByPeriod(events, period, startDate, endDate) {
  if (!period && !startDate && !endDate) {
    return events; // Pas de filtre = tous les événements
  }

  const now = new Date();
  let filterStartDate;

  // Calculer la date de début selon la période
  if (period === '7d') {
    filterStartDate = new Date(now);
    filterStartDate.setDate(now.getDate() - 7);
  } else if (period === '30d') {
    filterStartDate = new Date(now);
    filterStartDate.setDate(now.getDate() - 30);
  } else if (period === '90d') {
    filterStartDate = new Date(now);
    filterStartDate.setDate(now.getDate() - 90);
  } else if (startDate) {
    filterStartDate = new Date(startDate);
  }

  const filterEndDate = endDate ? new Date(endDate) : now;

  return events.filter(event => {
    const eventDate = new Date(event.fields.createdAt || event.createdTime);

    if (filterStartDate && eventDate < filterStartDate) {
      return false;
    }
    if (eventDate > filterEndDate) {
      return false;
    }

    return true;
  });
}

function calculateEnterpriseAnalytics(events, period) {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      totalParticipants: 0,
      totalResponses: 0,
      averageResponseRate: 0,
      averageResponseTime: '0h',
      averageResponseTimeMinutes: 0,
      topEventTypes: [],
      evolutionData: [],
      participationTrend: [],
      responseRateByEventType: []
    };
  }

  let totalEvents = events.length;
  let totalParticipants = 0;
  let totalResponses = 0;
  let totalExpected = 0;
  let totalResponseTimeMinutes = 0;
  let responseTimeCount = 0;

  const eventTypeCount = {};
  const eventTypeResponses = {};
  const eventTypeExpected = {};
  const timeSeriesData = {};

  events.forEach(event => {
    const fields = event.fields;

    // Comptage des participants et réponses
    if (fields.totalResponded) {
      totalResponses += fields.totalResponded;
    }
    if (fields.expectedParticipants) {
      totalExpected += fields.expectedParticipants;
    }

    // Comptage par type d'événement
    const eventType = fields.type || 'Non spécifié';
    eventTypeCount[eventType] = (eventTypeCount[eventType] || 0) + 1;
    eventTypeResponses[eventType] = (eventTypeResponses[eventType] || 0) + (fields.totalResponded || 0);
    eventTypeExpected[eventType] = (eventTypeExpected[eventType] || 0) + (fields.expectedParticipants || 0);

    // Calcul du temps de réponse moyen
    if (fields.participants) {
      try {
        const participants = JSON.parse(fields.participants);
        totalParticipants += participants.length;

        const eventCreatedAt = new Date(fields.createdAt || event.createdTime);

        participants.forEach(participant => {
          if (participant.votedAt) {
            const votedAt = new Date(participant.votedAt);
            const responseTimeMs = votedAt - eventCreatedAt;
            const responseTimeMinutes = Math.max(0, responseTimeMs / (1000 * 60));
            totalResponseTimeMinutes += responseTimeMinutes;
            responseTimeCount++;
          }
        });
      } catch (e) {
        console.error('Error parsing participants:', e);
      }
    }

    // Série temporelle pour l'évolution
    const eventDate = new Date(fields.createdAt || event.createdTime);
    let timeKey;

    if (period === '7d' || period === '30d') {
      // Pour 7j et 30j : jour par jour
      timeKey = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD
    } else {
      // Pour 90j et plus : mois par mois
      timeKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!timeSeriesData[timeKey]) {
      timeSeriesData[timeKey] = {
        count: 0,
        responses: 0,
        expected: 0
      };
    }

    timeSeriesData[timeKey].count += 1;
    timeSeriesData[timeKey].responses += (fields.totalResponded || 0);
    timeSeriesData[timeKey].expected += (fields.expectedParticipants || 0);
  });

  // Calcul du taux de réponse moyen
  const averageResponseRate = totalExpected > 0
    ? Math.round((totalResponses / totalExpected) * 100)
    : 0;

  // Calcul du temps de réponse moyen
  const avgResponseMinutes = responseTimeCount > 0
    ? Math.round(totalResponseTimeMinutes / responseTimeCount)
    : 0;

  const avgResponseTime = formatResponseTime(avgResponseMinutes);

  // Top types d'événements (Top 5)
  const topEventTypes = Object.entries(eventTypeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalEvents) * 100)
    }));

  // Taux de réponse par type d'événement
  const responseRateByEventType = Object.keys(eventTypeCount)
    .map(type => ({
      type,
      count: eventTypeCount[type],
      responseRate: eventTypeExpected[type] > 0
        ? Math.round((eventTypeResponses[type] / eventTypeExpected[type]) * 100)
        : 0
    }))
    .sort((a, b) => b.responseRate - a.responseRate);

  // Évolution temporelle triée
  const evolutionData = Object.entries(timeSeriesData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date: formatDate(date, period),
      count: data.count,
      responses: data.responses,
      expected: data.expected,
      responseRate: data.expected > 0
        ? Math.round((data.responses / data.expected) * 100)
        : 0
    }));

  return {
    totalEvents,
    totalParticipants: totalParticipants || totalResponses,
    totalResponses,
    totalExpected,
    averageResponseRate,
    averageResponseTime: avgResponseTime,
    averageResponseTimeMinutes: avgResponseMinutes,
    topEventTypes,
    evolutionData,
    responseRateByEventType
  };
}

function formatResponseTime(minutes) {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
}

function formatDate(dateKey, period) {
  if (period === '7d' || period === '30d') {
    // Format: YYYY-MM-DD → "15 Jan"
    const date = new Date(dateKey);
    const day = date.getDate();
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  } else {
    // Format: YYYY-MM → "Jan 24"
    const [year, month] = dateKey.split('-');
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
  }
}
