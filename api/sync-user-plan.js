/**
 * API Serverless pour synchroniser manuellement le plan utilisateur depuis Stripe vers Airtable
 * Utile pour déboguer et réparer les problèmes de synchronisation
 *
 * Usage: GET /api/sync-user-plan?email=user@example.com
 */

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Permettre uniquement les requêtes GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      error: 'Email manquant',
      message: 'Le paramètre email est requis'
    });
  }

  const logs = [];
  const log = (message) => {
    console.log(message);
    logs.push(message);
  };

  try {
    log(`🔍 Synchronizing plan for user: ${email}`);

    // 1. Chercher le client dans Stripe par email
    log('📡 Searching for customer in Stripe...');
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customers.data.length === 0) {
      log('❌ No Stripe customer found for this email');
      return res.status(404).json({
        success: false,
        message: 'Aucun client Stripe trouvé pour cet email',
        logs
      });
    }

    const customer = customers.data[0];
    log(`✅ Stripe customer found: ${customer.id}`);

    // 2. Récupérer les abonnements actifs
    log('📡 Fetching active subscriptions...');
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    let plan = 'gratuit';
    let subscriptionData = null;

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0].price.id;

      log(`✅ Active subscription found: ${subscription.id}`);
      log(`🔍 Price ID: ${priceId}`);

      // Déterminer le plan
      if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
          priceId === process.env.STRIPE_PRICE_PRO_YEARLY) {
        plan = 'pro';
      } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ||
                 priceId === process.env.STRIPE_PRICE_ENTERPRISE_YEARLY) {
        plan = 'entreprise';
      }

      subscriptionData = {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        priceId: priceId
      };

      log(`✅ Determined plan: ${plan}`);
    } else {
      log('⚠️ No active subscription found - defaulting to gratuit');
    }

    // 3. Mettre à jour Airtable
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_TOKEN || !BASE_ID) {
      log('❌ Airtable credentials missing');
      return res.status(500).json({
        success: false,
        message: 'Configuration Airtable manquante',
        logs
      });
    }

    log('📡 Searching for user in Airtable...');
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
      const errorText = await searchResponse.text();
      log(`❌ Error searching Airtable: ${errorText}`);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche dans Airtable',
        logs
      });
    }

    const searchData = await searchResponse.json();

    if (searchData.records && searchData.records.length > 0) {
      // Utilisateur existe - mettre à jour
      const recordId = searchData.records[0].id;
      const currentData = searchData.records[0].fields;

      log(`✅ User found in Airtable, record ID: ${recordId}`);
      log(`🔍 Current plan in Airtable: ${currentData.plan || 'not set'}`);

      const updatePayload = {
        fields: {
          plan: plan,
          stripe_customer_id: customer.id,
          events_limit: plan === 'pro' ? 15 : (plan === 'entreprise' ? 999 : 5)
        }
      };

      if (subscriptionData) {
        updatePayload.fields.stripe_subscription_id = subscriptionData.id;
        updatePayload.fields.subscription_status = subscriptionData.status;
        updatePayload.fields.subscription_period_end = subscriptionData.currentPeriodEnd;
      }

      log(`🔄 Updating Airtable with plan: ${plan}`);

      const updateResponse = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Users/${recordId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        }
      );

      if (updateResponse.ok) {
        const updatedData = await updateResponse.json();
        log(`✅✅✅ User plan successfully updated to: ${plan}`);

        return res.status(200).json({
          success: true,
          message: 'Synchronisation réussie',
          data: {
            email: email,
            previousPlan: currentData.plan || 'not set',
            newPlan: plan,
            stripeCustomerId: customer.id,
            subscription: subscriptionData,
            airtableRecord: updatedData.fields
          },
          logs
        });
      } else {
        const errorText = await updateResponse.text();
        log(`❌ Error updating Airtable: ${errorText}`);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour Airtable',
          logs
        });
      }
    } else {
      // Utilisateur n'existe pas - le créer
      log('⚠️ User not found in Airtable, creating new user...');

      const createPayload = {
        fields: {
          email: email,
          plan: plan,
          stripe_customer_id: customer.id,
          created_at: new Date().toISOString(),
          events_created_this_month: 0,
          events_limit: plan === 'pro' ? 15 : (plan === 'entreprise' ? 999 : 5)
        }
      };

      if (subscriptionData) {
        createPayload.fields.stripe_subscription_id = subscriptionData.id;
        createPayload.fields.subscription_status = subscriptionData.status;
        createPayload.fields.subscription_period_end = subscriptionData.currentPeriodEnd;
      }

      const createResponse = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createPayload)
        }
      );

      if (createResponse.ok) {
        const createdData = await createResponse.json();
        log(`✅✅✅ User created in Airtable with plan: ${plan}`);

        return res.status(200).json({
          success: true,
          message: 'Utilisateur créé et synchronisé',
          data: {
            email: email,
            plan: plan,
            stripeCustomerId: customer.id,
            subscription: subscriptionData,
            airtableRecord: createdData.fields
          },
          logs
        });
      } else {
        const errorText = await createResponse.text();
        log(`❌ Error creating user in Airtable: ${errorText}`);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création dans Airtable',
          logs
        });
      }
    }

  } catch (error) {
    log(`❌ Error: ${error.message}`);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: error.message,
      logs
    });
  }
}
