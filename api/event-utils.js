/**
 * API consolidée pour les utilitaires d'événements
 *
 * GENERATE ICS:
 * - GET ?action=generate-ics : Générer un fichier .ics pour calendrier
 *
 * GET USER EVENTS:
 * - GET ?action=list&email=xxx : Récupérer les événements d'un utilisateur
 *
 * SHARE EVENT:
 * - GET ?action=sharing&eventId=xxx : Récupérer la liste des partages
 * - POST ?action=share : Partager un événement avec l'équipe
 * - DELETE ?action=unshare : Retirer l'accès à un événement
 */

import { canPerformAction, getUserAccountInfo } from './_middleware/auth.js';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // GET requests
    if (req.method === 'GET') {
      if (action === 'generate-ics') {
        return await generateICS(req, res);
      }
      if (action === 'list') {
        return await getUserEvents(req, res);
      }
      if (action === 'sharing') {
        return await getEventSharing(req, res);
      }
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Use action=generate-ics|list|sharing'
      });
    }

    // POST requests
    if (req.method === 'POST') {
      if (action === 'share') {
        return await shareEvent(req, res);
      }
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Use action=share'
      });
    }

    // DELETE requests
    if (req.method === 'DELETE') {
      if (action === 'unshare') {
        return await unshareEvent(req, res);
      }
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Use action=unshare'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Event utils API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

// ========================================
// GENERATE ICS - Générer un fichier .ics
// ========================================

async function generateICS(req, res) {
  const { title, start, end, location, description } = req.query;

  // Validation des paramètres requis
  if (!title || !start || !end) {
    return res.status(400).json({
      error: 'Missing required parameters',
      required: ['title', 'start', 'end']
    });
  }

  // Générer un UID unique pour l'événement
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@synkro.app`;

  // Créer le contenu .ics
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Synkro//Event Calendar//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Synkro Event
X-WR-TIMEZONE:Europe/Paris
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(start)}
DTEND:${formatDateForICS(end)}
SUMMARY:${escapeICSText(title)}
${location ? `LOCATION:${escapeICSText(location)}` : ''}
${description ? `DESCRIPTION:${escapeICSText(description)}` : ''}
STATUS:CONFIRMED
SEQUENCE:0
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

  // Configurer les headers pour le téléchargement
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="synkro-event-${Date.now()}.ics"`);

  return res.status(200).send(icsContent);
}

/**
 * Formate une date au format iCalendar (yyyyMMddTHHmmssZ)
 * @param {string|Date} date - Date à formatter
 * @returns {string} Date au format ICS
 */
function formatDateForICS(date) {
  const d = new Date(date);

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Échappe les caractères spéciaux pour le format ICS
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
function escapeICSText(text) {
  if (!text) return '';

  return text
    .replace(/\\/g, '\\\\')  // Backslash
    .replace(/;/g, '\\;')    // Point-virgule
    .replace(/,/g, '\\,')    // Virgule
    .replace(/\n/g, '\\n')   // Nouvelle ligne
    .replace(/\r/g, '');     // Retour chariot
}

// ========================================
// GET USER EVENTS - Récupérer les événements d'un utilisateur
// ========================================

async function getUserEvents(req, res) {
  const { email } = req.query;

  console.log('📧 Fetching events for email:', email);

  if (!email) {
    return res.status(400).json({ error: 'Missing email parameter' });
  }

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    console.error('❌ Missing Airtable configuration');
    console.error('AIRTABLE_TOKEN exists:', !!AIRTABLE_TOKEN);
    console.error('AIRTABLE_BASE_ID exists:', !!AIRTABLE_BASE_ID);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;

    // Récupérer les événements depuis EventsLog
    // Filtre par email + tri par date de création décroissante + limite à 10 résultats
    const filterFormula = `{user_email}='${email}'`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/EventsLog?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=created_at&sort[0][direction]=desc&maxRecords=10`;

    console.log('🔍 Fetching from Airtable URL:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Airtable API error:', errorText);
      console.error('❌ Response status:', response.status);
      return res.status(500).json({
        error: 'Failed to fetch events from database',
        details: errorText
      });
    }

    const data = await response.json();

    console.log('📊 Found events:', data.records.length);

    // Transformer les données pour le frontend
    const events = data.records.map(record => {
      const fields = record.fields || {};
      return {
        id: record.id,
        eventId: fields.event_id || null,
        eventName: fields.event_name || 'Sans titre',
        // participants_count = nombre d'invités
        invitedCount: fields.participants_count || 0,
        // responses_count = nombre de réponses reçues
        responsesCount: fields.responses_count || 0,
        status: fields.status || 'draft',
        createdAt: fields.created_at || new Date().toISOString(),
        eventDate: fields.event_date || null,
        lastEventDate: fields.last_event_date || null,
        eventType: fields.event_type || 'generic',
        stripeCustomerId: fields.stripe_customer_id || null,
        stripeSubscriptionId: fields.stripe_subscription_id || null
      };
    });

    console.log('✅ Returning events:', events.length);

    return res.status(200).json({
      success: true,
      events: events,
      count: events.length
    });

  } catch (error) {
    console.error('❌ Error fetching events:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

// ========================================
// SHARE EVENT - Partager un événement avec l'équipe
// ========================================

async function getEventSharing(req, res) {
  const { eventId, clerkUserId } = req.query;

  if (!eventId || !clerkUserId) {
    return res.status(400).json({ error: 'eventId et clerkUserId requis' });
  }

  // Vérifier que l'utilisateur peut voir les partages (owner ou admin)
  const authCheck = await canPerformAction(clerkUserId, eventId, 'share');

  if (!authCheck.canPerform) {
    return res.status(403).json({ error: authCheck.reason });
  }

  const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;

  // Récupérer l'événement
  const eventResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_EVENTS_TABLE_ID}?filterByFormula={eventId}='${eventId}'`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  const eventData = await eventResponse.json();

  if (!eventData.records || eventData.records.length === 0) {
    return res.status(404).json({ error: 'Événement introuvable' });
  }

  const event = eventData.records[0].fields;
  const sharedWith = event.shared_with ? JSON.parse(event.shared_with) : [];

  return res.status(200).json({
    success: true,
    sharedWith,
    totalShared: sharedWith.length
  });
}

async function shareEvent(req, res) {
  const { eventId, clerkUserId, shareWithAll = true } = req.body;

  if (!eventId || !clerkUserId) {
    return res.status(400).json({ error: 'eventId et clerkUserId requis' });
  }

  // Vérifier que l'utilisateur peut partager (owner ou admin)
  const authCheck = await canPerformAction(clerkUserId, eventId, 'share');

  if (!authCheck.canPerform) {
    return res.status(403).json({ error: authCheck.reason });
  }

  // Récupérer les infos du compte
  const accountInfo = await getUserAccountInfo(clerkUserId);

  // Déterminer l'ID du compte principal
  const parentUserId = accountInfo.isSubAccount ? accountInfo.parentUserId : clerkUserId;

  const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;

  // Récupérer tous les membres de l'équipe
  const membersResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/SubAccounts?filterByFormula=AND({parent_user_id}='${parentUserId}',{status}='active')`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  const membersData = await membersResponse.json();

  // Gérer l'erreur si le champ parent_user_id n'existe pas
  if (membersData.error && membersData.error.type === 'INVALID_FILTER_BY_FORMULA') {
    return res.status(500).json({
      error: 'Configuration Airtable incomplète',
      message: 'Le champ parent_user_id n\'existe pas dans la table SubAccounts. Veuillez le créer dans Airtable (type: Single line text).',
      solution: 'Allez dans votre table SubAccounts sur Airtable et créez un nouveau champ nommé "parent_user_id" de type "Single line text".'
    });
  }

  if (!membersData.records || membersData.records.length === 0) {
    return res.status(400).json({ error: 'Aucun membre d\'équipe trouvé' });
  }

  // Construire la liste des partages
  const sharedWith = membersData.records.map(member => ({
    userId: member.fields.clerk_user_id,
    email: member.fields.sub_user_email,
    role: member.fields.role,
    sharedAt: new Date().toISOString()
  }));

  // Récupérer l'événement pour mise à jour
  const eventResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_EVENTS_TABLE_ID}?filterByFormula={eventId}='${eventId}'`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  const eventData = await eventResponse.json();

  if (!eventData.records || eventData.records.length === 0) {
    return res.status(404).json({ error: 'Événement introuvable' });
  }

  const airtableRecordId = eventData.records[0].id;

  // Mettre à jour l'événement avec shared_with
  const updateResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_EVENTS_TABLE_ID}/${airtableRecordId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          shared_with: JSON.stringify(sharedWith)
        }
      })
    }
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    console.error('Failed to update event sharing:', errorText);
    return res.status(500).json({ error: 'Erreur lors du partage' });
  }

  return res.status(200).json({
    success: true,
    message: `Événement partagé avec ${sharedWith.length} membre(s)`,
    sharedWith
  });
}

async function unshareEvent(req, res) {
  const { eventId, clerkUserId, removeUserId } = req.query;

  if (!eventId || !clerkUserId) {
    return res.status(400).json({ error: 'eventId et clerkUserId requis' });
  }

  // Vérifier que l'utilisateur peut gérer les partages
  const authCheck = await canPerformAction(clerkUserId, eventId, 'share');

  if (!authCheck.canPerform) {
    return res.status(403).json({ error: authCheck.reason });
  }

  const authToken = AIRTABLE_TOKEN || AIRTABLE_API_KEY;

  // Récupérer l'événement
  const eventResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_EVENTS_TABLE_ID}?filterByFormula={eventId}='${eventId}'`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  );

  const eventData = await eventResponse.json();

  if (!eventData.records || eventData.records.length === 0) {
    return res.status(404).json({ error: 'Événement introuvable' });
  }

  const event = eventData.records[0];
  const airtableRecordId = event.id;
  const sharedWith = event.fields.shared_with ? JSON.parse(event.fields.shared_with) : [];

  // Si removeUserId est fourni, retirer uniquement cet utilisateur
  let updatedSharedWith;
  if (removeUserId) {
    updatedSharedWith = sharedWith.filter(s => s.userId !== removeUserId);
  } else {
    // Sinon, retirer tous les partages
    updatedSharedWith = [];
  }

  // Mettre à jour
  const updateResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_EVENTS_TABLE_ID}/${airtableRecordId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          shared_with: JSON.stringify(updatedSharedWith)
        }
      })
    }
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    console.error('Failed to update event sharing:', errorText);
    return res.status(500).json({ error: 'Erreur lors du retrait du partage' });
  }

  return res.status(200).json({
    success: true,
    message: removeUserId ? 'Accès retiré pour cet utilisateur' : 'Tous les partages retirés',
    sharedWith: updatedSharedWith
  });
}
