/**
 * API pour gérer le partage d'événements
 * - GET: Récupérer la liste des personnes avec qui l'événement est partagé
 * - POST: Partager un événement avec des membres de l'équipe
 * - DELETE: Retirer l'accès à un événement
 */

import { canPerformAction, getUserAccountInfo } from './middleware/auth.js';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getEventSharing(req, res);
      case 'POST':
        return await shareEvent(req, res);
      case 'DELETE':
        return await unshareEvent(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Share event API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}

// GET: Récupérer la liste des partages
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

  // Récupérer l'événement
  const eventResponse = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_EVENTS_TABLE_ID}?filterByFormula={eventId}='${eventId}'`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
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

// POST: Partager l'événement
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

  // Récupérer tous les membres de l'équipe
  const membersResponse = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts?filterByFormula=AND({parent_user_id}='${parentUserId}',{status}='active')`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    }
  );

  const membersData = await membersResponse.json();

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
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_EVENTS_TABLE_ID}?filterByFormula={eventId}='${eventId}'`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
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
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_EVENTS_TABLE_ID}/${airtableRecordId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
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

// DELETE: Retirer le partage
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

  // Récupérer l'événement
  const eventResponse = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_EVENTS_TABLE_ID}?filterByFormula={eventId}='${eventId}'`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
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
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_EVENTS_TABLE_ID}/${airtableRecordId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
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
