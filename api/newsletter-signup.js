// api/newsletter-signup.js
// Endpoint pour enregistrer les emails de newsletter dans Airtable

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { email } = req.body;

    // Validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Email invalide'
      });
    }

    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
      console.error('Missing Airtable credentials');
      return res.status(500).json({
        success: false,
        error: 'Configuration serveur manquante'
      });
    }

    // Créer ou récupérer la table Newsletter dans Airtable
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Newsletter`;

    // Vérifier si l'email existe déjà
    const checkUrl = `${airtableUrl}?filterByFormula=email="${email}"`;
    const checkResponse = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      console.error('Airtable check error:', errorData);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification de l\'email'
      });
    }

    const checkData = await checkResponse.json();

    // Si l'email existe déjà, retourner succès sans dupliquer
    if (checkData.records && checkData.records.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Déjà inscrit',
        alreadyExists: true
      });
    }

    // Ajouter le nouvel email
    const response = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{
          fields: {
            email: email,
            subscribedAt: new Date().toISOString(),
            source: 'landing_page',
            status: 'active'
          }
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable error:', errorData);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'enregistrement'
      });
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      message: 'Email enregistré avec succès',
      recordId: data.records[0].id
    });

  } catch (error) {
    console.error('Newsletter signup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
}
