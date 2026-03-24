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

    // Find the user's Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No subscription found for this user' 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const customer = customers.data[0];

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${req.headers.get('origin')}/Dashboard`,
    });

    return new Response(JSON.stringify({ 
      url: session.url 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Subscription management error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create subscription management session' 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});