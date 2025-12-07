// /api/settings.js
// API consolidée pour gérer les paramètres utilisateur
// Route selon l'action

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

  const { action } = req.query;

  try {
    // POST /api/settings?action=ai-preferences - Sauvegarder les préférences IA
    if (action === 'ai-preferences') {
      return await saveAIPreferences(req, res);
    }

    // POST /api/settings?action=customization - Sauvegarder la personnalisation
    if (action === 'customization') {
      return await saveCustomization(req, res);
    }

    return res.status(400).json({
      error: 'Invalid action',
      message: 'Use action=ai-preferences|customization'
    });

  } catch (error) {
    console.error('Error in settings API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

// ========================================
// SAVE AI PREFERENCES - Préférences IA
// ========================================
async function saveAIPreferences(req, res) {
  const { eventId, participantName, participantEmail, preferences } = req.body;

  if (!eventId || !participantName || !preferences) {
    return res.status(400).json({
      error: 'Données manquantes',
      message: 'eventId, participantName et preferences sont requis'
    });
  }

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

  let aiPreferences = [];
  if (event.ai_preferences) {
    try {
      aiPreferences = JSON.parse(event.ai_preferences);
    } catch (e) {
      console.error('Error parsing existing ai_preferences:', e);
      aiPreferences = [];
    }
  }

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
    aiPreferences[existingIndex] = newPreference;
    console.log('📝 Updating existing AI preferences for:', participantName);
  } else {
    aiPreferences.push(newPreference);
    console.log('➕ Adding new AI preferences for:', participantName);
  }

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

  return res.status(200).json({
    success: true,
    message: 'Préférences sauvegardées avec succès',
    totalResponses: aiPreferences.length,
    expectedParticipants: event.expectedParticipants || 0,
    allResponsesReceived: aiPreferences.length >= (event.expectedParticipants || 0)
  });
}

// ========================================
// SAVE CUSTOMIZATION - Personnalisation
// ========================================
async function saveCustomization(req, res) {
  const { clerkUserId, themeColor, hideBranding } = req.body;

  if (!clerkUserId) {
    return res.status(400).json({
      error: 'clerkUserId manquant',
      message: 'Le paramètre clerkUserId est requis'
    });
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
    console.error('Variables d\'environnement Airtable manquantes');
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  const getUserResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users?filterByFormula={clerk_user_id}='${clerkUserId}'`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      }
    }
  );

  if (!getUserResponse.ok) {
    console.error('Erreur Airtable (GET):', await getUserResponse.text());
    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
  }

  const userData = await getUserResponse.json();

  if (userData.records.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userId = userData.records[0].id;

  const updateResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users/${userId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          theme_color: themeColor,
          hide_branding: hideBranding
        }
      })
    }
  );

  if (!updateResponse.ok) {
    console.error('Erreur Airtable (PATCH):', await updateResponse.text());
    return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }

  return res.status(200).json({ success: true });
}
