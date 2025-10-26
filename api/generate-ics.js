// /api/generate-ics.js
// API Serverless pour générer un fichier .ics compatible avec tous les calendriers
// Format: iCalendar (RFC 5545)

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

  try {
    const { title, start, end, location, description } = req.query;

    // Validation des paramètres requis
    if (!title || !start || !end) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['title', 'start', 'end']
      });
    }

    // Générer un UID unique pour l'événement
    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@synkro.app`;

    // Créer le contenu .ics
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Synkro//Event Calendar//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Synkro Event
X-WR-TIMEZONE:Europe/Paris
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(start)}
DTEND:${formatDateForICS(end)}
SUMMARY:${escapeICSText(title)}
${location ? `LOCATION:${escapeICSText(location)}` : ''}
${description ? `DESCRIPTION:${escapeICSText(description)}` : ''}
STATUS:CONFIRMED
SEQUENCE:0
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

    // Configurer les headers pour le téléchargement
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="synkro-event-${Date.now()}.ics"`);
    
    return res.status(200).send(icsContent);

  } catch (error) {
    console.error('Error generating ICS:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * Formate une date au format iCalendar (yyyyMMddTHHmmssZ)
 * @param {string|Date} date - Date à formatter
 * @returns {string} Date au format ICS
 */
function formatDateForICS(date) {
  const d = new Date(date);
  
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Échappe les caractères spéciaux pour le format ICS
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
function escapeICSText(text) {
  if (!text) return '';
  
  return text
    .replace(/\\/g, '\\\\')  // Backslash
    .replace(/;/g, '\\;')    // Point-virgule
    .replace(/,/g, '\\,')    // Virgule
    .replace(/\n/g, '\\n')   // Nouvelle ligne
    .replace(/\r/g, '');     // Retour chariot
}
