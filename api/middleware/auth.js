/**
 * Middleware d'autorisation pour vérifier les permissions des utilisateurs
 * Gère les sous-comptes et les permissions basées sur les rôles
 */

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

/**
 * Récupère les informations utilisateur et vérifie s'il s'agit d'un sous-compte
 * @param {string} clerkUserId - ID Clerk de l'utilisateur
 * @returns {Object} - { isSubAccount, parentUserId, role, userId }
 */
export async function getUserAccountInfo(clerkUserId) {
  if (!clerkUserId) {
    throw new Error('clerkUserId requis');
  }

  // Rechercher l'utilisateur dans la table Users
  const userResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users?filterByFormula={clerk_user_id}='${clerkUserId}'`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      }
    }
  );

  if (!userResponse.ok) {
    throw new Error('Erreur lors de la récupération des informations utilisateur');
  }

  const userData = await userResponse.json();

  if (!userData.records || userData.records.length === 0) {
    // Utilisateur n'existe pas encore dans Airtable
    return {
      exists: false,
      isSubAccount: false,
      parentUserId: null,
      role: null,
      userId: null
    };
  }

  const user = userData.records[0].fields;

  // Vérifier si c'est un sous-compte
  if (user.is_sub_account && user.parent_account_id) {
    // Récupérer le rôle depuis SubAccounts
    const subAccountResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/SubAccounts?filterByFormula=AND({clerk_user_id}='${clerkUserId}',{status}='active')`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`
        }
      }
    );

    const subAccountData = await subAccountResponse.json();

    if (subAccountData.records && subAccountData.records.length > 0) {
      const subAccount = subAccountData.records[0].fields;
      return {
        exists: true,
        isSubAccount: true,
        parentUserId: user.parent_account_id,
        role: subAccount.role || 'viewer',
        userId: clerkUserId,
        email: user.email
      };
    }
  }

  // Compte principal
  return {
    exists: true,
    isSubAccount: false,
    parentUserId: null,
    role: 'owner',
    userId: clerkUserId,
    email: user.email
  };
}

/**
 * Vérifie si un utilisateur peut accéder à un événement
 * @param {string} clerkUserId - ID Clerk de l'utilisateur
 * @param {string} eventId - ID de l'événement
 * @returns {Object} - { canAccess, permission, reason }
 */
export async function canAccessEvent(clerkUserId, eventId) {
  if (!clerkUserId || !eventId) {
    return { canAccess: false, permission: null, reason: 'Paramètres manquants' };
  }

  // 1. Récupérer l'événement
  const eventResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_EVENTS_TABLE_ID}?filterByFormula={eventId}='${eventId}'`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      }
    }
  );

  if (!eventResponse.ok) {
    return { canAccess: false, permission: null, reason: 'Erreur lors de la récupération de l\'événement' };
  }

  const eventData = await eventResponse.json();

  if (!eventData.records || eventData.records.length === 0) {
    return { canAccess: false, permission: null, reason: 'Événement introuvable' };
  }

  const event = eventData.records[0].fields;

  // 2. Récupérer les infos du compte
  const accountInfo = await getUserAccountInfo(clerkUserId);

  if (!accountInfo.exists) {
    return { canAccess: false, permission: null, reason: 'Utilisateur introuvable' };
  }

  // 3. Vérifier l'accès

  // Si c'est le propriétaire de l'événement (par email)
  if (event.organizerEmail === accountInfo.email) {
    return { canAccess: true, permission: 'owner', role: 'owner' };
  }

  // Si c'est un sous-compte, vérifier s'il a accès via shared_with ou si le parent est le propriétaire
  if (accountInfo.isSubAccount) {
    const parentInfo = await getUserAccountInfo(accountInfo.parentUserId);

    // Vérifier si le parent est le propriétaire
    if (event.organizerEmail === parentInfo.email) {
      // Le parent est propriétaire, donc le sous-compte a accès selon son rôle
      return {
        canAccess: true,
        permission: accountInfo.role,
        role: accountInfo.role,
        viaParent: true
      };
    }

    // Vérifier si l'événement est partagé explicitement avec ce sous-compte
    if (event.shared_with) {
      try {
        const sharedWith = JSON.parse(event.shared_with);
        const sharedAccess = sharedWith.find(s => s.userId === clerkUserId);

        if (sharedAccess) {
          return {
            canAccess: true,
            permission: sharedAccess.permission || accountInfo.role,
            role: accountInfo.role,
            viaSharing: true
          };
        }
      } catch (e) {
        console.error('Error parsing shared_with:', e);
      }
    }
  }

  // Pas d'accès
  return { canAccess: false, permission: null, reason: 'Accès non autorisé' };
}

/**
 * Vérifie si un utilisateur peut effectuer une action sur un événement
 * @param {string} clerkUserId - ID Clerk de l'utilisateur
 * @param {string} eventId - ID de l'événement
 * @param {string} action - Action à effectuer: 'view', 'edit', 'delete', 'share'
 * @returns {Object} - { canPerform, reason }
 */
export async function canPerformAction(clerkUserId, eventId, action) {
  const accessCheck = await canAccessEvent(clerkUserId, eventId);

  if (!accessCheck.canAccess) {
    return { canPerform: false, reason: accessCheck.reason };
  }

  const permission = accessCheck.permission;

  // Matrice de permissions
  const permissionMatrix = {
    owner: ['view', 'edit', 'delete', 'share', 'manage_team'],
    admin: ['view', 'edit', 'delete', 'share'],
    editor: ['view', 'edit'],
    viewer: ['view']
  };

  const allowedActions = permissionMatrix[permission] || [];

  if (allowedActions.includes(action)) {
    return { canPerform: true, permission, role: accessCheck.role };
  }

  return {
    canPerform: false,
    reason: `Permission insuffisante. Votre rôle (${permission}) ne permet pas l'action: ${action}`
  };
}

/**
 * Récupère tous les événements accessibles par un utilisateur
 * (ses propres événements + ceux partagés avec lui)
 * @param {string} clerkUserId - ID Clerk de l'utilisateur
 * @returns {Array} - Liste des IDs d'événements accessibles
 */
export async function getAccessibleEvents(clerkUserId) {
  const accountInfo = await getUserAccountInfo(clerkUserId);

  if (!accountInfo.exists) {
    return [];
  }

  let filterFormula = '';

  if (accountInfo.isSubAccount) {
    // Récupérer les infos du parent
    const parentInfo = await getUserAccountInfo(accountInfo.parentUserId);

    // Événements du parent OU événements partagés avec ce sous-compte
    filterFormula = `OR({organizerEmail}='${parentInfo.email}',FIND('${clerkUserId}',{shared_with})>0)`;
  } else {
    // Événements de l'utilisateur
    filterFormula = `{organizerEmail}='${accountInfo.email}'`;
  }

  const eventsResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_EVENTS_TABLE_ID}?filterByFormula=${encodeURIComponent(filterFormula)}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      }
    }
  );

  if (!eventsResponse.ok) {
    console.error('Error fetching accessible events');
    return [];
  }

  const eventsData = await eventsResponse.json();
  return eventsData.records || [];
}

/**
 * Middleware Express pour protéger les routes
 * Usage: app.get('/api/events/:id', requireAuth('edit'), handler)
 */
export function requireAuth(requiredAction = 'view') {
  return async (req, res, next) => {
    const clerkUserId = req.query.clerkUserId || req.body.clerkUserId;
    const eventId = req.query.eventId || req.params.eventId || req.body.eventId;

    if (!clerkUserId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!eventId && requiredAction !== 'create') {
      return res.status(400).json({ error: 'Event ID requis' });
    }

    // Pour la création, vérifier juste que l'utilisateur existe
    if (requiredAction === 'create') {
      const accountInfo = await getUserAccountInfo(clerkUserId);
      if (!accountInfo.exists) {
        return res.status(403).json({ error: 'Utilisateur non trouvé' });
      }
      req.accountInfo = accountInfo;
      return next();
    }

    // Pour les autres actions, vérifier les permissions
    const authCheck = await canPerformAction(clerkUserId, eventId, requiredAction);

    if (!authCheck.canPerform) {
      return res.status(403).json({ error: authCheck.reason });
    }

    // Ajouter les infos d'auth à la requête pour usage ultérieur
    req.auth = authCheck;
    next();
  };
}
