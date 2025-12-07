/**
 * API Serverless pour sauvegarder les préférences de personnalisation
 * Met à jour la couleur du thème et l'option de masquage du branding
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clerkUserId, themeColor, hideBranding } = req.body;

  // Validation
  if (!clerkUserId) {
    return res.status(400).json({
      error: 'clerkUserId manquant',
      message: 'Le paramètre clerkUserId est requis'
    });
  }

  try {
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

    if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) {
      console.error('Variables d\'environnement Airtable manquantes');
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

    // 1. Récupérer l'utilisateur depuis Airtable
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

    // 2. Mettre à jour les préférences
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

  } catch (error) {
    console.error('Erreur save-customization:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
}
