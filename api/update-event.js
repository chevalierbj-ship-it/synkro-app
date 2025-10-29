// API : Mettre à jour un événement avec les votes d'un participant + envoyer emails
// ✅ VERSION DEBUG - Avec logs détaillés

export default async function handler(req, res) {
  // Autoriser uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId, participantName, participantEmail, availabilities } = req.body;

  console.log('📥 Request received:', { eventId, participantName, hasEmail: !!participantEmail });

  // Validation
  if (!eventId || !participantName || !availabilities) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Normaliser participantEmail (peut être undefined, null, ou string vide)
  const normalizedEmail = participantEmail && participantEmail.trim() !== '' ? participantEmail.trim() : null;

  // Configuration Airtable
  const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN || process.env.VITE_AIRTABLE_API_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_ID = 'Events';

  if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
    console.error('❌ Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  console.log('🔧 Airtable config:', { 
    baseId: AIRTABLE_BASE_ID, 
    tableId: AIRTABLE_TABLE_ID,
    hasToken: !!AIRTABLE_API_TOKEN 
  });

  try {
    // 1. 🔍 RECHERCHER l'événement par son champ "id" custom
    
    // ✅ Essayer différentes syntaxes de filterByFormula
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula={id}="${eventId}"`;
    
    console.log('🔍 Searching event with URL:', searchUrl);

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Search response status:', searchResponse.status);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ Search failed:', errorText);
      throw new Error(`Failed to search event: ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log('📦 Search results:', { 
      recordsFound: searchData.records?.length || 0,
      records: searchData.records?.map(r => ({ id: r.id, fields: Object.keys(r.fields || {}) }))
    });
    
    // Vérifier si l'événement existe
    if (!searchData.records || searchData.records.length === 0) {
      console.error('❌ Event not found with id:', eventId);
      
      // 🔍 DEBUG: Lister tous les événements pour voir leur structure
      console.log('🔍 Fetching all events to debug...');
      const allEventsResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=3`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (allEventsResponse.ok) {
        const allEventsData = await allEventsResponse.json();
        console.log('📊 Sample events structure:', JSON.stringify(allEventsData.records?.slice(0, 2), null, 2));
      }
      
      return res.status(404).json({ 
        error: 'Event not found',
        eventId: eventId,
        hint: 'Check the logs to see the event structure'
      });
    }

    // Récupérer le record Airtable (avec son vrai record ID)
    const airtableRecord = searchData.records[0];
    const airtableRecordId = airtableRecord.id;
    const event = airtableRecord.fields;

    console.log('✅ Event found!', { 
      eventId, 
      airtableRecordId,
      eventType: event.type,
      organizerName: event.organizerName
    });

    // 2. Mettre à jour les données de l'événement
    const existingParticipants = event.participants ? JSON.parse(event.participants) : [];
    const existingDates = event.dates ? JSON.parse(event.dates) : [];

    console.log('📊 Current data:', {
      participantsCount: existingParticipants.length,
      datesCount: existingDates.length
    });

    // Vérifier si le participant a déjà voté
    const existingParticipantIndex = existingParticipants.findIndex(
      p => p.name.toLowerCase() === participantName.toLowerCase()
    );

    const newParticipant = {
      name: participantName,
      email: normalizedEmail || '',
      availabilities: availabilities,
      votedAt: new Date().toISOString()
    };

    let updatedParticipants;
    if (existingParticipantIndex !== -1) {
      console.log('🔄 Updating existing participant vote');
      updatedParticipants = [...existingParticipants];
      updatedParticipants[existingParticipantIndex] = newParticipant;
    } else {
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

    console.log('📊 Updated data:', {
      totalResponded,
      updatedDatesVotes: updatedDates.map(d => ({ label: d.label, votes: d.votes }))
    });

    // 3. ✅ Sauvegarder dans Airtable AVEC LE BON RECORD ID
    console.log('💾 Saving to Airtable...');
    
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
      console.error('❌ Failed to update event:', errorText);
      throw new Error(`Failed to update event: ${errorText}`);
    }

    console.log('✅ Event updated successfully!');

    // 4. 📧 ENVOI EMAIL CONFIRMATION PARTICIPANT (seulement si email fourni)
    if (normalizedEmail) {
      console.log('📧 Sending confirmation email to:', normalizedEmail);
      await sendParticipantConfirmationEmail({
        participantName,
        participantEmail: normalizedEmail,
        eventType: event.type,
        organizerName: event.organizerName,
        location: event.location,
        dates: existingDates,
        availabilities,
        eventId
      });
    }

    // 5. 🎉 VÉRIFIER SI 70% ATTEINT (Email célébration)
    const expectedParticipants = event.expectedParticipants || 0;
    const previousPercentage = event.previousParticipationRate || 0;
    const currentPercentage = expectedParticipants > 0 
      ? Math.round((totalResponded / expectedParticipants) * 100) 
      : 0;

    console.log('📊 Participation rate:', {
      previous: previousPercentage,
      current: currentPercentage,
      totalResponded,
      expectedParticipants
    });

    // Si on vient d'atteindre 70% (et qu'on n'était pas déjà à 70% avant)
    if (currentPercentage >= 70 && previousPercentage < 70) {
      console.log('🎉 70% reached! Sending celebration emails...');
      
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

    console.log('✅ All done!');

    return res.status(200).json({
      success: true,
      message: 'Vote enregistré avec succès',
      celebrationSent: currentPercentage >= 70 && previousPercentage < 70
    });

  } catch (error) {
    console.error('❌ Error updating event:', error);
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
  eventId
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return;
  }

  // Créer la liste des dates votées
  const votedDates = dates
    .filter(date => availabilities[date.label])
    .map(date => date.label)
    .join(', ');

  const participantLink = `${process.env.VERCEL_URL || 'https://synkro-app-bice.vercel.app'}/participant?id=${eventId}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vote confirmé !</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%); min-height: 100vh; padding: 40px 20px;">
  
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(139, 92, 246, 0.3);">
    
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 12px;">
          ✅
        </div>
        <h1 style="margin: 0; font-size: 32px; color: white; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          Vote confirmé !
        </h1>
        <p style="margin: 12px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 500;">
          Merci ${participantName} ! 🎉
        </p>
      </td>
    </tr>

    <!-- Contenu -->
    <tr>
      <td style="padding: 40px;">
        
        <!-- Info événement -->
        <div style="background: linear-gradient(135deg, #F5F3FF 0%, #E9D5FF 100%); padding: 24px; border-radius: 12px; margin-bottom: 28px; border: 2px solid #E9D5FF;">
          <div style="font-size: 14px; color: #8B5CF6; font-weight: 700; margin-bottom: 8px;">
            🎯 ${eventType}
          </div>
          <div style="font-size: 18px; color: #1E1B4B; font-weight: 700; margin-bottom: 8px;">
            Organisé par ${organizerName}
          </div>
          ${location ? `
            <div style="font-size: 14px; color: #8B5CF6; font-weight: 600;">
              📍 ${location}
            </div>
          ` : ''}
        </div>

        <!-- Tes disponibilités -->
        <div style="margin-bottom: 28px;">
          <h2 style="font-size: 18px; color: #1E1B4B; font-weight: 700; margin: 0 0 16px 0;">
            📅 Tes disponibilités
          </h2>
          <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 20px; border-radius: 12px; border: 2px solid #FCD34D;">
            <div style="font-size: 15px; color: #92400E; font-weight: 600; line-height: 1.7;">
              ${votedDates || 'Aucune date sélectionnée'}
            </div>
          </div>
        </div>

        <!-- Message info -->
        <div style="background: linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%); padding: 20px; border-radius: 12px; margin-bottom: 28px;">
          <p style="margin: 0; font-size: 14px; color: #1E40AF; line-height: 1.6;">
            💡 <strong>Besoin de modifier ?</strong><br>
            Tu peux revenir sur le lien à tout moment pour changer tes disponibilités !
          </p>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${participantLink}" style="display: inline-block; padding: 18px 32px; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; text-decoration: none; border-radius: 14px; font-size: 16px; font-weight: 700; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3); transition: all 0.3s ease;">
            🔗 Voir l'événement
          </a>
        </div>

        <!-- Prochaines étapes -->
        <div style="background: #F9FAFB; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB;">
          <h3 style="font-size: 15px; color: #1E1B4B; font-weight: 700; margin: 0 0 12px 0;">
            🚀 Prochaines étapes
          </h3>
          <div style="font-size: 14px; color: #6B7280; line-height: 1.8;">
            <strong style="color: #1E1B4B;">1.</strong> D'autres participants vont voter 👋<br>
            <strong style="color: #1E1B4B;">2.</strong> La date avec le plus de votes sera choisie<br>
            <strong style="color: #1E1B4B;">3.</strong> Tu recevras un email de confirmation avec tous les détails
          </div>
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
        subject: `✅ Vote confirmé : ${eventType}`,
        html: emailHtml
      })
    });

    if (!response.ok) {
      console.error('Failed to send participant confirmation email:', await response.text());
    } else {
      console.log('✅ Participant confirmation email sent to:', participantEmail);
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
