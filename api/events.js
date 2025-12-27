// /api/events.js
// API consolidée pour gérer les événements
// Route selon la méthode HTTP et les paramètres

import { applyRateLimit } from './_lib/rate-limit.js';
import { getEmailConfig } from './_lib/validate-env.js';

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Router selon l'action
  const { action } = req.query;

  try {
    // GET /api/events?action=get&id=xxx - Récupérer un événement
    if (req.method === 'GET' && action === 'get') {
      return await getEvent(req, res);
    }

    // POST /api/events?action=create - Créer un événement
    if (req.method === 'POST' && action === 'create') {
      // Rate limiting pour la création d'événements
      if (applyRateLimit(req, res, 'createEvent')) {
        return; // Requête bloquée par rate limit
      }
      return await createEvent(req, res);
    }

    // POST /api/events?action=update - Mettre à jour un événement (votes)
    if (req.method === 'POST' && action === 'update') {
      // Rate limiting pour les votes
      if (applyRateLimit(req, res, 'vote')) {
        return; // Requête bloquée par rate limit
      }
      return await updateEvent(req, res);
    }

    // POST /api/events?action=track - Tracker un événement (limites)
    if (req.method === 'POST' && action === 'track') {
      return await trackEvent(req, res);
    }

    // POST /api/events?action=confirm - Confirmer une date (organisateur)
    if (req.method === 'POST' && action === 'confirm') {
      return await confirmDate(req, res);
    }

    // DELETE /api/events?action=delete - Supprimer un événement (organisateur)
    if ((req.method === 'POST' || req.method === 'DELETE') && action === 'delete') {
      return await deleteEvent(req, res);
    }

    // GET /api/events?action=calendar-ics&id=xxx - Générer fichier ICS
    if (req.method === 'GET' && action === 'calendar-ics') {
      return await generateCalendarICS(req, res);
    }

    return res.status(400).json({
      error: 'Invalid action',
      message: 'Use action=create|get|update|track|confirm|delete|calendar-ics'
    });

  } catch (error) {
    console.error('Error in events API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

// ========================================
// GET EVENT - Récupérer un événement
// ========================================
async function getEvent(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  console.log('📥 Fetching event with ID:', id);

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

  if (!AIRTABLE_TOKEN || !BASE_ID || !TABLE_ID) {
    console.error('❌ Missing Airtable configuration');
    return res.status(500).json({ error: 'Database configuration error' });
  }

  const searchUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula={eventId}='${id}'`;

  const searchResponse = await fetch(searchUrl, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!searchResponse.ok) {
    const errorText = await searchResponse.text();
    console.error('Airtable search error:', errorText);
    return res.status(500).json({ error: 'Database search error' });
  }

  const searchData = await searchResponse.json();

  if (!searchData.records || searchData.records.length === 0) {
    console.log('❌ Event not found:', id);
    return res.status(404).json({ error: 'Event not found' });
  }

  const record = searchData.records[0];
  console.log('✅ Event found:', record.id);

  const dates = record.fields.dates ? JSON.parse(record.fields.dates) : [];
  const participants = record.fields.participants ? JSON.parse(record.fields.participants) : [];
  const budgetRanges = record.fields.budgetRanges ? JSON.parse(record.fields.budgetRanges) : [];
  const budgetVotes = record.fields.budgetVotes ? JSON.parse(record.fields.budgetVotes) : [];

  const event = {
    eventId: record.fields.eventId,
    airtableId: record.id,
    type: record.fields.type,
    organizerName: record.fields.organizerName,
    organizerEmail: record.fields.organizerEmail || null,
    location: record.fields.location || null,
    eventSchedule: record.fields.eventSchedule || null,
    expectedParticipants: record.fields.expectedParticipants || 0,
    totalResponded: record.fields.totalResponded || 0,
    dates: dates,
    participants: participants,
    status: record.fields.status || 'active',
    createdAt: record.fields.createdAt,
    budgetVoteEnabled: record.fields.budgetVoteEnabled || false,
    budgetRanges: budgetRanges,
    budgetVotes: budgetVotes,
    useAI: record.fields.useAI || false,
    ai_preferences: record.fields.ai_preferences || null,
    cagnotteLink: record.fields.cagnotteLink || null,
    confirmedDate: record.fields.confirmedDate || null,
    confirmedTime: record.fields.confirmedTime || null
  };

  return res.status(200).json({
    success: true,
    event: event
  });
}

// ========================================
// CREATE EVENT - Créer un événement
// ========================================
async function createEvent(req, res) {
  const eventData = req.body;

  if (!eventData.type || !eventData.organizerName || !eventData.dates) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['type', 'organizerName', 'dates']
    });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

  if (!AIRTABLE_TOKEN || !BASE_ID || !TABLE_ID) {
    console.error('Missing environment variables');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'Missing Airtable credentials'
    });
  }

  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const airtableData = {
    fields: {
      eventId: eventId,
      type: eventData.type,
      organizerName: eventData.organizerName,
      organizerEmail: eventData.organizerEmail || '',
      location: eventData.location || '',
      eventSchedule: eventData.eventSchedule || '',
      expectedParticipants: eventData.expectedParticipants || 0,
      dates: JSON.stringify(eventData.dates),
      participants: JSON.stringify([]),
      totalResponded: 0,
      status: 'active',
      budgetVoteEnabled: eventData.budgetVoteEnabled || false,
      budgetRanges: eventData.budgetVoteEnabled
        ? JSON.stringify(eventData.budgetRanges)
        : null,
      budgetVotes: eventData.budgetVoteEnabled
        ? JSON.stringify(eventData.budgetRanges.map(range => ({
            range: range,
            votes: 0,
            voters: []
          })))
        : null,
      cagnotteLink: eventData.cagnotteLink || '',
      useAI: eventData.useAI !== undefined ? eventData.useAI : true,
      ai_preferences: JSON.stringify([])
    }
  };

  console.log('Creating event with ID:', eventId);

  const response = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtableData)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Airtable error:', errorText);
    return res.status(500).json({
      error: 'Failed to create event in Airtable',
      details: errorText,
      status: response.status
    });
  }

  const result = await response.json();
  console.log('Event created successfully:', result.id);

  // Envoi email à l'organisateur
  if (eventData.organizerEmail) {
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;

      if (RESEND_API_KEY) {
        const eventLink = `https://getsynkro.com/participant?id=${eventId}`;
        const adminLink = `https://getsynkro.com/admin?id=${eventId}`;

        const emailHTML = getOrganizerCreatedEmail({
          eventType: eventData.type,
          eventLink: eventLink,
          adminLink: adminLink,
          organizerName: eventData.organizerName,
          dates: eventData.dates,
          location: eventData.location || null,
          eventSchedule: eventData.eventSchedule || null
        });

        const emailConfig = getEmailConfig();
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: emailConfig.from,
            to: [eventData.organizerEmail],
            subject: 'Synkro - Ton événement est créé',
            html: emailHTML,
            headers: {
              'List-Unsubscribe': '<mailto:unsubscribe@getsynkro.com>',
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            }
          })
        });

        if (resendResponse.ok) {
          const resendResult = await resendResponse.json();
          console.log('✅ Email sent to organizer:', eventData.organizerEmail);
        } else {
          console.error('❌ Resend API error:', await resendResponse.text());
        }
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send email to organizer:', emailError.message);
    }
  }

  return res.status(200).json({
    success: true,
    eventId: eventId,
    airtableId: result.id,
    participantLink: `https://getsynkro.com/participant?id=${eventId}`,
    message: 'Event created successfully'
  });
}

// ========================================
// UPDATE EVENT - Mettre à jour un événement
// ========================================
async function updateEvent(req, res) {
  const { eventId, participantName, participantEmail, availabilities, selectedBudget } = req.body;

  if (!eventId || !participantName || !availabilities) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const normalizedEmail = participantEmail && participantEmail.trim() !== '' ? participantEmail.trim() : null;

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.error('Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  console.log('🔍 Searching for event:', eventId);
  const searchResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula={eventId}="${eventId}"`,
    {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
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

  const existingParticipants = event.participants ? JSON.parse(event.participants) : [];
  const existingDates = event.dates ? JSON.parse(event.dates) : [];
  const existingBudgetVotes = event.budgetVotes ? JSON.parse(event.budgetVotes) : [];

  const existingParticipantIndex = existingParticipants.findIndex(
    p => p.name.toLowerCase() === participantName.toLowerCase()
  );

  const newParticipant = {
    name: participantName,
    email: normalizedEmail || '',
    availabilities: availabilities,
    selectedBudget: selectedBudget || null,
    votedAt: new Date().toISOString()
  };

  let updatedParticipants;
  if (existingParticipantIndex !== -1) {
    updatedParticipants = [...existingParticipants];
    updatedParticipants[existingParticipantIndex] = newParticipant;
  } else {
    updatedParticipants = [...existingParticipants, newParticipant];
  }

  const updatedDates = existingDates.map(date => ({
    ...date,
    votes: 0,
    voters: []
  }));

  updatedParticipants.forEach(participant => {
    Object.keys(participant.availabilities).forEach(dateLabel => {
      if (participant.availabilities[dateLabel]) {
        const dateIndex = updatedDates.findIndex(d => d.label === dateLabel);
        if (dateIndex !== -1) {
          updatedDates[dateIndex].votes += 1;
          updatedDates[dateIndex].voters.push(participant.name);
        }
      }
    });
  });

  let updatedBudgetVotes = existingBudgetVotes;
  if (existingBudgetVotes.length > 0) {
    updatedBudgetVotes = existingBudgetVotes.map(bv => ({
      ...bv,
      votes: 0,
      voters: []
    }));

    updatedParticipants.forEach(participant => {
      if (participant.selectedBudget) {
        const budgetIndex = updatedBudgetVotes.findIndex(b => b.range === participant.selectedBudget);
        if (budgetIndex !== -1) {
          updatedBudgetVotes[budgetIndex].votes += 1;
          updatedBudgetVotes[budgetIndex].voters.push(participant.name);
        }
      }
    });
  }

  const totalResponded = updatedParticipants.length;

  const updateResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${airtableRecordId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          participants: JSON.stringify(updatedParticipants),
          dates: JSON.stringify(updatedDates),
          totalResponded: totalResponded,
          budgetVotes: existingBudgetVotes.length > 0 ? JSON.stringify(updatedBudgetVotes) : null
        }
      })
    }
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    console.error('Failed to update event:', errorText);
    throw new Error('Failed to update event');
  }

  console.log('✅ Event updated successfully');

  // Email confirmation participant
  if (normalizedEmail) {
    await sendParticipantConfirmationEmail({
      participantName,
      participantEmail: normalizedEmail,
      eventType: event.type,
      organizerName: event.organizerName,
      location: event.location,
      eventSchedule: event.eventSchedule,
      cagnotteLink: event.cagnotteLink,
      dates: existingDates,
      availabilities,
      eventId
    });
  }

  // Vérifier si 70% atteint
  const expectedParticipants = event.expectedParticipants || 0;
  const previousPercentage = event.previousParticipationRate || 0;
  const currentPercentage = expectedParticipants > 0
    ? Math.round((totalResponded / expectedParticipants) * 100)
    : 0;

  if (currentPercentage >= 70 && previousPercentage < 70) {
    const bestDate = updatedDates.reduce((prev, current) =>
      current.votes > prev.votes ? current : prev
    );

    await sendCelebrationEmail({
      participants: updatedParticipants,
      eventType: event.type,
      organizerName: event.organizerName,
      organizerEmail: event.organizerEmail,
      location: event.location,
      eventSchedule: event.eventSchedule,
      bestDate,
      totalResponded,
      expectedParticipants,
      percentage: currentPercentage
    });

    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${airtableRecordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            previousParticipationRate: currentPercentage
          }
        })
      }
    );
  }

  // Vérifier si 100% atteint (tous ont voté)
  const previous100Sent = event.allVotedNotificationSent || false;
  if (currentPercentage >= 100 && !previous100Sent && expectedParticipants > 0) {
    const bestDate = updatedDates.reduce((prev, current) =>
      current.votes > prev.votes ? current : prev
    );

    // Envoyer email de célébration 100% avec boutons calendrier à tous
    await sendAllVotedCelebrationEmail({
      participants: updatedParticipants,
      eventType: event.type,
      organizerName: event.organizerName,
      organizerEmail: event.organizerEmail,
      location: event.location,
      eventSchedule: event.eventSchedule,
      bestDate,
      totalResponded,
      expectedParticipants,
      eventId
    });

    // Marquer comme notifié pour éviter les envois multiples
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${airtableRecordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            allVotedNotificationSent: true
          }
        })
      }
    );
  }

  return res.status(200).json({
    success: true,
    message: 'Vote enregistré avec succès',
    celebrationSent: currentPercentage >= 70 && previousPercentage < 70,
    allVotedSent: currentPercentage >= 100 && !previous100Sent,
    event: {
      ...event,
      participants: updatedParticipants,
      dates: updatedDates,
      totalResponded: totalResponded
    }
  });
}

// ========================================
// TRACK EVENT - Tracker les limites
// ========================================
async function trackEvent(req, res) {
  const { userEmail, eventName, participantsCount, eventId } = req.body;

  if (!userEmail || !eventName) {
    return res.status(400).json({
      error: 'Données manquantes',
      message: 'Email et nom d\'événement requis'
    });
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
    console.error('Variables d\'environnement Airtable manquantes');
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  const userResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users?filterByFormula={email}='${userEmail}'`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      }
    }
  );

  if (!userResponse.ok) {
    console.error('Erreur Airtable:', await userResponse.text());
    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
  }

  const userData = await userResponse.json();
  let user = userData.records[0];

  if (!user) {
    const createUserResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            email: userEmail,
            plan: 'gratuit',
            events_created_this_month: 0,
            events_limit: 5,
            created_at: new Date().toISOString()
          }
        })
      }
    );

    if (!createUserResponse.ok) {
      console.error('Erreur création utilisateur:', await createUserResponse.text());
      return res.status(500).json({ error: 'Erreur création utilisateur' });
    }

    const newUserData = await createUserResponse.json();
    user = newUserData;
  }

  const currentCount = user.fields.events_created_this_month || 0;
  const limit = user.fields.events_limit || 5;
  const userPlan = user.fields.plan || 'gratuit';

  if (currentCount >= limit && userPlan === 'gratuit') {
    return res.status(403).json({
      error: 'Limite atteinte',
      message: 'Vous avez atteint votre limite d\'événements ce mois-ci. Passez en Pro pour événements illimités !',
      currentCount,
      limit,
      upgradeUrl: '/pricing'
    });
  }

  const logResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/EventsLog`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          user_email: userEmail,
          event_name: eventName,
          participants_count: participantsCount || 0,
          created_at: new Date().toISOString(),
          status: 'draft',
          event_id: eventId || null
        }
      })
    }
  );

  if (!logResponse.ok) {
    console.error('Erreur logging événement:', await logResponse.text());
  }

  const updateResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users/${user.id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          events_created_this_month: currentCount + 1,
          last_event_date: new Date().toISOString()
        }
      })
    }
  );

  if (!updateResponse.ok) {
    console.error('Erreur mise à jour compteur:', await updateResponse.text());
    return res.status(500).json({ error: 'Erreur mise à jour compteur' });
  }

  return res.status(200).json({
    success: true,
    currentCount: currentCount + 1,
    limit,
    plan: userPlan,
    message: 'Événement créé avec succès !',
    remainingEvents: userPlan === 'gratuit' ? limit - (currentCount + 1) : 'illimité'
  });
}

// ========================================
// CONFIRM DATE - Confirmer une date (organisateur)
// ========================================
async function confirmDate(req, res) {
  const { eventId, confirmedDate, confirmedTime } = req.body;

  if (!eventId || !confirmedDate) {
    return res.status(400).json({
      error: 'Données manquantes',
      message: 'eventId et confirmedDate sont requis'
    });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.error('Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Récupérer l'événement
  const searchResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula={eventId}="${eventId}"`,
    {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!searchResponse.ok) {
    const errorText = await searchResponse.text();
    console.error('Failed to search event:', errorText);
    return res.status(500).json({ error: 'Database search error' });
  }

  const searchData = await searchResponse.json();

  if (!searchData.records || searchData.records.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const record = searchData.records[0];
  const event = record.fields;

  // Mettre à jour l'événement avec la date confirmée
  const updateResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${record.id}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          confirmedDate: confirmedDate,
          confirmedTime: confirmedTime || null,
          status: 'completed'
        }
      })
    }
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    console.error('Failed to update event:', errorText);
    return res.status(500).json({ error: 'Failed to confirm date' });
  }

  console.log('✅ Date confirmed for event:', eventId, '→', confirmedDate);

  // Envoyer email de confirmation à tous les participants avec email
  const participants = event.participants ? JSON.parse(event.participants) : [];
  const participantEmails = participants
    .filter(p => p.email)
    .map(p => ({ name: p.name, email: p.email }));

  // Ajouter l'organisateur s'il a un email
  if (event.organizerEmail) {
    participantEmails.push({ name: event.organizerName, email: event.organizerEmail });
  }

  // Envoyer les emails de confirmation
  if (participantEmails.length > 0) {
    await sendDateConfirmedEmails({
      participants: participantEmails,
      eventType: event.type,
      organizerName: event.organizerName,
      location: event.location,
      eventSchedule: event.eventSchedule,
      confirmedDate,
      confirmedTime,
      eventId
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Date confirmée avec succès',
    confirmedDate,
    confirmedTime: confirmedTime || null
  });
}

// ========================================
// DELETE EVENT - Supprimer un événement
// ========================================
async function deleteEvent(req, res) {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({
      error: 'Données manquantes',
      message: 'eventId est requis'
    });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.error('Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Récupérer l'événement pour obtenir l'ID Airtable
  const searchResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula={eventId}="${eventId}"`,
    {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!searchResponse.ok) {
    const errorText = await searchResponse.text();
    console.error('Failed to search event:', errorText);
    return res.status(500).json({ error: 'Database search error' });
  }

  const searchData = await searchResponse.json();

  if (!searchData.records || searchData.records.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const record = searchData.records[0];

  // Supprimer l'événement
  const deleteResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${record.id}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!deleteResponse.ok) {
    const errorText = await deleteResponse.text();
    console.error('Failed to delete event:', errorText);
    return res.status(500).json({ error: 'Failed to delete event' });
  }

  console.log('🗑️ Event deleted:', eventId);

  return res.status(200).json({
    success: true,
    message: 'Événement supprimé avec succès'
  });
}

// ========================================
// HELPER FUNCTIONS
// ========================================

async function sendParticipantConfirmationEmail({
  participantName,
  participantEmail,
  eventType,
  organizerName,
  location,
  eventSchedule,
  cagnotteLink,
  dates,
  availabilities,
  eventId
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return;
  }

  const votedDates = dates
    .filter(date => availabilities[date.label])
    .map(date => date.label)
    .join(', ');

  // Toujours utiliser le domaine production pour les emails
  const APP_URL = process.env.APP_URL || 'https://getsynkro.com';
  const participantLink = `${APP_URL}/participant?id=${eventId}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vote confirmé !</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%); min-height: 100vh; padding: 40px 20px;">

  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(139, 92, 246, 0.3);">

    <tr>
      <td style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 12px;">✅</div>
        <h1 style="margin: 0; font-size: 32px; color: white; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">Vote confirmé !</h1>
        <p style="margin: 12px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 500;">Merci ${participantName} ! 🎉</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 40px;">

        <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); padding: 24px; border-radius: 12px; margin-bottom: 28px; border: 2px solid #E9D5FF;">
          <div style="font-size: 14px; color: #8B5CF6; font-weight: 700; margin-bottom: 8px;">🎯 ${eventType}</div>
          <div style="font-size: 18px; color: #1E1B4B; font-weight: 700; margin-bottom: 8px;">Organisé par ${organizerName}</div>
          ${location ? `<div style="font-size: 14px; color: #8B5CF6; font-weight: 600;">📍 ${location}</div>` : ''}
          ${eventSchedule ? `<div style="font-size: 13px; color: #6B7280; margin-top: 8px; line-height: 1.5;">📋 ${eventSchedule}</div>` : ''}
        </div>

        <div style="margin-bottom: 28px;">
          <h2 style="font-size: 18px; color: #1E1B4B; font-weight: 700; margin: 0 0 16px 0;">📅 Tes disponibilités</h2>
          <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 20px; border-radius: 12px; border: 2px solid #FCD34D;">
            <div style="font-size: 15px; color: #92400E; font-weight: 600; line-height: 1.7;">${votedDates || 'Aucune date sélectionnée'}</div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%); padding: 20px; border-radius: 12px; margin-bottom: 28px;">
          <p style="margin: 0; font-size: 14px; color: #1E40AF; line-height: 1.6;">
            💡 <strong>Besoin de modifier ?</strong><br>
            Tu peux revenir sur le lien à tout moment pour changer tes disponibilités !
          </p>
        </div>

        ${cagnotteLink ? `
        <div style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); padding: 20px; border-radius: 12px; margin-bottom: 28px; border: 2px solid #10B981;">
          <div style="font-size: 16px; color: #065F46; font-weight: 700; margin-bottom: 12px;">💰 Cagnotte</div>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #065F46; line-height: 1.6;">
            Une cagnotte a été créée pour cet événement. N'oublie pas d'y participer !
          </p>
          <a href="${cagnotteLink}" style="display: inline-block; padding: 14px 24px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            🐷 Participer à la cagnotte
          </a>
        </div>
        ` : ''}

        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${participantLink}" style="display: inline-block; padding: 18px 32px; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; border-radius: 14px; font-size: 16px; font-weight: 700; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);">
            🔗 Voir l'événement
          </a>
        </div>

      </td>
    </tr>

    <tr>
      <td style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0; font-size: 12px; color: #6B7280; line-height: 1.6;">
          Cet email a été envoyé par <strong style="color: #8B5CF6;">Synkro</strong><br>
          La solution simple pour organiser vos événements<br>
          <a href="https://getsynkro.com" style="color: #8B5CF6; text-decoration: none;">getsynkro.com</a>
        </p>
      </td>
    </tr>

  </table>

</body>
</html>
  `;

  try {
    const emailConfig = getEmailConfig();
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: emailConfig.from,
        to: participantEmail,
        subject: `Synkro - Vote confirmé : ${eventType}`,
        html: emailHtml,
        headers: {
          'List-Unsubscribe': '<mailto:unsubscribe@getsynkro.com>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      })
    });

    if (!response.ok) {
      console.error('Failed to send participant confirmation email:', await response.text());
    } else {
      console.log('✅ Participant confirmation email sent to:', participantEmail);
    }
  } catch (error) {
    console.error('Error sending participant confirmation email:', error);
  }
}

// Fonction utilitaire pour le délai (rate limiting Resend)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendCelebrationEmail({
  participants,
  eventType,
  organizerName,
  organizerEmail,
  location,
  eventSchedule,
  bestDate,
  totalResponded,
  expectedParticipants,
  percentage
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return;
  }

  const allEmails = [
    organizerEmail,
    ...participants.filter(p => p.email).map(p => p.email)
  ].filter(email => email);

  // Dédupliquer les emails
  const uniqueEmails = [...new Set(allEmails)];

  if (uniqueEmails.length === 0) {
    console.log('No emails to send celebration to');
    return;
  }

  console.log(`📧 Sending celebration emails to ${uniqueEmails.length} recipients with rate limiting...`);

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎊 Super nouvelle !</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%); min-height: 100vh; padding: 40px 20px;">

  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(139, 92, 246, 0.3);">

    <tr>
      <td style="background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); padding: 40px; text-align: center;">
        <div style="font-size: 72px; margin-bottom: 16px;">🎊</div>
        <h1 style="margin: 0; font-size: 36px; color: white; font-weight: 800;">Super nouvelle !</h1>
        <p style="margin: 12px 0 0 0; font-size: 18px; color: rgba(255,255,255,0.95); font-weight: 600;">La majorité a voté ! 🎉</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 40px;">

        <div style="text-align: center; margin-bottom: 32px;">
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 32px; border-radius: 16px;">
            <div style="font-size: 64px; color: white; font-weight: 800; line-height: 1; margin-bottom: 8px;">${percentage}%</div>
            <div style="font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 600;">${totalResponded} / ${expectedParticipants} participants ont voté !</div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px;">
          <div style="font-size: 14px; color: #8B5CF6; font-weight: 700; margin-bottom: 8px;">🎯 ${eventType}</div>
          <div style="font-size: 20px; color: #1E1B4B; font-weight: 700; margin-bottom: 8px;">Organisé par ${organizerName}</div>
          ${location ? `<div style="font-size: 14px; color: #8B5CF6; font-weight: 600;">📍 ${location}</div>` : ''}
        </div>

        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 20px; color: #1E1B4B; font-weight: 700; margin: 0 0 16px 0; text-align: center;">🏆 Date favorite</h2>
          <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 24px; border-radius: 12px; text-align: center; border: 3px solid #FCD34D;">
            <div style="font-size: 28px; color: #92400E; font-weight: 800; margin-bottom: 8px;">${bestDate.label}</div>
            <div style="font-size: 16px; color: #92400E; font-weight: 600;">${bestDate.votes} vote${bestDate.votes > 1 ? 's' : ''}</div>
          </div>
        </div>

      </td>
    </tr>

    <tr>
      <td style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #1E1B4B; font-weight: 600;">✨ Félicitations pour cette belle mobilisation !</p>
        <p style="margin: 0; font-size: 12px; color: #6B7280;">
          Cet email a été envoyé par <strong style="color: #8B5CF6;">Synkro</strong>
        </p>
      </td>
    </tr>

  </table>

</body>
</html>
  `;

  const emailConfig = getEmailConfig();
  let successCount = 0;
  let failCount = 0;

  // Envoyer les emails un par un avec un délai de 600ms pour respecter la limite Resend (2/seconde)
  for (let i = 0; i < uniqueEmails.length; i++) {
    const email = uniqueEmails[i];

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: emailConfig.from,
          to: email,
          subject: `Synkro - La majorité a voté pour : ${eventType}`,
          html: emailHtml,
          headers: {
            'List-Unsubscribe': '<mailto:unsubscribe@getsynkro.com>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
          }
        })
      });

      if (!response.ok) {
        console.error(`❌ Failed to send celebration email to ${email}:`, await response.text());
        failCount++;
      } else {
        console.log(`✅ Celebration email ${i + 1}/${uniqueEmails.length} sent to: ${email}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error sending celebration email to ${email}:`, error.message);
      failCount++;
    }

    // Attendre 600ms avant le prochain email (respecte la limite 2/seconde de Resend)
    if (i < uniqueEmails.length - 1) {
      await delay(600);
    }
  }

  console.log(`🎉 Celebration emails complete: ${successCount} sent, ${failCount} failed`);
}

// Envoyer email de confirmation de date à tous les participants
async function sendDateConfirmedEmails({
  participants,
  eventType,
  organizerName,
  location,
  eventSchedule,
  confirmedDate,
  confirmedTime,
  eventId
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return;
  }

  const APP_URL = process.env.APP_URL || 'https://getsynkro.com';
  const participantLink = `${APP_URL}/participant?id=${eventId}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📅 Date confirmée !</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%); min-height: 100vh; padding: 40px 20px;">

  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(139, 92, 246, 0.3);">

    <tr>
      <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px; text-align: center;">
        <div style="font-size: 72px; margin-bottom: 16px;">📅</div>
        <h1 style="margin: 0; font-size: 36px; color: white; font-weight: 800;">Date confirmée !</h1>
        <p style="margin: 12px 0 0 0; font-size: 18px; color: rgba(255,255,255,0.95); font-weight: 600;">Rendez-vous confirmé 🎉</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 40px;">

        <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px;">
          <div style="font-size: 14px; color: #8B5CF6; font-weight: 700; margin-bottom: 8px;">🎯 ${eventType}</div>
          <div style="font-size: 20px; color: #1E1B4B; font-weight: 700; margin-bottom: 8px;">Organisé par ${organizerName}</div>
          ${location ? `<div style="font-size: 14px; color: #8B5CF6; font-weight: 600;">📍 ${location}</div>` : ''}
          ${eventSchedule ? `<div style="font-size: 13px; color: #6B7280; margin-top: 8px; line-height: 1.5;">📋 ${eventSchedule}</div>` : ''}
        </div>

        <div style="text-align: center; margin-bottom: 32px;">
          <h2 style="font-size: 20px; color: #1E1B4B; font-weight: 700; margin: 0 0 16px 0;">🏆 Date retenue</h2>
          <div style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); padding: 24px; border-radius: 12px; border: 3px solid #10B981;">
            <div style="font-size: 28px; color: #065F46; font-weight: 800; margin-bottom: 8px;">${confirmedDate}</div>
            ${confirmedTime ? `<div style="font-size: 18px; color: #065F46; font-weight: 600;">🕐 ${confirmedTime}</div>` : ''}
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${participantLink}" style="display: inline-block; padding: 18px 32px; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; border-radius: 14px; font-size: 16px; font-weight: 700; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);">
            📅 Ajouter à mon calendrier
          </a>
        </div>

        <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 16px; border-radius: 12px; border: 2px solid #FCD34D;">
          <p style="margin: 0; font-size: 14px; color: #92400E; line-height: 1.6;">
            💡 Clique sur le lien ci-dessus pour ajouter cet événement à ton calendrier Google, Outlook ou télécharger un fichier .ics !
          </p>
        </div>

      </td>
    </tr>

    <tr>
      <td style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #1E1B4B; font-weight: 600;">✨ À bientôt !</p>
        <p style="margin: 0; font-size: 12px; color: #6B7280;">
          Cet email a été envoyé par <strong style="color: #8B5CF6;">Synkro</strong>
        </p>
      </td>
    </tr>

  </table>

</body>
</html>
  `;

  const emailConfig = getEmailConfig();
  let successCount = 0;
  let failCount = 0;

  console.log(`📧 Sending date confirmation emails to ${participants.length} recipients...`);

  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: emailConfig.from,
          to: participant.email,
          subject: `Synkro - Date confirmée : ${eventType} le ${confirmedDate}`,
          html: emailHtml,
          headers: {
            'List-Unsubscribe': '<mailto:unsubscribe@getsynkro.com>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
          }
        })
      });

      if (!response.ok) {
        console.error(`❌ Failed to send date confirmation email to ${participant.email}:`, await response.text());
        failCount++;
      } else {
        console.log(`✅ Date confirmation email ${i + 1}/${participants.length} sent to: ${participant.email}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error sending date confirmation email to ${participant.email}:`, error.message);
      failCount++;
    }

    // Attendre 600ms avant le prochain email
    if (i < participants.length - 1) {
      await delay(600);
    }
  }

  console.log(`📅 Date confirmation emails complete: ${successCount} sent, ${failCount} failed`);
}

function getOrganizerCreatedEmail(data) {
  const { eventType, eventLink, adminLink, organizerName, dates, location, eventSchedule } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Événement créé</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 20px;">
                <span style="font-size: 40px;">✨</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">Synkro</h1>
            </td>
          </tr>
          <tr>
            <td style="background: white; padding: 40px;">
              <h2 style="color: #1E1B4B; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">✅ Ton événement est créé !</h2>

              <p style="color: #6B7280; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                Salut ${organizerName} ! 👋<br><br>
                Ton événement <strong>"${eventType}"</strong> est prêt ! Partage le lien ci-dessous avec tes invités.
              </p>

              <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">📅 Type d'événement</p>
                <p style="color: #1E1B4B; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">${eventType}</p>

                ${location ? `
                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">📍 Lieu</p>
                <p style="color: #1E1B4B; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">${location}</p>
                ` : ''}

                ${eventSchedule ? `
                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">📋 Déroulé prévu</p>
                <p style="color: #1E1B4B; margin: 0 0 16px 0; font-size: 14px; font-weight: 500; line-height: 1.6;">${eventSchedule}</p>
                ` : ''}

                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">📆 Dates proposées</p>
                <p style="color: #1E1B4B; margin: 0; font-size: 14px; font-weight: 500; line-height: 1.8;">
                  ${dates.map(d => d.label).join('<br>')}
                </p>
              </div>

              <!-- Lien participant pour copier -->
              <div style="background: #F5F3FF; padding: 16px; border-radius: 10px; margin-bottom: 16px; border: 2px solid #E9D5FF;">
                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">🔗 Lien à partager avec tes invités :</p>
                <p style="color: #8B5CF6; margin: 0; font-size: 14px; word-break: break-all; font-family: monospace;">${eventLink}</p>
              </div>

              <a href="${adminLink}" style="display: block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 16px;">
                📤 Partager avec mes invités
              </a>

              <a href="${adminLink}" style="display: block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 20px;">
                🔐 Voir le tableau de bord
              </a>

            </td>
          </tr>
          <tr>
            <td style="background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; margin: 0 0 10px 0; font-size: 14px;">Créé avec ❤️ par Synkro</p>
              <p style="color: #9CA3AF; margin: 0; font-size: 12px;">Trouve la date parfaite en 1 minute</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Générer les liens calendrier
function generateCalendarLinks(eventName, dateLabel, location, eventSchedule, eventId, duration = 60) {
  // Parse la date du label (format attendu: "Dimanche 15 juin 2025 - Matin" ou similaire)
  const APP_URL = process.env.APP_URL || 'https://getsynkro.com';

  // Encoder les paramètres pour les URLs
  const eventTitle = encodeURIComponent(eventName);
  const eventDescription = encodeURIComponent(eventSchedule || `Événement organisé via Synkro`);
  const eventLocation = encodeURIComponent(location || '');

  // Pour simplifier, on utilise une date approximative basée sur le label
  // L'utilisateur peut ajuster dans son calendrier
  const now = new Date();
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 jours par défaut
  const startDate = futureDate;
  const endDate = new Date(startDate.getTime() + duration * 60000);

  const formatDateGoogle = (date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, -1) + 'Z';
  };

  const formatDateOutlook = (date) => {
    return date.toISOString();
  };

  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${formatDateGoogle(startDate)}/${formatDateGoogle(endDate)}&details=${eventDescription}&location=${eventLocation}`,

    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${eventTitle}&startdt=${formatDateOutlook(startDate)}&enddt=${formatDateOutlook(endDate)}&body=${eventDescription}&location=${eventLocation}`,

    ics: `${APP_URL}/api/events?action=calendar-ics&id=${eventId}`
  };
}

// Envoyer email de célébration 100% avec boutons calendrier
async function sendAllVotedCelebrationEmail({
  participants,
  eventType,
  organizerName,
  organizerEmail,
  location,
  eventSchedule,
  bestDate,
  totalResponded,
  expectedParticipants,
  eventId
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return;
  }

  const allEmails = [
    organizerEmail,
    ...participants.filter(p => p.email).map(p => p.email)
  ].filter(email => email);

  // Dédupliquer les emails
  const uniqueEmails = [...new Set(allEmails)];

  if (uniqueEmails.length === 0) {
    console.log('No emails to send 100% celebration to');
    return;
  }

  console.log(`📧 Sending 100% celebration emails to ${uniqueEmails.length} recipients with calendar buttons...`);

  // Générer les liens calendrier
  const calendarLinks = generateCalendarLinks(
    eventType,
    bestDate.label,
    location,
    eventSchedule,
    eventId
  );

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎊 100% ont voté !</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%); min-height: 100vh; padding: 40px 20px;">

  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(139, 92, 246, 0.3);">

    <tr>
      <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px; text-align: center;">
        <div style="font-size: 72px; margin-bottom: 16px;">🎉</div>
        <h1 style="margin: 0; font-size: 36px; color: white; font-weight: 800;">100% ont voté !</h1>
        <p style="margin: 12px 0 0 0; font-size: 18px; color: rgba(255,255,255,0.95); font-weight: 600;">Tout le monde a répondu 🎊</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 40px;">

        <div style="text-align: center; margin-bottom: 32px;">
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 32px; border-radius: 16px;">
            <div style="font-size: 64px; color: white; font-weight: 800; line-height: 1; margin-bottom: 8px;">100%</div>
            <div style="font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 600;">${totalResponded} / ${expectedParticipants} participants ont voté !</div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px;">
          <div style="font-size: 14px; color: #8B5CF6; font-weight: 700; margin-bottom: 8px;">🎯 ${eventType}</div>
          <div style="font-size: 20px; color: #1E1B4B; font-weight: 700; margin-bottom: 8px;">Organisé par ${organizerName}</div>
          ${location ? `<div style="font-size: 14px; color: #8B5CF6; font-weight: 600;">📍 ${location}</div>` : ''}
        </div>

        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 20px; color: #1E1B4B; font-weight: 700; margin: 0 0 16px 0; text-align: center;">🏆 Date favorite</h2>
          <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 24px; border-radius: 12px; text-align: center; border: 3px solid #FCD34D;">
            <div style="font-size: 28px; color: #92400E; font-weight: 800; margin-bottom: 8px;">${bestDate.label}</div>
            <div style="font-size: 16px; color: #92400E; font-weight: 600;">${bestDate.votes} vote${bestDate.votes > 1 ? 's' : ''}</div>
          </div>
        </div>

        <!-- Boutons Calendrier -->
        <div style="margin-bottom: 32px;">
          <h3 style="font-size: 16px; color: #1E1B4B; font-weight: 700; margin: 0 0 16px 0; text-align: center;">📅 Ajoute cet événement à ton agenda</h3>

          <div style="text-align: center; margin-bottom: 12px;">
            <a href="${calendarLinks.google}" style="display: inline-block; padding: 14px 24px; background: #4285F4; color: white; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 700; margin: 4px;">
              📅 Google Calendar
            </a>
          </div>

          <div style="text-align: center; margin-bottom: 12px;">
            <a href="${calendarLinks.outlook}" style="display: inline-block; padding: 14px 24px; background: #0078D4; color: white; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 700; margin: 4px;">
              📅 Outlook / Hotmail
            </a>
          </div>

          <div style="text-align: center;">
            <a href="${calendarLinks.ics}" style="display: inline-block; padding: 14px 24px; background: #6B7280; color: white; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 700; margin: 4px;">
              📅 Télécharger .ics
            </a>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); padding: 16px; border-radius: 12px; border: 2px solid #3B82F6;">
          <p style="margin: 0; font-size: 14px; color: #1E40AF; line-height: 1.6; text-align: center;">
            💡 L'organisateur peut maintenant confirmer la date finale dans son tableau de bord !
          </p>
        </div>

      </td>
    </tr>

    <tr>
      <td style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #1E1B4B; font-weight: 600;">✨ Félicitations pour cette belle mobilisation !</p>
        <p style="margin: 0; font-size: 12px; color: #6B7280;">
          Cet email a été envoyé par <strong style="color: #8B5CF6;">Synkro</strong>
        </p>
      </td>
    </tr>

  </table>

</body>
</html>
  `;

  const emailConfig = getEmailConfig();
  let successCount = 0;
  let failCount = 0;

  // Envoyer les emails un par un avec un délai de 600ms pour respecter la limite Resend (2/seconde)
  for (let i = 0; i < uniqueEmails.length; i++) {
    const email = uniqueEmails[i];

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: emailConfig.from,
          to: email,
          subject: `🎉 Synkro - 100% ont voté pour : ${eventType}`,
          html: emailHtml,
          headers: {
            'List-Unsubscribe': '<mailto:unsubscribe@getsynkro.com>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
          }
        })
      });

      if (!response.ok) {
        console.error(`❌ Failed to send 100% celebration email to ${email}:`, await response.text());
        failCount++;
      } else {
        console.log(`✅ 100% celebration email ${i + 1}/${uniqueEmails.length} sent to: ${email}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error sending 100% celebration email to ${email}:`, error.message);
      failCount++;
    }

    // Attendre 600ms avant le prochain email (respecte la limite 2/seconde de Resend)
    if (i < uniqueEmails.length - 1) {
      await delay(600);
    }
  }

  console.log(`🎉 100% celebration emails complete: ${successCount} sent, ${failCount} failed`);
}

// ========================================
// GENERATE CALENDAR ICS - Générer fichier ICS
// ========================================
async function generateCalendarICS(req, res) {
  const { id: eventId } = req.query;

  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

  if (!AIRTABLE_TOKEN || !BASE_ID || !TABLE_ID) {
    return res.status(500).json({ error: 'Database configuration error' });
  }

  try {
    // Récupérer l'événement
    const searchUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula={eventId}='${eventId}'`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      return res.status(500).json({ error: 'Database search error' });
    }

    const searchData = await searchResponse.json();

    if (!searchData.records || searchData.records.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const record = searchData.records[0];
    const event = record.fields;

    // Obtenir la meilleure date ou la date confirmée
    let eventDate;
    let eventTime = '09:00';

    if (event.confirmedDate) {
      eventDate = event.confirmedDate;
      eventTime = event.confirmedTime || '09:00';
    } else {
      const dates = event.dates ? JSON.parse(event.dates) : [];
      if (dates.length > 0) {
        const bestDate = dates.reduce((prev, current) =>
          (current.votes || 0) > (prev.votes || 0) ? current : prev
        );
        eventDate = bestDate.label;
        eventTime = bestDate.time || '09:00';
      } else {
        return res.status(400).json({ error: 'No dates available for this event' });
      }
    }

    // Créer une date approximative pour le calendrier
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [hours, minutes] = eventTime.split(':').map(Number);
    futureDate.setHours(hours || 9, minutes || 0, 0, 0);

    const startDate = futureDate;
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatICSDate = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hour = String(date.getUTCHours()).padStart(2, '0');
      const minute = String(date.getUTCMinutes()).padStart(2, '0');
      const second = String(date.getUTCSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hour}${minute}${second}Z`;
    };

    const escapeICS = (text) => {
      if (!text) return '';
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    const eventName = event.type || 'Événement Synkro';
    const eventDescription = event.eventSchedule
      ? `${event.eventSchedule}\\n\\nDate proposée: ${eventDate}\\nOrganisé par ${event.organizerName} via Synkro`
      : `Date proposée: ${eventDate}\\nOrganisé par ${event.organizerName} via Synkro`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Synkro//Event//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${eventId}@getsynkro.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS(eventName)}`,
      `DESCRIPTION:${escapeICS(eventDescription)}`,
      event.location ? `LOCATION:${escapeICS(event.location)}` : '',
      `ORGANIZER;CN=${escapeICS(event.organizerName)}:mailto:${event.organizerEmail || 'noreply@getsynkro.com'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line).join('\r\n');

    const safeFileName = eventName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}.ics"`);
    return res.status(200).send(icsContent);

  } catch (error) {
    console.error('Error generating ICS:', error);
    return res.status(500).json({ error: 'Failed to generate calendar file' });
  }
}
