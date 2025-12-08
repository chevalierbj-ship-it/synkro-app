# Structure de la table Airtable : Synkro_Events

## Configuration requise

**Nom de la table :** `Synkro_Events` ou selon votre variable d'environnement `AIRTABLE_EVENTS_TABLE_ID`

---

## Champs requis (21 champs)

| Nom du champ | Type Airtable | Description | Exemple | Obligatoire |
|--------------|---------------|-------------|---------|-------------|
| `eventId` | Single line text | ID unique de l'événement | `evt_1765226960529_hnaxw6zwz` | ✅ Oui |
| `type` | Single line text | Type d'événement | `Anniversaire`, `Réunion`, etc. | ✅ Oui |
| `organizerName` | Single line text | Nom de l'organisateur | `Jean Dupont` | ✅ Oui |
| `organizerEmail` | Email | Email de l'organisateur | `jean@example.com` | ✅ Oui |
| `location` | Long text | Lieu de l'événement | `Paris, France` | Non |
| `eventSchedule` | Long text | Déroulement prévu | `10h: Accueil\n11h: Déjeuner` | Non |
| `expectedParticipants` | Number (Integer) | Nombre de participants attendus | `20` | Non |
| `dates` | Long text | Dates proposées (JSON) | `[{"label":"Lundi 10/12","votes":5}]` | ✅ Oui |
| `participants` | Long text | Liste des participants (JSON) | `[{"name":"Alice","email":"..."}]` | Non |
| `totalResponded` | Number (Integer) | Nombre de réponses reçues | `8` | Non |
| `status` | Single select | Statut de l'événement | `active`, `archived`, `cancelled` | Non |
| `budgetVoteEnabled` | Checkbox | Vote budget activé | `true` / `false` | Non |
| `budgetRanges` | Long text | Fourchettes de budget (JSON) | `["0-50€","50-100€"]` | Non |
| `budgetVotes` | Long text | Votes budget (JSON) | `[{"range":"0-50€","votes":3}]` | Non |
| `cagnotteLink` | URL | Lien vers la cagnotte | `https://lydia.com/...` | Non |
| `useAI` | Checkbox | Utilisation de l'IA | `true` / `false` | Non |
| `ai_preferences` | Long text | Préférences IA (JSON) | `[]` | Non |
| `shared_with` | Long text | Partages (JSON) | `[{"userId":"user_123","permission":"editor"}]` | Non |
| `previousParticipationRate` | Number (Integer) | Taux de participation précédent (%) | `70` | Non |
| `createdAt` | Date | Date de création | `2025-12-08T20:49:20.530Z` | Non |
| `clerk_user_id` | Single line text | ID Clerk du créateur (optionnel) | `user_2abc...` | Non |

---

## Options Single Select pour le champ `status`

Créez ces 3 options dans Airtable :
- `active` (par défaut) - Couleur verte
- `archived` - Couleur grise
- `cancelled` - Couleur rouge

---

## Configuration des champs JSON (Long text)

Les champs suivants contiennent du JSON stringifié :
- `dates`
- `participants`
- `budgetRanges`
- `budgetVotes`
- `ai_preferences`
- `shared_with`

⚠️ **Important :** Ces champs doivent être de type **"Long text"** (pas "Single line text") car le JSON peut dépasser 100 caractères.

---

## Exemples de données JSON

### `dates` (array d'objets)
```json
[
  {
    "label": "Lundi 10 décembre 2025",
    "votes": 5,
    "voters": ["Alice", "Bob", "Charlie"]
  },
  {
    "label": "Mardi 11 décembre 2025",
    "votes": 3,
    "voters": ["Alice", "David"]
  }
]
```

### `participants` (array d'objets)
```json
[
  {
    "name": "Alice Dupont",
    "email": "alice@example.com",
    "availabilities": {
      "Lundi 10 décembre 2025": true,
      "Mardi 11 décembre 2025": false
    },
    "selectedBudget": "50-100€",
    "votedAt": "2025-12-08T20:30:00.000Z"
  }
]
```

### `shared_with` (array d'objets) - ⚠️ CHAMP MANQUANT
```json
[
  {
    "userId": "user_2abc123",
    "permission": "editor",
    "sharedAt": "2025-12-08T20:00:00.000Z"
  }
]
```

### `budgetRanges` (array de strings)
```json
["0-50€", "50-100€", "100-200€", "200€+"]
```

### `budgetVotes` (array d'objets)
```json
[
  {
    "range": "0-50€",
    "votes": 3,
    "voters": ["Alice", "Bob", "Charlie"]
  }
]
```

### `ai_preferences` (array)
```json
[]
```

---

## Comment créer ces champs dans Airtable

1. Allez dans votre base Airtable
2. Ouvrez la table `Synkro_Events`
3. Cliquez sur "+" pour ajouter un nouveau champ
4. Pour chaque champ, sélectionnez le bon type :
   - **Single line text** : Pour les IDs, noms, types
   - **Email** : Pour organizerEmail
   - **Long text** : Pour tous les champs JSON et les descriptions longues
   - **Number** : Pour expectedParticipants, totalResponded, previousParticipationRate
   - **Checkbox** : Pour budgetVoteEnabled, useAI
   - **Single select** : Pour status (avec les 3 options)
   - **URL** : Pour cagnotteLink
   - **Date** : Pour createdAt

---

## Champs manquants actuellement (d'après votre erreur)

Vous devez créer le champ : **`shared_with`** (Long text)

---

## Vérification rapide

Pour vérifier que votre table est complète, vous devriez avoir **21 colonnes** au total.

Si certains champs manquent, votre application ne pourra pas créer d'événements.
