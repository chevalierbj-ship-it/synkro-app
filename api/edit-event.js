// /api/edit-event.js
// API pour modifier les détails d'un événement (type, lieu, nombre de participants)

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
    const { eventId, updates } = req.body;

    // Validation
    if (!eventId || !updates) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('📝 Editing event:', eventId);

    // Configuration Airtable
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

    if (!AIRTABLE_TOKEN || !BASE_ID || !TABLE_ID) {
      console.error('Missing Airtable configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 1. Rechercher l'événement par eventId
    const searchUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula={eventId}='${eventId}'`;

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
      console.log('❌ Event not found:', eventId);
      return res.status(404).json({ error: 'Event not found' });
    }

    const record = searchData.records[0];
    const airtableRecordId = record.id;

    console.log('✅ Event found:', airtableRecordId);

    // 2. Préparer les champs à mettre à jour
    const fieldsToUpdate = {};
    
    if (updates.type !== undefined) {
      fieldsToUpdate.type = updates.type;
    }
    
    if (updates.location !== undefined) {
      fieldsToUpdate.location = updates.location;
    }
    
    if (updates.expectedParticipants !== undefined) {
      fieldsToUpdate.expectedParticipants = parseInt(updates.expectedParticipants) || 0;
    }

    // 3. Mettre à jour dans Airtable
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${airtableRecordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: fieldsToUpdate
        })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update event:', errorText);
      return res.status(500).json({ error: 'Failed to update event' });
    }

    const updatedRecord = await updateResponse.json();
    console.log('✅ Event updated successfully');

    // 4. Reconstruire l'objet événement
    const dates = updatedRecord.fields.dates ? JSON.parse(updatedRecord.fields.dates) : [];
    const participants = updatedRecord.fields.participants ? JSON.parse(updatedRecord.fields.participants) : [];

    const event = {
      eventId: updatedRecord.fields.eventId,
      airtableId: updatedRecord.id,
      type: updatedRecord.fields.type,
      organizerName: updatedRecord.fields.organizerName,
      organizerEmail: updatedRecord.fields.organizerEmail || null,
      location: updatedRecord.fields.location || null,
      expectedParticipants: updatedRecord.fields.expectedParticipants || 0,
      totalResponded: updatedRecord.fields.totalResponded || 0,
      dates: dates,
      participants: participants,
      status: updatedRecord.fields.status || 'active',
      createdAt: updatedRecord.fields.createdAt
    };

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event: event
    });

  } catch (error) {
    console.error('Error editing event:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
