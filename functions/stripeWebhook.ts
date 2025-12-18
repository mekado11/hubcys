import { createClient } from 'npm:@base44/sdk@0.1.0';
import Stripe from 'npm:stripe@14.21.0';

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'), 
});

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    // Get the raw body
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return new Response('No signature', { status: 400 });
    }

    // Verify the webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    console.log('Received event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response('Success', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Server error', { status: 500 });
  }
});

async function handleCheckoutCompleted(session) {
  try {
    console.log('Processing checkout completion for session:', session.id);
    
    const userEmail = session.metadata?.user_email;
    if (!userEmail) {
      console.error('No user email in session metadata');
      return;
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const priceId = subscription.items.data[0].price.id;
    
    // Map price ID to subscription tier
    const tierMapping = {
      'price_basic_monthly': 'basic',
      'price_basic_annual': 'basic',
      'price_pro_monthly': 'pro',
      'price_pro_annual': 'pro'
    };
    
    const subscriptionTier = tierMapping[priceId] || 'basic';
    
    console.log(`Updating user ${userEmail} to tier: ${subscriptionTier}`);
    
    // Update user's subscription tier
    const users = await base44.entities.User.filter({ email: userEmail });
    if (users.length > 0) {
      await base44.entities.User.update(users[0].id, {
        subscription_tier: subscriptionTier
      });
      console.log(`Successfully updated user ${userEmail} subscription tier to ${subscriptionTier}`);
    } else {
      console.error(`User not found: ${userEmail}`);
    }
    
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Processing subscription update:', subscription.id);
    
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userEmail = customer.email;
    
    if (!userEmail) {
      console.error('No email found for customer');
      return;
    }

    const priceId = subscription.items.data[0].price.id;
    
    // Map price ID to subscription tier
    const tierMapping = {
      'price_basic_monthly': 'basic',
      'price_basic_annual': 'basic',
      'price_pro_monthly': 'pro',
      'price_pro_annual': 'pro'
    };
    
    const subscriptionTier = tierMapping[priceId] || 'basic';
    
    console.log(`Updating user ${userEmail} to tier: ${subscriptionTier}`);
    
    // Update user's subscription tier
    const users = await base44.entities.User.filter({ email: userEmail });
    if (users.length > 0) {
      await base44.entities.User.update(users[0].id, {
        subscription_tier: subscriptionTier
      });
      console.log(`Successfully updated user ${userEmail} subscription tier to ${subscriptionTier}`);
    } else {
      console.error(`User not found: ${userEmail}`);
    }
    
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('Processing subscription cancellation:', subscription.id);
    
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userEmail = customer.email;
    
    if (!userEmail) {
      console.error('No email found for customer');
      return;
    }

    console.log(`Downgrading user ${userEmail} to free_trial`);
    
    // Downgrade user to free trial
    const users = await base44.entities.User.filter({ email: userEmail });
    if (users.length > 0) {
      await base44.entities.User.update(users[0].id, {
        subscription_tier: 'free_trial'
      });
      console.log(`Successfully downgraded user ${userEmail} to free_trial`);
    } else {
      console.error(`User not found: ${userEmail}`);
    }
    
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    console.log('Payment succeeded for invoice:', invoice.id);
    // Additional logic for successful payments if needed
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    console.log('Payment failed for invoice:', invoice.id);
    
    const customer = await stripe.customers.retrieve(invoice.customer);
    const userEmail = customer.email;
    
    if (!userEmail) {
      console.error('No email found for customer');
      return;
    }

    console.log(`Payment failed for user: ${userEmail}`);
    // You might want to send notifications or take other actions here
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}