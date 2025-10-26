// /api/update-event.js
// API Serverless pour sauvegarder les votes des participants dans Airtable
// ✅ Version SÉCURISÉE avec variables d'environnement
// ✅ Envoie des emails aux participants

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
    const { eventId, airtableId, participant, availabilities } = req.body;

    if (!eventId || !airtableId || !participant || !availabilities) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['eventId', 'airtableId', 'participant', 'availabilities']
      });
    }

    // 🔐 RÉCUPÉRATION DES VARIABLES D'ENVIRONNEMENT
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

    // Vérification que les variables existent
    if (!AIRTABLE_TOKEN || !BASE_ID || !TABLE_ID) {
      console.error('Missing environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing Airtable credentials'
      });
    }

    // 1. Récupérer l'événement actuel
    const getResponse = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${airtableId}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!getResponse.ok) {
      console.error('Failed to fetch event:', await getResponse.text());
      return res.status(500).json({ error: 'Failed to fetch event from Airtable' });
    }

    const eventRecord = await getResponse.json();
    const dates = JSON.parse(eventRecord.fields.dates || '[]');
    const participants = JSON.parse(eventRecord.fields.participants || '[]');

    // 2. Vérifier si le participant a déjà voté
    const existingParticipantIndex = participants.findIndex(
      p => p.name.toLowerCase() === participant.name.toLowerCase()
    );

    const participantData = {
      name: participant.name,
      availabilities: availabilities,
      votedAt: new Date().toISOString()
    };

    if (existingParticipantIndex !== -1) {
      // Mettre à jour le participant existant
      participants[existingParticipantIndex] = participantData;
    } else {
      // Ajouter nouveau participant
      participants.push(participantData);
    }

    // 3. Recalculer les votes pour chaque date
    dates.forEach(date => {
      date.votes = 0;
      date.voters = [];

      participants.forEach(p => {
        if (p.availabilities[date.id] === true) {
          date.votes++;
          date.voters.push(p.name);
        }
      });
    });

    // 4. Mettre à jour dans Airtable
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${airtableId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            dates: JSON.stringify(dates),
            participants: JSON.stringify(participants),
            totalResponded: participants.length
          }
        })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update event:', errorText);
      return res.status(500).json({ 
        error: 'Failed to update event in Airtable',
        details: errorText
      });
    }

    const updatedRecord = await updateResponse.json();

    // 🆕 ENVOI EMAIL AU PARTICIPANT (Direct Resend)
    if (participant.email) {
      try {
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        
        if (!RESEND_API_KEY) {
          console.error('⚠️ RESEND_API_KEY not configured');
        } else {
          // Préparer les dates votées pour l'email
          const votedDates = dates.map(date => ({
            label: date.label,
            available: availabilities[date.id] === true
          }));

          // Générer le HTML de l'email
          const emailHTML = getParticipantVotedEmail({
            participantName: participant.name,
            eventType: eventRecord.fields.type,
            organizerName: eventRecord.fields.organizerName,
            votedDates: votedDates
          });
          
          // Envoyer directement via Resend
          console.log('📤 Sending email to Resend API (participant)...');
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Synkro <onboarding@resend.dev>',
              to: [participant.email],
              subject: '✅ Tes disponibilités sont enregistrées !',
              html: emailHTML
            })
          });
          
          console.log('📥 Resend API response status:', resendResponse.status);
          
          if (resendResponse.ok) {
            const resendResult = await resendResponse.json();
            console.log('✅ Email sent to participant:', participant.email, '- Email ID:', resendResult.id);
          } else {
            const errorText = await resendResponse.text();
            console.error('❌ Resend API error:', errorText);
          }
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send email to participant:', emailError.message);
      }
    }

    // 🆕 VÉRIFIER SI UNE DATE ATTEINT LA MAJORITÉ
    // Si expectedParticipants est défini et qu'une date atteint 70%+
    if (eventRecord.fields.expectedParticipants) {
      const bestDate = dates.reduce((prev, current) => 
        current.votes > prev.votes ? current : prev
      );
      
      const percentage = (bestDate.votes / eventRecord.fields.expectedParticipants) * 100;
      
      // Si majorité atteinte (70%+) et pas déjà notifié
      if (percentage >= 70 && !eventRecord.fields.dateConfirmedEmailSent) {
        try {
          // Collecter tous les emails (organisateur + participants)
          const allEmails = [];
          
          // Ajouter l'email de l'organisateur
          if (eventRecord.fields.organizerEmail) {
            allEmails.push(eventRecord.fields.organizerEmail);
          }
          
          // Ajouter les emails des participants qui ont voté
          participants.forEach(p => {
            if (p.email && !allEmails.includes(p.email)) {
              allEmails.push(p.email);
            }
          });

          // Envoyer l'email à tous (Direct Resend)
          const RESEND_API_KEY = process.env.RESEND_API_KEY;
          
          if (!RESEND_API_KEY) {
            console.error('⚠️ RESEND_API_KEY not configured');
          } else {
            for (const email of allEmails) {
              try {
                // Générer le HTML de l'email
                const emailHTML = getDateConfirmedEmail({
                  eventType: eventRecord.fields.type,
                  finalDate: bestDate.label,
                  organizerName: eventRecord.fields.organizerName,
                  participants: [eventRecord.fields.organizerName, ...bestDate.voters],
                  location: eventRecord.fields.location || null,
                  calendarLink: null
                });
                
                // Envoyer directement via Resend
                console.log('📤 Sending date confirmation email to Resend API...');
                const resendResponse = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    from: 'Synkro <onboarding@resend.dev>',
                    to: [email],
                    subject: '🎉 La date de ton événement est confirmée !',
                    html: emailHTML
                  })
                });
                
                console.log('📥 Resend API response status:', resendResponse.status);
                
                if (resendResponse.ok) {
                  const resendResult = await resendResponse.json();
                  console.log('✅ Date confirmation email sent to:', email, '- Email ID:', resendResult.id);
                } else {
                  const errorText = await resendResponse.text();
                  console.error('❌ Resend API error for', email, ':', errorText);
                }
              } catch (emailError) {
                console.error('⚠️ Failed to send date confirmation email to:', email, '- Error:', emailError.message);
              }
            }
          }
          
          // Marquer comme notifié dans Airtable
          await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${airtableId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: {
                dateConfirmedEmailSent: true
              }
            })
          });
          
        } catch (emailError) {
          console.error('⚠️ Failed to send date confirmation emails:', emailError.message);
        }
      }
    }
    
    // 5. Retourner les données mises à jour
    return res.status(200).json({
      success: true,
      event: {
        id: eventRecord.fields.eventId,
        airtableId: updatedRecord.id,
        type: updatedRecord.fields.type,
        organizerName: updatedRecord.fields.organizerName,
        organizerEmail: updatedRecord.fields.organizerEmail,
        location: updatedRecord.fields.location,
        expectedParticipants: updatedRecord.fields.expectedParticipants,
        dates: JSON.parse(updatedRecord.fields.dates),
        participants: JSON.parse(updatedRecord.fields.participants),
        totalResponded: updatedRecord.fields.totalResponded,
        createdAt: updatedRecord.fields.createdAt,
        status: updatedRecord.fields.status || 'active'
      }
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// ========================================
// TEMPLATES D'EMAILS
// ========================================

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
              <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 20px;">
                <span style="font-size: 40px; line-height: 80px;">✅</span>
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
              <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 20px;">
                <span style="font-size: 40px; line-height: 80px;">🎉</span>
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

              <div style="background: #FEF3C7; border-radius: 12px; padding: 16px; border-left: 4px solid #F59E0B;">
                <p style="color: #92400E; margin: 0; font-size: 14px; line-height: 1.6;">
                  💡 <strong>Note :</strong> N'oublie pas d'ajouter cet événement à ton calendrier !
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
