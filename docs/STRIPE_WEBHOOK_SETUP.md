# 🔔 Configuration des Webhooks Stripe

Ce guide explique comment configurer les webhooks Stripe pour Synkro.

## 📋 Table des matières

1. [Qu'est-ce qu'un webhook Stripe ?](#quest-ce-quun-webhook-stripe-)
2. [Configuration en production](#configuration-en-production)
3. [Configuration en développement local](#configuration-en-développement-local)
4. [Événements gérés](#événements-gérés)
5. [Dépannage](#dépannage)

---

## Qu'est-ce qu'un webhook Stripe ?

Un webhook Stripe est un endpoint HTTP qui reçoit des notifications en temps réel lorsque des événements se produisent dans votre compte Stripe (paiements, abonnements, etc.).

**Notre endpoint :** `https://[votre-domaine].vercel.app/api/stripe-webhook`

---

## Configuration en production

### Étape 1 : Déployer l'application sur Vercel

Assurez-vous que votre application est déployée avec le fichier `/api/stripe-webhook.js`.

### Étape 2 : Configurer le webhook sur Stripe Dashboard

1. Allez sur [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)

2. Cliquez sur **"Add endpoint"**

3. Renseignez l'URL de votre endpoint :
   ```
   https://getsynkro.com/api/stripe-webhook
   ```
   _(Remplacez par votre domaine de production)_

4. Sélectionnez les événements à écouter :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
   - ✅ `invoice.payment_succeeded`

   > 💡 **Astuce :** Vous pouvez aussi choisir "Recevoir tous les événements" et filtrer dans le code.

5. Cliquez sur **"Add endpoint"**

### Étape 3 : Copier le Webhook Secret

1. Après avoir créé l'endpoint, cliquez dessus

2. Dans la section **"Signing secret"**, cliquez sur **"Reveal"**

3. Copiez le secret (commence par `whsec_`)

4. Ajoutez-le dans votre fichier `.env.local` :
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

5. Sur Vercel, ajoutez la variable d'environnement :
   - Allez dans **Settings** → **Environment Variables**
   - Ajoutez `STRIPE_WEBHOOK_SECRET` avec la valeur copiée

6. **Redéployez votre application** pour que la variable soit prise en compte

### Étape 4 : Tester le webhook

1. Sur Stripe Dashboard, cliquez sur votre webhook

2. Cliquez sur l'onglet **"Send test webhook"**

3. Sélectionnez `checkout.session.completed`

4. Cliquez sur **"Send test webhook"**

5. Vérifiez que le statut est **✅ Succeeded**

---

## Configuration en développement local

Pour tester les webhooks en local, utilisez le **Stripe CLI**.

### Étape 1 : Installer Stripe CLI

#### macOS
```bash
brew install stripe/stripe-cli/stripe
```

#### Linux
```bash
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

#### Windows
Téléchargez depuis [github.com/stripe/stripe-cli/releases](https://github.com/stripe/stripe-cli/releases)

### Étape 2 : Authentifier Stripe CLI

```bash
stripe login
```

Suivez les instructions dans le terminal pour vous connecter.

### Étape 3 : Démarrer le serveur de développement

```bash
npm run dev
```

Votre application tourne maintenant sur `http://localhost:5173` (ou autre port Vite).

### Étape 4 : Créer un tunnel pour le webhook

Dans un **nouveau terminal**, lancez :

```bash
stripe listen --forward-to localhost:5173/api/stripe-webhook
```

Vous verrez un message comme :
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### Étape 5 : Configurer le webhook secret local

1. Copiez le `webhook signing secret` affiché

2. Ajoutez-le dans `.env.local` :
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

3. Redémarrez votre serveur de développement (`npm run dev`)

### Étape 6 : Tester un événement

Dans un **troisième terminal**, simulez un paiement :

```bash
stripe trigger checkout.session.completed
```

Vous devriez voir dans le terminal `stripe listen` :
```
✅ checkout.session.completed [evt_xxxxx]
```

Et dans les logs de votre serveur :
```
✅ Webhook signature verified: checkout.session.completed
💳 Checkout session completed: cs_xxxxx
```

---

## Événements gérés

Voici les événements Stripe que notre webhook gère :

| Événement | Description | Action |
|-----------|-------------|--------|
| `checkout.session.completed` | Paiement initial réussi | Activer l'abonnement premium |
| `customer.subscription.created` | Abonnement créé | Enregistrer dans la BDD |
| `customer.subscription.updated` | Abonnement modifié | Mettre à jour le statut |
| `customer.subscription.deleted` | Abonnement annulé | Révoquer l'accès premium |
| `invoice.payment_failed` | Échec de paiement | Envoyer un email d'alerte |
| `invoice.payment_succeeded` | Renouvellement réussi | Prolonger l'accès |

---

## Dépannage

### ❌ Erreur : "Webhook signature verification failed"

**Cause :** Le `STRIPE_WEBHOOK_SECRET` est incorrect ou manquant.

**Solution :**
1. Vérifiez que la variable est bien dans `.env.local`
2. Redémarrez votre serveur de développement
3. Sur Vercel, vérifiez que la variable est configurée et redéployez

### ❌ Erreur : "No signatures found matching the expected signature"

**Cause :** Le body de la requête a été modifié (parsing JSON automatique).

**Solution :**
- Vérifiez que `bodyParser: false` est bien dans la config de l'endpoint
- Assurez-vous que Vercel n'a pas de middleware qui parse le body

### ❌ Webhook timeout (30 secondes)

**Cause :** Le traitement est trop long.

**Solution :**
- Répondez rapidement à Stripe (`200 OK`)
- Effectuez les traitements longs de manière asynchrone
- Utilisez une queue (Redis, BullMQ) pour les traitements différés

### 🔍 Déboguer les webhooks

1. **Logs Stripe :**
   - Dashboard → Developers → Webhooks → [Votre endpoint] → Events

2. **Logs Vercel :**
   - Dashboard Vercel → Project → Functions → `/api/stripe-webhook`

3. **Logs locaux avec Stripe CLI :**
   ```bash
   stripe listen --forward-to localhost:5173/api/stripe-webhook --print-json
   ```

---

## 📚 Ressources

- [Documentation Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Événements Stripe](https://stripe.com/docs/api/events/types)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

---

## ✅ Checklist finale

Avant de passer en production :

- [ ] Webhook endpoint créé sur Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` configuré sur Vercel
- [ ] Application redéployée
- [ ] Webhook testé avec "Send test webhook"
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Mode LIVE activé sur Stripe (pas TEST)

---

**🎉 Votre webhook est prêt !**

Les paiements et abonnements seront maintenant gérés automatiquement.
