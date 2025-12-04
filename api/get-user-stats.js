/**
 * API Serverless pour récupérer les statistiques d'un utilisateur
 * Retourne le plan, le nombre d'événements créés, la limite, etc.
 */

export default async function handler(req, res) {
  // Permettre uniquement les requêtes GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;

  // Validation
  if (!email) {
    return res.status(400).json({
      error: 'Email manquant',
      message: 'Le paramètre email est requis'
    });
  }

  try {
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      console.error('Variables d\'environnement Airtable manquantes');
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

    // Récupérer l'utilisateur depuis Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users?filterByFormula={email}='${email}'`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.error('Erreur Airtable:', await response.text());
      return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
    }

    const data = await response.json();

    // Si l'utilisateur n'existe pas, retourner des stats par défaut
    if (!data.records || data.records.length === 0) {
      return res.status(200).json({
        email,
        plan: 'gratuit',
        eventsCreatedThisMonth: 0,
        eventsLimit: 5,
        canRemoveBranding: false,
        canExportData: false,
        canCustomizeColors: false,
        canAccessAnalytics: false,
        isNewUser: true
      });
    }

    const user = data.records[0].fields;

    // Construire les permissions basées sur le plan
    const plan = user.plan || 'gratuit';
    const isPro = plan === 'pro';
    const isEnterprise = plan === 'entreprise';
    const isPremium = isPro || isEnterprise;

    // Retourner les statistiques complètes
    return res.status(200).json({
      email: user.email,
      plan,
      eventsCreatedThisMonth: user.events_created_this_month || 0,
      eventsLimit: isPremium ? 'illimité' : (user.events_limit || 5),
      lastEventDate: user.last_event_date || null,
      createdAt: user.created_at || null,

      // Permissions basées sur le plan
      canRemoveBranding: isPremium,
      canExportData: isPremium,
      canCustomizeColors: isPremium,
      canAccessAnalytics: isPremium,
      canUploadLogo: isEnterprise,
      canHaveCustomDomain: isEnterprise,

      // Informations additionnelles
      isNewUser: false,
      remainingEvents: isPremium ? 'illimité' : Math.max(0, (user.events_limit || 5) - (user.events_created_this_month || 0))
    });

  } catch (error) {
    console.error('Erreur get stats:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
}
