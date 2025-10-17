// /api/get-event.js
// API Serverless pour récupérer un événement depuis Airtable

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

    if (!id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Configuration Airtable
    const AIRTABLE_TOKEN = 'pat8UmBjvuuxLFiK9.3214fff366e3cdfaa5ca5776e8def8b4c76e7c4c8e936b8311cb7d1c2b5bd058';
    const BASE_ID = 'appgW7tCFlzGlBRsi';
    const TABLE_NAME = 'Events';

    // Récupérer l'événement depuis Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?filterByFormula={eventId}='${id}'`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Airtable error:', await response.text());
      return res.status(500).json({ error: 'Failed to fetch event from Airtable' });
    }

    const data = await response.json();

    if (!data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Retourner l'événement
    const record = data.records[0];
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
