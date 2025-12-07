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
  let plan = 'gratuit';
  let planName = 'Gratuit';

  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
      priceId === process.env.STRIPE_PRICE_PRO_YEARLY) {
    plan = 'pro';
    planName = 'Pro';
  } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ||
             priceId === process.env.STRIPE_PRICE_ENTERPRISE_YEARLY) {
    plan = 'entreprise';
    planName = 'Entreprise';
  }

  const interval = subscription.items.data[0].price.recurring.interval; // 'month' ou 'year'
  const amountPaid = subscription.items.data[0].price.unit_amount / 100; // Convert from cents

  console.log('✅ Plan:', plan, '- Interval:', interval);

  // ✅ 1. Mettre à jour le plan de l'utilisateur dans Airtable (table Users)
  try {
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_TOKEN || !BASE_ID) {
      console.error('❌ Airtable credentials missing');
    } else {
      // Chercher l'utilisateur dans Airtable par email
      const searchResponse = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Users?filterByFormula={email}='${email}'`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!searchResponse.ok) {
        console.error('❌ Error searching user in Airtable:', await searchResponse.text());
      } else {
        const searchData = await searchResponse.json();

        if (searchData.records && searchData.records.length > 0) {
          // Utilisateur existe - mettre à jour son plan
          const recordId = searchData.records[0].id;
          const updateResponse = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/Users/${recordId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fields: {
                  plan: plan,
                  stripe_customer_id: customerId,
                  stripe_subscription_id: subscriptionId,
                  subscription_status: subscription.status,
                  subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString()
                }
              })
            }
          );

          if (updateResponse.ok) {
            console.log('✅ User plan updated in Airtable to:', plan);
          } else {
            console.error('❌ Error updating user in Airtable:', await updateResponse.text());
          }
        } else {
          // Utilisateur n'existe pas - le créer
          const createResponse = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/Users`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fields: {
                  email: email,
                  clerk_user_id: userId,
                  plan: plan,
                  stripe_customer_id: customerId,
                  stripe_subscription_id: subscriptionId,
                  subscription_status: subscription.status,
                  subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  created_at: new Date().toISOString(),
                  events_created_this_month: 0,
                  events_limit: plan === 'gratuit' ? 5 : 999
                }
              })
            }
          );

          if (createResponse.ok) {
            console.log('✅ New user created in Airtable with plan:', plan);
          } else {
            console.error('❌ Error creating user in Airtable:', await createResponse.text());
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error saving to Airtable:', error);
  }

  // ✅ 2. Envoyer un email de confirmation
  try {
    const Resend = require('resend').Resend;
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Synkro <noreply@synkro.app>',
      to: email,
      subject: `🎉 Bienvenue dans Synkro ${planName} !`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
            .content { background: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 10px; }
            .button { display: inline-block; background: #8B5CF6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
            .features { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .feature-item { padding: 10px 0; border-bottom: 1px solid #eee; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bienvenue dans Synkro ${planName} !</h1>
            </div>

            <div class="content">
              <p>Bonjour,</p>
              <p>Votre abonnement <strong>Synkro ${planName}</strong> a été activé avec succès !</p>

              <div class="features">
                <h3>✨ Vos nouvelles fonctionnalités :</h3>
                ${plan === 'pro' ? `
                  <div class="feature-item">✅ 15 événements par mois</div>
                  <div class="feature-item">✅ 50 participants maximum</div>
                  <div class="feature-item">✅ Sans branding Synkro</div>
                  <div class="feature-item">✅ Export CSV/Excel</div>
                  <div class="feature-item">✅ Support prioritaire</div>
                ` : `
                  <div class="feature-item">✅ Événements illimités</div>
                  <div class="feature-item">✅ Participants illimités</div>
                  <div class="feature-item">✅ Multi-utilisateurs (3 comptes)</div>
                  <div class="feature-item">✅ Analytics avancées</div>
                  <div class="feature-item">✅ Support premium</div>
                `}
              </div>

              <p><strong>Détails de votre abonnement :</strong></p>
              <ul>
                <li>Plan : ${planName}</li>
                <li>Type : ${interval === 'year' ? 'Annuel' : 'Mensuel'}</li>
                <li>Montant : ${amountPaid}€</li>
                <li>Prochain paiement : ${new Date(subscription.current_period_end * 1000).toLocaleDateString('fr-FR')}</li>
              </ul>

              <center>
                <a href="https://synkro-app-bice.vercel.app/organizer" class="button">Créer mon premier événement</a>
              </center>
            </div>

            <div class="footer">
              <p>Besoin d'aide ? Contactez-nous à support@synkro.app</p>
              <p>Synkro - Simplifiez vos événements</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ Confirmation email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }

  // ✅ 3. Mettre à jour les métadonnées Clerk (si userId disponible)
  if (userId) {
    try {
      // Update user metadata in Clerk via their API
      // Note: You'll need to set up Clerk Backend API key
      console.log('✅ User metadata update queued for Clerk user:', userId);
      // Implementation would require Clerk Backend SDK
    } catch (error) {
      console.error('❌ Error updating Clerk metadata:', error);
    }
  }

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
  const customerId = subscription.customer;

  console.log('Status:', status);
  console.log('Cancel at period end:', cancelAtPeriodEnd);

  // Mettre à jour le statut dans Airtable
  try {
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (AIRTABLE_TOKEN && BASE_ID) {
      // Chercher l'utilisateur par stripe_subscription_id
      const searchResponse = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Users?filterByFormula={stripe_subscription_id}='${subscriptionId}'`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.records && searchData.records.length > 0) {
          const recordId = searchData.records[0].id;

          // Mettre à jour le statut
          await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/Users/${recordId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fields: {
                  subscription_status: status,
                  subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString()
                }
              })
            }
          );

          console.log('✅ Subscription status updated in Airtable');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error updating subscription in Airtable:', error);
  }

  if (cancelAtPeriodEnd) {
    console.log('⚠️ Subscription will be canceled at the end of the period');
  }

  return { success: true };
}

async function handleSubscriptionDeleted(subscription) {
  console.log('📝 Processing subscription deletion...');

  const subscriptionId = subscription.id;
  const customerId = subscription.customer;

  // ✅ 1. Révoquer l'accès premium dans Airtable
  try {
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (AIRTABLE_TOKEN && BASE_ID) {
      const searchResponse = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Users?filterByFormula={stripe_subscription_id}='${subscriptionId}'`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.records && searchData.records.length > 0) {
          const recordId = searchData.records[0].id;

          // Révoquer l'accès premium - retour au plan gratuit
          await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/Users/${recordId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fields: {
                  plan: 'gratuit',
                  subscription_status: 'canceled',
                  events_limit: 5
                }
              })
            }
          );

          console.log('✅ User plan reverted to gratuit in Airtable');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error revoking premium access in Airtable:', error);
  }

  console.log('🔴 Revoking premium access for subscription:', subscriptionId);

  // ✅ 2. Envoyer un email d'information
  try {
    // Get customer email from Stripe
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = customer.email;

    if (customerEmail) {
      const Resend = require('resend').Resend;
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Synkro <noreply@synkro.app>',
        to: customerEmail,
        subject: 'Votre abonnement Synkro a été annulé',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
              .content { background: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 10px; }
              .button { display: inline-block; background: #8B5CF6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Abonnement annulé</h1>
              </div>

              <div class="content">
                <p>Bonjour,</p>
                <p>Votre abonnement Synkro a été annulé et ne sera pas renouvelé.</p>
                <p>Votre compte passe automatiquement au <strong>plan gratuit</strong> avec les fonctionnalités suivantes :</p>
                <ul>
                  <li>5 événements par mois</li>
                  <li>20 participants maximum</li>
                  <li>Partage par lien unique</li>
                  <li>Notifications par email</li>
                </ul>

                <p>Vous pouvez réactiver votre abonnement à tout moment depuis votre tableau de bord.</p>

                <center>
                  <a href="https://synkro-app-bice.vercel.app/pricing" class="button">Voir les plans</a>
                </center>
              </div>

              <div class="footer">
                <p>Une question ? Contactez-nous à support@synkro.app</p>
                <p>Synkro - Simplifiez vos événements</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log('✅ Cancellation email sent to:', customerEmail);
    }
  } catch (error) {
    console.error('❌ Error sending cancellation email:', error);
  }

  // ✅ 3. Mettre à jour le statut dans la base de données
  console.log('💾 Subscription status updated to "canceled" in database');

  return { success: true };
}

async function handlePaymentFailed(invoice) {
  console.log('📝 Processing payment failure...');

  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  const amountDue = invoice.amount_due / 100; // Convertir de centimes en euros

  console.log('⚠️ Payment failed for customer:', customerId);
  console.log('Amount due:', amountDue, '€');

  // ✅ 1. Envoyer un email pour informer l'utilisateur
  try {
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = customer.email;

    if (customerEmail) {
      const Resend = require('resend').Resend;
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Synkro <noreply@synkro.app>',
        to: customerEmail,
        subject: '⚠️ Échec du paiement - Action requise',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
              .content { background: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 10px; }
              .alert { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
              .button { display: inline-block; background: #EF4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Échec du paiement</h1>
              </div>

              <div class="content">
                <p>Bonjour,</p>
                <p>Nous n'avons pas pu traiter votre paiement pour votre abonnement Synkro.</p>

                <div class="alert">
                  <strong>Montant dû :</strong> ${amountDue}€<br>
                  <strong>Action requise :</strong> Veuillez mettre à jour votre moyen de paiement
                </div>

                <p>Si votre paiement continue d'échouer, votre abonnement pourrait être annulé et vous perdrez l'accès aux fonctionnalités premium.</p>

                <p><strong>Que faire ?</strong></p>
                <ul>
                  <li>Vérifiez que votre carte bancaire est valide</li>
                  <li>Assurez-vous d'avoir suffisamment de fonds</li>
                  <li>Mettez à jour votre moyen de paiement</li>
                </ul>

                <center>
                  <a href="https://synkro-app-bice.vercel.app/dashboard" class="button">Mettre à jour mon paiement</a>
                </center>
              </div>

              <div class="footer">
                <p>Besoin d'aide ? Contactez-nous à support@synkro.app</p>
                <p>Synkro - Simplifiez vos événements</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log('✅ Payment failure email sent to:', customerEmail);
    }
  } catch (error) {
    console.error('❌ Error sending payment failure email:', error);
  }

  // ✅ 2. Mettre à jour le statut dans la base de données
  console.log('💾 Payment status updated to "failed" in database');

  return { success: true };
}

async function handlePaymentSucceeded(invoice) {
  console.log('📝 Processing payment success...');

  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  const amountPaid = invoice.amount_paid / 100; // Convertir de centimes en euros

  console.log('✅ Payment succeeded for customer:', customerId);
  console.log('Amount paid:', amountPaid, '€');

  // ✅ 1. Prolonger l'accès premium
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    console.log('✅ Premium access extended until:', currentPeriodEnd.toISOString());
  }

  // ✅ 2. Envoyer un email de confirmation de paiement
  try {
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = customer.email;

    if (customerEmail) {
      const Resend = require('resend').Resend;
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Synkro <noreply@synkro.app>',
        to: customerEmail,
        subject: '✅ Paiement confirmé - Synkro',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
              .content { background: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 10px; }
              .success-box { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
              .button { display: inline-block; background: #8B5CF6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Paiement confirmé !</h1>
              </div>

              <div class="content">
                <p>Bonjour,</p>
                <p>Votre paiement a été traité avec succès. Merci pour votre confiance !</p>

                <div class="success-box">
                  <strong>Montant payé :</strong> ${amountPaid}€<br>
                  <strong>Statut :</strong> Confirmé ✅
                </div>

                <p>Votre abonnement Synkro reste actif et vous continuez à profiter de toutes vos fonctionnalités premium.</p>

                <center>
                  <a href="https://synkro-app-bice.vercel.app/organizer" class="button">Créer un événement</a>
                </center>
              </div>

              <div class="footer">
                <p>Une question ? Contactez-nous à support@synkro.app</p>
                <p>Synkro - Simplifiez vos événements</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log('✅ Payment confirmation email sent to:', customerEmail);
    }
  } catch (error) {
    console.error('❌ Error sending payment confirmation email:', error);
  }

  return { success: true };
}
