# Guide d'implémentation de l'authentification OAuth

## Vue d'ensemble

Le formulaire participant propose maintenant **deux options** :
1. **Connexion rapide** : Utiliser Google, Microsoft ou Apple pour pré-remplir automatiquement nom et email
2. **Formulaire simple** : Entrer manuellement son nom et email (sans authentification)

## État actuel

✅ Interface utilisateur complète avec les boutons d'authentification
✅ Composant `AuthButtons` créé dans `/src/components/AuthButtons.jsx`
✅ Intégration dans `Participant.jsx` avec divider "ou"
⚠️ Les fonctions d'authentification sont actuellement des placeholders (TODO)

## Options d'implémentation OAuth

### Option 1 : Firebase Authentication (Recommandé)

**Avantages :**
- Gratuit jusqu'à 10K utilisateurs/mois
- Configuration simple
- Support natif pour Google, Microsoft, Apple
- Gestion automatique des tokens

**Installation :**
```bash
npm install firebase
```

**Configuration :**

1. Créer un projet Firebase : https://console.firebase.google.com
2. Activer Authentication > Sign-in method
3. Configurer les providers (Google, Microsoft, Apple)

**Code pour AuthButtons.jsx :**

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google
const handleGoogleAuth = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    onAuthSuccess({
      name: user.displayName,
      email: user.email,
      provider: 'google'
    });
  } catch (error) {
    console.error('Google auth error:', error);
    alert('Erreur lors de la connexion avec Google');
  }
};

// Microsoft
const handleMicrosoftAuth = async () => {
  const provider = new OAuthProvider('microsoft.com');
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    onAuthSuccess({
      name: user.displayName,
      email: user.email,
      provider: 'microsoft'
    });
  } catch (error) {
    console.error('Microsoft auth error:', error);
    alert('Erreur lors de la connexion avec Microsoft');
  }
};

// Apple
const handleAppleAuth = async () => {
  const provider = new OAuthProvider('apple.com');
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    onAuthSuccess({
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      provider: 'apple'
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    alert('Erreur lors de la connexion avec Apple');
  }
};
```

**Variables d'environnement (.env) :**
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
```

---

### Option 2 : Supabase Auth

**Avantages :**
- Gratuit jusqu'à 50K utilisateurs
- Backend inclus (base de données)
- Support OAuth natif

**Installation :**
```bash
npm install @supabase/supabase-js
```

**Code exemple :**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const handleGoogleAuth = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });

  if (!error && data.user) {
    onAuthSuccess({
      name: data.user.user_metadata.full_name,
      email: data.user.email,
      provider: 'google'
    });
  }
};
```

---

### Option 3 : Auth0

**Avantages :**
- Solution enterprise-grade
- Très sécurisé
- Support de nombreux providers

**Installation :**
```bash
npm install @auth0/auth0-react
```

---

## Configuration des providers OAuth

### Google OAuth

1. Aller sur https://console.cloud.google.com
2. Créer un nouveau projet
3. Activer "Google+ API"
4. Créer des credentials OAuth 2.0
5. Ajouter les URLs autorisées :
   - `http://localhost:5173` (dev)
   - `https://synkro-app-bice.vercel.app` (prod)

### Microsoft OAuth

1. Aller sur https://portal.azure.com
2. Azure Active Directory > App registrations
3. New registration
4. Configurer redirect URIs
5. Récupérer Application (client) ID

### Apple Sign In

1. Aller sur https://developer.apple.com
2. Certificates, Identifiers & Profiles
3. Créer un Service ID
4. Configurer le domaine et redirect URIs
5. ⚠️ Note : Apple Sign In nécessite un domaine HTTPS (pas localhost)

---

## Étapes de finalisation

### 1. Choisir une option (Firebase recommandé)

### 2. Installer les dépendances
```bash
npm install firebase
```

### 3. Configurer les providers OAuth
- Créer les applications sur chaque plateforme
- Récupérer les clés API

### 4. Ajouter les variables d'environnement
Créer un fichier `.env` :
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
```

### 5. Remplacer les TODO dans AuthButtons.jsx
Remplacer les fonctions placeholder par le code Firebase

### 6. Tester
- Tester chaque provider
- Vérifier que nom et email sont bien pré-remplis
- Vérifier le flux complet jusqu'au vote

---

## Sécurité

⚠️ **Important :**
- Ne jamais commit les clés API dans git
- Ajouter `.env` au `.gitignore`
- Utiliser les variables d'environnement Vercel pour la production
- Limiter les domaines autorisés dans chaque provider OAuth

---

## Support

Pour toute question sur l'implémentation :
- Firebase docs : https://firebase.google.com/docs/auth
- Supabase docs : https://supabase.com/docs/guides/auth
- Auth0 docs : https://auth0.com/docs

---

## Workflow utilisateur final

1. **Participant arrive sur le formulaire**
   - Voit les 3 boutons de connexion rapide (Google, Microsoft, Apple)
   - OU peut scroller pour voir le formulaire simple

2. **Option A : Connexion rapide**
   - Clic sur un bouton → popup OAuth
   - Autorisation → retour sur l'app
   - Nom et email **automatiquement pré-remplis** ✨
   - Bouton "Continuer" activé

3. **Option B : Formulaire simple**
   - Entre son prénom manuellement
   - Entre son email (optionnel)
   - Bouton "Continuer"

4. **Suite du flux identique**
   - Choix des disponibilités
   - Vote budget (si activé)
   - Confirmation

---

## Notes importantes

- L'authentification OAuth **ne créé pas de compte** dans Synkro
- Les infos sont juste utilisées pour **pré-remplir** le formulaire
- Le participant reste anonyme dans Airtable (sauf si l'organisateur active la collecte d'email)
- C'est une **amélioration UX**, pas un système de comptes utilisateurs
