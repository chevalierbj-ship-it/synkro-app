# 📚 Documentation Synkro

## Authentification OAuth avec Clerk

Synkro propose une **double option d'authentification** pour les participants :

1. 🚀 **Connexion rapide** : Se connecter avec Google/Microsoft/Apple pour pré-remplir automatiquement les infos
2. ✍️ **Formulaire simple** : Entrer nom et email manuellement (sans compte)

---

## 🎯 Pour commencer

### Démarrage rapide (5 minutes)

➡️ **[QUICK_START_CLERK.md](./QUICK_START_CLERK.md)**

Suivez ce guide pour activer l'authentification OAuth en 5 minutes chrono.

### Configuration complète

➡️ **[CLERK_SETUP.md](./CLERK_SETUP.md)**

Guide détaillé avec :
- Configuration des providers OAuth (Google, Microsoft, Apple)
- Personnalisation de l'interface
- Déploiement en production
- Troubleshooting

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   Formulaire Participant            │
│                                     │
│  ┌───────────────────────────┐     │
│  │ 🚀 Connexion rapide        │     │
│  │ [Google] [Microsoft] [🍎] │     │
│  └───────────────────────────┘     │
│                                     │
│  ──────────── ou ────────────      │
│                                     │
│  ┌───────────────────────────┐     │
│  │ ✍️ Formulaire simple       │     │
│  │ Nom: [____________]        │     │
│  │ Email: [__________]        │     │
│  └───────────────────────────┘     │
│                                     │
│         [Continuer →]              │
└─────────────────────────────────────┘
```

---

## 📂 Fichiers concernés

### Code

- **`src/main.jsx`** : Configuration du `ClerkProvider`
- **`src/components/AuthButtons.jsx`** : Boutons de connexion OAuth
- **`src/pages/Participant.jsx`** : Formulaire avec les deux options

### Configuration

- **`.env.example`** : Variables d'environnement à configurer
- **`.env`** : Votre configuration locale (à créer, non commité)

---

## 🔑 Variables d'environnement requises

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_ou_pk_live_VOTRE_CLE

# Airtable (déjà configuré)
AIRTABLE_TOKEN=...
AIRTABLE_BASE_ID=...

# Resend (emails)
RESEND_API_KEY=...
```

---

## ✅ Checklist d'activation

- [ ] Compte Clerk créé sur https://dashboard.clerk.com
- [ ] Application créée avec providers Google/Microsoft/Apple
- [ ] Publishable Key copiée
- [ ] Fichier `.env` créé avec `VITE_CLERK_PUBLISHABLE_KEY`
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Test de connexion Google réussi
- [ ] Vérification que les infos se pré-remplissent

---

## 🆘 Support

- **Démarrage rapide** → [QUICK_START_CLERK.md](./QUICK_START_CLERK.md)
- **Guide complet** → [CLERK_SETUP.md](./CLERK_SETUP.md)
- **Docs Clerk** → https://clerk.com/docs
- **Dashboard Clerk** → https://dashboard.clerk.com

---

## 💡 Pourquoi Clerk ?

- ✅ Gratuit jusqu'à 10K utilisateurs/mois
- ✅ Configuration OAuth ultra-simple
- ✅ Support natif Google, Microsoft, Apple
- ✅ Interface pré-construite et responsive
- ✅ Conforme RGPD
- ✅ Pas de backend à gérer

Clerk gère toute la complexité de l'OAuth pour nous ! 🎉
