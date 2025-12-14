# 💳 Configuration des Paiements Stripe - Guide Complet

Ce guide vous explique comment configurer les paiements Stripe pour activer les abonnements Pro et Entreprise dans Synkro.

---

## 📋 Pré-requis

- Un compte Stripe (gratuit) : https://dashboard.stripe.com/register
- Accès à votre tableau de bord Stripe
- Les variables d'environnement Airtable et Resend déjà configurées

---

## 🚀 Étape 1 : Créer un compte Stripe

1. Allez sur https://dashboard.stripe.com/register
2. Créez votre compte Stripe
3. Activez votre compte (vérification email + informations entreprise)

> **Note** : Vous pouvez commencer en mode TEST sans activer complètement votre compte.

---

## 🔑 Étape 2 : Récupérer vos clés API

### Mode TEST (développement)

1. Allez sur https://dashboard.stripe.com/test/apikeys
2. Copiez vos clés :
   - **Publishable key** : `pk_test_xxxxxxxxxxxxx`
   - **Secret key** : `sk_test_xxxxxxxxxxxxx`

### Mode LIVE (production)

1. Allez sur https://dashboard.stripe.com/apikeys
2. Copiez vos clés :
   - **Publishable key** : `pk_live_xxxxxxxxxxxxx`
   - **Secret key** : `sk_live_xxxxxxxxxxxxx`

> ⚠️ **IMPORTANT** : Ne JAMAIS commiter la Secret Key dans Git !

---

## 📦 Étape 3 : Créer vos produits et prix

### 1. Créer le produit "Synkro Pro"

1. Allez sur https://dashboard.stripe.com/test/products
2. Cliquez sur **"+ New"** ou **"Ajouter un produit"**
3. Remplissez :
   - **Name** : `Synkro Pro`
   - **Description** : `Abonnement Pro pour Synkro - 15 événements/mois, 50 participants`
   - **Image** : (optionnel)

4. **Pricing** :

   **Prix Mensuel :**
   - Model : `Standard pricing`
   - Price : `19` EUR
   - Billing period : `Monthly`
   - Cliquez sur **"Save product"**
   - Copiez le **Price ID** : `price_xxxxxxxxxxxxx` ← **VITE_STRIPE_PRICE_PRO_MONTHLY**

5. **Ajouter le prix annuel** :
   - Dans la page du produit, cliquez sur **"Add another price"**
   - Price : `15` EUR (économie de 20%)
   - Billing period : `Monthly`
   - **Custom** : `Every 12 months` (annuel)
   - Copiez le **Price ID** : `price_xxxxxxxxxxxxx` ← **VITE_STRIPE_PRICE_PRO_YEARLY**

### 2. Créer le produit "Synkro Entreprise"

1. Répétez le processus ci-dessus
2. **Name** : `Synkro Entreprise`
3. **Description** : `Abonnement Entreprise - Événements illimités, Analytics avancées`

4. **Prix Mensuel** :
   - Price : `49` EUR
   - Billing : `Monthly`
   - Copiez le Price ID ← **VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY**

5. **Prix Annuel** :
   - Price : `40` EUR
   - Billing : `Every 12 months`
   - Copiez le Price ID ← **VITE_STRIPE_PRICE_ENTERPRISE_YEARLY**

---

## 🔗 Étape 4 : Configurer le Webhook

Les webhooks permettent à Stripe de notifier votre application quand un paiement est effectué.

### Mode TEST (développement local)

1. Installez Stripe CLI :
   ```bash
   # macOS (Homebrew)
   brew install stripe/stripe-cli/stripe

   # Windows (Scoop)
   scoop install stripe

   # Linux
   wget https://github.com/stripe/stripe-cli/releases/download/v1.19.5/stripe_1.19.5_linux_x86_64.tar.gz
   tar -xvf stripe_1.19.5_linux_x86_64.tar.gz
   sudo mv stripe /usr/local/bin
   ```

2. Connectez-vous à Stripe :
   ```bash
   stripe login
   ```

3. Lancez le webhook en local :
   ```bash
   stripe listen --forward-to http://localhost:5173/api/stripe-webhook
   ```

4. Copiez le **webhook secret** affiché : `whsec_xxxxxxxxxxxxx`

### Mode PRODUCTION (Vercel)

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez sur **"Add endpoint"**
3. **Endpoint URL** : `https://getsynkro.com/api/stripe-webhook`
4. **Events to send** : Sélectionnez :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`

5. Cliquez sur **"Add endpoint"**
6. Copiez le **Signing secret** : `whsec_xxxxxxxxxxxxx`

---

## ⚙️ Étape 5 : Configurer les variables d'environnement

### Fichier `.env` (local)

Créez ou modifiez votre fichier `.env` :

```env
# Stripe Configuration (MODE TEST)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Price IDs
VITE_STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxxxxxxxxxx
```

### Variables Vercel (production)

1. Allez sur https://vercel.com/chevalierbj-ship-it/synkro-app/settings/environment-variables
2. Ajoutez les mêmes variables (utilisez les clés LIVE cette fois) :
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `VITE_STRIPE_PRICE_PRO_MONTHLY`
   - `VITE_STRIPE_PRICE_PRO_YEARLY`
   - `VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY`
   - `VITE_STRIPE_PRICE_ENTERPRISE_YEARLY`

3. **Redéployez** votre application après avoir ajouté les variables

---

## 🧪 Étape 6 : Tester le flux de paiement

### Mode TEST

1. Lancez votre serveur local :
   ```bash
   npm run dev
   ```

2. Lancez le webhook listener (dans un autre terminal) :
   ```bash
   stripe listen --forward-to http://localhost:5173/api/stripe-webhook
   ```

3. Allez sur http://localhost:5173/pricing

4. Cliquez sur **"Essayer Pro"**

5. Utilisez une carte de test Stripe :
   - **Numéro** : `4242 4242 4242 4242`
   - **Date** : n'importe quelle date future (ex: `12/25`)
   - **CVC** : n'importe quel code 3 chiffres (ex: `123`)
   - **Email** : votre email de test

6. Validez le paiement

7. Vous devriez être redirigé vers `/success` 🎉

8. Vérifiez :
   - ✅ Email de confirmation reçu
   - ✅ Webhook reçu dans le terminal
   - ✅ Paiement visible dans https://dashboard.stripe.com/test/payments

---

## ✅ Checklist de vérification

Avant de passer en production, vérifiez :

- [ ] Compte Stripe créé et activé
- [ ] Produits "Synkro Pro" et "Synkro Entreprise" créés
- [ ] 4 Price IDs copiés (Pro mensuel/annuel, Entreprise mensuel/annuel)
- [ ] Clés API copiées (Publishable + Secret)
- [ ] Webhook configuré et secret copié
- [ ] Variables d'environnement configurées dans `.env`
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Test de paiement réussi en mode TEST
- [ ] Email de confirmation reçu après paiement test
- [ ] Passage en mode LIVE avec les vraies clés

---

## 📊 Tableau de bord Stripe

Après configuration, vous pourrez suivre :

- 💳 **Paiements** : https://dashboard.stripe.com/payments
- 📊 **Abonnements** : https://dashboard.stripe.com/subscriptions
- 👥 **Clients** : https://dashboard.stripe.com/customers
- 🔔 **Webhooks** : https://dashboard.stripe.com/webhooks
- 📈 **Analytics** : https://dashboard.stripe.com/dashboard

---

## 🚨 Dépannage

### Erreur : "Stripe n'est pas configuré"

➡️ Vérifiez que les variables `VITE_STRIPE_PRICE_*` sont bien définies dans `.env`

### Erreur : "Webhook signature verification failed"

➡️ Vérifiez que `STRIPE_WEBHOOK_SECRET` correspond au secret du webhook

### Aucun email reçu après paiement

➡️ Vérifiez que `RESEND_API_KEY` est bien configurée

### Le bouton ne fait rien

➡️ Ouvrez la console du navigateur pour voir les erreurs JavaScript

---

## 📚 Ressources

- **Documentation Stripe** : https://stripe.com/docs
- **Dashboard Stripe TEST** : https://dashboard.stripe.com/test/dashboard
- **Dashboard Stripe LIVE** : https://dashboard.stripe.com/dashboard
- **Cartes de test** : https://stripe.com/docs/testing
- **Stripe CLI** : https://stripe.com/docs/stripe-cli

---

## 💡 Conseils

1. **Toujours tester en mode TEST** avant de passer en production
2. **Ne jamais commiter** les clés secrètes dans Git
3. **Activer l'authentification 2FA** sur votre compte Stripe
4. **Surveiller les webhooks** dans le dashboard pour détecter les erreurs
5. **Configurer les emails de reçu** dans Stripe (Settings > Customer emails)

---

Besoin d'aide ? Consultez la documentation complète dans `/docs/STRIPE_WEBHOOK_SETUP.md`
