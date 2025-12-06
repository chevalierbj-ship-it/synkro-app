# Guide de configuration Clerk Authentication

## Vue d'ensemble

Synkro utilise **Clerk** pour l'authentification OAuth (Google, Microsoft, Apple).

Le formulaire participant propose **deux options** :
1. 🚀 **Connexion rapide** : Se connecter avec Google/Microsoft/Apple → infos pré-remplies automatiquement
2. ✍️ **Formulaire simple** : Entrer nom et email manuellement (sans compte)

---

## ✅ Installation (déjà fait)

```bash
npm install @clerk/clerk-react
```

Le SDK Clerk est déjà installé et configuré dans le projet.

---

## 🔑 Configuration requise

### Étape 1 : Créer un compte Clerk

1. Aller sur https://dashboard.clerk.com
2. Créer un compte (gratuit jusqu'à 10K utilisateurs/mois)
3. Créer une nouvelle application

### Étape 2 : Activer les providers OAuth

Dans le Dashboard Clerk :

1. Aller dans **Configure** → **SSO Connections**
2. Activer les providers souhaités :
   - ✅ **Google** (recommandé - le plus utilisé)
   - ✅ **Microsoft** (pour Outlook/Office 365)
   - ✅ **Apple** (pour iOS)

#### Configuration Google OAuth

1. Dans Clerk Dashboard, cliquer sur **Google**
2. Suivre les instructions pour créer un projet Google Cloud
3. Activer Google+ API
4. Créer des credentials OAuth 2.0
5. Ajouter les redirect URIs fournis par Clerk
6. Copier Client ID et Client Secret dans Clerk

#### Configuration Microsoft OAuth

1. Dans Clerk Dashboard, cliquer sur **Microsoft**
2. Aller sur https://portal.azure.com
3. Azure Active Directory → App registrations → New registration
4. Copier Application (client) ID dans Clerk
5. Créer un Client Secret et le copier dans Clerk
6. Configurer les redirect URIs fournis par Clerk

#### Configuration Apple Sign In

1. Dans Clerk Dashboard, cliquer sur **Apple**
2. Aller sur https://developer.apple.com
3. Certificates, Identifiers & Profiles → Créer un Service ID
4. Configurer le domaine et redirect URIs
5. Copier les credentials dans Clerk

⚠️ **Note** : Apple Sign In nécessite un domaine HTTPS (ne fonctionne pas sur localhost)

### Étape 3 : Récupérer votre Publishable Key

1. Dans Clerk Dashboard, aller dans **API Keys**
2. Copier votre **Publishable Key** (commence par `pk_test_...` ou `pk_live_...`)

### Étape 4 : Configurer les variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_ICI
```

⚠️ **Important** :
- Ne jamais commit ce fichier dans git
- `.env` est déjà dans `.gitignore`
- Pour la production (Vercel), ajouter cette variable dans les settings du projet

---

## 🏗️ Architecture du code

### 1. ClerkProvider (main.jsx)

Le provider Clerk enveloppe toute l'application :

```javascript
import { ClerkProvider } from '@clerk/clerk-react'

<ClerkProvider publishableKey={PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>
```

### 2. AuthButtons Component (src/components/AuthButtons.jsx)

Utilise les hooks Clerk pour gérer l'authentification :

```javascript
import { useAuth, useUser, useClerk } from '@clerk/clerk-react'

const { isSignedIn } = useAuth()       // Statut de connexion
const { user } = useUser()             // Données utilisateur
const { openSignIn } = useClerk()      // Ouvrir modal de connexion
```

**Fonctionnement** :
1. Utilisateur clique sur un bouton (Google/Microsoft/Apple)
2. `openSignIn()` ouvre une modal Clerk avec le provider choisi
3. L'utilisateur s'authentifie sur le provider OAuth
4. Clerk gère le retour et crée une session
5. `useEffect` détecte `isSignedIn === true`
6. Les données `user.fullName` et `user.email` sont extraites
7. `onAuthSuccess()` pré-remplit le formulaire participant

### 3. Participant.jsx

Le formulaire détecte quand l'utilisateur se connecte et pré-remplit les champs :

```javascript
<AuthButtons
  onAuthSuccess={(userData) => {
    setUserName(userData.name || '');
    setUserEmail(userData.email || '');
  }}
/>
```

---

## 🚀 Workflow utilisateur complet

### Scénario A : Connexion rapide avec Google

1. Participant arrive sur le formulaire Synkro
2. Voit les 3 boutons : Google, Microsoft, Apple
3. Clique sur **"Continuer avec Google"**
4. Modal Clerk s'ouvre → Choisit son compte Google
5. Autorise Synkro à accéder à son nom et email
6. Redirection automatique vers le formulaire
7. ✨ **Nom et email déjà remplis !**
8. Clique sur "Continuer" → Choix des disponibilités
9. Vote et confirmation

### Scénario B : Formulaire simple

1. Participant arrive sur le formulaire
2. Scroll vers le bas, voit "ou"
3. Section **"Continuer sans compte"**
4. Entre son prénom manuellement
5. Entre son email (optionnel)
6. Clique sur "Continuer" → Choix des disponibilités
7. Vote et confirmation

---

## 🔒 Sécurité et confidentialité

### Clerk ne stocke PAS les votes

⚠️ **Important à comprendre** :

- Clerk est utilisé **uniquement pour pré-remplir le formulaire**
- Les votes sont stockés dans **Airtable** (pas dans Clerk)
- Aucun compte utilisateur n'est créé dans Synkro
- Les participants restent anonymes pour l'organisateur (sauf si email collecté)

**Flux de données** :
```
Clerk (OAuth) → Récupère nom + email
         ↓
AuthButtons → Pré-remplit les champs
         ↓
Participant vote → Envoyé à Airtable
         ↓
Airtable → Stockage final (sans lien avec Clerk)
```

### Session Clerk

- Clerk crée une session locale pour éviter de redemander l'auth
- La session expire automatiquement (configurable dans Clerk Dashboard)
- Les données sensibles ne sont jamais exposées côté client

### RGPD

- Clerk est conforme RGPD
- Les utilisateurs peuvent demander la suppression de leurs données
- Voir : https://clerk.com/legal/privacy

---

## 🎨 Personnalisation de l'interface Clerk

Vous pouvez personnaliser l'apparence de la modal Clerk dans `AuthButtons.jsx` :

```javascript
openSignIn({
  appearance: {
    elements: {
      rootBox: "mx-auto",
      card: "shadow-xl rounded-2xl",
      headerTitle: "text-2xl font-bold",
      socialButtonsBlockButton: "border-2 border-purple-200"
    },
    variables: {
      colorPrimary: '#8B5CF6', // Violet Synkro
      borderRadius: '12px'
    }
  }
})
```

---

## 🧪 Test en développement

### Localhost

1. Assurez-vous que `.env` contient votre clé :
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

2. Lancez le serveur de dev :
   ```bash
   npm run dev
   ```

3. Ouvrez http://localhost:5173

4. Naviguez vers un formulaire participant

5. Testez la connexion Google/Microsoft/Apple

⚠️ **Apple Sign In ne fonctionnera pas sur localhost** (nécessite HTTPS)

---

## 🚢 Déploiement en production

### Sur Vercel

1. Aller dans les Settings du projet Vercel

2. Ajouter la variable d'environnement :
   ```
   VITE_CLERK_PUBLISHABLE_KEY = pk_live_...
   ```

3. Utiliser votre **Live Key** (pas Test Key)

4. Redéployer

### Changer de Test à Production

Dans Clerk Dashboard :

1. **Development** → API Keys (pk_test_...)
2. **Production** → API Keys (pk_live_...)

⚠️ Les deux environnements sont séparés :
- Les utilisateurs de test ne sont PAS dans la prod
- Vous devez reconfigurer les OAuth providers en prod

---

## 📊 Monitoring et analytics

### Dashboard Clerk

Aller dans **Users** → Voir :
- Nombre d'utilisateurs authentifiés
- Providers utilisés (Google vs Microsoft vs Apple)
- Taux de conversion
- Erreurs d'authentification

### Logs

Les logs sont visibles dans la console browser :
```javascript
console.log('User signed in:', userData);
```

---

## 🐛 Troubleshooting

### Erreur : "Missing Publishable Key"

➡️ Vérifiez que `.env` existe et contient `VITE_CLERK_PUBLISHABLE_KEY`

### Erreur : "Redirect URI mismatch"

➡️ Dans Clerk Dashboard, vérifiez que vos URLs autorisées incluent :
- `http://localhost:5173` (dev)
- `https://synkro-app-bice.vercel.app` (prod)

### La modal ne s'ouvre pas

➡️ Vérifiez dans la console :
1. ClerkProvider est bien chargé
2. La clé Clerk est valide
3. Pas d'erreur JavaScript

### Les infos ne se pré-remplissent pas

➡️ Vérifiez :
1. Le `useEffect` dans AuthButtons se déclenche
2. `user.fullName` et `user.email` existent
3. Le callback `onAuthSuccess` est bien appelé

---

## 📚 Ressources

- [Clerk Docs](https://clerk.com/docs)
- [Clerk React SDK](https://clerk.com/docs/references/react/overview)
- [Clerk OAuth Guide](https://clerk.com/docs/authentication/social-connections/overview)
- [Clerk Dashboard](https://dashboard.clerk.com)

---

## 💰 Pricing Clerk

**Free Plan** :
- Jusqu'à 10,000 utilisateurs actifs par mois
- OAuth illimité (Google, Microsoft, Apple)
- Parfait pour Synkro

**Pro Plan** ($25/mois) :
- 100,000 utilisateurs actifs
- Support prioritaire
- Customisation avancée

Pour Synkro, le plan gratuit est largement suffisant ! 🎉

---

## ✅ Checklist finale

Avant de déployer en production :

- [ ] Compte Clerk créé
- [ ] Providers OAuth activés (Google, Microsoft, Apple)
- [ ] Publishable Key ajoutée dans `.env`
- [ ] Test local réussi (connexion Google)
- [ ] Variable d'environnement configurée sur Vercel
- [ ] Test en production réussi
- [ ] Vérification que les infos se pré-remplissent correctement
- [ ] Vérification que le formulaire simple fonctionne toujours

---

**Vous avez besoin d'aide ?** Consultez la [documentation Clerk](https://clerk.com/docs) ou créez un ticket de support.
