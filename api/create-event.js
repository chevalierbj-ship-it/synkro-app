// /api/create-event.js
// API Serverless pour créer un événement dans Airtable
// ✅ Version SÉCURISÉE avec variables d'environnement
// ✅ Utilise l'ID de la table au lieu du nom
// ✅ Envoie un email à l'organisateur

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const eventData = req.body;

    // Validation
    if (!eventData.type || !eventData.organizerName || !eventData.dates) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['type', 'organizerName', 'dates']
      });
    }

    // 🔐 RÉCUPÉRATION DES VARIABLES D'ENVIRONNEMENT
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

    // Vérification que les variables existent
    if (!AIRTABLE_TOKEN || !BASE_ID || !TABLE_ID) {
      console.error('Missing environment variables');
      console.error('AIRTABLE_TOKEN:', AIRTABLE_TOKEN ? 'Present' : 'Missing');
      console.error('BASE_ID:', BASE_ID ? 'Present' : 'Missing');
      console.error('TABLE_ID:', TABLE_ID ? 'Present' : 'Missing');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing Airtable credentials'
      });
    }

    // Générer un ID unique pour l'événement
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Préparer les données pour Airtable
    const airtableData = {
      fields: {
        eventId: eventId,
        type: eventData.type,
        organizerName: eventData.organizerName,
        organizerEmail: eventData.organizerEmail || '',
        location: eventData.location || '',
        eventSchedule: eventData.eventSchedule || '',
        expectedParticipants: eventData.expectedParticipants || 0,
        dates: JSON.stringify(eventData.dates),
        participants: JSON.stringify([]),
        totalResponded: 0,
        status: 'active'
      }
    };

    console.log('Creating event with ID:', eventId);
    console.log('Using BASE_ID:', BASE_ID);
    console.log('Using TABLE_ID:', TABLE_ID);

    // Créer l'événement dans Airtable avec l'ID de la table
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(airtableData)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable error:', errorText);
      console.error('Status:', response.status);
      return res.status(500).json({ 
        error: 'Failed to create event in Airtable',
        details: errorText,
        status: response.status
      });
    }

    const result = await response.json();
    console.log('Event created successfully:', result.id);

    // 🆕 ENVOI EMAIL À L'ORGANISATEUR (Direct Resend)
    if (eventData.organizerEmail) {
      try {
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        
        if (!RESEND_API_KEY) {
          console.error('⚠️ RESEND_API_KEY not configured');
        } else {
          // Construire les liens
          const eventLink = `https://synkro-app-bice.vercel.app/participant?id=${eventId}`;
          const adminLink = `https://synkro-app-bice.vercel.app/admin?id=${eventId}`;
          
          // Générer le HTML de l'email
          const emailHTML = getOrganizerCreatedEmail({
            eventType: eventData.type,
            eventLink: eventLink,
            adminLink: adminLink,
            organizerName: eventData.organizerName,
            dates: eventData.dates,
            location: eventData.location || null,
            eventSchedule: eventData.eventSchedule || null
          });
          
          // Envoyer directement via Resend
          console.log('📤 Sending email to Resend API...');
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Synkro <onboarding@resend.dev>',
              to: [eventData.organizerEmail],
              subject: '✅ Ton événement Synkro est créé !',
              html: emailHTML
            })
          });
          
          console.log('📥 Resend API response status:', resendResponse.status);
          
          if (resendResponse.ok) {
            const resendResult = await resendResponse.json();
            console.log('✅ Email sent to organizer:', eventData.organizerEmail, '- Email ID:', resendResult.id);
          } else {
            const errorText = await resendResponse.text();
            console.error('❌ Resend API error:', errorText);
          }
        }
      } catch (emailError) {
        // Ne pas bloquer la création si l'email échoue
        console.error('⚠️ Failed to send email to organizer:', emailError.message);
      }
    }
    
    // Retourner l'ID de l'événement et le lien
    return res.status(200).json({
      success: true,
      eventId: eventId,
      airtableId: result.id,
      participantLink: `https://synkro-app-bice.vercel.app/participant?id=${eventId}`,
      message: 'Event created successfully'
    });

  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// ========================================
// TEMPLATE D'EMAIL ORGANISATEUR
// ========================================

function getOrganizerCreatedEmail(data) {
  const { eventType, eventLink, adminLink, organizerName, dates, location, eventSchedule } = data;
  
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

                ${eventSchedule ? `
                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">
                  📋 Déroulé prévu
                </p>
                <p style="color: #1E1B4B; margin: 0 0 16px 0; font-size: 14px; font-weight: 500; line-height: 1.6;">
                  ${eventSchedule}
                </p>
                ` : ''}

                <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">
                  📆 Dates proposées
                </p>
                <p style="color: #1E1B4B; margin: 0; font-size: 14px; font-weight: 500; line-height: 1.8;">
                  ${dates.map(d => d.label).join('<br>')}
                </p>
              </div>

              <a href="${eventLink}" style="display: block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 16px;">
                📤 Partager avec mes invités
              </a>

              <a href="${adminLink}" style="display: block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                🔐 Accéder à mon dashboard
              </a>

              <div style="background: #FEF3C7; border-radius: 12px; padding: 16px; border-left: 4px solid #F59E0B; margin-bottom: 16px;">
                <p style="color: #92400E; margin: 0; font-size: 14px; line-height: 1.6;">
                  💡 <strong>Astuce :</strong> Copie ce lien et envoie-le par WhatsApp, email ou SMS à tes invités !
                </p>
              </div>

              <div style="background: #DBEAFE; border-radius: 12px; padding: 16px; border-left: 4px solid #3B82F6;">
                <p style="color: #1E40AF; margin: 0; font-size: 14px; line-height: 1.6;">
                  🔐 <strong>Dashboard privé :</strong> Garde le lien du dashboard pour suivre les votes en temps réel ! Ne le partage pas avec tes invités.
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
