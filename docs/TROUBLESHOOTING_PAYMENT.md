# 🔧 Guide de Dépannage - Problèmes de Synchronisation des Paiements

## Problème : Le paiement est accepté mais le plan reste "gratuit"

### Symptômes
- ✅ Paiement Stripe accepté
- ✅ Email de confirmation reçu
- ❌ Le Dashboard affiche toujours "Forfait Gratuit"
- ❌ Les fonctionnalités premium ne sont pas débloquées

---

## 🔍 Diagnostic

### Étape 1 : Vérifier dans Airtable

1. Connectez-vous à Airtable
2. Ouvrez votre base de données Synkro
3. **IMPORTANT** : Regardez la table **"Users"**, PAS la table "EventsLog"
4. Cherchez votre utilisateur par email
5. Vérifiez le champ `plan` :
   - Devrait être `pro` ou `entreprise`
   - Si c'est `gratuit`, le webhook n'a pas mis à jour correctement

### Étape 2 : Vérifier les logs Vercel

1. Allez sur https://vercel.com
2. Sélectionnez votre projet `synkro-app`
3. Allez dans l'onglet **"Functions"** ou **"Logs"**
4. Cherchez les logs du webhook `/api/stripe-webhook`
5. Recherchez ces messages :
   - `✅✅✅ CHECKOUT COMPLETED SUCCESSFULLY` = Tout va bien
   - `❌❌❌ CHECKOUT COMPLETED BUT AIRTABLE UPDATE FAILED` = Problème détecté
   - Regardez les logs détaillés pour identifier l'erreur

### Étape 3 : Vérifier dans Stripe

1. Connectez-vous à Stripe Dashboard
2. Allez dans **"Customers"**
3. Cherchez votre email
4. Vérifiez qu'il y a un abonnement actif
5. Notez l'email exact utilisé (case-sensitive!)

---

## ✅ Solution : Synchronisation Manuelle

Si votre paiement Stripe est validé mais Airtable n'est pas à jour, utilisez l'endpoint de synchronisation :

### Option 1 : Via l'API directement

```bash
# Remplacez votre-email@example.com par votre vrai email
curl "https://synkro-app-bice.vercel.app/api/sync-user-plan?email=votre-email@example.com"
```

### Option 2 : Via le navigateur

1. Ouvrez votre navigateur
2. Collez cette URL (en remplaçant l'email) :
   ```
   https://synkro-app-bice.vercel.app/api/sync-user-plan?email=votre-email@example.com
   ```
3. Vous devriez voir une réponse JSON avec :
   ```json
   {
     "success": true,
     "message": "Synchronisation réussie",
     "data": {
       "previousPlan": "gratuit",
       "newPlan": "pro",
       ...
     }
   }
   ```

### Option 3 : Demander à l'équipe support

Envoyez un email à support@synkro.app avec :
- Votre adresse email
- La date du paiement
- Une capture d'écran de votre Dashboard

---

## 🐛 Causes Courantes

### 1. Email différent entre Clerk et Stripe
**Problème** : Vous utilisez `user@gmail.com` dans Clerk mais `user@company.com` pour payer dans Stripe

**Solution** :
- Utilisez toujours le même email
- OU utilisez l'endpoint de sync avec l'email Stripe

### 2. Variables d'environnement manquantes
**Problème** : `AIRTABLE_TOKEN` ou `AIRTABLE_BASE_ID` non configurés dans Vercel

**Solution** : Vérifiez dans Vercel > Settings > Environment Variables

### 3. Webhook Stripe non configuré
**Problème** : Le webhook n'est pas configuré dans Stripe

**Solution** :
1. Allez dans Stripe Dashboard > Developers > Webhooks
2. Vérifiez qu'il y a un endpoint vers `https://synkro-app-bice.vercel.app/api/stripe-webhook`
3. Vérifiez que ces événements sont activés :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 4. Structure de la table Airtable incorrecte
**Problème** : Les champs nécessaires n'existent pas dans la table Users

**Solution** : Assurez-vous que la table "Users" contient ces champs :
- `email` (Single line text)
- `plan` (Single select: gratuit, pro, entreprise)
- `stripe_customer_id` (Single line text)
- `stripe_subscription_id` (Single line text)
- `subscription_status` (Single line text)
- `subscription_period_end` (Date)
- `events_created_this_month` (Number)
- `events_limit` (Number)
- `created_at` (Date)

---

## 🔄 Après la Synchronisation

1. **Rafraîchissez votre Dashboard** (Ctrl+R ou Cmd+R)
2. **Déconnectez-vous et reconnectez-vous** si le problème persiste
3. **Videz le cache du navigateur** si nécessaire

---

## 📊 Monitoring

Pour surveiller les paiements futurs :

### Dans Vercel Logs
Cherchez ces indicateurs de succès :
```
✅ Determined plan: pro
✅ User found in Airtable, record ID: recXXX
✅ User plan updated in Airtable to: pro
✅ Payment event logged to EventsLog
✅✅✅ CHECKOUT COMPLETED SUCCESSFULLY
```

### Dans Airtable EventsLog
Après chaque paiement, un événement est loggé :
- `event_name` : "Payment: Pro - Monthly" ou "Payment: Pro - Yearly"
- `status` : "completed"
- `stripe_subscription_id` : rempli
- `subscription_status` : "active"

---

## 🆘 Support

Si rien ne fonctionne :

1. **Collectez les informations** :
   - Votre email exact
   - Capture d'écran de Stripe (abonnement actif)
   - Capture d'écran d'Airtable (table Users)
   - Logs Vercel du webhook (si accessibles)

2. **Créez un ticket** :
   - GitHub Issues : https://github.com/votre-repo/synkro-app/issues
   - Email : support@synkro.app

3. **En attendant** :
   - Vous pouvez utiliser l'endpoint de sync manuellement après chaque connexion
   - Ou demander un remboursement si le service n'est pas accessible

---

## ✅ Vérification Finale

Liste de contrôle pour confirmer que tout fonctionne :

- [ ] Le paiement Stripe est bien "paid" et "active"
- [ ] La table **Users** (pas EventsLog!) dans Airtable montre le bon plan
- [ ] Les champs Stripe (customer_id, subscription_id) sont remplis
- [ ] Le Dashboard affiche le bon plan après rafraîchissement
- [ ] Les fonctionnalités premium sont débloquées
- [ ] La limite d'événements a changé (gratuit: 5, pro: 15, entreprise: illimité)

---

**Mis à jour le** : {{ date }}
**Version** : 1.0
