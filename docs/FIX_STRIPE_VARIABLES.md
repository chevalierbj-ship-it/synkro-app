# 🔧 Correction Urgente - Variables Stripe Manquantes

## ⚠️ Problème Identifié

Le webhook Stripe ne pouvait pas déterminer votre plan (Pro ou Entreprise) car les **variables backend** étaient manquantes dans Vercel.

### Variables manquantes :
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- `STRIPE_PRICE_ENTERPRISE_YEARLY`

## ✅ Solution Rapide

Ajoutez ces 4 variables dans votre Dashboard Vercel **MAINTENANT** :

### 1️⃣ Allez sur Vercel
https://vercel.com/dashboard → votre projet → **Settings** → **Environment Variables**

### 2️⃣ Ajoutez les 4 variables

**Variable 1 : STRIPE_PRICE_PRO_MONTHLY**
- **Name:** `STRIPE_PRICE_PRO_MONTHLY`
- **Value:** 🔍 **MÊME valeur** que `VITE_STRIPE_PRICE_PRO_MONTHLY`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Cliquez **Save**

**Variable 2 : STRIPE_PRICE_PRO_YEARLY**
- **Name:** `STRIPE_PRICE_PRO_YEARLY`
- **Value:** 🔍 **MÊME valeur** que `VITE_STRIPE_PRICE_PRO_YEARLY`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Cliquez **Save**

**Variable 3 : STRIPE_PRICE_ENTERPRISE_MONTHLY**
- **Name:** `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- **Value:** 🔍 **MÊME valeur** que `VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Cliquez **Save**

**Variable 4 : STRIPE_PRICE_ENTERPRISE_YEARLY**
- **Name:** `STRIPE_PRICE_ENTERPRISE_YEARLY`
- **Value:** 🔍 **MÊME valeur** que `VITE_STRIPE_PRICE_ENTERPRISE_YEARLY`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Cliquez **Save**

### 3️⃣ Redéployez

Allez dans **Deployments** → Dernier déploiement → **⋯** → **Redeploy**

⏱️ Attendez 1-2 minutes que le déploiement se termine.

## 📝 Pourquoi ce bug ?

Les variables `VITE_*` sont **uniquement accessibles au frontend** (dans le navigateur).

Le **backend** (webhook Stripe, API routes) utilise `process.env.STRIPE_PRICE_*` (sans VITE_).

Sans ces variables, le webhook ne pouvait pas savoir si vous payiez pour Pro ou Entreprise, donc il laissait le plan sur "gratuit".

## 🎯 Résultat attendu

Après avoir ajouté ces variables et redéployé :

1. ✅ Le webhook Stripe pourra déterminer votre plan correctement
2. ✅ Votre abonnement Entreprise sera activé automatiquement
3. ✅ La page Success forcera une synchronisation manuelle (doublement sécurisé)

## 🔍 Comment vérifier ?

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez sur votre webhook
3. Allez dans l'onglet "Events"
4. Regardez les logs récents - vous devriez voir : `✅ Determined plan: entreprise`

---

**🚀 Une fois les variables ajoutées, votre plan Entreprise s'activera correctement !**
