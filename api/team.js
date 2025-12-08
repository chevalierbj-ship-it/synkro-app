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
  const { parentUserId, email, role = 'editor' } = req.body;

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

  const parentUser = userData.records[0].fields;

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

  // 4. Générer un token d'invitation unique
  const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;

  // 5. Créer l'invitation avec role et token
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
          role: role,
          invitation_token: invitationToken,
          invited_at: new Date().toISOString()
        }
      })
    }
  );

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('Failed to create invitation:', errorText);
    return res.status(500).json({ error: 'Erreur lors de la création de l\'invitation' });
  }

  const invitationData = await createResponse.json();

  // 6. Envoyer l'email d'invitation
  await sendInvitationEmail({
    email,
    invitationToken,
    parentUserName: parentUser.email,
    role
  });

  return res.status(200).json({
    success: true,
    invitationId: invitationData.id
  });
}

// Fonction pour envoyer l'email d'invitation
async function sendInvitationEmail({ email, invitationToken, parentUserName, role }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return;
  }

  const invitationLink = `${process.env.VERCEL_URL || 'https://synkro-app-bice.vercel.app'}/accept-invitation?token=${invitationToken}`;

  const roleText = {
    admin: 'Administrateur - Accès complet à tous les événements',
    editor: 'Éditeur - Peut créer et modifier des événements',
    viewer: 'Lecteur - Peut uniquement consulter les événements'
  }[role] || 'Membre de l\'équipe';

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation Synkro</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%); min-height: 100vh; padding: 40px 20px;">

  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(139, 92, 246, 0.3);">

    <tr>
      <td style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 12px;">🎉</div>
        <h1 style="margin: 0; font-size: 32px; color: white; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">Invitation à rejoindre Synkro</h1>
        <p style="margin: 12px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 500;">Plan Entreprise</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 40px;">

        <p style="font-size: 18px; color: #1E1B4B; font-weight: 600; margin: 0 0 24px 0;">
          Bonjour ! 👋
        </p>

        <p style="font-size: 16px; color: #6B7280; line-height: 1.6; margin: 0 0 24px 0;">
          <strong style="color: #8B5CF6;">${parentUserName}</strong> vous invite à rejoindre son équipe sur Synkro pour collaborer sur les événements.
        </p>

        <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); padding: 20px; border-radius: 12px; margin-bottom: 28px; border: 2px solid #E9D5FF;">
          <div style="font-size: 14px; color: #8B5CF6; font-weight: 700; margin-bottom: 8px;">🎯 Votre rôle</div>
          <div style="font-size: 16px; color: #1E1B4B; font-weight: 600;">${roleText}</div>
        </div>

        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${invitationLink}" style="display: inline-block; padding: 18px 32px; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; border-radius: 14px; font-size: 16px; font-weight: 700; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);">
            ✨ Accepter l'invitation
          </a>
        </div>

        <div style="background: linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; color: #1E40AF; line-height: 1.6;">
            💡 <strong>Note importante :</strong><br>
            Cette invitation expire dans 7 jours. Si vous n'avez pas encore de compte Synkro, vous serez invité à en créer un.
          </p>
        </div>

      </td>
    </tr>

    <tr>
      <td style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0; font-size: 12px; color: #6B7280; line-height: 1.6;">
          Cet email a été envoyé par <strong style="color: #8B5CF6;">Synkro</strong><br>
          La solution simple pour organiser vos événements en équipe<br>
          <a href="https://synkro-app-bice.vercel.app" style="color: #8B5CF6; text-decoration: none;">synkro-app-bice.vercel.app</a>
        </p>
      </td>
    </tr>

  </table>

</body>
</html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Synkro <onboarding@resend.dev>',
        to: email,
        subject: '🎉 Vous êtes invité à rejoindre une équipe sur Synkro',
        html: emailHtml
      })
    });

    if (!response.ok) {
      console.error('Failed to send invitation email:', await response.text());
    } else {
      console.log('✅ Invitation email sent to:', email);
    }
  } catch (error) {
    console.error('Error sending invitation email:', error);
  }
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
