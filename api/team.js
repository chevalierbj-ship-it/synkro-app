/**
 * API consolidée pour la gestion d'équipe (Plan Entreprise)
 * - GET ?action=members : Récupérer les membres de l'équipe
 * - GET ?action=invitation&token=xxx : Vérifier une invitation
 * - POST ?action=invite : Inviter un nouveau membre
 * - POST ?action=accept : Accepter une invitation
 * - DELETE ?action=revoke : Révoquer un membre
 */

import { getEmailConfig } from './_lib/validate-env.js';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_AUTH = AIRTABLE_TOKEN || AIRTABLE_API_KEY;

export default async function handler(req, res) {
  const { method } = req;
  const { action } = req.query;

  try {
    switch (method) {
      case 'GET':
        if (action === 'invitation') {
          return await getInvitationDetails(req, res);
        }
        return await getTeamMembers(req, res);
      case 'POST':
        if (action === 'accept') {
          return await acceptInvitation(req, res);
        }
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
        Authorization: `Bearer ${AIRTABLE_AUTH}`
      }
    }
  );

  const data = await response.json();

  // Vérification de sécurité pour éviter le crash si data.records est undefined
  if (!data.records || !Array.isArray(data.records)) {
    console.error('Unexpected response from Airtable:', data);

    // Si l'erreur est due à un champ manquant, retourner un message explicite
    if (data.error && data.error.type === 'INVALID_FILTER_BY_FORMULA') {
      return res.status(200).json({
        members: [],
        warning: 'Le champ parent_user_id n\'existe pas dans la table SubAccounts. Veuillez le créer dans Airtable (type: Single line text).'
      });
    }

    return res.status(200).json({ members: [] });
  }

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
        Authorization: `Bearer ${AIRTABLE_AUTH}`
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
        Authorization: `Bearer ${AIRTABLE_AUTH}`
      }
    }
  );

  const membersData = await getMembersResponse.json();

  // Gérer l'erreur si le champ parent_user_id n'existe pas
  if (membersData.error && membersData.error.type === 'INVALID_FILTER_BY_FORMULA') {
    return res.status(500).json({
      error: 'Configuration Airtable incomplète',
      message: 'Le champ parent_user_id n\'existe pas dans la table SubAccounts. Veuillez le créer dans Airtable (type: Single line text).',
      solution: 'Allez dans votre table SubAccounts sur Airtable et créez un nouveau champ nommé "parent_user_id" de type "Single line text".'
    });
  }

  if (membersData.records && membersData.records.length >= 2) {
    return res.status(400).json({ error: 'Limite de 2 membres atteinte' });
  }

  // 3. Vérifier que l'email n'est pas déjà invité
  const checkEmailResponse = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts?filterByFormula=AND({parent_user_id}='${parentUserId}',{sub_user_email}='${email}',{status}!='revoked')`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_AUTH}`
      }
    }
  );

  const checkEmailData = await checkEmailResponse.json();

  // Gérer l'erreur si le champ parent_user_id n'existe pas
  if (checkEmailData.error && checkEmailData.error.type === 'INVALID_FILTER_BY_FORMULA') {
    return res.status(500).json({
      error: 'Configuration Airtable incomplète',
      message: 'Le champ parent_user_id n\'existe pas dans la table SubAccounts. Veuillez le créer dans Airtable (type: Single line text).',
      solution: 'Allez dans votre table SubAccounts sur Airtable et créez un nouveau champ nommé "parent_user_id" de type "Single line text".'
    });
  }

  if (checkEmailData.records && checkEmailData.records.length > 0) {
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
        Authorization: `Bearer ${AIRTABLE_AUTH}`,
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

  // Toujours utiliser le domaine production pour les emails
  const APP_URL = process.env.APP_URL || 'https://getsynkro.com';
  const invitationLink = `${APP_URL}/accept-invitation?token=${invitationToken}`;

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
          <a href="https://getsynkro.com" style="color: #8B5CF6; text-decoration: none;">getsynkro.com</a>
        </p>
      </td>
    </tr>

  </table>

</body>
</html>
  `;

  try {
    const emailConfig = getEmailConfig();
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: emailConfig.from,
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
        Authorization: `Bearer ${AIRTABLE_AUTH}`,
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

// ========================================
// ACCEPT INVITATION - Fonctions d'acceptation d'invitation
// ========================================

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
        Authorization: `Bearer ${AIRTABLE_AUTH}`
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
        Authorization: `Bearer ${AIRTABLE_AUTH}`
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
        Authorization: `Bearer ${AIRTABLE_AUTH}`
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
        Authorization: `Bearer ${AIRTABLE_AUTH}`,
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
        Authorization: `Bearer ${AIRTABLE_AUTH}`
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
          Authorization: `Bearer ${AIRTABLE_AUTH}`,
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
          Authorization: `Bearer ${AIRTABLE_AUTH}`,
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
