/**
 * API consolidée pour la gestion d'équipe (Plan Entreprise)
 * - GET: Récupérer les membres de l'équipe
 * - POST: Inviter un nouveau membre
 * - DELETE: Révoquer un membre
 */

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getTeamMembers(req, res);
      case 'POST':
        return await inviteTeamMember(req, res);
      case 'DELETE':
        return await revokeTeamMember(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Team API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

// GET: Récupérer les membres de l'équipe
async function getTeamMembers(req, res) {
  const { clerkUserId } = req.query;

  const response = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts?filterByFormula={parent_user_id}='${clerkUserId}'`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    }
  );

  const data = await response.json();

  const members = data.records.map(record => ({
    id: record.id,
    ...record.fields
  }));

  return res.status(200).json({ members });
}

// POST: Inviter un nouveau membre
async function inviteTeamMember(req, res) {
  const { parentUserId, email } = req.body;

  // 1. Vérifier que l'utilisateur est bien Entreprise
  const getUserResponse = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Users?filterByFormula={clerk_user_id}='${parentUserId}'`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    }
  );

  const userData = await getUserResponse.json();

  if (userData.records.length === 0 || userData.records[0].fields.plan !== 'entreprise') {
    return res.status(403).json({ error: 'Plan Entreprise requis' });
  }

  // 2. Vérifier la limite (2 membres max)
  const getMembersResponse = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts?filterByFormula=AND({parent_user_id}='${parentUserId}',{status}!='revoked')`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    }
  );

  const membersData = await getMembersResponse.json();

  if (membersData.records.length >= 2) {
    return res.status(400).json({ error: 'Limite de 2 membres atteinte' });
  }

  // 3. Vérifier que l'email n'est pas déjà invité
  const checkEmailResponse = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts?filterByFormula=AND({parent_user_id}='${parentUserId}',{sub_user_email}='${email}',{status}!='revoked')`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    }
  );

  const checkEmailData = await checkEmailResponse.json();

  if (checkEmailData.records.length > 0) {
    return res.status(400).json({ error: 'Email déjà invité' });
  }

  // 4. Créer l'invitation
  const createResponse = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          parent_user_id: parentUserId,
          sub_user_email: email,
          status: 'pending',
          invited_at: new Date().toISOString()
        }
      })
    }
  );

  // 5. TODO: Envoyer email d'invitation avec lien signup

  return res.status(200).json({ success: true });
}

// DELETE: Révoquer un membre
async function revokeTeamMember(req, res) {
  const { memberId } = req.query;

  if (!memberId) {
    return res.status(400).json({ error: 'memberId requis' });
  }

  await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts/${memberId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          status: 'revoked'
        }
      })
    }
  );

  return res.status(200).json({ success: true });
}
