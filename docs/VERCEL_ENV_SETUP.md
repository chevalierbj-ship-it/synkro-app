# Configuration des Variables d'Environnement sur Vercel

## 🎯 Problème
Lorsque vous déployez sur Vercel, le message d'erreur suivant apparaît sur `/pricing` :
```
Stripe n'est pas encore configuré. Veuillez configurer les Price IDs dans .env
```

## 💡 Solution
Les variables d'environnement doivent être configurées directement dans le Dashboard Vercel, car les fichiers `.env.local` ne sont PAS déployés sur Vercel (ils sont dans `.gitignore`).

---

## 📋 Étapes de Configuration

### 1️⃣ Accéder au Dashboard Vercel

1. Allez sur https://vercel.com/dashboard
2. Connectez-vous avec votre compte
3. Trouvez votre projet **synkro-app**
4. Cliquez sur le projet

### 2️⃣ Ajouter les Variables d'Environnement

1. Dans votre projet, cliquez sur **Settings** (en haut)
2. Dans le menu de gauche, cliquez sur **Environment Variables**
3. Ajoutez **chaque variable** une par une :

#### 📝 Où trouver vos valeurs ?

Toutes vos valeurs de variables se trouvent dans votre fichier **`.env.local`** à la racine du projet.

**⚠️ IMPORTANT :** Ne partagez JAMAIS vos clés secrètes publiquement !

#### Variables à ajouter dans Vercel

Pour chaque variable ci-dessous, copiez la valeur depuis votre `.env.local` :

**Variable 1 : VITE_STRIPE_PUBLISHABLE_KEY**
- **Name:** `VITE_STRIPE_PUBLISHABLE_KEY`
- **Value:** Copiez la valeur depuis `.env.local` (commence par `pk_test_...`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Cliquez **Save**

**Variable 2 : STRIPE_SECRET_KEY**
- **Name:** `STRIPE_SECRET_KEY`
- **Value:** Copiez la valeur depuis `.env.local` (commence par `sk_test_...`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Cliquez **Save**

**Variable 3 : VITE_STRIPE_PRICE_PRO_MONTHLY**
- **Name:** `VITE_STRIPE_PRICE_PRO_MONTHLY`
- **Value:** Copiez la valeur depuis `.env.local` (commence par `price_...`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Cliquez **Save**

**Variable 4 : VITE_STRIPE_PRICE_PRO_YEARLY**
- **Name:** `VITE_STRIPE_PRICE_PRO_YEARLY`
- **Value:** Copiez la valeur depuis `.env.local` (commence par `price_...`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Cliquez **Save**

**Variable 5 : VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY**
- **Name:** `VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY`
- **Value:** Copiez la valeur depuis `.env.local` (commence par `price_...`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Cliquez **Save**

**Variable 6 : VITE_STRIPE_PRICE_ENTERPRISE_YEARLY**
- **Name:** `VITE_STRIPE_PRICE_ENTERPRISE_YEARLY`
- **Value:** Copiez la valeur depuis `.env.local` (commence par `price_...`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Cliquez **Save**

#### Variables Clerk

**Variable 7 : VITE_CLERK_PUBLISHABLE_KEY**
- **Name:** `VITE_CLERK_PUBLISHABLE_KEY`
- **Value:** Copiez la valeur depuis `.env.local` (commence par `pk_test_...`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Cliquez **Save**

### 3️⃣ Redéployer l'Application

Après avoir ajouté toutes les variables :

1. Allez dans l'onglet **Deployments**
2. Trouvez le dernier déploiement
3. Cliquez sur les **trois points** (⋯) à droite
4. Cliquez sur **Redeploy**
5. Confirmez en cliquant **Redeploy** à nouveau

⏱️ Le redéploiement prend environ 1-2 minutes.

---

## ✅ Vérification

Une fois le redéploiement terminé :

1. Allez sur votre URL Vercel : `https://votre-app.vercel.app/pricing`
2. Cliquez sur **"Essayer Pro"**
3. Vous devriez maintenant être redirigé vers Stripe Checkout ✨

### Tester le Paiement (Mode Test)

Utilisez ces informations de carte de test :
- **Numéro :** `4242 4242 4242 4242`
- **Date :** `12/34` (ou toute date future)
- **CVC :** `123`
- **Code postal :** `75001`

---

## ⚠️ Important : Préfixe VITE_

Dans **Vite**, les variables d'environnement ont deux types :

| Type | Préfixe | Accessible | Usage |
|------|---------|------------|-------|
| **Publique** | `VITE_` | ✅ Frontend (React) | Clés publiques, Price IDs |
| **Secrète** | Pas de préfixe | ❌ Backend only (API) | Clés secrètes, webhooks |

**Exemple :**
```javascript
// ✅ Fonctionne dans React (a le préfixe VITE_)
const priceId = process.env.VITE_STRIPE_PRICE_PRO_MONTHLY

// ❌ Ne fonctionne PAS dans React (pas de préfixe VITE_)
const secret = process.env.STRIPE_SECRET_KEY // undefined dans le frontend!
```

---

## 🔒 Sécurité

**Variables publiques (avec VITE_) :**
- `VITE_STRIPE_PUBLISHABLE_KEY` ✅ OK (clé publique Stripe)
- `VITE_STRIPE_PRICE_*` ✅ OK (les Price IDs sont publics)
- `VITE_CLERK_PUBLISHABLE_KEY` ✅ OK (clé publique Clerk)

**Variables secrètes (sans VITE_) :**
- `STRIPE_SECRET_KEY` 🔒 Reste côté serveur
- `STRIPE_WEBHOOK_SECRET` 🔒 Reste côté serveur
- `AIRTABLE_TOKEN` 🔒 Reste côté serveur

---

## 📱 Mode Production vs Test

Actuellement, vous êtes en **mode TEST**.

### Passer en Mode Production

Quand vous serez prêt pour de vrais paiements :

1. Allez sur https://dashboard.stripe.com
2. Basculez le toggle en haut à droite de **Test** à **Live**
3. Créez les mêmes produits/prix en mode Live
4. Copiez les nouveaux IDs (qui commenceront par `price_live_...`)
5. Remplacez les variables dans Vercel par les versions Live
6. Redéployez

---

## 🆘 Dépannage

### Erreur : "Stripe n'est pas encore configuré"
- ✅ Vérifiez que les variables ont le préfixe `VITE_` pour les Price IDs
- ✅ Vérifiez que vous avez bien cliqué **Save** pour chaque variable
- ✅ Vérifiez que vous avez **redéployé** après avoir ajouté les variables
- ✅ Videz le cache de votre navigateur (Ctrl+Shift+R)

### Variables non détectées après déploiement
- ⚠️ Vérifiez que vous avez sélectionné les bons environnements (Production/Preview/Development)
- ⚠️ Attendez 1-2 minutes que le déploiement soit complètement terminé
- ⚠️ Vérifiez dans l'onglet Functions logs si les variables sont chargées

---

## 📚 Ressources

- [Documentation Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Documentation Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Stripe Test Cards](https://stripe.com/docs/testing)

---

**Auteur :** Documentation Synkro
**Dernière mise à jour :** 7 décembre 2025
