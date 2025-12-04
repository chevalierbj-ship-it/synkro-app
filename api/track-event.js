/**
 * API Serverless pour tracker les événements créés par les utilisateurs
 * Vérifie les limites du plan gratuit et incrémente les compteurs
 */

export default async function handler(req, res) {
  // Permettre uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userEmail, eventName, participantsCount } = req.body;

  // Validation des données
  if (!userEmail || !eventName) {
    return res.status(400).json({
      error: 'Données manquantes',
      message: 'Email et nom d\'événement requis'
    });
  }

  try {
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      console.error('Variables d\'environnement Airtable manquantes');
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

    // 1. Vérifier si l'utilisateur existe dans Airtable
    const userResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users?filterByFormula={email}='${userEmail}'`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`
        }
      }
    );

    if (!userResponse.ok) {
      console.error('Erreur Airtable:', await userResponse.text());
      return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
    }

    const userData = await userResponse.json();
    let user = userData.records[0];

    // 2. Si l'utilisateur n'existe pas, le créer
    if (!user) {
      const createUserResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              email: userEmail,
              plan: 'gratuit',
              events_created_this_month: 0,
              events_limit: 5,
              created_at: new Date().toISOString()
            }
          })
        }
      );

      if (!createUserResponse.ok) {
        console.error('Erreur création utilisateur:', await createUserResponse.text());
        return res.status(500).json({ error: 'Erreur création utilisateur' });
      }

      const newUserData = await createUserResponse.json();
      user = newUserData;
    }

    // 3. Vérifier si la limite est atteinte (uniquement pour le plan gratuit)
    const currentCount = user.fields.events_created_this_month || 0;
    const limit = user.fields.events_limit || 5;
    const userPlan = user.fields.plan || 'gratuit';

    if (currentCount >= limit && userPlan === 'gratuit') {
      return res.status(403).json({
        error: 'Limite atteinte',
        message: 'Vous avez atteint votre limite d\'événements ce mois-ci. Passez en Pro pour événements illimités !',
        currentCount,
        limit,
        upgradeUrl: '/pricing'
      });
    }

    // 4. Logger l'événement dans EventsLog
    const logResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/EventsLog`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            user_email: userEmail,
            event_name: eventName,
            participants_count: participantsCount || 0,
            created_at: new Date().toISOString(),
            status: 'draft'
          }
        })
      }
    );

    if (!logResponse.ok) {
      console.error('Erreur logging événement:', await logResponse.text());
      // On continue quand même, le logging n'est pas critique
    }

    // 5. Incrémenter le compteur d'événements de l'utilisateur
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users/${user.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            events_created_this_month: currentCount + 1,
            last_event_date: new Date().toISOString()
          }
        })
      }
    );

    if (!updateResponse.ok) {
      console.error('Erreur mise à jour compteur:', await updateResponse.text());
      return res.status(500).json({ error: 'Erreur mise à jour compteur' });
    }

    // 6. Retourner le succès avec les nouvelles stats
    return res.status(200).json({
      success: true,
      currentCount: currentCount + 1,
      limit,
      plan: userPlan,
      message: 'Événement créé avec succès !',
      remainingEvents: userPlan === 'gratuit' ? limit - (currentCount + 1) : 'illimité'
    });

  } catch (error) {
    console.error('Erreur tracking:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
}
