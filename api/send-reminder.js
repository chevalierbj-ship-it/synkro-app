// API : Relancer les participants qui n'ont pas encore voté

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ error: 'Missing eventId' });
  }

  // Configuration Airtable
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // 1. Récupérer l'événement
    const getResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${eventId}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!getResponse.ok) {
      throw new Error('Event not found');
    }

    const eventData = await getResponse.json();
    const event = eventData.fields;

    // 2. Identifier les non-votants
    // On n'a pas de liste complète des invités dans Airtable actuellement
    // Donc on va simplement envoyer un email générique à l'organisateur
    // avec le lien à partager

    const participantLink = `${process.env.VERCEL_URL || 'https://getsynkro.com'}/participant?id=${eventId}`;
    const organizerEmail = event.organizerEmail;

    if (!organizerEmail) {
      return res.status(400).json({ error: 'No organizer email found' });
    }

    const totalResponded = event.totalResponded || 0;
    const expectedParticipants = event.expectedParticipants || 0;
    const remaining = Math.max(0, expectedParticipants - totalResponded);

    // 3. Envoyer email de relance à l'organisateur
    await sendReminderToOrganizer({
      organizerName: event.organizerName,
      organizerEmail: organizerEmail,
      eventType: event.type,
      location: event.location,
      participantLink,
      totalResponded,
      expectedParticipants,
      remaining
    });

    return res.status(200).json({
      success: true,
      message: 'Email de relance envoyé à l\'organisateur',
      remaining
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    return res.status(500).json({ 
      error: 'Failed to send reminder',
      details: error.message 
    });
  }
}

// 📣 FONCTION : Email de relance pour l'organisateur
async function sendReminderToOrganizer({
  organizerName,
  organizerEmail,
  eventType,
  location,
  participantLink,
  totalResponded,
  expectedParticipants,
  remaining
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return;
  }

  const percentage = expectedParticipants > 0 
    ? Math.round((totalResponded / expectedParticipants) * 100) 
    : 0;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relance des participants</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%); min-height: 100vh; padding: 40px 20px;">
  
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(139, 92, 246, 0.3);">
    
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); padding: 40px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 16px;">
          📣
        </div>
        <h1 style="margin: 0; font-size: 32px; color: white; font-weight: 800;">
          Petit coup de pouce ?
        </h1>
        <p style="margin: 12px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">
          Relance tes participants facilement
        </p>
      </td>
    </tr>

    <!-- Contenu -->
    <tr>
      <td style="padding: 40px;">
        
        <!-- Salutation -->
        <p style="font-size: 18px; color: #1E1B4B; margin: 0 0 24px 0;">
          Salut <strong>${organizerName}</strong> ! 👋
        </p>

        <!-- Info événement -->
        <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border: 2px solid #E9D5FF;">
          <div style="font-size: 14px; color: #8B5CF6; font-weight: 700; margin-bottom: 8px;">
            🎯 ${eventType}
          </div>
          ${location ? `
            <div style="font-size: 14px; color: #8B5CF6; font-weight: 600; margin-top: 4px;">
              📍 ${location}
            </div>
          ` : ''}
        </div>

        <!-- Statistiques -->
        <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; text-align: center;">
          <div style="font-size: 48px; color: #92400E; font-weight: 800; line-height: 1; margin-bottom: 8px;">
            ${percentage}%
          </div>
          <div style="font-size: 16px; color: #92400E; font-weight: 600;">
            ${totalResponded} / ${expectedParticipants} participants
          </div>
          ${remaining > 0 ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #FCD34D;">
              <div style="font-size: 18px; color: #92400E; font-weight: 700;">
                📢 ${remaining} personne${remaining > 1 ? 's' : ''} à relancer
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Message principal -->
        <div style="margin-bottom: 32px;">
          <p style="font-size: 16px; color: #6B7280; line-height: 1.8; margin: 0 0 20px 0;">
            Il reste quelques participants qui n'ont pas encore voté. 
            Pas de panique, c'est normal ! 😊
          </p>
          <p style="font-size: 16px; color: #6B7280; line-height: 1.8; margin: 0;">
            Voici un <strong style="color: #1E1B4B;">message tout prêt</strong> que tu peux leur envoyer :
          </p>
        </div>

        <!-- Message à copier -->
        <div style="background: #F9FAFB; border: 2px dashed #D1D5DB; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 15px; color: #1E1B4B; line-height: 1.8; font-style: italic;">
            "Hey ! 👋<br><br>
            J'organise <strong>${eventType}</strong> et j'attends encore quelques réponses pour choisir la meilleure date.<br><br>
            Tu peux voter en 30 secondes ici : ${participantLink}<br><br>
            Merci ! 🙏"
          </p>
        </div>

        <!-- Bouton copier -->
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${participantLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);">
            📋 Copier le lien participant
          </a>
        </div>

        <!-- Tips -->
        <div style="background: linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%); padding: 20px; border-radius: 12px;">
          <div style="font-size: 14px; color: #1E40AF; font-weight: 700; margin-bottom: 12px;">
            💡 <strong>Tips pour relancer efficacement</strong>
          </div>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #1E40AF; line-height: 1.8;">
            <li>Envoie le message par <strong>WhatsApp</strong> ou <strong>SMS</strong></li>
            <li>Mentionne une <strong>deadline</strong> pour créer l'urgence</li>
            <li>Rappelle les <strong>enjeux</strong> de l'événement</li>
            <li>Reste <strong>sympa</strong> et décontracté 😊</li>
          </ul>
        </div>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0; font-size: 12px; color: #6B7280; line-height: 1.6;">
          Cet email a été envoyé par <strong style="color: #8B5CF6;">Synkro</strong><br>
          La solution simple pour organiser vos événements<br>
          <a href="https://getsynkro.com" style="color: #8B5CF6; text-decoration: none;">getsynkro.com</a>
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
        to: organizerEmail,
        subject: `📣 Relance tes participants : ${eventType}`,
        html: emailHtml
      })
    });

    if (!response.ok) {
      console.error('Failed to send reminder email:', await response.text());
    } else {
      console.log('📣 Reminder email sent to organizer:', organizerEmail);
    }
  } catch (error) {
    console.error('Error sending reminder email:', error);
  }
}
