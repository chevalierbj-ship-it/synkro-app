// /api/get-user-events.js
// API pour récupérer les événements d'un utilisateur depuis EventsLog
// ✅ Lecture depuis la table EventsLog dans Airtable
// ✅ Filtrage par email utilisateur
// ✅ Tri par date de création (plus récent en premier)

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

  const { email } = req.query;

  console.log('📧 Fetching events for email:', email);

  if (!email) {
    return res.status(400).json({ error: 'Missing email parameter' });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_TOKEN || !BASE_ID) {
    console.error('❌ Missing Airtable configuration');
    console.error('AIRTABLE_TOKEN exists:', !!AIRTABLE_TOKEN);
    console.error('AIRTABLE_BASE_ID exists:', !!BASE_ID);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Récupérer les événements depuis EventsLog
    // Filtre par email + tri par date de création décroissante + limite à 10 résultats
    const filterFormula = `{user_email}='${email}'`;
    const url = `https://api.airtable.com/v0/${BASE_ID}/EventsLog?filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=created_at&sort[0][direction]=desc&maxRecords=10`;

    console.log('🔍 Fetching from Airtable URL:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Airtable API error:', errorText);
      console.error('❌ Response status:', response.status);
      return res.status(500).json({
        error: 'Failed to fetch events from database',
        details: errorText
      });
    }

    const data = await response.json();

    console.log('📊 Found events:', data.records.length);

    // Transformer les données pour le frontend
    const events = data.records.map(record => {
      const fields = record.fields || {};
      return {
        id: record.id,
        eventId: fields.event_id || null,
        eventName: fields.event_name || 'Sans titre',
        participantsCount: fields.participants_count || 0,
        status: fields.status || 'draft',
        createdAt: fields.created_at || new Date().toISOString(),
        lastEventDate: fields.last_event_date || null,
        stripeCustomerId: fields.stripe_customer_id || null,
        stripeSubscriptionId: fields.stripe_subscription_id || null
      };
    });

    console.log('✅ Returning events:', events.length);

    return res.status(200).json({
      success: true,
      events: events,
      count: events.length
    });

  } catch (error) {
    console.error('❌ Error fetching events:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
