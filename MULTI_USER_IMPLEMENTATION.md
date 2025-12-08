# Implémentation Multi-utilisateurs Entreprise - Synkro

## 📋 Vue d'ensemble

Cette implémentation ajoute la fonctionnalité complète de collaboration multi-utilisateurs pour le plan Entreprise de Synkro. Elle permet aux comptes Entreprise d'inviter jusqu'à 2 sous-comptes avec des rôles et permissions granulaires.

## ✅ Fonctionnalités implémentées

### 1. **Système d'invitation complet**
- ✅ Génération de tokens d'invitation uniques
- ✅ Envoi d'emails d'invitation via Resend
- ✅ Page d'acceptation d'invitation (`/accept-invitation`)
- ✅ Vérification d'expiration (7 jours)
- ✅ Validation de l'email invité vs utilisateur Clerk
- ✅ Activation automatique après acceptation

### 2. **Système de rôles et permissions (RBAC)**
- ✅ 3 rôles disponibles :
  - **👑 Admin** : Accès complet, peut créer/modifier/supprimer/partager
  - **✏️ Éditeur** : Peut créer et modifier des événements
  - **👁️ Lecteur** : Consultation uniquement
- ✅ Matrice de permissions granulaires
- ✅ Middleware d'autorisation (`api/middleware/auth.js`)

### 3. **Partage d'événements**
- ✅ Partage automatique avec tous les membres de l'équipe
- ✅ API dédiée (`/api/share-event`)
- ✅ Tracking des événements partagés dans Airtable (`shared_with`)
- ✅ Récupération des événements accessibles via `getAccessibleEvents()`

### 4. **Modifications du schéma Airtable**

#### Table `SubAccounts` - Nouveaux champs :
```javascript
{
  parent_user_id: String,        // ID Clerk du compte parent
  sub_user_email: String,         // Email de l'invité
  clerk_user_id: String,          // ID Clerk (rempli après acceptation)
  status: String,                 // 'pending', 'active', 'revoked'
  role: String,                   // 'admin', 'editor', 'viewer'
  invitation_token: String,       // Token unique pour l'invitation
  invited_at: DateTime,           // Date d'invitation
  accepted_at: DateTime           // Date d'acceptation
}
```

#### Table `Events` - Nouveaux champs :
```javascript
{
  owner_user_id: String,          // ID Clerk du propriétaire
  shared_with: JSON,              // Liste des utilisateurs avec accès
  // Format de shared_with:
  // [{ userId, email, role, sharedAt }]
}
```

#### Table `Users` - Nouveaux champs :
```javascript
{
  is_sub_account: Boolean,        // Indique si c'est un sous-compte
  parent_account_id: String       // ID du compte parent
}
```

## 🗂️ Fichiers créés

### APIs
1. **`/api/accept-invitation.js`**
   - GET : Récupérer les détails d'une invitation
   - POST : Accepter une invitation

2. **`/api/share-event.js`**
   - GET : Liste des partages d'un événement
   - POST : Partager avec l'équipe
   - DELETE : Retirer un partage

3. **`/api/middleware/auth.js`**
   - `getUserAccountInfo()` : Infos compte et rôle
   - `canAccessEvent()` : Vérifier l'accès à un événement
   - `canPerformAction()` : Vérifier une permission spécifique
   - `getAccessibleEvents()` : Tous les événements accessibles
   - `requireAuth()` : Middleware Express

### Pages
1. **`/src/pages/AcceptInvitation.jsx`**
   - Page pour accepter les invitations
   - Intégration Clerk pour signup/signin
   - Redirection automatique vers dashboard

### Composants modifiés
1. **`/src/components/TeamManagement.jsx`**
   - Ajout du sélecteur de rôle
   - Affichage des rôles dans la liste
   - Interface améliorée

2. **`/src/App.jsx`**
   - Route `/accept-invitation` ajoutée

## 🔄 Fichiers modifiés

### 1. `/api/team.js`
**Changements :**
- Ajout du paramètre `role` lors de l'invitation
- Génération du `invitation_token`
- Fonction `sendInvitationEmail()` complète
- Envoi d'email avec lien d'invitation

**Avant :**
```javascript
// TODO: Envoyer email d'invitation avec lien signup
```

**Après :**
```javascript
// Génération token
const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;

// Envoi email
await sendInvitationEmail({ email, invitationToken, parentUserName, role });
```

### 2. `/api/events.js`
**Changements :**
- Ajout de `owner_user_id` lors de la création
- Ajout de `shared_with: JSON.stringify([])`

**Ligne 165 :**
```javascript
owner_user_id: eventData.clerkUserId || '',
```

### 3. `/api/analytics.js`
**Changements :**
- Support du paramètre `clerkUserId`
- Utilisation de `getAccessibleEvents()` pour récupérer événements partagés
- Fallback vers filter par email si erreur

**Fonction `getDetailedAnalyticsData()` :**
```javascript
async function getDetailedAnalyticsData(email, authToken, clerkUserId = null) {
  if (clerkUserId) {
    const { getAccessibleEvents } = await import('./middleware/auth.js');
    events = await getAccessibleEvents(clerkUserId);
  }
  // ...
}
```

## 🔐 Matrice de permissions

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| view   | ✅ | ✅ | ✅ | ✅ |
| edit   | ✅ | ✅ | ✅ | ❌ |
| delete | ✅ | ✅ | ❌ | ❌ |
| share  | ✅ | ✅ | ❌ | ❌ |
| manage_team | ✅ | ❌ | ❌ | ❌ |

## 🚀 Flow d'utilisation

### 1. Invitation d'un membre
```
1. Compte Entreprise va dans Dashboard > Gestion d'équipe
2. Saisit email + sélectionne rôle (admin/editor/viewer)
3. Click "Envoyer l'invitation"
4. API crée record SubAccount avec status='pending' + token
5. Email envoyé avec lien /accept-invitation?token=xxx
```

### 2. Acceptation d'invitation
```
1. Utilisateur clique sur lien dans email
2. Page /accept-invitation charge les détails
3. Si pas connecté → Redirigé vers Clerk Sign Up
4. Si connecté → Vérification email
5. Si email OK → Activation (status='active', clerk_user_id rempli)
6. Redirection vers Dashboard
```

### 3. Partage d'événements
```
1. Compte parent crée un événement
2. owner_user_id est enregistré
3. API /share-event peut partager avec l'équipe
4. shared_with est mis à jour avec liste des sub-accounts
5. Les sous-comptes voient l'événement dans leur dashboard
```

### 4. Accès aux événements
```
1. Sous-compte se connecte
2. getUserAccountInfo() récupère son rôle
3. getAccessibleEvents() retourne :
   - Événements du parent (si owner_user_id = parentUserId)
   - Événements explicitement partagés (si dans shared_with)
4. canPerformAction() vérifie les permissions selon le rôle
```

## 🧪 Tests à effectuer

### Test 1 : Invitation complète
- [ ] Créer compte Entreprise
- [ ] Inviter un membre avec rôle "editor"
- [ ] Vérifier réception email
- [ ] Cliquer sur lien → Sign Up
- [ ] Vérifier activation du compte
- [ ] Vérifier apparition dans liste des membres

### Test 2 : Permissions
- [ ] Créer événement avec compte parent
- [ ] Se connecter avec sous-compte "viewer"
- [ ] Vérifier accès lecture seule
- [ ] Tenter modification → Doit échouer
- [ ] Se connecter avec sous-compte "editor"
- [ ] Vérifier possibilité de modifier

### Test 3 : Partage d'événements
- [ ] Créer événement avec parent
- [ ] Appeler `/api/share-event` pour partager
- [ ] Vérifier `shared_with` dans Airtable
- [ ] Connexion sous-compte → Événement visible
- [ ] Retirer partage → Événement invisible

### Test 4 : Analytics partagées
- [ ] Créer plusieurs événements
- [ ] Partager avec équipe
- [ ] Vérifier analytics du parent (tous les événements)
- [ ] Vérifier analytics du sous-compte (événements partagés)

## 🔧 Configuration requise

### Variables d'environnement
```env
AIRTABLE_BASE_ID=xxx
AIRTABLE_API_KEY=xxx
AIRTABLE_TOKEN=xxx
AIRTABLE_EVENTS_TABLE_ID=xxx
RESEND_API_KEY=xxx
VERCEL_URL=https://synkro-app-bice.vercel.app
```

### Champs Airtable à créer

**SubAccounts :**
- `role` (Single line text)
- `invitation_token` (Single line text)
- `clerk_user_id` (Single line text)
- `accepted_at` (Date)

**Events :**
- `owner_user_id` (Single line text)
- `shared_with` (Long text)

**Users :**
- `is_sub_account` (Checkbox)
- `parent_account_id` (Single line text)

## 📝 Notes importantes

### Limites actuelles
- Maximum 2 sous-comptes par compte Entreprise (hardcodé)
- Invitations expirent après 7 jours
- Partage automatique avec TOUTE l'équipe (pas de partage sélectif)

### Améliorations futures possibles
1. Partage sélectif par événement
2. Audit logging des actions
3. Notifications en temps réel
4. Délégation d'événements
5. Co-organisateurs
6. Augmenter limite à 3 membres (comme annoncé)
7. Resend invitation functionality
8. Custom domains pour Entreprise

## 🐛 Debugging

### Vérifier l'état d'une invitation
```javascript
// GET /api/accept-invitation?token={token}
// Retourne : { success, invitation: { email, role, invitedBy, invitedAt } }
```

### Vérifier les permissions d'un utilisateur
```javascript
import { getUserAccountInfo, canPerformAction } from './api/middleware/auth.js';

const info = await getUserAccountInfo(clerkUserId);
// { isSubAccount, parentUserId, role, userId, email }

const authCheck = await canPerformAction(clerkUserId, eventId, 'edit');
// { canPerform, permission, role }
```

### Vérifier les événements accessibles
```javascript
import { getAccessibleEvents } from './api/middleware/auth.js';

const events = await getAccessibleEvents(clerkUserId);
// Array d'événements Airtable
```

## 🎯 Prochaines étapes recommandées

1. **Tests complets** du flow end-to-end
2. **Migration des données** : Ajouter les nouveaux champs à Airtable
3. **Tests des emails** : Vérifier réception et liens
4. **Tests de permissions** : Vérifier matrice RBAC
5. **Documentation utilisateur** : Guide pour les comptes Entreprise
6. **Monitoring** : Ajouter logs pour suivre acceptations/partages

---

**Implémenté le :** 2025-12-08
**Version :** 1.0
**Status :** ✅ Complet - Prêt pour tests
