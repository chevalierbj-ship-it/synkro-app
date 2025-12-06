/**
 * API Serverless pour sauvegarder les préférences IA d'un participant
 * Stocke les réponses aux questions intelligentes dans Airtable
 */

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

  const { eventId, participantName, participantEmail, preferences } = req.body;

  // Validation
  if (!eventId || !participantName || !preferences) {
    return res.status(400).json({
      error: 'Données manquantes',
      message: 'eventId, participantName et preferences sont requis'
    });
  }

  // Configuration Airtable
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.error('Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // 1. Rechercher l'événement par eventId
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

    // Vérifier si l'événement existe
    if (!searchData.records || searchData.records.length === 0) {
      console.error('Event not found with eventId:', eventId);
      return res.status(404).json({ error: 'Event not found' });
    }

    const airtableRecord = searchData.records[0];
    const airtableRecordId = airtableRecord.id;
    const event = airtableRecord.fields;

    console.log('✅ Event found:', eventId, '→ Airtable Record ID:', airtableRecordId);

    // 2. Récupérer les préférences AI existantes
    let aiPreferences = [];
    if (event.ai_preferences) {
      try {
        aiPreferences = JSON.parse(event.ai_preferences);
      } catch (e) {
        console.error('Error parsing existing ai_preferences:', e);
        aiPreferences = [];
      }
    }

    // 3. Vérifier si le participant a déjà répondu
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
      // Mise à jour des préférences existantes
      aiPreferences[existingIndex] = newPreference;
      console.log('📝 Updating existing AI preferences for:', participantName);
    } else {
      // Ajout de nouvelles préférences
      aiPreferences.push(newPreference);
      console.log('➕ Adding new AI preferences for:', participantName);
    }

    // 4. Sauvegarder dans Airtable
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

    // 5. Retourner le succès avec les stats
    return res.status(200).json({
      success: true,
      message: 'Préférences sauvegardées avec succès',
      totalResponses: aiPreferences.length,
      expectedParticipants: event.expectedParticipants || 0,
      allResponsesReceived: aiPreferences.length >= (event.expectedParticipants || 0)
    });

  } catch (error) {
    console.error('Error saving AI preferences:', error);
    return res.status(500).json({
      error: 'Failed to save AI preferences',
      details: error.message
    });
  }
}
