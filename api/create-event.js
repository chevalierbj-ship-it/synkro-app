// API Serverless pour créer un événement dans Airtable
// Version améliorée avec meilleure gestion des erreurs

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accepter uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer les variables d'environnement (avec ou sans VITE_)
    const AIRTABLE_API_TOKEN = 
      process.env.AIRTABLE_API_TOKEN || 
      process.env.VITE_AIRTABLE_API_TOKEN;
    
    const AIRTABLE_BASE_ID = 
      process.env.AIRTABLE_BASE_ID || 
      process.env.VITE_AIRTABLE_BASE_ID;
    
    const AIRTABLE_EVENTS_TABLE_ID = 
      process.env.AIRTABLE_EVENTS_TABLE_ID || 
      process.env.VITE_AIRTABLE_EVENTS_TABLE_ID;

    // Logs pour déboguer (masquer les valeurs sensibles)
    console.log('Environment check:', {
      hasToken: !!AIRTABLE_API_TOKEN,
      hasBaseId: !!AIRTABLE_BASE_ID,
      hasTableId: !!AIRTABLE_EVENTS_TABLE_ID,
      tokenStart: AIRTABLE_API_TOKEN ? AIRTABLE_API_TOKEN.substring(0, 10) + '...' : 'MISSING',
      baseId: AIRTABLE_BASE_ID || 'MISSING',
      tableId: AIRTABLE_EVENTS_TABLE_ID || 'MISSING'
    });

    // Vérifier que les variables existent
    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_EVENTS_TABLE_ID) {
      console.error('Missing environment variables!');
      return res.status(500).json({ 
        error: 'Configuration incomplète',
        details: {
          hasToken: !!AIRTABLE_API_TOKEN,
          hasBaseId: !!AIRTABLE_BASE_ID,
          hasTableId: !!AIRTABLE_EVENTS_TABLE_ID
        }
      });
    }

    // Récupérer les données de l'événement depuis le body
    const eventData = req.body;
    
    console.log('Creating event with data:', {
      eventId: eventData.eventId,
      organizer: eventData.organizerName,
      type: eventData.type
    });

    // Construire l'URL de l'API Airtable
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_EVENTS_TABLE_ID}`;
    
    console.log('Calling Airtable at:', airtableUrl);

    // Appeler l'API Airtable
    const response = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: eventData
      })
    });

    console.log('Airtable response status:', response.status);

    // Vérifier la réponse
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable error response:', errorText);
      
      // Parser l'erreur si c'est du JSON
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch (e) {
        errorDetails = { message: errorText };
      }
      
      return res.status(response.status).json({ 
        error: 'Erreur Airtable',
        status: response.status,
        details: errorDetails,
        url: airtableUrl.replace(AIRTABLE_API_TOKEN, 'TOKEN_HIDDEN')
      });
    }

    // Récupérer les données de la réponse
    const result = await response.json();
    
    console.log('Event created successfully:', result.id);

    // Retourner le succès
    return res.status(200).json({ 
      success: true, 
      data: result 
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
