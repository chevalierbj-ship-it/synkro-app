export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { parentUserId, email } = req.body;

  try {
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

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
