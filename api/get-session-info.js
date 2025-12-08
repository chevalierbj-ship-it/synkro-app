import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id } = req.query;

    // Validation
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Get subscription details if available
    let planName = 'Pro'; // Default
    let planType = 'monthly';

    if (session.metadata) {
      planName = session.metadata.planName || 'Pro';
      planType = session.metadata.planType || 'monthly';
    }

    // If metadata doesn't have the plan, try to get it from the subscription
    if (session.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const priceId = subscription.items.data[0].price.id;

        // Determine the plan based on price ID
        if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ||
            priceId === process.env.STRIPE_PRICE_ENTERPRISE_YEARLY) {
          planName = 'Entreprise';
        } else if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
                   priceId === process.env.STRIPE_PRICE_PRO_YEARLY) {
          planName = 'Pro';
        }

        // Get the billing interval
        planType = subscription.items.data[0].price.recurring.interval === 'year' ? 'yearly' : 'monthly';
      } catch (error) {
        console.error('Error retrieving subscription:', error.message);
      }
    }

    return res.status(200).json({
      planName,
      planType,
      customerEmail: session.customer_details?.email,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Error retrieving session:', error);
    return res.status(500).json({
      error: 'Failed to retrieve session',
      message: error.message
    });
  }
}
