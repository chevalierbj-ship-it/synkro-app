# 🚀 Démarrage rapide - Clerk Authentication

## Activation de l'authentification OAuth en 5 minutes

### 1️⃣ Créer un compte Clerk

Aller sur https://dashboard.clerk.com et créer un compte (gratuit).

### 2️⃣ Créer une application

1. Cliquer sur **"Create Application"**
2. Nom : "Synkro" (ou ce que vous voulez)
3. **Cocher les providers** :
   - ✅ Google
   - ✅ Microsoft (optionnel)
   - ✅ Apple (optionnel)
4. Cliquer sur **"Create Application"**

### 3️⃣ Copier votre clé

Dans le dashboard, vous verrez :

```
Publishable Key: pk_test_XXXXXXXXXXXXX
```

Copier cette clé.

### 4️⃣ Créer le fichier .env

À la racine du projet, créer un fichier `.env` :

```bash
# Copier depuis .env.example
cp .env.example .env
```

Puis éditer `.env` et remplacer :

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_ICI
```

### 5️⃣ Lancer l'application

```bash
npm run dev
```

### 6️⃣ Tester

1. Ouvrir http://localhost:5173
2. Créer un événement (mode organisateur)
3. Copier le lien participant
4. Sur la page participant, cliquer sur **"Continuer avec Google"**
5. Se connecter avec votre compte Google
6. ✨ **Vos infos sont pré-remplies automatiquement !**

---

## ✅ C'est tout !

L'authentification OAuth fonctionne maintenant. Les utilisateurs peuvent :

- Se connecter avec Google/Microsoft/Apple → infos pré-remplies
- OU utiliser le formulaire simple sans compte

---

## 🔧 Configuration avancée

Pour activer Apple Sign In, configurer les redirects URIs, personnaliser l'interface, etc., consultez le guide complet : [CLERK_SETUP.md](./CLERK_SETUP.md)

---

## 🚢 Déploiement

Quand vous déployez sur Vercel :

1. Aller dans les Settings du projet
2. Ajouter la variable d'environnement :
   ```
   VITE_CLERK_PUBLISHABLE_KEY = pk_live_VOTRE_CLE_PRODUCTION
   ```
3. Utiliser votre **Live Key** (pas Test Key) du dashboard Clerk
4. Redéployer

---

## ❓ Problèmes ?

- La modal ne s'ouvre pas → Vérifiez que `.env` contient bien la clé
- Erreur "Missing Publishable Key" → Redémarrez le serveur (`npm run dev`)
- Les infos ne se pré-remplissent pas → Vérifiez la console browser pour les erreurs

Pour plus d'aide : [CLERK_SETUP.md](./CLERK_SETUP.md)
