# ⚡ Stripe Webhook - Guide Rapide

## 🎯 Obtenir le Webhook Secret en 2 minutes

### Option 1 : Pour le développement local (recommandé pour tester)

1. **Installer Stripe CLI :**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
   tar -xvf stripe_linux_x86_64.tar.gz
   sudo mv stripe /usr/local/bin/
   ```

2. **Se connecter :**
   ```bash
   stripe login
   ```

3. **Démarrer le serveur de dev :**
   ```bash
   npm run dev
   ```

4. **Dans un nouveau terminal, lancer le webhook :**
   ```bash
   stripe listen --forward-to localhost:5173/api/stripe-webhook
   ```

5. **Copier le secret affiché :**
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

6. **L'ajouter dans `.env.local` :**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

7. **Redémarrer le serveur** (`Ctrl+C` puis `npm run dev`)

8. **Tester :**
   ```bash
   stripe trigger checkout.session.completed
   ```

✅ **Vous devriez voir dans les logs :**
```
✅ Webhook signature verified: checkout.session.completed
💳 Checkout session completed: cs_xxxxx
```

---

### Option 2 : Pour la production (Vercel)

1. **Aller sur le Stripe Dashboard :**
   [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)

2. **Cliquer sur "Add endpoint"**

3. **Renseigner l'URL :**
   ```
   https://getsynkro.com/api/stripe-webhook
   ```
   *(Remplacez par votre domaine Vercel)*

4. **Sélectionner les événements :**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`

5. **Cliquer sur "Add endpoint"**

6. **Cliquer sur le webhook créé**

7. **Dans "Signing secret", cliquer sur "Reveal"**

8. **Copier le secret** (commence par `whsec_`)

9. **L'ajouter sur Vercel :**
   - Dashboard Vercel → Settings → Environment Variables
   - Nom : `STRIPE_WEBHOOK_SECRET`
   - Valeur : `whsec_xxxxxxxxxxxxx`

10. **Redéployer l'application**

11. **Tester avec "Send test webhook"**

---

## 🔍 Vérifier que ça fonctionne

### Test en local :
```bash
stripe trigger checkout.session.completed
```

### Test en production :
1. Dashboard Stripe → Webhooks → [Votre endpoint]
2. Onglet "Send test webhook"
3. Événement : `checkout.session.completed`
4. Cliquer sur "Send test webhook"
5. Vérifier le statut : ✅ **Succeeded**

---

## 🚨 Erreurs courantes

### "Webhook signature verification failed"
➡️ Le `STRIPE_WEBHOOK_SECRET` est incorrect ou manquant
➡️ Redémarrez le serveur après l'avoir ajouté

### "Method not allowed"
➡️ Le webhook doit être appelé en POST, pas GET
➡️ Vérifiez que Stripe envoie bien en POST

### Timeout 30s
➡️ Le traitement est trop long
➡️ Répondez vite à Stripe puis traitez en asynchrone

---

## 📚 Documentation complète

Pour plus de détails, consultez [`STRIPE_WEBHOOK_SETUP.md`](./STRIPE_WEBHOOK_SETUP.md)

---

**🎉 C'est tout ! Votre webhook est configuré.**
