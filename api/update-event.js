// API : Mettre à jour un événement avec les votes d'un participant + envoyer emails
// ✅ VERSION CORRIGÉE - Gère correctement les votes modifiés

export default async function handler(req, res) {
  // Autoriser uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId, participantName, participantEmail, availabilities } = req.body;

  // Validation
  if (!eventId || !participantName || !availabilities) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Normaliser participantEmail (peut être undefined, null, ou string vide)
  const normalizedEmail = participantEmail && participantEmail.trim() !== '' ? participantEmail.trim() : null;
  
  // Normaliser le nom du participant (trim + lowercase pour comparaison)
  const normalizedName = participantName.trim();

  // Configuration Airtable
  const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN || process.env.VITE_AIRTABLE_API_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_ID = 'Synkro_Events';

  if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // 1. 🔍 RECHERCHER l'événement par son champ "eventId"
    console.log('🔍 Searching for event:', eventId);
    const searchResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula={eventId}="${eventId}"`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Failed to search event:', errorText);
      throw new Error('Failed to search event');
    }

    const searchData = await searchResponse.json();
    
    // Vérifier si l'événement existe
    if (!searchData.records || searchData.records.length === 0) {
      console.error('Event not found with eventId:', eventId);
      return res.status(404).json({ error: 'Event not found' });
    }

    // Récupérer le record Airtable (avec son vrai record ID)
    const airtableRecord = searchData.records[0];
    const airtableRecordId = airtableRecord.id;
    const event = airtableRecord.fields;

    console.log('✅ Event found:', eventId, '→ Airtable Record ID:', airtableRecordId);

    // 2. Mettre à jour les données de l'événement
    const existingParticipants = event.participants ? JSON.parse(event.participants) : [];
    const existingDates = event.dates ? JSON.parse(event.dates) : [];

    // 🔧 CORRECTION : Vérifier si le participant a déjà voté (comparaison normalisée)
    const existingParticipantIndex = existingParticipants.findIndex(
      p => p.name.trim().toLowerCase() === normalizedName.toLowerCase()
    );

    const isUpdate = existingParticipantIndex !== -1;

    console.log(`📊 Participant "${normalizedName}": ${isUpdate ? 'UPDATE' : 'NEW'}`);

    const newParticipant = {
      name: normalizedName,
      email: normalizedEmail || '',
      availabilities: availabilities,
      votedAt: new Date().toISOString()
    };

    let updatedParticipants;
    if (isUpdate) {
      // ✅ Mise à jour d'un vote existant (REMPLACEMENT)
      console.log(`🔄 Updating existing participant at index ${existingParticipantIndex}`);
      updatedParticipants = [...existingParticipants];
      updatedParticipants[existingParticipantIndex] = newParticipant;
    } else {
      // ✅ Nouveau participant (AJOUT)
      console.log('➕ Adding new participant');
      updatedParticipants = [...existingParticipants, newParticipant];
    }

    // Recalculer les votes par date
    const updatedDates = existingDates.map(date => ({
      ...date,
      votes: 0,
      voters: []
    }));

    updatedParticipants.forEach(participant => {
      Object.keys(participant.availabilities).forEach(dateLabel => {
        if (participant.availabilities[dateLabel]) {
          const dateIndex = updatedDates.findIndex(d => d.label === dateLabel);
          if (dateIndex !== -1) {
            updatedDates[dateIndex].votes += 1;
            updatedDates[dateIndex].voters.push(participant.name);
          }
        }
      });
    });

    const totalResponded = updatedParticipants.length;

    console.log(`📈 Total participants: ${totalResponded}`);

    // 3. ✅ Sauvegarder dans Airtable AVEC LE BON RECORD ID
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${airtableRecordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            participants: JSON.stringify(updatedParticipants),
            dates: JSON.stringify(updatedDates),
            totalResponded: totalResponded
          }
        })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update event:', errorText);
      throw new Error('Failed to update event');
    }

    console.log('✅ Event updated successfully');

    // 4. 📧 ENVOI EMAIL CONFIRMATION PARTICIPANT (seulement si email fourni)
    if (normalizedEmail) {
      await sendParticipantConfirmationEmail({
        participantName: normalizedName,
        participantEmail: normalizedEmail,
        eventType: event.type,
        organizerName: event.organizerName,
        location: event.location,
        dates: existingDates,
        availabilities,
        eventId,
        isUpdate // ✅ Indiquer si c'est une mise à jour
      });
    }

    // 5. 🎉 VÉRIFIER SI 70% ATTEINT (Email célébration)
    const expectedParticipants = event.expectedParticipants || 0;
    const previousPercentage = event.previousParticipationRate || 0;
    const currentPercentage = expectedParticipants > 0 
      ? Math.round((totalResponded / expectedParticipants) * 100) 
      : 0;

    // Si on vient d'atteindre 70% (et qu'on n'était pas déjà à 70% avant)
    if (currentPercentage >= 70 && previousPercentage < 70) {
      // Trouver la date gagnante
      const bestDate = updatedDates.reduce((prev, current) => 
        current.votes > prev.votes ? current : prev
      );

      // Envoyer email de célébration à tous les participants
      await sendCelebrationEmail({
        participants: updatedParticipants,
        eventType: event.type,
        organizerName: event.organizerName,
        organizerEmail: event.organizerEmail,
        location: event.location,
        bestDate,
        totalResponded,
        expectedParticipants,
        percentage: currentPercentage
      });

      // Sauvegarder qu'on a atteint 70%
      await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${airtableRecordId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              previousParticipationRate: currentPercentage
            }
          })
        }
      );
    }

    // 6. Retourner l'événement mis à jour pour le frontend
    return res.status(200).json({
      success: true,
      message: isUpdate ? 'Vote mis à jour avec succès' : 'Vote enregistré avec succès',
      isUpdate: isUpdate,
      celebrationSent: currentPercentage >= 70 && previousPercentage < 70,
      event: {
        ...event,
        participants: updatedParticipants,
        dates: updatedDates,
        totalResponded: totalResponded
      }
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ 
      error: 'Failed to update event',
      details: error.message 
    });
  }
}

// 📧 FONCTION : Email de confirmation participant
async function sendParticipantConfirmationEmail({
  participantName,
  participantEmail,
  eventType,
  organizerName,
  location,
  dates,
  availabilities,
  eventId,
  isUpdate = false
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return;
  }

  // Récupérer les dates disponibles
  const availableDates = dates.filter(d => availabilities[d.label]);
  
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isUpdate ? 'Vote mis à jour' : 'Vote confirmé'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  
  <table role="presentation" style="max-width: 600px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px; text-align: center;">
        <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 48px;">
          ${isUpdate ? '🔄' : '✅'}
        </div>
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          ${isUpdate ? 'Vote mis à jour !' : 'Merci d\'avoir voté !'}
        </h1>
        <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px;">
          ${eventType}
        </p>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        
        <p style="color: #6B7280; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
          Salut ${participantName} ! 👋<br><br>
          ${isUpdate 
            ? 'Ton vote a été <strong>mis à jour</strong> avec succès pour l\'événement <strong>"' + eventType + '"</strong> organisé par ' + organizerName + '.' 
            : 'Merci d\'avoir voté pour l\'événement <strong>"' + eventType + '"</strong> organisé par ' + organizerName + '.'}
        </p>

        ${location ? `
        <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); padding: 16px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #8B5CF6;">
          <p style="margin: 0; font-size: 14px; color: #8B5CF6; font-weight: 700;">
            📍 Lieu : ${location}
          </p>
        </div>
        ` : ''}

        <!-- Dates disponibles -->
        <div style="background: #F9FAFB; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #1E1B4B; font-weight: 700;">
            ✅ Tes disponibilités
          </h3>
          ${availableDates.length > 0 ? `
            <div style="display: grid; gap: 8px;">
              ${availableDates.map(d => `
                <div style="background: white; padding: 12px; border-radius: 8px; border: 2px solid #10B981;">
                  <span style="color: #059669; font-weight: 600;">${d.label}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="margin: 0; color: #EF4444; font-weight: 600;">
              ❌ Aucune disponibilité sélectionnée
            </p>
          `}
        </div>

        <!-- Info modification -->
        ${isUpdate ? `
        <div style="background: #DBEAFE; border-radius: 12px; padding: 16px; border-left: 4px solid #3B82F6; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #1E40AF; line-height: 1.6;">
            <strong>ℹ️ Note :</strong> Ton vote précédent a été remplacé par ces nouvelles disponibilités.
          </p>
        </div>
        ` : ''}

        <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; padding: 20px; border: 2px solid #FDE68A;">
          <p style="margin: 0; font-size: 14px; color: #92400E; line-height: 1.6; text-align: center;">
            💡 <strong>Tu peux modifier ton vote</strong> à tout moment en revotant avec le même nom !
          </p>
        </div>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0; font-size: 12px; color: #6B7280; line-height: 1.6;">
          Cet email a été envoyé par <strong style="color: #8B5CF6;">Synkro</strong><br>
          La solution simple pour organiser vos événements<br>
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
        to: participantEmail,
        subject: `${isUpdate ? '🔄 Vote mis à jour' : '✅ Vote confirmé'} : ${eventType}`,
        html: emailHtml
      })
    });

    if (!response.ok) {
      console.error('Failed to send participant confirmation email:', await response.text());
    } else {
      console.log(`✅ ${isUpdate ? 'Update' : 'Confirmation'} email sent to:`, participantEmail);
    }
  } catch (error) {
    console.error('Error sending participant confirmation email:', error);
  }
}

// 🎉 FONCTION : Email de célébration (70% atteint)
async function sendCelebrationEmail({
  participants,
  eventType,
  organizerName,
  organizerEmail,
  location,
  bestDate,
  totalResponded,
  expectedParticipants,
  percentage
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return;
  }

  // Liste des emails (participants + organisateur)
  const allEmails = [
    organizerEmail,
    ...participants.filter(p => p.email).map(p => p.email)
  ].filter(email => email); // Filtrer les emails vides

  if (allEmails.length === 0) {
    console.log('No emails to send celebration to');
    return;
  }

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎊 Super nouvelle !</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%); min-height: 100vh; padding: 40px 20px;">
  
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(139, 92, 246, 0.3);">
    
    <!-- Header avec confettis -->
    <tr>
      <td style="background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); padding: 40px; text-align: center; position: relative;">
        <div style="font-size: 72px; margin-bottom: 16px;">
          🎊
        </div>
        <h1 style="margin: 0; font-size: 36px; color: white; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          Super nouvelle !
        </h1>
        <p style="margin: 12px 0 0 0; font-size: 18px; color: rgba(255,255,255,0.95); font-weight: 600;">
          La majorité a voté ! 🎉
        </p>
      </td>
    </tr>

    <!-- Contenu -->
    <tr>
      <td style="padding: 40px;">
        
        <!-- Stats impressionnantes -->
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 32px; border-radius: 16px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);">
            <div style="font-size: 64px; color: white; font-weight: 800; line-height: 1; margin-bottom: 8px;">
              ${percentage}%
            </div>
            <div style="font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 600;">
              ${totalResponded} / ${expectedParticipants} participants ont voté !
            </div>
          </div>
        </div>

        <!-- Info événement -->
        <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border: 2px solid #E9D5FF;">
          <div style="font-size: 14px; color: #8B5CF6; font-weight: 700; margin-bottom: 8px;">
            🎯 ${eventType}
          </div>
          <div style="font-size: 20px; color: #1E1B4B; font-weight: 700; margin-bottom: 8px;">
            Organisé par ${organizerName}
          </div>
          ${location ? `
            <div style="font-size: 14px; color: #8B5CF6; font-weight: 600;">
              📍 ${location}
            </div>
          ` : ''}
        </div>

        <!-- Date gagnante -->
        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 20px; color: #1E1B4B; font-weight: 700; margin: 0 0 16px 0; text-align: center;">
            🏆 Date favorite
          </h2>
          <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 24px; border-radius: 12px; text-align: center; border: 3px solid #FCD34D;">
            <div style="font-size: 28px; color: #92400E; font-weight: 800; margin-bottom: 8px;">
              ${bestDate.label}
            </div>
            <div style="font-size: 16px; color: #92400E; font-weight: 600;">
              ${bestDate.votes} vote${bestDate.votes > 1 ? 's' : ''} 
            </div>
            ${bestDate.voters && bestDate.voters.length > 0 ? `
              <div style="font-size: 13px; color: #92400E; margin-top: 12px; padding-top: 12px; border-top: 1px solid #FCD34D;">
                👥 ${bestDate.voters.join(', ')}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Message motivant -->
        <div style="background: linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%); padding: 20px; border-radius: 12px; margin-bottom: 32px; text-align: center;">
          <p style="margin: 0; font-size: 16px; color: #1E40AF; font-weight: 600; line-height: 1.6;">
            ${totalResponded < expectedParticipants 
              ? `💪 Plus que <strong>${expectedParticipants - totalResponded}</strong> vote${expectedParticipants - totalResponded > 1 ? 's' : ''} pour atteindre 100% !`
              : `🎯 <strong>100% de participation !</strong> Incroyable !`
            }
          </p>
        </div>

        <!-- Appel à l'action -->
        ${totalResponded < expectedParticipants ? `
          <div style="background: #FEF3C7; padding: 20px; border-radius: 12px; border: 2px solid #FDE68A;">
            <p style="margin: 0; font-size: 14px; color: #92400E; line-height: 1.6; text-align: center;">
              📣 <strong>Besoin d'un dernier coup de pouce ?</strong><br>
              Relance les derniers participants pour confirmer la date définitivement !
            </p>
          </div>
        ` : ''}

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #1E1B4B; font-weight: 600;">
          ✨ Félicitations pour cette belle mobilisation !
        </p>
        <p style="margin: 0; font-size: 12px; color: #6B7280; line-height: 1.6;">
          Cet email a été envoyé par <strong style="color: #8B5CF6;">Synkro</strong><br>
          <a href="https://synkro-app-bice.vercel.app" style="color: #8B5CF6; text-decoration: none;">synkro-app-bice.vercel.app</a>
        </p>
      </td>
    </tr>

  </table>

</body>
</html>
  `;

  try {
    // Envoyer l'email à tous
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Synkro <onboarding@resend.dev>',
        to: allEmails,
        subject: `🎊 Super nouvelle ! La majorité a voté pour : ${eventType}`,
        html: emailHtml
      })
    });

    if (!response.ok) {
      console.error('Failed to send celebration email:', await response.text());
    } else {
      console.log('🎉 Celebration email sent to:', allEmails.length, 'recipients');
    }
  } catch (error) {
    console.error('Error sending celebration email:', error);
  }
}
