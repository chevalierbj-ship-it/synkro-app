/**
 * Utilitaires pour exporter les données d'événements
 * Formats supportés : CSV, Excel (via bibliothèque externe)
 */

/**
 * Exporte les données d'un événement en format CSV
 * @param {Object} eventData - Données de l'événement
 * @param {string} eventData.eventName - Nom de l'événement
 * @param {Array} eventData.dates - Liste des dates proposées
 * @param {Array} eventData.participants - Liste des participants avec leurs votes
 * @param {Object} eventData.budgetVotes - Votes pour le budget (optionnel)
 */
export const exportToCSV = (eventData) => {
  try {
    const { eventName, dates, participants, budgetVotes } = eventData;

    if (!eventName || !dates || !participants) {
      throw new Error('Données d\'événement incomplètes');
    }

    // Préparer les en-têtes
    const headers = ['Nom', 'Email', ...dates.map(d => d.label || d.date), 'Vote budget'];

    // Préparer les lignes de données
    const rows = participants.map(participant => {
      const row = [
        participant.name || 'Anonyme',
        participant.email || 'N/A'
      ];

      // Ajouter les disponibilités pour chaque date
      dates.forEach(date => {
        const hasVoted = date.voters?.includes(participant.name) ||
                        participant.votes?.includes(date.id);
        row.push(hasVoted ? '✓ Disponible' : '✗ Indisponible');
      });

      // Ajouter le vote budget si disponible
      const budgetVote = participant.budgetVote || 'Non voté';
      row.push(budgetVote);

      return row;
    });

    // Ajouter une ligne de résumé
    const summaryRow = ['RÉSUMÉ', 'Votes totaux'];
    dates.forEach(date => {
      summaryRow.push(`${date.votes || 0} votes`);
    });
    summaryRow.push('');

    rows.push(summaryRow);

    // Convertir en format CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Échapper les virgules et guillemets
        const escaped = String(cell).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(','))
    ].join('\n');

    // Créer le fichier et le télécharger
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const filename = `synkro-export-${sanitizeFilename(eventName)}-${getFormattedDate()}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      filename,
      participantCount: participants.length,
      dateCount: dates.length
    };

  } catch (error) {
    console.error('Erreur export CSV:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Exporte une version détaillée avec statistiques
 * @param {Object} eventData - Données de l'événement
 */
export const exportDetailedCSV = (eventData) => {
  try {
    const { eventName, dates, participants, organizerName, location, createdAt } = eventData;

    // Section 1 : Informations générales
    const infoSection = [
      ['INFORMATIONS GÉNÉRALES'],
      ['Nom de l\'événement', eventName],
      ['Organisateur', organizerName || 'Non spécifié'],
      ['Lieu', location || 'Non spécifié'],
      ['Date de création', createdAt ? new Date(createdAt).toLocaleDateString('fr-FR') : 'N/A'],
      ['Nombre de participants', participants.length],
      ['Nombre de dates proposées', dates.length],
      [''],
    ];

    // Section 2 : Statistiques des dates
    const statsSection = [
      ['STATISTIQUES PAR DATE'],
      ['Date', 'Votes', 'Taux de participation'],
    ];

    dates.forEach(date => {
      const voteCount = date.votes || 0;
      const participationRate = participants.length > 0
        ? Math.round((voteCount / participants.length) * 100)
        : 0;

      statsSection.push([
        date.label || date.date,
        voteCount,
        `${participationRate}%`
      ]);
    });

    statsSection.push(['']);

    // Section 3 : Détails participants
    const participantsSection = [
      ['DÉTAILS DES PARTICIPANTS'],
      ['Nom', 'Email', 'Dates disponibles', 'Vote budget'],
    ];

    participants.forEach(participant => {
      const availableDates = dates
        .filter(date => date.voters?.includes(participant.name) || participant.votes?.includes(date.id))
        .map(d => d.label || d.date)
        .join(' | ');

      participantsSection.push([
        participant.name || 'Anonyme',
        participant.email || 'N/A',
        availableDates || 'Aucune',
        participant.budgetVote || 'Non voté'
      ]);
    });

    // Combiner toutes les sections
    const allRows = [...infoSection, ...statsSection, ...participantsSection];

    // Convertir en CSV
    const csvContent = allRows.map(row =>
      row.map(cell => {
        const escaped = String(cell || '').replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    ).join('\n');

    // Télécharger
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const filename = `synkro-detailed-${sanitizeFilename(eventName)}-${getFormattedDate()}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      filename,
      participantCount: participants.length
    };

  } catch (error) {
    console.error('Erreur export détaillé:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Exporte uniquement la liste des participants
 * @param {Array} participants - Liste des participants
 * @param {string} eventName - Nom de l'événement
 */
export const exportParticipantsOnly = (participants, eventName) => {
  try {
    const headers = ['Nom', 'Email', 'A répondu'];

    const rows = participants.map(p => [
      p.name || 'Anonyme',
      p.email || 'N/A',
      p.hasResponded ? 'Oui' : 'Non'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const filename = `synkro-participants-${sanitizeFilename(eventName)}-${getFormattedDate()}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, filename };

  } catch (error) {
    console.error('Erreur export participants:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prépare les données pour export Excel (nécessite une bibliothèque externe comme xlsx)
 * @param {Object} eventData - Données de l'événement
 * @returns {Object} Données formatées pour Excel
 */
export const prepareExcelData = (eventData) => {
  // Cette fonction retourne les données structurées
  // Pour l'implémentation complète, installer la bibliothèque 'xlsx':
  // npm install xlsx
  // import * as XLSX from 'xlsx';

  console.log('Export Excel nécessite la bibliothèque "xlsx"');
  console.log('Installation : npm install xlsx');

  return {
    success: false,
    message: 'Export Excel non implémenté. Utilisez exportToCSV à la place.',
    note: 'Pour activer l\'export Excel, installez la bibliothèque xlsx'
  };
};

// ===== FONCTIONS UTILITAIRES =====

/**
 * Nettoie un nom de fichier en retirant les caractères spéciaux
 * @param {string} filename
 * @returns {string}
 */
function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Retourne la date actuelle formatée pour un nom de fichier
 * @returns {string} Format: YYYYMMDD
 */
function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Génère des statistiques résumées pour l'événement
 * @param {Object} eventData
 * @returns {Object}
 */
export const generateEventStats = (eventData) => {
  const { dates, participants } = eventData;

  if (!dates || !participants) {
    return null;
  }

  // Trouver la date avec le plus de votes
  const bestDate = dates.reduce((best, current) => {
    return (current.votes || 0) > (best.votes || 0) ? current : best;
  }, dates[0]);

  // Calculer le taux de réponse moyen
  const totalResponses = participants.filter(p => p.hasResponded).length;
  const responseRate = (totalResponses / participants.length) * 100;

  // Calculer le consensus (% de participants dispo sur la meilleure date)
  const consensusRate = participants.length > 0
    ? ((bestDate.votes || 0) / participants.length) * 100
    : 0;

  return {
    bestDate: bestDate.label || bestDate.date,
    bestDateVotes: bestDate.votes || 0,
    totalParticipants: participants.length,
    responseRate: Math.round(responseRate),
    consensusRate: Math.round(consensusRate),
    totalDates: dates.length
  };
};
