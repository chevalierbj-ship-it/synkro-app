// api/get-analytics.js
// Endpoint pour récupérer les analytics détaillées d'un utilisateur

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
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
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis'
      });
    }

    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
      console.error('Missing Airtable credentials');
      return res.status(500).json({
        success: false,
        error: 'Configuration serveur manquante'
      });
    }

    // Récupérer tous les événements de l'utilisateur
    const eventsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Events?filterByFormula=organizerEmail="${email}"`;
    const eventsResponse = await fetch(eventsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!eventsResponse.ok) {
      throw new Error('Erreur lors de la récupération des événements');
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.records || [];

    // Calculer les analytics
    const analytics = calculateAnalytics(events);

    return res.status(200).json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
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
