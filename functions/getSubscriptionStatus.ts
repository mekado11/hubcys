import { createClient } from 'npm:@base44/sdk@0.1.0';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'), 
});

Deno.serve(async (req) => {
  try {
    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    base44.auth.setToken(token);
    const user = await base44.auth.me();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Find the user's Stripe customer and their subscriptions
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ 
        hasSubscription: false,
        tier: 'free_trial'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return new Response(JSON.stringify({ 
        hasSubscription: false,
        tier: 'free_trial'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;

    // Map price IDs to tiers (you'll need to update these with your actual Stripe price IDs)
    let tier = 'basic';
    if (priceId === 'price_pro_monthly' || priceId === 'price_pro_yearly') {
      tier = 'pro';
    } else if (priceId === 'price_enterprise_monthly' || priceId === 'price_enterprise_yearly') {
      tier = 'enterprise';
    }

    return new Response(JSON.stringify({ 
      hasSubscription: true,
      tier: tier,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Subscription status error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to get subscription status',
      hasSubscription: false,
      tier: 'free_trial'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});