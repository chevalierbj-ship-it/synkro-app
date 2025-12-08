# 🔧 Fix : Champ manquant `parent_user_id` dans SubAccounts

## 🚨 Problème

Vous obtenez l'erreur suivante dans les logs :
```
INVALID_FILTER_BY_FORMULA: Unknown field names: parent_user_id
```

Cette erreur se produit lorsque vous tentez d'utiliser les fonctionnalités d'équipe (Plan Entreprise), car le champ `parent_user_id` n'existe pas dans votre table Airtable `SubAccounts`.

## ✅ Solution : Créer le champ manquant dans Airtable

### Étape 1 : Accéder à votre table SubAccounts

1. Connectez-vous à [Airtable](https://airtable.com)
2. Ouvrez votre base Synkro (identifiant : `AIRTABLE_BASE_ID`)
3. Sélectionnez la table **SubAccounts**

### Étape 2 : Créer le champ `parent_user_id`

1. Cliquez sur le bouton **"+"** à droite des colonnes pour ajouter un nouveau champ
2. Nommez le champ : `parent_user_id`
3. Sélectionnez le type : **Single line text**
4. Cliquez sur **Créer le champ**

### Étape 3 : Vérifier la création

Votre table SubAccounts devrait maintenant contenir les champs suivants :
- ✅ `parent_user_id` (Single line text) - ID Clerk du compte parent
- ✅ `sub_user_email` (Email) - Email du membre invité
- ✅ `clerk_user_id` (Single line text) - ID Clerk du sous-compte
- ✅ `status` (Single select) - Statut : 'pending', 'active', 'revoked'
- ✅ `role` (Single line text) - Rôle : 'admin', 'editor', 'viewer'
- ✅ `invitation_token` (Single line text) - Token d'invitation
- ✅ `invited_at` (Date) - Date d'invitation
- ✅ `accepted_at` (Date) - Date d'acceptation

### Étape 4 : Redéployer (si nécessaire)

Si vous êtes en production sur Vercel :
1. L'erreur devrait disparaître automatiquement
2. Pas besoin de redéployer, le code gère maintenant l'erreur gracieusement
3. Une fois le champ créé, les fonctionnalités d'équipe fonctionneront correctement

## 📋 Structure complète de la table SubAccounts

```javascript
{
  // Identification du parent
  parent_user_id: "user_2abc123def456",  // ⚠️ CHAMP À CRÉER

  // Identification du sous-compte
  sub_user_email: "membre@example.com",
  clerk_user_id: "user_2xyz789ghi012",   // Rempli après acceptation

  // Statut et rôle
  status: "pending",                      // 'pending' | 'active' | 'revoked'
  role: "editor",                         // 'admin' | 'editor' | 'viewer'

  // Tokens et dates
  invitation_token: "inv_1733684820000_abc123def456",
  invited_at: "2025-12-08T20:00:00.000Z",
  accepted_at: "2025-12-08T20:15:00.000Z"  // null si non accepté
}
```

## 🎯 À quoi sert ce champ ?

Le champ `parent_user_id` permet de :
- **Lier les sous-comptes au compte parent** (Plan Entreprise)
- **Filtrer les membres d'une équipe** lors de l'affichage
- **Vérifier les limites** (max 2 sous-comptes par compte)
- **Gérer les permissions** selon la hiérarchie

## 🔍 Pourquoi ce champ était-il manquant ?

Ce champ fait partie du système multi-utilisateurs documenté dans `MULTI_USER_IMPLEMENTATION.md`. Si vous n'utilisez pas les fonctionnalités d'équipe (Plan Entreprise), vous pouvez ignorer cette erreur.

## 🛠️ Modifications apportées au code

Le code a été modifié pour gérer gracieusement l'absence de ce champ :
- ✅ Détection de l'erreur `INVALID_FILTER_BY_FORMULA`
- ✅ Message clair expliquant le problème
- ✅ Retour d'une liste vide au lieu d'un crash
- ✅ Instructions pour créer le champ

### Fichiers modifiés :
- `/api/team.js` (lignes 41-77, 92-124, 126-149)
- `/api/event-utils.js` (lignes 318-341)

## ❓ Questions fréquentes

### Q : Dois-je créer ce champ si je n'utilise pas le Plan Entreprise ?
**R :** Non, si vous n'utilisez pas les fonctionnalités d'équipe, vous pouvez ignorer cette erreur. Le code retournera simplement une liste vide de membres.

### Q : Que se passe-t-il si j'oublie de créer ce champ ?
**R :** Les fonctionnalités d'équipe ne fonctionneront pas, mais votre application principale continuera de fonctionner normalement.

### Q : Puis-je renommer ce champ ?
**R :** Non, le nom `parent_user_id` est utilisé dans plusieurs endroits du code. Si vous le renommez, vous devrez modifier tous les fichiers qui l'utilisent.

## 📚 Ressources

- [Documentation Airtable](https://airtable.com/developers/web/api/introduction)
- [Guide multi-utilisateurs](../MULTI_USER_IMPLEMENTATION.md)
- [Schéma complet Airtable](../AIRTABLE_SCHEMA.md)

---

**Dernière mise à jour :** 8 décembre 2025
**Priorité :** MOYENNE - Requis uniquement pour les fonctionnalités d'équipe
