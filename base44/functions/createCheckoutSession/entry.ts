import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    // Auth via Base44 (request-scoped client)
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const { priceId, planName, billingType } = await req.json();

    // Create or get Stripe customer
    let customer;
    try {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: user.full_name,
          metadata: {
            user_id: user.id,
            base44_user_email: user.email
          }
        });
      }
    } catch (error) {
      console.error('Error managing customer:', error);
      return new Response(JSON.stringify({ error: 'Customer creation failed' }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const origin = req.headers.get('origin') || '';
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/Dashboard?payment=success`,
      cancel_url: `${origin}/Pricing?payment=cancelled`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_name: planName,
        billing_type: billingType || 'monthly'
      }
    });

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to create checkout session' }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});