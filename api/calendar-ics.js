// /api/calendar-ics.js
// API pour générer un fichier ICS (calendrier) pour un événement

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId } = req.query;

  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID;

  if (!AIRTABLE_TOKEN || !BASE_ID || !TABLE_ID) {
    return res.status(500).json({ error: 'Database configuration error' });
  }

  try {
    // Récupérer l'événement
    const searchUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula={eventId}='${eventId}'`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      return res.status(500).json({ error: 'Database search error' });
    }

    const searchData = await searchResponse.json();

    if (!searchData.records || searchData.records.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const record = searchData.records[0];
    const event = record.fields;

    // Obtenir la meilleure date ou la date confirmée
    let eventDate;
    let eventTime = '09:00';

    if (event.confirmedDate) {
      // Utiliser la date confirmée si disponible
      eventDate = event.confirmedDate;
      eventTime = event.confirmedTime || '09:00';
    } else {
      // Sinon, utiliser la date avec le plus de votes
      const dates = event.dates ? JSON.parse(event.dates) : [];
      if (dates.length > 0) {
        const bestDate = dates.reduce((prev, current) =>
          (current.votes || 0) > (prev.votes || 0) ? current : prev
        );
        eventDate = bestDate.label;
        eventTime = bestDate.time || '09:00';
      } else {
        return res.status(400).json({ error: 'No dates available for this event' });
      }
    }

    // Créer une date approximative pour le calendrier
    // Le format attendu est "Dimanche 15 juin 2025 - Matin" ou similaire
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 jours par défaut

    // Parser l'heure
    const [hours, minutes] = eventTime.split(':').map(Number);
    futureDate.setHours(hours || 9, minutes || 0, 0, 0);

    const startDate = futureDate;
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 heure

    // Formater la date pour ICS (format: YYYYMMDDTHHMMSS)
    const formatICSDate = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hour = String(date.getUTCHours()).padStart(2, '0');
      const minute = String(date.getUTCMinutes()).padStart(2, '0');
      const second = String(date.getUTCSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hour}${minute}${second}Z`;
    };

    // Nettoyer le texte pour ICS (échapper les caractères spéciaux)
    const escapeICS = (text) => {
      if (!text) return '';
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    // Générer le contenu ICS
    const eventName = event.type || 'Événement Synkro';
    const eventDescription = event.eventSchedule
      ? `${event.eventSchedule}\\n\\nDate proposée: ${eventDate}\\nOrganisé par ${event.organizerName} via Synkro`
      : `Date proposée: ${eventDate}\\nOrganisé par ${event.organizerName} via Synkro`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Synkro//Event//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${eventId}@getsynkro.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS(eventName)}`,
      `DESCRIPTION:${escapeICS(eventDescription)}`,
      event.location ? `LOCATION:${escapeICS(event.location)}` : '',
      `ORGANIZER;CN=${escapeICS(event.organizerName)}:mailto:${event.organizerEmail || 'noreply@getsynkro.com'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line).join('\r\n');

    // Créer un nom de fichier sécurisé
    const safeFileName = eventName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);

    // Envoyer le fichier ICS
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}.ics"`);
    return res.status(200).send(icsContent);

  } catch (error) {
    console.error('Error generating ICS:', error);
    return res.status(500).json({ error: 'Failed to generate calendar file' });
  }
}
