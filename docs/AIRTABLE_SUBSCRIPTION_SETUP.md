# Configuration Airtable pour les Abonnements Stripe

## Problème résolu

Lorsqu'un utilisateur effectue un paiement Stripe, son forfait Pro n'était pas débloqué car les données n'étaient jamais enregistrées dans Airtable.

## Solution implémentée

Le webhook Stripe enregistre maintenant automatiquement le plan de l'utilisateur dans Airtable lors du paiement.

## Champs requis dans la table "Users" d'Airtable

Assurez-vous que votre table **Users** dans Airtable contient les champs suivants :

### Champs existants (à vérifier)
- `email` (Single line text) - **OBLIGATOIRE**
- `clerk_user_id` (Single line text)
- `plan` (Single select: gratuit, pro, entreprise) - **OBLIGATOIRE**
- `created_at` (Date)
- `events_created_this_month` (Number)
- `events_limit` (Number)
- `theme_color` (Single line text)
- `hide_branding` (Checkbox)

### Nouveaux champs à ajouter (pour Stripe)
- `stripe_customer_id` (Single line text)
- `stripe_subscription_id` (Single line text)
- `subscription_status` (Single select: active, past_due, canceled, unpaid)
- `subscription_period_end` (Date)

## Comment ajouter les champs manquants

1. Ouvrez votre base Airtable
2. Allez dans la table **Users**
3. Cliquez sur **+ (Add field)** à droite des colonnes
4. Pour chaque champ manquant :
   - **stripe_customer_id**
     - Type : Single line text
   - **stripe_subscription_id**
     - Type : Single line text
   - **subscription_status**
     - Type : Single select
     - Options : `active`, `past_due`, `canceled`, `unpaid`
   - **subscription_period_end**
     - Type : Date
     - Include time: Yes

## Flux de fonctionnement

### 1. Paiement réussi (checkout.session.completed)
- Le webhook Stripe reçoit l'événement
- Il cherche l'utilisateur dans Airtable par email
- Si l'utilisateur existe : met à jour son plan (pro/entreprise)
- Si l'utilisateur n'existe pas : crée un nouvel enregistrement

### 2. Mise à jour d'abonnement (customer.subscription.updated)
- Met à jour le statut de l'abonnement
- Met à jour la date de fin de période

### 3. Annulation d'abonnement (customer.subscription.deleted)
- Remet le plan à "gratuit"
- Met le statut à "canceled"
- Remet la limite d'événements à 5

## Test du système

### Option 1 : Paiement test (recommandé)
1. Utilisez la carte de test Stripe : `4242 4242 4242 4242`
2. Date d'expiration : n'importe quelle date future
3. CVC : n'importe quel 3 chiffres
4. Complétez le paiement
5. Vérifiez dans Airtable que le champ `plan` est bien mis à jour

### Option 2 : Webhook manuel (avancé)
1. Allez sur le dashboard Stripe → Webhooks
2. Sélectionnez votre endpoint webhook
3. Cliquez sur "Send test webhook"
4. Choisissez `checkout.session.completed`
5. Vérifiez dans Airtable

## Vérification après paiement

Après un paiement réussi, vérifiez dans Airtable que :
- ✅ Le champ `plan` est à "pro" ou "entreprise"
- ✅ Le champ `stripe_customer_id` est rempli
- ✅ Le champ `stripe_subscription_id` est rempli
- ✅ Le champ `subscription_status` est à "active"
- ✅ Le champ `subscription_period_end` contient la bonne date

## Debugging

Si le forfait ne se débloque toujours pas :

### 1. Vérifier les logs Vercel
```bash
vercel logs
```

Cherchez les messages :
- ✅ `User plan updated in Airtable to: pro`
- ❌ `Error updating user in Airtable`

### 2. Vérifier les variables d'environnement
- `AIRTABLE_TOKEN` : doit être configuré
- `AIRTABLE_BASE_ID` : doit être configuré
- `STRIPE_WEBHOOK_SECRET` : doit être configuré

### 3. Vérifier les webhooks Stripe
1. Dashboard Stripe → Developers → Webhooks
2. Vérifiez que l'endpoint est actif
3. Regardez l'historique des événements
4. Vérifiez que `checkout.session.completed` est bien reçu

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs Vercel
2. Vérifiez les logs Stripe webhook
3. Vérifiez que tous les champs Airtable existent
4. Vérifiez que les variables d'environnement sont bien configurées
