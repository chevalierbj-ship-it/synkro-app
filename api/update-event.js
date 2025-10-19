// /api/update-event.js
// API Serverless pour sauvegarder les votes des participants dans Airtable
// ✅ Version SÉCURISÉE avec variables d'environnement

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId, airtableId, participant, availabilities } = req.body;

    if (!eventId || !airtableId || !participant || !availabilities) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['eventId', 'airtableId', 'participant', 'availabilities']
      });
    }

    // 🔐 RÉCUPÉRATION DES VARIABLES D'ENVIRONNEMENT
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

    // Vérification que les variables existent
    if (!AIRTABLE_TOKEN || !BASE_ID || !TABLE_ID) {
      console.error('Missing environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing Airtable credentials'
      });
    }

    // 1. Récupérer l'événement actuel
    const getResponse = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${airtableId}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!getResponse.ok) {
      console.error('Failed to fetch event:', await getResponse.text());
      return res.status(500).json({ error: 'Failed to fetch event from Airtable' });
    }

    const eventRecord = await getResponse.json();
    const dates = JSON.parse(eventRecord.fields.dates || '[]');
    const participants = JSON.parse(eventRecord.fields.participants || '[]');

    // 2. Vérifier si le participant a déjà voté
    const existingParticipantIndex = participants.findIndex(
      p => p.name.toLowerCase() === participant.name.toLowerCase()
    );

    const participantData = {
      name: participant.name,
      availabilities: availabilities,
      votedAt: new Date().toISOString()
    };

    if (existingParticipantIndex !== -1) {
      // Mettre à jour le participant existant
      participants[existingParticipantIndex] = participantData;
    } else {
      // Ajouter nouveau participant
      participants.push(participantData);
    }

    // 3. Recalculer les votes pour chaque date
    dates.forEach(date => {
      date.votes = 0;
      date.voters = [];

      participants.forEach(p => {
        if (p.availabilities[date.id] === true) {
          date.votes++;
          date.voters.push(p.name);
        }
      });
    });

    // 4. Mettre à jour dans Airtable
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${airtableId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            dates: JSON.stringify(dates),
            participants: JSON.stringify(participants),
            totalResponded: participants.length
          }
        })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update event:', errorText);
      return res.status(500).json({ 
        error: 'Failed to update event in Airtable',
        details: errorText
      });
    }

    const updatedRecord = await updateResponse.json();

    // 5. Retourner les données mises à jour
    return res.status(200).json({
      success: true,
      event: {
        id: eventRecord.fields.eventId,
        airtableId: updatedRecord.id,
        type: updatedRecord.fields.type,
        organizerName: updatedRecord.fields.organizerName,
        organizerEmail: updatedRecord.fields.organizerEmail,
        location: updatedRecord.fields.location,
        expectedParticipants: updatedRecord.fields.expectedParticipants,
        dates: JSON.parse(updatedRecord.fields.dates),
        participants: JSON.parse(updatedRecord.fields.participants),
        totalResponded: updatedRecord.fields.totalResponded,
        createdAt: updatedRecord.fields.createdAt,
        status: updatedRecord.fields.status || 'active'
      }
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
