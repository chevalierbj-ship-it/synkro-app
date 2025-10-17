// API Serverless pour créer un événement dans Airtable
// Ce fichier doit être placé dans /api/create-event.js

export default async function handler(req, res) {
  // Accepter uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer les variables d'environnement
    const AIRTABLE_API_TOKEN = process.env.VITE_AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID;
    const AIRTABLE_EVENTS_TABLE_ID = process.env.VITE_AIRTABLE_EVENTS_TABLE_ID;

    // Vérifier que les variables existent
    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_EVENTS_TABLE_ID) {
      return res.status(500).json({ 
        error: 'Missing environment variables',
        details: {
          hasToken: !!AIRTABLE_API_TOKEN,
          hasBaseId: !!AIRTABLE_BASE_ID,
          hasTableId: !!AIRTABLE_EVENTS_TABLE_ID
        }
      });
    }

    // Récupérer les données de l'événement depuis le body
    const eventData = req.body;

    // Appeler l'API Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_EVENTS_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: eventData
        })
      }
    );

    // Vérifier la réponse
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable error:', errorText);
      return res.status(response.status).json({ 
        error: 'Airtable API error',
        details: errorText
      });
    }

    // Récupérer les données de la réponse
    const result = await response.json();

    // Retourner le succès
    return res.status(200).json({ 
      success: true, 
      data: result 
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
}
