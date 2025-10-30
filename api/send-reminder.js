// /api/send-reminder.js
// API pour envoyer un email de rappel aux participants qui n'ont pas encore voté

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
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    console.log('📧 Sending reminder for event:', eventId);

    // Configuration
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!AIRTABLE_TOKEN || !BASE_ID || !TABLE_ID) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!RESEND_API_KEY) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // 1. Rechercher l'événement
    const searchUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula={eventId}='${eventId}'`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch event' });
    }

    const searchData = await searchResponse.json();

    if (!searchData.records || searchData.records.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const record = searchData.records[0];
    const event = record.fields;

    // 2. Calculer le nombre de non-votants
    const expectedParticipants = event.expectedParticipants || 0;
    const totalResponded = event.totalResponded || 0;
    const remainingParticipants = expectedParticipants - totalResponded;

    if (remainingParticipants <= 0) {
      return res.status(200).json({
        success: true,
        message: 'All participants have already voted',
        sent: 0
      });
    }

    // 3. Créer le lien participant
    const participantLink = `https://synkro-app-bice.vercel.app/participant?id=${eventId}`;

    // 4. Envoyer l'email à l'organisateur (qui pourra transférer)
    const emailHTML = getReminderEmailHTML({
      eventType: event.type,
      organizerName: event.organizerName,
      location: event.location || null,
      dates: JSON.parse(event.dates || '[]'),
      totalResponded,
      expectedParticipants,
      remainingParticipants,
      participantLink
    });

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Synkro <onboarding@resend.dev>',
        to: event.organizerEmail,
        subject: `⏰ Rappel : ${remainingParticipants} participant(s) n'ont pas encore voté`,
        html: emailHTML
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Failed to send reminder email:', errorText);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    console.log('✅ Reminder email sent to organizer');

    return res.status(200).json({
      success: true,
      message: 'Reminder email sent successfully',
      sent: 1,
      remainingParticipants
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// Template d'email de rappel
function getReminderEmailHTML(data) {
  const { 
    eventType, 
    organizerName, 
    location, 
    dates, 
    totalResponded, 
    expectedParticipants,
    remainingParticipants,
    participantLink 
  } = data;

  const percentage = Math.round((totalResponded / expectedParticipants) * 100);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel : votes manquants</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); padding: 40px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 16px;">⏰</div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                Petite relance !
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
                Il reste des votes à recueillir
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              
              <p style="color: #6B7280; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                Salut ${organizerName} ! 👋<br><br>
                Voici un petit rappel pour ton événement <strong>"${eventType}"</strong>.
              </p>

              <!-- Stats -->
              <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #F59E0B;">
                <div style="text-align: center; margin-bottom: 16px;">
                  <div style="font-size: 48px; color: #92400E; font-weight: 800; line-height: 1;">
                    ${percentage}%
                  </div>
                  <div style="font-size: 14px; color: #92400E; font-weight: 600; margin-top: 4px;">
                    de participation
                  </div>
                </div>
                <div style="text-align: center; padding-top: 16px; border-top: 1px solid #FCD34D;">
                  <p style="margin: 0; font-size: 16px; color: #92400E;">
                    <strong>${totalResponded}</strong> votes reçus sur <strong>${expectedParticipants}</strong> attendus
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #92400E;">
                    ${remainingParticipants} participant(s) n'ont pas encore voté
                  </p>
                </div>
              </div>

              <!-- Event info -->
              <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 2px solid #E9D5FF;">
                <p style="color: #1E1B4B; margin: 0 0 12px 0; font-size: 16px; font-weight: 700;">
                  📅 ${eventType}
                </p>
                ${location ? `
                  <p style="color: #6B7280; margin: 0 0 12px 0; font-size: 14px;">
                    📍 ${location}
                  </p>
                ` : ''}
                <p style="color: #6B7280; margin: 0; font-size: 13px;">
                  <strong>Dates proposées :</strong><br>
                  ${dates.map(d => d.label).join('<br>')}
                </p>
              </div>

              <!-- Action -->
              <div style="background: #DBEAFE; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #3B82F6;">
                <p style="color: #1E40AF; margin: 0 0 16px 0; font-size: 15px; font-weight: 600;">
                  💡 Comment relancer les derniers participants ?
                </p>
                <p style="color: #1E40AF; margin: 0; font-size: 14px; line-height: 1.6;">
                  1️⃣ Copie le lien ci-dessous<br>
                  2️⃣ Envoie-le par WhatsApp, email ou SMS<br>
                  3️⃣ Encourage-les à voter rapidement !
                </p>
              </div>

              <!-- Link -->
              <a href="${participantLink}" style="display: block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; padding: 18px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 16px;">
                🔗 Lien à partager
              </a>

              <div style="background: #FEF3C7; border-radius: 8px; padding: 12px; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #92400E;">
                  <strong>📋 Copie ce lien :</strong><br>
                  <code style="background: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${participantLink}</code>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; margin: 0 0 8px 0; font-size: 14px;">
                Créé avec ❤️ par Synkro
              </p>
              <p style="color: #9CA3AF; margin: 0; font-size: 12px;">
                <a href="https://synkro-app-bice.vercel.app" style="color: #8B5CF6; text-decoration: none;">synkro-app-bice.vercel.app</a>
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
