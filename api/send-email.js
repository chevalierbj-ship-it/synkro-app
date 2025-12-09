// /api/send-email.js
// API pour envoyer les emails via Resend
// Documentation: https://resend.com/docs/send-with-nodejs
//
// CONFIGURATION DOMAINE CUSTOM:
// Pour utiliser un domaine personnalise (ex: noreply@synkro.app):
// 1. Ajoutez votre domaine dans Resend Dashboard (https://resend.com/domains)
// 2. Configurez les enregistrements DNS (SPF, DKIM, DMARC)
// 3. Definissez EMAIL_FROM_ADDRESS et EMAIL_FROM_NAME dans vos variables d'environnement
//
// Variables d'environnement:
// - RESEND_API_KEY: Cle API Resend (obligatoire)
// - EMAIL_FROM_ADDRESS: Adresse email d'envoi (optionnel, defaut: onboarding@resend.dev)
// - EMAIL_FROM_NAME: Nom d'affichage (optionnel, defaut: Synkro)

import { applyRateLimit } from './lib/rate-limit.js';
import { getEmailConfig } from './lib/validate-env.js';

export default async function handler(req, res) {
  console.log('🔵 send-email.js called - Method:', req.method);
  
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request - returning 200');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting pour les emails
  if (applyRateLimit(req, res, 'email')) {
    console.log('⚠️ Rate limit exceeded for email sending');
    return; // Requête bloquée par rate limit
  }

  try {
    console.log('📧 Email request body:', JSON.stringify(req.body, null, 2));
    const { type, to, data } = req.body;

    // Validation
    if (!type || !to || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['type', 'to', 'data']
      });
    }

    // Clé API Resend (à configurer dans Vercel Environment Variables)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Préparer le contenu de l'email selon le type
    let emailContent;
    let subject;

    switch(type) {
      case 'organizer-created':
        subject = '✅ Ton événement Synkro est créé !';
        emailContent = getOrganizerCreatedEmail(data);
        break;
      
      case 'participant-voted':
        subject = '✅ Tes disponibilités sont enregistrées !';
        emailContent = getParticipantVotedEmail(data);
        break;
      
      case 'date-confirmed':
        subject = '🎉 La date de ton événement est confirmée !';
        emailContent = getDateConfirmedEmail(data);
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid email type' });
    }

    // Recuperer la configuration email (supporte domaine custom)
    const emailConfig = getEmailConfig();

    // Envoyer l'email via Resend
    console.log('📤 Sending email to Resend API...');
    console.log('📧 To:', to);
    console.log('📋 Subject:', subject);
    console.log('📬 From:', emailConfig.from);
    console.log('🌐 Custom domain:', emailConfig.isCustomDomain ? 'Yes' : 'No (using resend.dev)');
    console.log('🔑 API Key present:', !!RESEND_API_KEY);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: emailConfig.from,
        to: [to],
        subject: subject,
        html: emailContent
      })
    });

    console.log('📥 Resend API response status:', response.status);
    const result = await response.json();
    console.log('📥 Resend API response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('Resend API error:', result);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: result 
      });
    }

    return res.status(200).json({ 
      success: true,
      emailId: result.id,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// ========================================
// TEMPLATES D'EMAILS
// ========================================

function getOrganizerCreatedEmail(data) {
  const { eventType, eventLink, organizerName, dates, location } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Événement créé</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✨</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">Synkro</h1>
            </td>
          </tr>
          <tr>
            <td style="background: white; padding: 40px;">
              <h2 style="color: #1E1B4B; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">
                ✅ Ton événement est créé !
              </h2>
              
              <p style="color: #6B7280; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                Salut ${organizerName} ! 👋<br><br>
                Ton événement <strong>"${eventType}"</strong> est prêt ! Partage le lien ci-dessous avec tes invités pour qu'ils puissent voter.
              </p>

              <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">
                  📅 Type d'événement
                </p>
                <p style="color: #1E1B4B; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">
                  ${eventType}
                </p>
                
                ${location ? `
                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">
                  📍 Lieu
                </p>
                <p style="color: #1E1B4B; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
                  ${location}
                </p>
                ` : ''}
                
                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">
                  📆 Dates proposées
                </p>
                <p style="color: #1E1B4B; margin: 0; font-size: 14px; font-weight: 500; line-height: 1.8;">
                  ${dates.map(d => d.label).join('<br>')}
                </p>
              </div>

              <a href="${eventLink}" style="display: block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 20px;">
                📤 Partager avec mes invités
              </a>

              <div style="background: #FEF3C7; border-radius: 12px; padding: 16px; border-left: 4px solid #F59E0B;">
                <p style="color: #92400E; margin: 0; font-size: 14px; line-height: 1.6;">
                  💡 <strong>Astuce :</strong> Copie ce lien et envoie-le par WhatsApp, email ou SMS à tes invités !
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; margin: 0 0 10px 0; font-size: 14px;">
                Créé avec ❤️ par Synkro
              </p>
              <p style="color: #9CA3AF; margin: 0; font-size: 12px;">
                Trouve la date parfaite en 1 minute
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getParticipantVotedEmail(data) {
  const { participantName, eventType, organizerName, votedDates } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vote enregistré</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✅</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">Synkro</h1>
            </td>
          </tr>
          <tr>
            <td style="background: white; padding: 40px;">
              <h2 style="color: #1E1B4B; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">
                ✅ Tes disponibilités sont enregistrées !
              </h2>
              
              <p style="color: #6B7280; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                Merci ${participantName} ! 🙏<br><br>
                Ton vote pour l'événement <strong>"${eventType}"</strong> de ${organizerName} a bien été pris en compte.
              </p>

              <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <p style="color: #6B7280; margin: 0 0 12px 0; font-size: 13px; font-weight: 600;">
                  📆 Tes disponibilités
                </p>
                ${votedDates.map(date => `
                  <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                    <p style="color: #1E1B4B; margin: 0; font-size: 16px; font-weight: 600;">
                      ${date.available ? '✅' : '❌'} ${date.label}
                    </p>
                  </div>
                `).join('')}
              </div>

              <div style="background: #DBEAFE; border-radius: 12px; padding: 20px; text-align: center;">
                <p style="color: #1E40AF; margin: 0; font-size: 15px; font-weight: 600;">
                  📬 On te tiendra au courant dès que la date sera confirmée !
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; margin: 0 0 10px 0; font-size: 14px;">
                Créé avec ❤️ par Synkro
              </p>
              <p style="color: #9CA3AF; margin: 0; font-size: 12px;">
                Trouve la date parfaite en 1 minute
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getDateConfirmedEmail(data) {
  const { eventType, finalDate, organizerName, participants, location, calendarLink } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Date confirmée</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🎉</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">Synkro</h1>
            </td>
          </tr>
          <tr>
            <td style="background: white; padding: 40px;">
              <h2 style="color: #1E1B4B; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">
                🎉 La date est confirmée !
              </h2>
              
              <p style="color: #6B7280; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                Super nouvelle ! La date de l'événement <strong>"${eventType}"</strong> est confirmée ! 🎊
              </p>

              <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 2px solid #8B5CF6;">
                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">
                  📅 Date & Heure
                </p>
                <p style="color: #8B5CF6; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">
                  ${finalDate}
                </p>
                
                ${location ? `
                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">
                  📍 Lieu
                </p>
                <p style="color: #1E1B4B; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
                  ${location}
                </p>
                ` : ''}
                
                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">
                  👥 Participants
                </p>
                <p style="color: #1E1B4B; margin: 0; font-size: 15px; font-weight: 500;">
                  ${participants.join(', ')}
                </p>
              </div>

              ${calendarLink ? `
              <a href="${calendarLink}" style="display: block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 20px;">
                📅 Ajouter à mon calendrier
              </a>
              ` : ''}

              <div style="background: #FEF3C7; border-radius: 12px; padding: 16px; border-left: 4px solid #F59E0B;">
                <p style="color: #92400E; margin: 0; font-size: 14px; line-height: 1.6;">
                  💡 <strong>Rappel :</strong> Tu recevras un email de rappel 24h avant l'événement !
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; margin: 0 0 10px 0; font-size: 14px;">
                Créé avec ❤️ par Synkro
              </p>
              <p style="color: #9CA3AF; margin: 0; font-size: 12px;">
                Trouve la date parfaite en 1 minute
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
