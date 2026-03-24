
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.25.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret) {
      return Response.json({ error: 'Stripe secret not configured' }, { status: 500 });
    }
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });

    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const plan = (body.plan || 'standard').toLowerCase(); // 'standard' | 'plus'
    // Amounts in cents (USD)
    const planConfig = {
      standard: { amount: 69900, label: 'Fortigap Early Career (Annual - Standard)' },
      plus: { amount: 89900, label: 'Fortigap Early Career (Annual - Plus)' }
    };
    const cfg = planConfig[plan] || planConfig.standard;

    // Derive app origin for redirect URLs
    const originHeader = req.headers.get('origin');
    const forwardProto = req.headers.get('x-forwarded-proto') || 'https';
    const forwardHost = req.headers.get('x-forwarded-host');
    const appOrigin = originHeader || (forwardHost ? `${forwardProto}://${forwardHost}` : 'https://base44.app');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      allow_promotion_codes: true,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: cfg.amount,
            product_data: {
              name: cfg.label,
              description: 'One-year individual access to Fortigap Early Career tier (non-recurring)',
            },
          },
        },
      ],
      metadata: {
        plan_key: plan,
        user_id: user.id,
        user_email: user.email,
        requested_tier: 'early_career',
      },
      success_url: `${appOrigin}/Pricing?checkout=success&section=early-career`,
      cancel_url: `${appOrigin}/Pricing?checkout=cancelled&section=early-career`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createEarlyCareerCheckout error:', error);
    return Response.json({ error: error.message || 'Checkout init failed' }, { status: 500 });
  }
});
