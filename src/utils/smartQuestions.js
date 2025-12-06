/**
 * Smart Questions - Système de questions adaptatives pour Synkro IA
 * Génère des questions intelligentes selon le type d'événement
 */

// Types d'événements détectables
export const eventTypes = {
  DINNER_FRIENDS: 'dinner_friends',
  BUSINESS_LUNCH: 'business_lunch',
  BIRTHDAY: 'birthday',
  WEDDING: 'wedding',
  BACHELOR_PARTY: 'bachelor_party',
  BACHELORETTE_PARTY: 'bachelorette_party',
  WEEKEND_TRIP: 'weekend_trip',
  TEAM_MEETING: 'team_meeting',
  WORKSHOP: 'workshop',
  SPORT: 'sport',
  REHEARSAL: 'rehearsal',
  FAMILY: 'family',
  GENERIC: 'generic'
};

// Questions par type d'événement
export const questionTemplates = {
  [eventTypes.DINNER_FRIENDS]: [
    {
      id: 'day_preference',
      question: 'Pour ce dîner, vous préférez :',
      type: 'single_choice',
      options: [
        { value: 'weekday', label: 'En semaine (lundi-jeudi)', icon: '📅' },
        { value: 'friday', label: 'Vendredi soir', icon: '🎉' },
        { value: 'weekend', label: 'Weekend (samedi-dimanche)', icon: '🌟' },
        { value: 'any', label: 'Peu importe', icon: '✨' }
      ]
    },
    {
      id: 'time_preference',
      question: 'Et niveau horaire :',
      type: 'single_choice',
      options: [
        { value: 'early', label: '19h-20h (dîner tôt)', icon: '🌅' },
        { value: 'standard', label: '20h-21h (classique)', icon: '🍽️' },
        { value: 'late', label: '21h+ (tardif)', icon: '🌙' },
        { value: 'any', label: 'Flexible', icon: '✨' }
      ]
    }
  ],

  [eventTypes.BUSINESS_LUNCH]: [
    {
      id: 'day_preference',
      question: 'Pour ce déjeuner professionnel :',
      type: 'single_choice',
      options: [
        { value: 'monday', label: 'Lundi', icon: '📊' },
        { value: 'tuesday_thursday', label: 'Mardi à jeudi', icon: '💼' },
        { value: 'friday', label: 'Vendredi', icon: '🎯' },
        { value: 'any', label: 'N\'importe quel jour', icon: '✨' }
      ]
    },
    {
      id: 'duration',
      question: 'Durée souhaitée :',
      type: 'single_choice',
      options: [
        { value: 'quick', label: '1h (rapide)', icon: '⚡' },
        { value: 'standard', label: '1h30 (standard)', icon: '🍴' },
        { value: 'long', label: '2h+ (approfondi)', icon: '☕' },
        { value: 'any', label: 'Flexible', icon: '✨' }
      ]
    }
  ],

  [eventTypes.BIRTHDAY]: [
    {
      id: 'day_preference',
      question: 'Pour cet anniversaire :',
      type: 'single_choice',
      options: [
        { value: 'exact_date', label: 'Le jour exact de l\'anniversaire', icon: '🎂' },
        { value: 'weekend_before', label: 'Le weekend avant', icon: '🎈' },
        { value: 'weekend_after', label: 'Le weekend après', icon: '🎉' },
        { value: 'any', label: 'Peu importe', icon: '✨' }
      ]
    },
    {
      id: 'time_preference',
      question: 'Plutôt :',
      type: 'single_choice',
      options: [
        { value: 'lunch', label: 'Déjeuner (12h-15h)', icon: '🌞' },
        { value: 'afternoon', label: 'Après-midi (15h-18h)', icon: '🎪' },
        { value: 'evening', label: 'Soirée (19h+)', icon: '🌃' },
        { value: 'any', label: 'Flexible', icon: '✨' }
      ]
    }
  ],

  [eventTypes.BACHELOR_PARTY]: [
    {
      id: 'duration_preference',
      question: 'Durée de l\'EVG :',
      type: 'single_choice',
      options: [
        { value: 'one_day', label: '1 journée', icon: '☀️' },
        { value: 'weekend', label: 'Weekend (2 jours)', icon: '🎊' },
        { value: 'long_weekend', label: 'Long weekend (3-4 jours)', icon: '🚀' },
        { value: 'any', label: 'Flexible', icon: '✨' }
      ]
    },
    {
      id: 'period_preference',
      question: 'Période de l\'année :',
      type: 'single_choice',
      options: [
        { value: 'spring', label: 'Printemps (mars-mai)', icon: '🌸' },
        { value: 'summer', label: 'Été (juin-août)', icon: '☀️' },
        { value: 'fall', label: 'Automne (sept-nov)', icon: '🍂' },
        { value: 'winter', label: 'Hiver (déc-fév)', icon: '❄️' },
        { value: 'any', label: 'N\'importe quand', icon: '✨' }
      ]
    }
  ],

  [eventTypes.BACHELORETTE_PARTY]: [
    {
      id: 'duration_preference',
      question: 'Durée de l\'EVF :',
      type: 'single_choice',
      options: [
        { value: 'one_day', label: '1 journée', icon: '☀️' },
        { value: 'weekend', label: 'Weekend (2 jours)', icon: '💃' },
        { value: 'long_weekend', label: 'Long weekend (3-4 jours)', icon: '🎀' },
        { value: 'any', label: 'Flexible', icon: '✨' }
      ]
    },
    {
      id: 'period_preference',
      question: 'Période de l\'année :',
      type: 'single_choice',
      options: [
        { value: 'spring', label: 'Printemps (mars-mai)', icon: '🌸' },
        { value: 'summer', label: 'Été (juin-août)', icon: '☀️' },
        { value: 'fall', label: 'Automne (sept-nov)', icon: '🍂' },
        { value: 'winter', label: 'Hiver (déc-fév)', icon: '❄️' },
        { value: 'any', label: 'N\'importe quand', icon: '✨' }
      ]
    }
  ],

  [eventTypes.WEEKEND_TRIP]: [
    {
      id: 'duration',
      question: 'Durée du weekend :',
      type: 'single_choice',
      options: [
        { value: 'short', label: 'Weekend classique (2 jours)', icon: '🎒' },
        { value: 'long', label: 'Long weekend (3-4 jours)', icon: '🏔️' },
        { value: 'any', label: 'Flexible', icon: '✨' }
      ]
    },
    {
      id: 'season_preference',
      question: 'Saison préférée :',
      type: 'single_choice',
      options: [
        { value: 'spring', label: 'Printemps', icon: '🌸' },
        { value: 'summer', label: 'Été', icon: '☀️' },
        { value: 'fall', label: 'Automne', icon: '🍂' },
        { value: 'winter', label: 'Hiver', icon: '❄️' },
        { value: 'any', label: 'N\'importe quand', icon: '✨' }
      ]
    }
  ],

  [eventTypes.TEAM_MEETING]: [
    {
      id: 'day_preference',
      question: 'Jour le plus pratique :',
      type: 'single_choice',
      options: [
        { value: 'monday', label: 'Lundi (début de semaine)', icon: '🚀' },
        { value: 'mid_week', label: 'Mardi-Mercredi-Jeudi', icon: '💼' },
        { value: 'friday', label: 'Vendredi (fin de semaine)', icon: '🎯' },
        { value: 'any', label: 'Flexible', icon: '✨' }
      ]
    },
    {
      id: 'time_slot',
      question: 'Créneau horaire :',
      type: 'single_choice',
      options: [
        { value: 'morning', label: 'Matin (9h-12h)', icon: '🌅' },
        { value: 'afternoon', label: 'Après-midi (14h-17h)', icon: '☕' },
        { value: 'end_day', label: 'Fin de journée (17h-19h)', icon: '🌆' },
        { value: 'any', label: 'Flexible', icon: '✨' }
      ]
    }
  ],

  [eventTypes.SPORT]: [
    {
      id: 'day_preference',
      question: 'Quel jour pour le sport :',
      type: 'single_choice',
      options: [
        { value: 'weekday_evening', label: 'Soir de semaine', icon: '🌆' },
        { value: 'saturday_morning', label: 'Samedi matin', icon: '🌅' },
        { value: 'sunday', label: 'Dimanche', icon: '☀️' },
        { value: 'any', label: 'Peu importe', icon: '✨' }
      ]
    },
    {
      id: 'time_preference',
      question: 'Horaire préféré :',
      type: 'single_choice',
      options: [
        { value: 'early_morning', label: 'Tôt le matin (7h-9h)', icon: '🌄' },
        { value: 'late_morning', label: 'Fin de matinée (9h-12h)', icon: '☀️' },
        { value: 'evening', label: 'Soirée (18h-21h)', icon: '🌙' },
        { value: 'any', label: 'Flexible', icon: '✨' }
      ]
    }
  ],

  [eventTypes.FAMILY]: [
    {
      id: 'day_preference',
      question: 'Pour cette réunion familiale :',
      type: 'single_choice',
      options: [
        { value: 'sunday_lunch', label: 'Dimanche midi', icon: '🍽️' },
        { value: 'saturday', label: 'Samedi', icon: '🎉' },
        { value: 'weekday', label: 'En semaine', icon: '📅' },
        { value: 'any', label: 'Flexible', icon: '✨' }
      ]
    },
    {
      id: 'time_preference',
      question: 'Moment de la journée :',
      type: 'single_choice',
      options: [
        { value: 'lunch', label: 'Déjeuner (12h-15h)', icon: '🌞' },
        { value: 'afternoon', label: 'Après-midi (15h-18h)', icon: '☕' },
        { value: 'dinner', label: 'Dîner (19h+)', icon: '🌃' },
        { value: 'any', label: 'Flexible', icon: '✨' }
      ]
    }
  ],

  [eventTypes.GENERIC]: [
    {
      id: 'day_type',
      question: 'Type de jour :',
      type: 'single_choice',
      options: [
        { value: 'weekday', label: 'En semaine', icon: '📅' },
        { value: 'weekend', label: 'Weekend', icon: '🌟' },
        { value: 'any', label: 'Peu importe', icon: '✨' }
      ]
    },
    {
      id: 'time_of_day',
      question: 'Moment de la journée :',
      type: 'single_choice',
      options: [
        { value: 'morning', label: 'Matin', icon: '🌅' },
        { value: 'afternoon', label: 'Après-midi', icon: '☀️' },
        { value: 'evening', label: 'Soirée', icon: '🌙' },
        { value: 'any', label: 'Flexible', icon: '✨' }
      ]
    }
  ]
};

/**
 * Détecte le type d'événement depuis le titre ou le type
 * @param {string} eventTitle - Titre ou type de l'événement
 * @returns {string} Type d'événement détecté
 */
export function detectEventType(eventTitle) {
  if (!eventTitle) return eventTypes.GENERIC;

  const title = eventTitle.toLowerCase();

  // Dîner / Soirée
  if (title.includes('dîner') || title.includes('diner') ||
      title.includes('resto') || title.includes('restaurant') ||
      title.includes('soirée') || title.includes('soiree')) {
    return eventTypes.DINNER_FRIENDS;
  }

  // Déjeuner pro
  if (title.includes('déjeuner') || title.includes('dejeuner')) {
    if (title.includes('pro') || title.includes('business') ||
        title.includes('affaire') || title.includes('travail')) {
      return eventTypes.BUSINESS_LUNCH;
    }
  }

  // Anniversaire
  if (title.includes('anniversaire') || title.includes('birthday') ||
      title.includes('anniv')) {
    return eventTypes.BIRTHDAY;
  }

  // Mariage
  if (title.includes('mariage') || title.includes('wedding') ||
      title.includes('noce')) {
    return eventTypes.WEDDING;
  }

  // EVG
  if (title.includes('evg') || title.includes('enterrement') ||
      title.includes('bachelor')) {
    return eventTypes.BACHELOR_PARTY;
  }

  // EVF
  if (title.includes('evf') || title.includes('bachelorette')) {
    return eventTypes.BACHELORETTE_PARTY;
  }

  // Weekend / Vacances
  if (title.includes('weekend') || title.includes('we') ||
      title.includes('vacances') || title.includes('trip')) {
    return eventTypes.WEEKEND_TRIP;
  }

  // Réunion
  if (title.includes('réunion') || title.includes('reunion') ||
      title.includes('meeting') || title.includes('rendez-vous')) {
    return eventTypes.TEAM_MEETING;
  }

  // Sport
  if (title.includes('sport') || title.includes('foot') ||
      title.includes('basket') || title.includes('tennis') ||
      title.includes('match') || title.includes('entraînement')) {
    return eventTypes.SPORT;
  }

  // Famille
  if (title.includes('famille') || title.includes('familial') ||
      title.includes('family')) {
    return eventTypes.FAMILY;
  }

  // Répétition
  if (title.includes('répétition') || title.includes('repetition') ||
      title.includes('rehearsal')) {
    return eventTypes.REHEARSAL;
  }

  // Par défaut
  return eventTypes.GENERIC;
}

/**
 * Récupère les questions pour un événement donné
 * @param {string} eventTitle - Titre ou type de l'événement
 * @returns {Array} Array de questions
 */
export function getQuestionsForEvent(eventTitle) {
  const eventType = detectEventType(eventTitle);
  return questionTemplates[eventType] || questionTemplates[eventTypes.GENERIC];
}

/**
 * Valide les réponses d'un participant
 * @param {Object} answers - Réponses du participant
 * @param {Array} questions - Questions posées
 * @returns {boolean} True si valide
 */
export function validateAnswers(answers, questions) {
  if (!answers || typeof answers !== 'object') return false;

  // Vérifier que toutes les questions ont une réponse
  for (const question of questions) {
    if (!answers[question.id]) {
      return false;
    }
  }

  return true;
}
