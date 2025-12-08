/**
 * API pour accepter une invitation d'équipe
 * - GET ?token=xxx : Vérifier et obtenir les détails de l'invitation
 * - POST : Accepter l'invitation et activer le compte
 */

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getInvitationDetails(req, res);
      case 'POST':
        return await acceptInvitation(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Accept invitation API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

// GET: Récupérer les détails de l'invitation
async function getInvitationDetails(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token manquant' });
  }

  // Rechercher l'invitation par token
  const response = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts?filterByFormula={invitation_token}='${token}'`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    }
  );

  const data = await response.json();

  if (!data.records || data.records.length === 0) {
    return res.status(404).json({ error: 'Invitation invalide ou expirée' });
  }

  const invitation = data.records[0].fields;

  // Vérifier le statut
  if (invitation.status === 'active') {
    return res.status(400).json({ error: 'Invitation déjà acceptée' });
  }

  if (invitation.status === 'revoked') {
    return res.status(400).json({ error: 'Invitation révoquée' });
  }

  // Vérifier l'expiration (7 jours)
  const invitedAt = new Date(invitation.invited_at);
  const now = new Date();
  const daysDiff = (now - invitedAt) / (1000 * 60 * 60 * 24);

  if (daysDiff > 7) {
    return res.status(400).json({ error: 'Invitation expirée (7 jours)' });
  }

  // Récupérer les infos du compte parent
  const parentResponse = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Users?filterByFormula={clerk_user_id}='${invitation.parent_user_id}'`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    }
  );

  const parentData = await parentResponse.json();
  const parentEmail = parentData.records[0]?.fields?.email || 'Un utilisateur';

  return res.status(200).json({
    success: true,
    invitation: {
      email: invitation.sub_user_email,
      role: invitation.role,
      invitedBy: parentEmail,
      invitedAt: invitation.invited_at
    }
  });
}

// POST: Accepter l'invitation
async function acceptInvitation(req, res) {
  const { token, clerkUserId, email } = req.body;

  if (!token || !clerkUserId || !email) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  // 1. Rechercher l'invitation
  const searchResponse = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts?filterByFormula={invitation_token}='${token}'`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    }
  );

  const searchData = await searchResponse.json();

  if (!searchData.records || searchData.records.length === 0) {
    return res.status(404).json({ error: 'Invitation invalide' });
  }

  const record = searchData.records[0];
  const invitation = record.fields;

  // 2. Vérifications
  if (invitation.status !== 'pending') {
    return res.status(400).json({ error: 'Invitation déjà traitée' });
  }

  // Vérifier que l'email correspond
  if (invitation.sub_user_email.toLowerCase() !== email.toLowerCase()) {
    return res.status(403).json({
      error: 'Email non autorisé',
      message: `Cette invitation est pour ${invitation.sub_user_email}`
    });
  }

  // Vérifier l'expiration
  const invitedAt = new Date(invitation.invited_at);
  const now = new Date();
  const daysDiff = (now - invitedAt) / (1000 * 60 * 60 * 24);

  if (daysDiff > 7) {
    return res.status(400).json({ error: 'Invitation expirée' });
  }

  // 3. Activer l'invitation
  const updateResponse = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts/${record.id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          status: 'active',
          clerk_user_id: clerkUserId,
          accepted_at: new Date().toISOString()
        }
      })
    }
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    console.error('Failed to activate invitation:', errorText);
    return res.status(500).json({ error: 'Erreur lors de l\'activation' });
  }

  // 4. Créer ou mettre à jour l'utilisateur dans la table Users
  await ensureUserExists(clerkUserId, email, invitation.parent_user_id);

  return res.status(200).json({
    success: true,
    message: 'Invitation acceptée avec succès',
    role: invitation.role,
    parentUserId: invitation.parent_user_id
  });
}

// Créer ou mettre à jour l'utilisateur
async function ensureUserExists(clerkUserId, email, parentUserId) {
  // Vérifier si l'utilisateur existe déjà
  const checkUserResponse = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Users?filterByFormula={clerk_user_id}='${clerkUserId}'`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    }
  );

  const checkUserData = await checkUserResponse.json();

  if (checkUserData.records && checkUserData.records.length > 0) {
    // L'utilisateur existe déjà
    const userId = checkUserData.records[0].id;
    await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Users/${userId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            is_sub_account: true,
            parent_account_id: parentUserId
          }
        })
      }
    );
  } else {
    // Créer l'utilisateur
    await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Users`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            clerk_user_id: clerkUserId,
            email: email,
            plan: 'gratuit',
            is_sub_account: true,
            parent_account_id: parentUserId,
            created_at: new Date().toISOString()
          }
        })
      }
    );
  }
}
