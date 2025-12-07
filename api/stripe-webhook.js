// /api/stripe-webhook.js
// API Serverless pour gérer les webhooks Stripe
// ✅ Gestion sécurisée des événements de paiement
// ✅ Validation de la signature Stripe
// ⚠️ Compatible Vercel Serverless Functions

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configuration Vercel pour désactiver le body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  // Seules les requêtes POST sont acceptées
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Lire le body brut (raw body)
    const rawBody = await getRawBody(req);

    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    console.log('✅ Webhook signature verified:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Gérer les différents types d'événements
  try {
    switch (event.type) {
      // ========================================
      // PAIEMENT RÉUSSI
      // ========================================
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('💳 Checkout session completed:', session.id);

        // Récupérer les informations de l'utilisateur
        const userId = session.client_reference_id; // ID utilisateur Clerk
        const customerEmail = session.customer_details.email;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        console.log('User ID:', userId);
        console.log('Email:', customerEmail);
        console.log('Subscription ID:', subscriptionId);

        // TODO: Enregistrer l'abonnement dans Airtable ou base de données
        // Exemple : mettre à jour le statut premium de l'utilisateur
        await handleCheckoutCompleted({
          userId,
          email: customerEmail,
          subscriptionId,
          customerId,
          session
        });

        break;
      }

      // ========================================
      // ABONNEMENT CRÉÉ
      // ========================================
      case 'customer.subscription.created': {
        const subscription = event.data.object;
        console.log('📅 Subscription created:', subscription.id);

        await handleSubscriptionCreated(subscription);
        break;
      }

      // ========================================
      // ABONNEMENT MIS À JOUR
      // ========================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('🔄 Subscription updated:', subscription.id);

        await handleSubscriptionUpdated(subscription);
        break;
      }

      // ========================================
      // ABONNEMENT SUPPRIMÉ/ANNULÉ
      // ========================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('❌ Subscription deleted:', subscription.id);

        await handleSubscriptionDeleted(subscription);
        break;
      }

      // ========================================
      // PAIEMENT ÉCHOUÉ
      // ========================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('⚠️ Payment failed for invoice:', invoice.id);

        await handlePaymentFailed(invoice);
        break;
      }

      // ========================================
      // PAIEMENT RÉUSSI (renouvellement)
      // ========================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('✅ Payment succeeded for invoice:', invoice.id);

        await handlePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type);
    }

    // Répondre à Stripe pour confirmer la réception
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed', details: error.message });
  }
}

// ========================================
// FONCTION HELPER : Lire le body brut
// ========================================
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(Buffer.from(data));
    });
    req.on('error', reject);
  });
}

// ========================================
// HANDLERS D'ÉVÉNEMENTS
// ========================================

async function handleCheckoutCompleted({ userId, email, subscriptionId, customerId, session }) {
  console.log('📝 Processing checkout completion...');

  // Récupérer les détails de l'abonnement
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  // Déterminer le plan
  let plan = 'unknown';
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
      priceId === process.env.STRIPE_PRICE_PRO_YEARLY) {
    plan = 'pro';
  } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ||
             priceId === process.env.STRIPE_PRICE_ENTERPRISE_YEARLY) {
    plan = 'enterprise';
  }

  const interval = subscription.items.data[0].price.recurring.interval; // 'month' ou 'year'

  console.log('✅ Plan:', plan, '- Interval:', interval);

  // TODO: Enregistrer dans Airtable ou votre base de données
  // Exemple avec Airtable :
  /*
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const SUBSCRIPTIONS_TABLE_ID = process.env.AIRTABLE_SUBSCRIPTIONS_TABLE_ID;

  await fetch(`https://api.airtable.com/v0/${BASE_ID}/${SUBSCRIPTIONS_TABLE_ID}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        userId: userId,
        email: email,
        plan: plan,
        interval: interval,
        subscriptionId: subscriptionId,
        customerId: customerId,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        createdAt: new Date().toISOString()
      }
    })
  });
  */

  // TODO: Envoyer un email de confirmation
  // TODO: Mettre à jour les métadonnées utilisateur dans Clerk

  return { success: true };
}

async function handleSubscriptionCreated(subscription) {
  console.log('📝 Processing subscription creation...');

  const customerId = subscription.customer;
  const status = subscription.status;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  console.log('Customer:', customerId);
  console.log('Status:', status);
  console.log('Period ends:', currentPeriodEnd);

  // TODO: Enregistrer dans votre base de données

  return { success: true };
}

async function handleSubscriptionUpdated(subscription) {
  console.log('📝 Processing subscription update...');

  const subscriptionId = subscription.id;
  const status = subscription.status;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  console.log('Status:', status);
  console.log('Cancel at period end:', cancelAtPeriodEnd);

  // TODO: Mettre à jour dans votre base de données
  // Gérer les cas : active, past_due, canceled, unpaid

  if (cancelAtPeriodEnd) {
    console.log('⚠️ Subscription will be canceled at the end of the period');
  }

  return { success: true };
}

async function handleSubscriptionDeleted(subscription) {
  console.log('📝 Processing subscription deletion...');

  const subscriptionId = subscription.id;
  const customerId = subscription.customer;

  // TODO: Révoquer l'accès premium
  // TODO: Envoyer un email d'information
  // TODO: Mettre à jour le statut dans la base de données

  console.log('🔴 Subscription deleted for customer:', customerId);

  return { success: true };
}

async function handlePaymentFailed(invoice) {
  console.log('📝 Processing payment failure...');

  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  const amountDue = invoice.amount_due / 100; // Convertir de centimes en euros

  console.log('⚠️ Payment failed for customer:', customerId);
  console.log('Amount due:', amountDue, '€');

  // TODO: Envoyer un email pour informer l'utilisateur
  // TODO: Mettre à jour le statut dans la base de données

  return { success: true };
}

async function handlePaymentSucceeded(invoice) {
  console.log('📝 Processing payment success...');

  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  const amountPaid = invoice.amount_paid / 100; // Convertir de centimes en euros

  console.log('✅ Payment succeeded for customer:', customerId);
  console.log('Amount paid:', amountPaid, '€');

  // TODO: Prolonger l'accès premium
  // TODO: Envoyer un email de confirmation de paiement

  return { success: true };
}
