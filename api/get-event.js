// /api/get-event.js
// API pour récupérer les détails d'un événement

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

    console.log('📥 Fetching event with ID:', id);

    // Configuration Airtable
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

    console.log('🔑 Checking Airtable config...');
    console.log('AIRTABLE_TOKEN:', AIRTABLE_TOKEN ? 'Present' : 'MISSING');
    console.log('BASE_ID:', BASE_ID ? BASE_ID : 'MISSING');
    console.log('TABLE_ID:', TABLE_ID ? TABLE_ID : 'MISSING');

    if (!AIRTABLE_TOKEN || !BASE_ID || !TABLE_ID) {
      console.error('❌ Missing Airtable configuration');
      console.error('AIRTABLE_TOKEN:', !!AIRTABLE_TOKEN);
      console.error('BASE_ID:', !!BASE_ID);
      console.error('TABLE_ID:', !!TABLE_ID);
      return res.status(500).json({ error: 'Database configuration error' });
    }

    // Rechercher l'événement par eventId dans Airtable
    // On utilise filterByFormula pour chercher par le champ eventId
    const searchUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula={eventId}='${id}'`;

    console.log('🔍 Searching event in Airtable...');
    
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

    // Parser les champs JSON
    const dates = record.fields.dates ? JSON.parse(record.fields.dates) : [];
    const participants = record.fields.participants ? JSON.parse(record.fields.participants) : [];
    const budgetRanges = record.fields.budgetRanges ? JSON.parse(record.fields.budgetRanges) : [];
    const budgetVotes = record.fields.budgetVotes ? JSON.parse(record.fields.budgetVotes) : [];

    // Construire l'objet événement
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
      budgetVotes: budgetVotes
    };

    return res.status(200).json({
      success: true,
      event: event
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
