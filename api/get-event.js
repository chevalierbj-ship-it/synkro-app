// API Serverless pour récupérer un événement depuis Airtable
// Ce fichier doit être placé dans /api/get-event.js

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accepter uniquement les requêtes GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer l'ID de l'événement depuis les query params
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing event ID' });
    }

    // Récupérer les variables d'environnement
    const AIRTABLE_API_TOKEN = 
      process.env.AIRTABLE_API_TOKEN || 
      process.env.VITE_AIRTABLE_API_TOKEN;
    
    const AIRTABLE_BASE_ID = 
      process.env.AIRTABLE_BASE_ID || 
      process.env.VITE_AIRTABLE_BASE_ID;
    
    const AIRTABLE_EVENTS_TABLE_ID = 
      process.env.AIRTABLE_EVENTS_TABLE_ID || 
      process.env.VITE_AIRTABLE_EVENTS_TABLE_ID;

    console.log('Fetching event:', id);

    // Vérifier que les variables existent
    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_EVENTS_TABLE_ID) {
      console.error('Missing environment variables!');
      return res.status(500).json({ 
        error: 'Configuration incomplète'
      });
    }

    // Construire l'URL pour chercher l'événement
    // On utilise filterByFormula pour chercher par eventId
    const formula = encodeURIComponent(`{eventId}="${id}"`);
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_EVENTS_TABLE_ID}?filterByFormula=${formula}`;
    
    console.log('Searching in Airtable...');

    // Appeler l'API Airtable
    const response = await fetch(airtableUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`
      }
    });

    console.log('Airtable response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable error:', errorText);
      return res.status(response.status).json({ 
        error: 'Erreur Airtable',
        details: errorText
      });
    }

    const result = await response.json();

    // Vérifier si un événement a été trouvé
    if (!result.records || result.records.length === 0) {
      console.log('Event not found:', id);
      return res.status(404).json({ 
        error: 'Event not found',
        eventId: id
      });
    }

    // Récupérer le premier résultat (devrait être unique)
    const event = result.records[0].fields;

    console.log('Event found successfully:', event.eventId);

    // Retourner l'événement
    return res.status(200).json({ 
      success: true, 
      data: event 
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message
    });
  }
}
