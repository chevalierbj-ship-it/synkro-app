/**
 * API consolidée pour la gestion utilisateur
 *
 * ANALYTICS:
 * - GET ?action=stats : Statistiques de base (plan, limites, permissions)
 * - GET ?action=analytics : Analytics détaillées (événements, participants, tendances)
 *
 * SYNC USER PLAN:
 * - GET ?action=sync-plan&email=xxx : Synchroniser le plan depuis Stripe
 *
 * SETTINGS:
 * - POST ?action=ai-preferences : Sauvegarder les préférences IA
 * - POST ?action=customization : Sauvegarder la personnalisation
 */

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // GET requests
    if (req.method === 'GET') {
      if (action === 'sync-plan') {
        return await syncUserPlan(req, res);
      }
      if (action === 'stats') {
        return await getUserStats(req, res);
      }
      if (action === 'analytics') {
        return await getDetailedAnalytics(req, res);
      }
      // Par défaut, retourner stats + analytics
      return await getAllAnalytics(req, res);
    }

    // POST requests
    if (req.method === 'POST') {
      if (action === 'ai-preferences') {
        return await saveAIPreferences(req, res);
      }
      if (action === 'customization') {
        return await saveCustomization(req, res);
      }
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Use action=ai-preferences|customization'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('User API error:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
}

// ========================================
// SYNC USER PLAN - Synchronisation Stripe → Airtable
// ========================================

async function syncUserPlan(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      error: 'Email manquant',
      message: 'Le paramètre email est requis'
    });
  }

  const logs = [];
  const log = (message) => {
    console.log(message);
    logs.push(message);
  };

  try {
    log(`🔍 Synchronizing plan for user: ${email}`);

    // 1. Chercher le client dans Stripe par email
    log('📡 Searching for customer in Stripe...');
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customers.data.length === 0) {
      log('❌ No Stripe customer found for this email');
      return res.status(404).json({
        success: false,
        message: 'Aucun client Stripe trouvé pour cet email',
        logs
      });
    }

    const customer = customers.data[0];
    log(`✅ Stripe customer found: ${customer.id}`);

    // 2. Récupérer les abonnements actifs
    log('📡 Fetching active subscriptions...');
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    let plan = 'gratuit';
    let subscriptionData = null;

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0].price.id;

      log(`✅ Active subscription found: ${subscription.id}`);
      log(`🔍 Price ID: ${priceId}`);

      // Déterminer le plan
      if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
          priceId === process.env.STRIPE_PRICE_PRO_YEARLY) {
        plan = 'pro';
      } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ||
                 priceId === process.env.STRIPE_PRICE_ENTERPRISE_YEARLY) {
        plan = 'entreprise';
      }

      subscriptionData = {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        priceId: priceId
      };

      log(`✅ Determined plan: ${plan}`);
    } else {
      log('⚠️ No active subscription found - defaulting to gratuit');
    }

    // 3. Mettre à jour Airtable
    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
      log('❌ Airtable credentials missing');
      return res.status(500).json({
        success: false,
        message: 'Configuration Airtable manquante',
        logs
      });
    }

    log('📡 Searching for user in Airtable...');
    const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;
    const searchResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users?filterByFormula={email}='${email}'`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      log(`❌ Error searching Airtable: ${errorText}`);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche dans Airtable',
        logs
      });
    }

    const searchData = await searchResponse.json();

    if (searchData.records && searchData.records.length > 0) {
      // Utilisateur existe - mettre à jour
      const recordId = searchData.records[0].id;
      const currentData = searchData.records[0].fields;

      log(`✅ User found in Airtable, record ID: ${recordId}`);
      log(`🔍 Current plan in Airtable: ${currentData.plan || 'not set'}`);

      const updatePayload = {
        fields: {
          plan: plan,
          stripe_customer_id: customer.id,
          events_limit: plan === 'pro' ? 15 : (plan === 'entreprise' ? 999 : 5)
        }
      };

      if (subscriptionData) {
        updatePayload.fields.stripe_subscription_id = subscriptionData.id;
        updatePayload.fields.subscription_status = subscriptionData.status;
        updatePayload.fields.subscription_period_end = subscriptionData.currentPeriodEnd;
      }

      log(`🔄 Updating Airtable with plan: ${plan}`);

      const updateResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users/${recordId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        }
      );

      if (updateResponse.ok) {
        const updatedData = await updateResponse.json();
        log(`✅✅✅ User plan successfully updated to: ${plan}`);

        return res.status(200).json({
          success: true,
          message: 'Synchronisation réussie',
          data: {
            email: email,
            previousPlan: currentData.plan || 'not set',
            newPlan: plan,
            stripeCustomerId: customer.id,
            subscription: subscriptionData,
            airtableRecord: updatedData.fields
          },
          logs
        });
      } else {
        const errorText = await updateResponse.text();
        log(`❌ Error updating Airtable: ${errorText}`);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour Airtable',
          logs
        });
      }
    } else {
      // Utilisateur n'existe pas - le créer
      log('⚠️ User not found in Airtable, creating new user...');

      const createPayload = {
        fields: {
          email: email,
          plan: plan,
          stripe_customer_id: customer.id,
          created_at: new Date().toISOString(),
          events_created_this_month: 0,
          events_limit: plan === 'pro' ? 15 : (plan === 'entreprise' ? 999 : 5)
        }
      };

      if (subscriptionData) {
        createPayload.fields.stripe_subscription_id = subscriptionData.id;
        createPayload.fields.subscription_status = subscriptionData.status;
        createPayload.fields.subscription_period_end = subscriptionData.currentPeriodEnd;
      }

      const createResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createPayload)
        }
      );

      if (createResponse.ok) {
        const createdData = await createResponse.json();
        log(`✅✅✅ User created in Airtable with plan: ${plan}`);

        return res.status(200).json({
          success: true,
          message: 'Utilisateur créé et synchronisé',
          data: {
            email: email,
            plan: plan,
            stripeCustomerId: customer.id,
            subscription: subscriptionData,
            airtableRecord: createdData.fields
          },
          logs
        });
      } else {
        const errorText = await createResponse.text();
        log(`❌ Error creating user in Airtable: ${errorText}`);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création dans Airtable',
          logs
        });
      }
    }

  } catch (error) {
    log(`❌ Error: ${error.message}`);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: error.message,
      logs
    });
  }
}

// ========================================
// ANALYTICS - Statistiques et analytics
// ========================================

async function getAllAnalytics(req, res) {
  const { email, clerkUserId } = req.query;

  if (!email) {
    return res.status(400).json({
      error: 'Email manquant',
      message: 'Le paramètre email est requis'
    });
  }

  const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;
  const stats = await getUserStatsData(email, authToken);
  const analytics = await getDetailedAnalyticsData(email, authToken, clerkUserId);

  return res.status(200).json({
    success: true,
    stats,
    analytics
  });
}

async function getUserStats(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      error: 'Email manquant',
      message: 'Le paramètre email est requis'
    });
  }

  const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;
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

async function getDetailedAnalytics(req, res) {
  const { email, clerkUserId } = req.query;

  if (!email) {
    return res.status(400).json({
      error: 'Email manquant',
      message: 'Le paramètre email est requis'
    });
  }

  const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;
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

// ========================================
// SETTINGS - Préférences et personnalisation
// ========================================

async function saveAIPreferences(req, res) {
  const { eventId, participantName, participantEmail, preferences } = req.body;

  if (!eventId || !participantName || !preferences) {
    return res.status(400).json({
      error: 'Données manquantes',
      message: 'eventId, participantName et preferences sont requis'
    });
  }

  const AIRTABLE_TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.error('Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;

  console.log('🔍 Searching for event:', eventId);
  const searchResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula={eventId}="${eventId}"`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!searchResponse.ok) {
    const errorText = await searchResponse.text();
    console.error('Failed to search event:', errorText);
    throw new Error('Failed to search event');
  }

  const searchData = await searchResponse.json();

  if (!searchData.records || searchData.records.length === 0) {
    console.error('Event not found with eventId:', eventId);
    return res.status(404).json({ error: 'Event not found' });
  }

  const airtableRecord = searchData.records[0];
  const airtableRecordId = airtableRecord.id;
  const event = airtableRecord.fields;

  console.log('✅ Event found:', eventId, '→ Airtable Record ID:', airtableRecordId);

  let aiPreferences = [];
  if (event.ai_preferences) {
    try {
      aiPreferences = JSON.parse(event.ai_preferences);
    } catch (e) {
      console.error('Error parsing existing ai_preferences:', e);
      aiPreferences = [];
    }
  }

  const existingIndex = aiPreferences.findIndex(
    pref => pref.participant_name?.toLowerCase() === participantName.toLowerCase()
  );

  const newPreference = {
    participant_name: participantName,
    participant_email: participantEmail || '',
    preferences: preferences,
    answered_at: new Date().toISOString()
  };

  if (existingIndex !== -1) {
    aiPreferences[existingIndex] = newPreference;
    console.log('📝 Updating existing AI preferences for:', participantName);
  } else {
    aiPreferences.push(newPreference);
    console.log('➕ Adding new AI preferences for:', participantName);
  }

  const updateResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${airtableRecordId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          ai_preferences: JSON.stringify(aiPreferences)
        }
      })
    }
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    console.error('Failed to update event:', errorText);
    throw new Error('Failed to update event');
  }

  console.log('✅ AI preferences saved successfully');

  return res.status(200).json({
    success: true,
    message: 'Préférences sauvegardées avec succès',
    totalResponses: aiPreferences.length,
    expectedParticipants: event.expectedParticipants || 0,
    allResponsesReceived: aiPreferences.length >= (event.expectedParticipants || 0)
  });
}

async function saveCustomization(req, res) {
  const { clerkUserId, themeColor, hideBranding } = req.body;

  if (!clerkUserId) {
    return res.status(400).json({
      error: 'clerkUserId manquant',
      message: 'Le paramètre clerkUserId est requis'
    });
  }

  if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
    console.error('Variables d\'environnement Airtable manquantes');
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;

  const getUserResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users?filterByFormula={clerk_user_id}='${clerkUserId}'`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  if (!getUserResponse.ok) {
    console.error('Erreur Airtable (GET):', await getUserResponse.text());
    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
  }

  const userData = await getUserResponse.json();

  if (userData.records.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userId = userData.records[0].id;

  const updateResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users/${userId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          theme_color: themeColor,
          hide_branding: hideBranding
        }
      })
    }
  );

  if (!updateResponse.ok) {
    console.error('Erreur Airtable (PATCH):', await updateResponse.text());
    return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }

  return res.status(200).json({ success: true });
}
