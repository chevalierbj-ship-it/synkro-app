import Stripe from 'stripe';
import { applyRateLimit } from './lib/rate-limit.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting strict pour les paiements
  if (applyRateLimit(req, res, 'checkout')) {
    console.log('⚠️ Rate limit exceeded for checkout');
    return; // Requête bloquée par rate limit
  }

  try {
    const { priceId, planName, planType, userEmail, userId } = req.body;

    // Validation
    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(planName || 'Pro')}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/cancel`,
      customer_email: userEmail || undefined,
      client_reference_id: userId || undefined, // IMPORTANT: Lie l'utilisateur Clerk à la session Stripe
      metadata: {
        planName: planName || 'Unknown',
        planType: planType || 'monthly',
        userId: userId || 'anonymous',
        userEmail: userEmail || 'no-email',
      },
      subscription_data: {
        metadata: {
          planName: planName || 'Unknown',
          planType: planType || 'monthly',
          userId: userId || 'anonymous',
          userEmail: userEmail || 'no-email',
        },
      },
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
}
