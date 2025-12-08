# Rapport d'erreurs - 8 décembre 2025

## Contexte

Lors de la création d'un événement en production (Vercel), deux erreurs critiques ont été identifiées à partir des logs Vercel du 8 décembre 2025.

---

## Erreur 1 : Team API - Cannot read properties of undefined

### Détails de l'erreur

```
2025-12-08 20:03:19.740 [error] Team API error: TypeError: Cannot read properties of undefined (reading 'map')
    at getTeamMembers (file:///var/task/api/team.js:52:32)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async Object.handler (file:///var/task/api/team.js:20:16)
```

- **Timestamp**: 2025-12-08 21:03:19.29
- **Endpoint**: GET /api/team
- **Status**: 500
- **Fichier**: `api/team.js:52`

### Analyse

Le code à la ligne 52 de `api/team.js` tente d'appeler `.map()` sur `data.records` :

```javascript
const members = data.records.map(record => ({
  id: record.id,
  ...record.fields
}));
```

**Problème identifié** :
- `data.records` est `undefined`, ce qui indique que l'API Airtable a retourné une réponse inattendue
- Le code ne vérifie pas si `response.ok` avant de parser le JSON
- Aucune gestion d'erreur pour les cas où Airtable retourne une erreur

### Code problématique (lignes 41-55)

```javascript
const response = await fetch(
  `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts?filterByFormula={parent_user_id}='${clerkUserId}'`,
  {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
    }
  }
);

const data = await response.json();

const members = data.records.map(record => ({  // ❌ CRASH ICI
  id: record.id,
  ...record.fields
}));
```

### Solution recommandée

Ajouter une validation de la réponse Airtable :

```javascript
const response = await fetch(
  `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts?filterByFormula={parent_user_id}='${clerkUserId}'`,
  {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
    }
  }
);

if (!response.ok) {
  const errorText = await response.text();
  console.error('Airtable API error:', errorText);
  return res.status(500).json({
    error: 'Failed to fetch team members',
    details: errorText
  });
}

const data = await response.json();

if (!data.records) {
  console.error('Unexpected Airtable response:', data);
  return res.status(500).json({
    error: 'Invalid response from database'
  });
}

const members = data.records.map(record => ({
  id: record.id,
  ...record.fields
}));
```

---

## Erreur 2 : Airtable - Unknown field name "owner_user_id"

### Détails de l'erreur

```
2025-12-08 20:04:01.262 [error] Airtable error: {"error":{"type":"UNKNOWN_FIELD_NAME","message":"Unknown field name: \"owner_user_id\""}}
```

- **Timestamp**: 2025-12-08 21:04:01.262
- **Endpoint**: POST /api/events
- **Status**: 500
- **Fichier**: `api/events.js:165`

### Analyse

Lors de la création d'un événement, le code tente d'écrire dans un champ `owner_user_id` qui n'existe pas dans la table Airtable `Events`.

```javascript
const airtableData = {
  fields: {
    eventId: eventId,
    type: eventData.type,
    organizerName: eventData.organizerName,
    organizerEmail: eventData.organizerEmail || '',
    owner_user_id: eventData.clerkUserId || '',  // ❌ CE CHAMP N'EXISTE PAS
    location: eventData.location || '',
    // ...
  }
};
```

**Problème identifié** :
- Le champ `owner_user_id` n'existe pas dans le schéma Airtable de la table `Events`
- Cette erreur empêche complètement la création d'événements

### Impact

Cette erreur est **bloquante** :
- Tous les utilisateurs connectés qui tentent de créer un événement reçoivent une erreur 500
- Aucun événement ne peut être créé tant que ce champ existe dans le code

### Solutions possibles

**Option 1 : Retirer le champ (recommandé si non utilisé)**

Si le champ n'est pas utilisé ailleurs dans l'application :

```javascript
const airtableData = {
  fields: {
    eventId: eventId,
    type: eventData.type,
    organizerName: eventData.organizerName,
    organizerEmail: eventData.organizerEmail || '',
    // ✅ Retirer owner_user_id
    location: eventData.location || '',
    // ...
  }
};
```

**Option 2 : Créer le champ dans Airtable**

Si le champ est nécessaire pour la fonctionnalité multi-utilisateurs :

1. Aller dans la table Airtable `Events`
2. Créer un nouveau champ `owner_user_id` de type "Single line text"
3. Redéployer l'application

**Option 3 : Renommer le champ**

Vérifier le schéma Airtable et utiliser le bon nom de champ. Exemples possibles :
- `clerk_user_id`
- `user_id`
- `created_by`

---

## Actions prioritaires

### Urgence HAUTE

1. **Corriger l'erreur `owner_user_id`** (BLOQUANT)
   - Vérifier le schéma Airtable de la table Events
   - Soit retirer le champ, soit créer le champ manquant
   - Redéployer sur Vercel

2. **Ajouter la validation dans Team API**
   - Ajouter la vérification de `response.ok`
   - Gérer le cas où `data.records` est undefined
   - Améliorer les messages d'erreur

### Recommandations générales

1. **Validation systématique des réponses Airtable**
   - Toujours vérifier `response.ok` avant de parser le JSON
   - Valider la structure de la réponse (`data.records`, `data.fields`, etc.)
   - Logger les erreurs avec plus de détails

2. **Tests en staging**
   - Tester la création d'événements avec un utilisateur connecté
   - Tester l'API Team avec différents scénarios (0 membres, plusieurs membres, erreur Airtable)

3. **Monitoring**
   - Configurer des alertes Vercel pour les erreurs 500
   - Ajouter plus de logs pour faciliter le debugging

---

## Checklist de correction

- [ ] Vérifier le schéma Airtable de la table Events
- [ ] Corriger ou retirer le champ `owner_user_id` dans `api/events.js:165`
- [ ] Ajouter la validation de réponse dans `api/team.js:getTeamMembers()`
- [ ] Tester la création d'événement en local
- [ ] Tester l'API Team avec différents cas
- [ ] Déployer sur Vercel
- [ ] Vérifier les logs Vercel après déploiement

---

## Logs complets de référence

```
DEC 08 21:03:18.61  GET  304  synkro-app-b...  /api/event-utils
DEC 08 21:03:18.61  GET  200  synkro-app-b...  /api/user
DEC 08 21:03:19.29  GET  500  synkro-app-b...  /api/team
DEC 08 21:04:00.43  POST 500  synkro-app-b...  /api/events
```

**Log Team API** :
```
Team API error: TypeError: Cannot read properties of undefined (reading 'map')
    at getTeamMembers (file:///var/task/api/team.js:52:32)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async Object.handler (file:///var/task/api/team.js:20:16)
```

**Log Events API** :
```
Creating event with ID: evt_1765224240903_532x6v8sb
Airtable error: {"error":{"type":"UNKNOWN_FIELD_NAME","message":"Unknown field name: \"owner_user_id\""}}
```

---

**Rapport généré le** : 8 décembre 2025
**Analysé par** : Claude (AI Assistant)
**Priorité** : HAUTE - Erreurs bloquantes en production
