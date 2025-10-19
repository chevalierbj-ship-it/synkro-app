// /api/get-event.js
// API Serverless pour récupérer un événement depuis Airtable
// ✅ Version SÉCURISÉE avec variables d'environnement
// ✅ Utilise l'ID de la table au lieu du nom

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
    const { id } = req.query;

    console.log('Received event ID:', id);

    if (!id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // 🔐 RÉCUPÉRATION DES VARIABLES D'ENVIRONNEMENT
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

    // Vérification que les variables existent
    if (!AIRTABLE_TOKEN || !BASE_ID || !TABLE_ID) {
      console.error('Missing environment variables');
      console.error('AIRTABLE_TOKEN:', AIRTABLE_TOKEN ? 'Present' : 'Missing');
      console.error('BASE_ID:', BASE_ID ? 'Present' : 'Missing');
      console.error('TABLE_ID:', TABLE_ID ? 'Present' : 'Missing');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing Airtable credentials'
      });
    }

    console.log('Fetching event from Airtable...');
    console.log('Using BASE_ID:', BASE_ID);
    console.log('Using TABLE_ID:', TABLE_ID);

    // Récupérer l'événement depuis Airtable avec l'ID de la table
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula={eventId}='${id}'`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable error:', errorText);
      console.error('Status:', response.status);
      return res.status(500).json({ 
        error: 'Failed to fetch event from Airtable',
        details: errorText,
        status: response.status
      });
    }

    const data = await response.json();

    console.log('Airtable response:', JSON.stringify(data, null, 2));

    if (!data.records || data.records.length === 0) {
      console.log('No event found with ID:', id);
      return res.status(404).json({ error: 'Event not found' });
    }

    // Retourner l'événement
    const record = data.records[0];
    console.log('Event found:', record.fields.eventId);

    const eventData = {
      id: record.fields.eventId,
      airtableId: record.id, // Important pour les updates
      type: record.fields.type,
      organizerName: record.fields.organizerName,
      organizerEmail: record.fields.organizerEmail,
      location: record.fields.location,
      expectedParticipants: record.fields.expectedParticipants,
      dates: JSON.parse(record.fields.dates || '[]'),
      participants: JSON.parse(record.fields.participants || '[]'),
      totalResponded: record.fields.totalResponded || 0,
      createdAt: record.fields.createdAt,
      status: record.fields.status || 'active'
    };

    return res.status(200).json(eventData);

  } catch (error) {
    console.error('Error fetching event:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
