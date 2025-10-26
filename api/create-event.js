// /api/create-event.js
// API Serverless pour créer un événement dans Airtable
// ✅ Version SÉCURISÉE avec variables d'environnement
// ✅ Utilise l'ID de la table au lieu du nom
// ✅ Envoie un email à l'organisateur

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

    // Générer un ID unique pour l'événement
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
        status: 'active'
      }
    };

    console.log('Creating event with ID:', eventId);
    console.log('Using BASE_ID:', BASE_ID);
    console.log('Using TABLE_ID:', TABLE_ID);

    // Créer l'événement dans Airtable avec l'ID de la table
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
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
      console.error('Status:', response.status);
      return res.status(500).json({ 
        error: 'Failed to create event in Airtable',
        details: errorText,
        status: response.status
      });
    }

    const result = await response.json();
    console.log('Event created successfully:', result.id);

    // 🆕 ENVOI EMAIL À L'ORGANISATEUR
    if (eventData.organizerEmail) {
      try {
        // Construire le lien de l'événement
        const eventLink = `https://synkro-app-bice.vercel.app/participant?id=${eventId}`;
        
        // Envoyer l'email à l'organisateur
        const emailResponse = await fetch(`https://${process.env.VERCEL_URL || 'synkro-app-bice.vercel.app'}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'organizer-created',
            to: eventData.organizerEmail,
            data: {
              eventType: eventData.type,
              eventLink: eventLink,
              organizerName: eventData.organizerName,
              dates: eventData.dates,
              location: eventData.location || null
            }
          })
        });
        
        console.log('📧 Email API response status:', emailResponse.status);
        
        // Lire la réponse en texte d'abord
        const responseText = await emailResponse.text();
        console.log('📧 Email API response (first 500 chars):', responseText.substring(0, 500));
        
        if (!emailResponse.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: 'Non-JSON response', response: responseText.substring(0, 200) };
          }
          throw new Error(`Email API error (${emailResponse.status}): ${JSON.stringify(errorData)}`);
        }
        
        const emailResult = JSON.parse(responseText);
        console.log('✅ Email sent to organizer:', eventData.organizerEmail, '- Email ID:', emailResult.emailId);
      } catch (emailError) {
        // Ne pas bloquer la création si l'email échoue
        console.error('⚠️ Failed to send email to organizer:', emailError.message);
      }
    }
    
    // Retourner l'ID de l'événement et le lien
    return res.status(200).json({
      success: true,
      eventId: eventId,
      airtableId: result.id,
      participantLink: `https://synkro-app-bice.vercel.app/participant?id=${eventId}`,
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
