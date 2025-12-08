# 📡 Documentation API Synkro

Documentation complète des endpoints API disponibles dans Synkro.

---

## Table des matières

1. [Authentification](#authentification)
2. [Événements](#événements)
3. [Utilisateurs & Statistiques](#utilisateurs--statistiques)
4. [Paiements Stripe](#paiements-stripe)
5. [Emails & Notifications](#emails--notifications)
6. [Calendrier](#calendrier)
7. [Analytics](#analytics)
8. [Newsletter](#newsletter)

---

## Authentification

L'authentification est gérée par **Clerk**. Aucun endpoint API spécifique n'est nécessaire car Clerk fournit ses propres APIs.

### Configuration requise

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Événements

### 🔵 GET `/api/events`

Récupère un ou plusieurs événements.

**Query Parameters:**
- `action` (string, optional): `get` pour récupérer un événement spécifique
- `id` (string, required si action=get): ID de l'événement
- `email` (string, optional): Email de l'organisateur pour filtrer

**Exemples:**

```bash
# Récupérer un événement spécifique
GET /api/events?action=get&id=abc123

# Récupérer tous les événements d'un utilisateur
GET /api/events?email=user@example.com
```

**Réponse (succès):**

```json
{
  "success": true,
  "event": {
    "eventId": "abc123",
    "type": "Dîner entre amis",
    "organizerName": "John Doe",
    "organizerEmail": "john@example.com",
    "location": "Restaurant XYZ",
    "expectedParticipants": 10,
    "totalResponded": 7,
    "status": "active",
    "dates": [...],
    "participants": [...],
    "confirmedDate": null,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### 🟢 POST `/api/events`

Crée un nouvel événement.

**Headers:**
```
Content-Type: application/json
```

**Body:**

```json
{
  "eventId": "unique-event-id",
  "type": "Dîner entre amis",
  "organizerName": "John Doe",
  "organizerEmail": "john@example.com",
  "location": "Restaurant XYZ",
  "eventSchedule": "Dîner à 20h",
  "expectedParticipants": 10,
  "dates": [
    { "date": "2025-02-15", "label": "Vendredi 15 février" },
    { "date": "2025-02-16", "label": "Samedi 16 février" }
  ],
  "budgetVoteEnabled": false,
  "budgetRanges": [],
  "cagnotteLink": ""
}
```

**Réponse (succès):**

```json
{
  "success": true,
  "event": { ... },
  "recordId": "recXXXXXXXXXXXXXX"
}
```

---

### 🟡 PATCH `/api/events`

Met à jour un événement existant (ajout de participants, confirmation de date, etc.).

**Body:**

```json
{
  "eventId": "abc123",
  "action": "add_participant",
  "participant": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "selectedDates": ["2025-02-15"],
    "budgetVote": "20-50€"
  }
}
```

**Actions disponibles:**
- `add_participant`: Ajouter un participant
- `confirm_date`: Confirmer une date
- `update_status`: Mettre à jour le statut

---

## Utilisateurs & Statistiques

### 🔵 GET `/api/get-user-stats`

Récupère les statistiques d'un utilisateur.

**Query Parameters:**
- `email` (string, required): Email de l'utilisateur

**Exemple:**

```bash
GET /api/get-user-stats?email=user@example.com
```

**Réponse:**

```json
{
  "success": true,
  "email": "user@example.com",
  "plan": "pro",
  "eventsCreatedThisMonth": 3,
  "eventsLimit": 15,
  "isNewUser": false,
  "subscription": {
    "status": "active",
    "stripeCustomerId": "cus_xxx",
    "stripeSubscriptionId": "sub_xxx"
  }
}
```

---

### 🔵 GET `/api/sync-user-plan`

Synchronise manuellement le plan Stripe d'un utilisateur vers Airtable.

**Query Parameters:**
- `email` (string, required): Email de l'utilisateur

**Exemple:**

```bash
GET /api/sync-user-plan?email=user@example.com
```

---

### 🟢 POST `/api/settings`

Sauvegarde les préférences utilisateur (IA, personnalisation).

**Body:**

```json
{
  "email": "user@example.com",
  "aiPreferences": {
    "enableSmartSuggestions": true,
    "preferredTimeSlots": ["evening"]
  },
  "customization": {
    "theme": "purple",
    "hideBranding": false
  }
}
```

---

## Paiements Stripe

### 🟢 POST `/api/create-checkout-session`

Crée une session de paiement Stripe Checkout.

**Body:**

```json
{
  "priceId": "price_xxx",
  "email": "user@example.com",
  "successUrl": "https://synkro.app/success",
  "cancelUrl": "https://synkro.app/cancel"
}
```

**Réponse:**

```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxx"
}
```

---

### 🟢 POST `/api/stripe-webhook`

Webhook Stripe pour gérer les événements de paiement.

**Headers:**
```
stripe-signature: xxx
```

**Événements gérés:**
- `checkout.session.completed`: Paiement complété
- `customer.subscription.created`: Abonnement créé
- `customer.subscription.updated`: Abonnement mis à jour
- `customer.subscription.deleted`: Abonnement annulé
- `invoice.payment_succeeded`: Paiement de facture réussi
- `invoice.payment_failed`: Échec de paiement

**⚠️ Important:** Ce webhook doit être configuré dans le Dashboard Stripe.

---

## Emails & Notifications

### 🟢 POST `/api/send-email`

Envoie un email via Resend.

**Body:**

```json
{
  "to": "user@example.com",
  "subject": "Votre événement Synkro",
  "html": "<h1>Bonjour</h1><p>Votre événement est confirmé !</p>"
}
```

**Configuration requise:**

```env
RESEND_API_KEY=re_xxx
```

---

### 🟢 POST `/api/send-reminder`

Envoie un rappel aux participants.

**Body:**

```json
{
  "eventId": "abc123",
  "organizerEmail": "organizer@example.com"
}
```

---

## Calendrier

### 🔵 GET `/api/generate-ics`

Génère un fichier .ics pour ajouter l'événement au calendrier.

**Query Parameters:**
- `title` (string, required): Titre de l'événement
- `start` (string, required): Date/heure de début (ISO 8601)
- `end` (string, required): Date/heure de fin (ISO 8601)
- `location` (string, optional): Lieu
- `description` (string, optional): Description

**Exemple:**

```bash
GET /api/generate-ics?title=Dîner&start=2025-02-15T20:00:00Z&end=2025-02-15T23:00:00Z&location=Restaurant
```

**Réponse:**

Télécharge un fichier `.ics` compatible avec:
- Google Calendar
- Apple Calendar
- Outlook Calendar
- Tous les clients de calendrier compatibles iCalendar

---

## Analytics

### 🔵 GET `/api/get-analytics`

Récupère les analytics détaillées d'un utilisateur.

**Query Parameters:**
- `email` (string, required): Email de l'utilisateur

**Exemple:**

```bash
GET /api/get-analytics?email=user@example.com
```

**Réponse:**

```json
{
  "success": true,
  "analytics": {
    "totalEvents": 12,
    "totalParticipants": 87,
    "averageResponseRate": 85,
    "averageResponseTime": "2.4h",
    "bestDay": "Samedi",
    "bestDayPercentage": 72,
    "monthlyTrend": [
      { "month": "Jan 25", "count": 3 },
      { "month": "Fév 25", "count": 5 },
      { "month": "Mar 25", "count": 4 }
    ],
    "topEventTypes": [
      { "type": "Dîner entre amis", "count": 5 },
      { "type": "Réunion d'équipe", "count": 3 }
    ]
  }
}
```

---

## Newsletter

### 🟢 POST `/api/newsletter-signup`

Enregistre un email pour la newsletter.

**Body:**

```json
{
  "email": "user@example.com"
}
```

**Réponse:**

```json
{
  "success": true,
  "message": "Email enregistré avec succès",
  "recordId": "recXXXXXXXXXXXXXX",
  "alreadyExists": false
}
```

---

## Codes de statut HTTP

| Code | Signification |
|------|---------------|
| `200` | Succès |
| `201` | Ressource créée |
| `400` | Requête invalide |
| `401` | Non authentifié |
| `403` | Non autorisé |
| `404` | Ressource non trouvée |
| `405` | Méthode non autorisée |
| `500` | Erreur serveur |

---

## Variables d'environnement requises

### Airtable

```env
AIRTABLE_TOKEN=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

### Stripe

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
VITE_STRIPE_PRICE_GRATUIT=price_xxx
VITE_STRIPE_PRICE_PRO_MONTHLY=price_xxx
VITE_STRIPE_PRICE_PRO_YEARLY=price_xxx
VITE_STRIPE_PRICE_ENTREPRISE_MONTHLY=price_xxx
VITE_STRIPE_PRICE_ENTREPRISE_YEARLY=price_xxx
```

### Clerk

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

### Resend

```env
RESEND_API_KEY=re_xxx
```

---

## Gestion des erreurs

Toutes les APIs retournent un objet JSON avec la structure suivante en cas d'erreur:

```json
{
  "success": false,
  "error": "Message d'erreur descriptif"
}
```

---

## Rate Limiting

⚠️ **Important:** Les endpoints API sont déployés sur Vercel avec le plan Hobby qui a des limites:

- **Durée d'exécution max:** 10 secondes
- **Taille de réponse max:** 4.5 MB
- **Nombre de fonctions:** Limité selon le plan

Pour un usage intensif, considérez un upgrade vers Vercel Pro.

---

## Support & Contact

Pour toute question sur l'API:
- 📧 Email: support@synkro.app (placeholder)
- 📚 Documentation: https://synkro.app/docs (placeholder)
- 🐛 Issues: GitHub Issues

---

**Dernière mise à jour:** Décembre 2025
**Version API:** 1.0.0
