/**
 * Smart Scoring - Algorithme de calcul de la meilleure date
 * Analyse les préférences des participants et recommande la date optimale
 */

/**
 * Calcule un score pour chaque date selon les préférences
 * @param {Array} proposedDates - Dates proposées par l'organisateur
 * @param {Array} participantsPreferences - Préférences de tous les participants
 * @returns {Array} Dates avec scores triés par ordre décroissant
 */
export function calculateOptimalDate(proposedDates, participantsPreferences) {
  if (!proposedDates || proposedDates.length === 0) {
    return [];
  }

  if (!participantsPreferences || participantsPreferences.length === 0) {
    return proposedDates.map(date => ({
      ...date,
      score: 0,
      preferredBy: 0,
      matchDetails: []
    }));
  }

  const scores = proposedDates.map(dateObj => {
    let score = 0;
    const matchDetails = [];

    // Créer un objet Date pour l'analyse
    const dateStr = dateObj.date; // Format: "2024-12-15"
    const timeStr = dateObj.time; // Format: "19:00"
    const date = new Date(dateStr);

    // Pour chaque participant
    participantsPreferences.forEach(pref => {
      let participantScore = 0;
      const participantMatches = [];

      // Question 1 : day_preference (poids: 10 points)
      if (pref.preferences.day_preference) {
        const dayScore = scoreDayPreference(date, pref.preferences.day_preference);
        participantScore += dayScore;
        if (dayScore > 0) {
          participantMatches.push({
            criterion: 'Jour préféré',
            points: dayScore
          });
        }
      }

      // Question 2 : time_preference (poids: 8 points)
      if (pref.preferences.time_preference && timeStr) {
        const timeScore = scoreTimePreference(timeStr, pref.preferences.time_preference);
        participantScore += timeScore;
        if (timeScore > 0) {
          participantMatches.push({
            criterion: 'Horaire préféré',
            points: timeScore
          });
        }
      }

      // Question : period (poids: 5 points)
      if (pref.preferences.period) {
        const periodScore = scorePeriod(date, pref.preferences.period);
        participantScore += periodScore;
        if (periodScore > 0) {
          participantMatches.push({
            criterion: 'Période du mois',
            points: periodScore
          });
        }
      }

      // Question : season_preference (poids: 6 points)
      if (pref.preferences.season_preference) {
        const seasonScore = scoreSeason(date, pref.preferences.season_preference);
        participantScore += seasonScore;
        if (seasonScore > 0) {
          participantMatches.push({
            criterion: 'Saison préférée',
            points: seasonScore
          });
        }
      }

      // Question : duration (poids: 4 points)
      if (pref.preferences.duration) {
        participantScore += 4;
        participantMatches.push({
          criterion: 'Durée',
          points: 4
        });
      }

      // Question : time_slot (réunions) (poids: 8 points)
      if (pref.preferences.time_slot && timeStr) {
        const slotScore = scoreTimeSlot(timeStr, pref.preferences.time_slot);
        participantScore += slotScore;
        if (slotScore > 0) {
          participantMatches.push({
            criterion: 'Créneau horaire',
            points: slotScore
          });
        }
      }

      // Question : time_of_day (poids: 6 points)
      if (pref.preferences.time_of_day && timeStr) {
        const todScore = scoreTimeOfDay(timeStr, pref.preferences.time_of_day);
        participantScore += todScore;
        if (todScore > 0) {
          participantMatches.push({
            criterion: 'Moment de la journée',
            points: todScore
          });
        }
      }

      score += participantScore;

      if (participantMatches.length > 0) {
        matchDetails.push({
          participantName: pref.participant_name,
          score: participantScore,
          matches: participantMatches
        });
      }
    });

    const preferredBy = calculatePreferredBy(date, timeStr, participantsPreferences);

    return {
      ...dateObj,
      score,
      preferredBy,
      matchDetails,
      aiScore: score // Score brut pour l'affichage
    };
  });

  // Trier par score décroissant
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Score basé sur la préférence de jour
 */
function scoreDayPreference(date, preference) {
  const dayOfWeek = date.getDay(); // 0 = dimanche, 6 = samedi

  switch (preference) {
    case 'weekday':
      return (dayOfWeek >= 1 && dayOfWeek <= 4) ? 10 : 0;
    case 'friday':
      return (dayOfWeek === 5) ? 10 : 0;
    case 'weekend':
      return (dayOfWeek === 0 || dayOfWeek === 6) ? 10 : 0;
    case 'monday':
      return (dayOfWeek === 1) ? 10 : 0;
    case 'tuesday_thursday':
      return (dayOfWeek >= 2 && dayOfWeek <= 4) ? 10 : 0;
    case 'mid_week':
      return (dayOfWeek >= 2 && dayOfWeek <= 4) ? 10 : 0;
    case 'sunday_lunch':
      return (dayOfWeek === 0) ? 10 : 0;
    case 'saturday':
      return (dayOfWeek === 6) ? 10 : 0;
    case 'weekday_evening':
      return (dayOfWeek >= 1 && dayOfWeek <= 5) ? 10 : 0;
    case 'saturday_morning':
      return (dayOfWeek === 6) ? 10 : 0;
    case 'sunday':
      return (dayOfWeek === 0) ? 10 : 0;
    case 'any':
      return 5; // Neutre mais pas 0 pour montrer qu'ils ont répondu
    default:
      return 0;
  }
}

/**
 * Score basé sur la préférence d'horaire
 */
function scoreTimePreference(timeStr, preference) {
  const hour = parseInt(timeStr.split(':')[0]);

  switch (preference) {
    case 'early': // 19h-20h
      return (hour >= 19 && hour < 21) ? 8 : 0;
    case 'standard': // 20h-21h
      return (hour >= 20 && hour < 22) ? 8 : 0;
    case 'late': // 21h+
      return (hour >= 21) ? 8 : 0;
    case 'lunch': // 12h-15h
      return (hour >= 12 && hour < 15) ? 8 : 0;
    case 'afternoon': // 15h-18h
      return (hour >= 15 && hour < 18) ? 8 : 0;
    case 'evening': // 19h+
      return (hour >= 19) ? 8 : 0;
    case 'dinner': // 19h+
      return (hour >= 19) ? 8 : 0;
    case 'any':
      return 4;
    default:
      return 0;
  }
}

/**
 * Score basé sur la période du mois
 */
function scorePeriod(date, period) {
  const dayOfMonth = date.getDate();

  switch (period) {
    case 'early':
      return (dayOfMonth >= 1 && dayOfMonth <= 10) ? 5 : 0;
    case 'mid':
      return (dayOfMonth >= 11 && dayOfMonth <= 20) ? 5 : 0;
    case 'late':
      return (dayOfMonth >= 21) ? 5 : 0;
    case 'any':
      return 3;
    default:
      return 0;
  }
}

/**
 * Score basé sur la saison
 */
function scoreSeason(date, season) {
  const month = date.getMonth(); // 0 = janvier

  switch (season) {
    case 'spring': // mars, avril, mai
      return (month >= 2 && month <= 4) ? 6 : 0;
    case 'summer': // juin, juillet, août
      return (month >= 5 && month <= 7) ? 6 : 0;
    case 'fall': // septembre, octobre, novembre
      return (month >= 8 && month <= 10) ? 6 : 0;
    case 'winter': // décembre, janvier, février
      return (month === 11 || month <= 1) ? 6 : 0;
    case 'any':
      return 3;
    default:
      return 0;
  }
}

/**
 * Score basé sur le créneau horaire (réunions)
 */
function scoreTimeSlot(timeStr, slot) {
  const hour = parseInt(timeStr.split(':')[0]);

  switch (slot) {
    case 'morning': // 9h-12h
      return (hour >= 9 && hour < 12) ? 8 : 0;
    case 'afternoon': // 14h-17h
      return (hour >= 14 && hour < 17) ? 8 : 0;
    case 'end_day': // 17h-19h
      return (hour >= 17 && hour < 19) ? 8 : 0;
    case 'any':
      return 4;
    default:
      return 0;
  }
}

/**
 * Score basé sur le moment de la journée (générique)
 */
function scoreTimeOfDay(timeStr, timeOfDay) {
  const hour = parseInt(timeStr.split(':')[0]);

  switch (timeOfDay) {
    case 'morning':
      return (hour >= 6 && hour < 12) ? 6 : 0;
    case 'afternoon':
      return (hour >= 12 && hour < 18) ? 6 : 0;
    case 'evening':
      return (hour >= 18) ? 6 : 0;
    case 'early_morning':
      return (hour >= 7 && hour < 9) ? 6 : 0;
    case 'late_morning':
      return (hour >= 9 && hour < 12) ? 6 : 0;
    case 'any':
      return 3;
    default:
      return 0;
  }
}

/**
 * Calcule le nombre de participants qui préfèrent cette date
 */
function calculatePreferredBy(date, timeStr, participantsPreferences) {
  let count = 0;

  participantsPreferences.forEach(pref => {
    if (matchesPreferences(date, timeStr, pref.preferences)) {
      count++;
    }
  });

  return count;
}

/**
 * Vérifie si une date correspond aux préférences d'un participant
 */
function matchesPreferences(date, timeStr, preferences) {
  const dayOfWeek = date.getDay();
  let matches = 0;
  let totalCriteria = 0;

  // Vérifier day_preference
  if (preferences.day_preference) {
    totalCriteria++;
    if (scoreDayPreference(date, preferences.day_preference) > 0) {
      matches++;
    }
  }

  // Vérifier time_preference
  if (preferences.time_preference && timeStr) {
    totalCriteria++;
    if (scoreTimePreference(timeStr, preferences.time_preference) > 0) {
      matches++;
    }
  }

  // Vérifier period
  if (preferences.period) {
    totalCriteria++;
    if (scorePeriod(date, preferences.period) > 0) {
      matches++;
    }
  }

  // Si au moins 50% des critères matchent, c'est OK
  return totalCriteria > 0 && (matches / totalCriteria) >= 0.5;
}

/**
 * Trouve la meilleure date parmi les propositions
 * @param {Array} proposedDates - Dates proposées
 * @param {Array} participantsPreferences - Préférences des participants
 * @returns {Object} Résultat avec meilleure date et alternatives
 */
export function findBestDate(proposedDates, participantsPreferences) {
  const scoredDates = calculateOptimalDate(proposedDates, participantsPreferences);

  if (scoredDates.length === 0) return null;

  const best = scoredDates[0];
  const totalParticipants = participantsPreferences.length;

  return {
    bestDate: best,
    score: best.score,
    preferredBy: best.preferredBy,
    totalParticipants,
    confidence: totalParticipants > 0
      ? Math.round((best.preferredBy / totalParticipants) * 100)
      : 0,
    alternativeDates: scoredDates.slice(1, 3), // 2 alternatives
    allScores: scoredDates // Pour debug
  };
}

/**
 * Génère un résumé textuel de la recommandation
 * @param {Object} recommendation - Résultat de findBestDate
 * @returns {string} Résumé lisible
 */
export function generateRecommendationSummary(recommendation) {
  if (!recommendation) {
    return "Aucune recommandation disponible";
  }

  const { bestDate, preferredBy, totalParticipants, confidence } = recommendation;

  let summary = `La date ${bestDate.label} est recommandée avec ${confidence}% de confiance. `;
  summary += `${preferredBy} participant${preferredBy > 1 ? 's' : ''} sur ${totalParticipants} `;
  summary += `${preferredBy > 1 ? 'correspondent' : 'correspond'} à cette date selon leurs préférences.`;

  return summary;
}
