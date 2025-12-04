# Configuration de Synkro

Ce guide explique comment configurer les variables d'environnement nécessaires pour faire fonctionner Synkro.

## Variables d'environnement requises

### Airtable

Synkro utilise Airtable comme base de données. Vous devez configurer les variables suivantes :

- `AIRTABLE_TOKEN` : Votre token d'API Airtable (Personal Access Token)
- `AIRTABLE_BASE_ID` : L'ID de votre base Airtable
- `AIRTABLE_EVENTS_TABLE_ID` : L'ID de la table Events dans votre base

#### Comment obtenir ces valeurs ?

1. **AIRTABLE_TOKEN** :
   - Allez sur https://airtable.com/account
   - Section "Developer" > "Personal access tokens"
   - Créez un nouveau token avec les permissions nécessaires (read/write sur votre base)

2. **AIRTABLE_BASE_ID** :
   - Ouvrez votre base Airtable
   - L'URL ressemble à : `https://airtable.com/appXXXXXXXXXXXXXX/...`
   - Le `appXXXXXXXXXXXXXX` est votre BASE_ID

3. **AIRTABLE_EVENTS_TABLE_ID** :
   - Dans votre base, cliquez sur la table Events
   - Cliquez sur "..." > "Copy table ID"
   - OU utilisez directement le nom de la table (ex: `tblXXXXXXXXXXXXXX`)

### Resend (envoi d'emails)

- `RESEND_API_KEY` : Votre clé API Resend pour l'envoi d'emails

#### Comment obtenir cette valeur ?

1. Créez un compte sur https://resend.com
2. Allez dans "API Keys"
3. Créez une nouvelle clé API

## Configuration sur Vercel

1. Allez dans votre projet Vercel
2. Cliquez sur "Settings" > "Environment Variables"
3. Ajoutez les variables suivantes :
   - `AIRTABLE_TOKEN`
   - `AIRTABLE_BASE_ID`
   - `AIRTABLE_EVENTS_TABLE_ID`
   - `RESEND_API_KEY`

4. Redéployez votre application pour que les changements prennent effet

## Structure de la base Airtable

Votre base Airtable doit contenir les tables suivantes :

### Table "Events" (ou le nom que vous avez configuré)

Champs requis :
- `eventId` (Single line text) : Identifiant unique de l'événement
- `type` (Single line text) : Type d'événement
- `organizerName` (Single line text) : Nom de l'organisateur
- `organizerEmail` (Email) : Email de l'organisateur
- `location` (Single line text) : Lieu de l'événement
- `eventSchedule` (Long text) : Déroulé de l'événement
- `expectedParticipants` (Number) : Nombre de participants attendus
- `dates` (Long text) : JSON des dates proposées
- `participants` (Long text) : JSON des participants
- `totalResponded` (Number) : Nombre de réponses
- `status` (Single select) : Statut de l'événement
- `budgetVoteEnabled` (Checkbox) : Vote de budget activé
- `budgetRanges` (Long text) : JSON des tranches de budget
- `budgetVotes` (Long text) : JSON des votes de budget
- `cagnotteLink` (URL) : Lien vers la cagnotte

### Table "Users" (optionnelle, pour le freemium)

Champs :
- `email` (Email) : Email de l'utilisateur
- `plan` (Single select) : Plan de l'utilisateur (gratuit, pro, entreprise)
- `events_created_this_month` (Number) : Nombre d'événements créés ce mois
- `events_limit` (Number) : Limite d'événements par mois
- `created_at` (Date) : Date de création du compte
- `last_event_date` (Date) : Date du dernier événement

### Table "EventsLog" (optionnelle, pour le tracking)

Champs :
- `user_email` (Email) : Email de l'utilisateur
- `event_name` (Single line text) : Nom de l'événement
- `participants_count` (Number) : Nombre de participants
- `created_at` (Date) : Date de création
- `status` (Single select) : Statut

## Problèmes courants

### Erreur "Failed to create event in Airtable"

Cette erreur signifie que les variables d'environnement ne sont pas correctement configurées. Vérifiez que :
- Les 3 variables Airtable sont bien définies
- Le token a les permissions nécessaires
- Les IDs de base et de table sont corrects

### Emails non envoyés

Si les emails ne sont pas envoyés :
- Vérifiez que `RESEND_API_KEY` est bien configurée
- Vérifiez que votre compte Resend est actif
- Consultez les logs Vercel pour plus de détails

## Développement local

Pour développer en local :

1. Copiez `.env.example` vers `.env`
2. Remplissez les valeurs avec vos propres clés
3. Lancez le serveur de développement

```bash
npm install
npm run dev
```
