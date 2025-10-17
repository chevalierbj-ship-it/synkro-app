// /api/create-event.js
// API Serverless pour créer un événement dans Airtable
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
    const eventData = req.body;

    // Validation
    if (!eventData.type || !eventData.organizerName || !eventData.dates) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['type', 'organizerName', 'dates']
      });
    }

    // 🔐 RÉCUPÉRATION DES VARIABLES D'ENVIRONNEMENT
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Events';

    // Vérification que les variables existent
    if (!AIRTABLE_TOKEN || !BASE_ID) {
      console.error('Missing environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing Airtable credentials'
      });
    }

    // Générer un ID unique pour l'événement
    const eventId = `evt_${Date.now()}`;

    // Préparer les données pour Airtable
    const airtableData = {
      fields: {
        eventId: eventId,
        type: eventData.type,
        organizerName: eventData.organizerName,
        organizerEmail: eventData.organizerEmail || '',
        location: eventData.location || '',
        expectedParticipants: eventData.expectedParticipants || 0,
        dates: JSON.stringify(eventData.dates),
        participants: JSON.stringify([]),
        totalResponded: 0,
        createdAt: new Date().toISOString(),
        status: 'active'
      }
    };

    // Créer l'événement dans Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`,
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
        details: errorText
      });
    }

    const result = await response.json();

    // Retourner l'ID de l'événement et le lien
    return res.status(200).json({
      success: true,
      eventId: eventId,
      airtableId: result.id,
      participantLink: `${process.env.VERCEL_URL || 'https://synkro-app.vercel.app'}/event/${eventId}`,
      message: 'Event created successfully'
    });

  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
