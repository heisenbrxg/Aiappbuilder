/**
 * Stripe Webhooks API route for handling subscription events
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import Stripe from 'stripe';
import { createStripeInstance, validateWebhookSignature, STRIPE_WEBHOOK_EVENTS } from '~/lib/billing/stripe';
import { billingService } from '~/lib/billing/billingService';
import { ServerBillingService } from '~/lib/billing/billingService.server';

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Get Stripe secret key and webhook secret - try Cloudflare env first, then process.env
    let stripeSecretKey = context.cloudflare?.env?.STRIPE_SECRET_KEY;
    let webhookSecret = context.cloudflare?.env?.STRIPE_WEBHOOK_SECRET;
    
    // Fallback to process.env for local development
    if (!stripeSecretKey && process.env.STRIPE_SECRET_KEY) {
      console.log('Using STRIPE_SECRET_KEY from process.env');
      stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    }
    
    if (!webhookSecret && process.env.STRIPE_WEBHOOK_SECRET) {
      console.log('Using STRIPE_WEBHOOK_SECRET from process.env');
      webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    }
    
    if (!stripeSecretKey || !webhookSecret) {
      console.error('Missing Stripe configuration');
      return json({ error: 'Webhook configuration error' }, { status: 500 });
    }

    // Initialize server-side billing service with admin rights
    const serverBillingService = new ServerBillingService(request, context?.cloudflare?.env);
    
    // Get the raw request body and signature
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return json({ error: 'Missing signature' }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = createStripeInstance(stripeSecretKey);

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      // Check if this is a development environment
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           !process.env.NODE_ENV || 
                           request.headers.get('stripe-signature') === 'test_signature';
      
      if (isDevelopment) {
        console.log('⚠️ Development mode: Bypassing Stripe signature verification');
        // Parse the event from the request body
        event = JSON.parse(payload) as Stripe.Event;
      } else {
        // Production mode: Verify the signature
        event = validateWebhookSignature(payload, signature, webhookSecret, stripe);
      }
    } catch (error) {
      console.error('Invalid webhook signature:', error);
      return json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Process the event
    try {
      await processWebhookEvent(event, serverBillingService, stripe);
      return json({ received: true, id: event.id });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return json({ error: 'Webhook processing failed' }, { status: 500 });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export this function so it can be used by other routes
export async function processWebhookEvent(
  event: Stripe.Event, 
  serverBillingService: ServerBillingService,
  stripe: Stripe
): Promise<void> {
  console.log(`Processing Stripe webhook event: ${event.type} (${event.id})`);
  console.log('Event data:', JSON.stringify(event.data.object, null, 2));
  
  // Check if this event has already been processed
  const existingEvent = await serverBillingService.getBillingEventByStripeId(event.id);
  if (existingEvent && existingEvent.processed) {
    console.log(`Skipping already processed event: ${event.id}`);
    return;
  }
  
  // Log the event first, mark as unprocessed
  const userId = extractUserIdFromEvent(event);
  console.log('Extracted user ID:', userId);
  
  try {
    await serverBillingService.createBillingEvent({
      user_id: userId,
      event_type: event.type,
      stripe_event_id: event.id,
      data: event.data.object,
      processed: false,
    });
  } catch (error) {
    console.error('Failed to create billing event:', error);
    // Continue processing even if event logging fails
  }
  
  try {
  switch (event.type) {
    case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_CREATED:
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, serverBillingService);
      break;

    case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_UPDATED:
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, serverBillingService);
      break;

    case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_DELETED:
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, serverBillingService);
      break;

    case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED:
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, serverBillingService);
      break;

    case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        await handlePaymentFailed(event.data.object as Stripe.Invoice, serverBillingService);
      break;

    default:
      console.log('Unhandled webhook event type:', event.type);
  }

    // Mark the event as processed
    try {
      await serverBillingService.updateBillingEvent(event.id, { processed: true });
      console.log(`Successfully processed Stripe webhook event: ${event.type} (${event.id})`);
    } catch (error) {
      console.error('Failed to mark event as processed:', error);
    }
  } catch (error) {
    console.error(`Error processing Stripe webhook event ${event.id}:`, error);
    // Don't update the event status - it will remain unprocessed for retry
    throw error; // Re-throw to trigger webhook retry from Stripe
  }
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription, 
  serverBillingService: ServerBillingService
): Promise<void> {
  console.log('🔔 Processing subscription created event:', JSON.stringify(subscription, null, 2));
  
  const userId = subscription.metadata.userId;
  let planId = subscription.metadata.planId;

  // If no planId in metadata, try to extract from price metadata (for auto-created products)
  if (!planId && subscription.items.data[0]?.price?.metadata?.plan_id) {
    planId = subscription.items.data[0].price.metadata.plan_id;
    console.log('Extracted plan ID from price metadata:', planId);
  }

  if (!userId || !planId) {
    console.warn('⚠️ Missing metadata in subscription (likely a test event):', subscription.metadata);
    console.warn('Price metadata:', subscription.items.data[0]?.price?.metadata);
    console.log('Skipping subscription processing for test event without proper metadata');
    return; // Skip processing for test events
  }

  console.log(`✅ Processing subscription for user: ${userId}, plan: ${planId}`);

  // IMPORTANT: Instead of creating a subscription, ADD the plan's credits to user's existing balance
  const { adminSupabase } = serverBillingService as any;
  
  // 1. Get the plan details to see how many credits it provides
  const plan = await serverBillingService.getPlanById(planId);
  if (!plan) {
    console.error(`❌ Plan ${planId} not found`);
    return;
  }
  
  const planCredits = plan.message_limit;
  console.log(`📦 Plan ${planId} provides ${planCredits} credits`);
  
  // 2. Get user's current total credits (from all sources)
  const { data: currentUsage } = await adminSupabase
    .rpc('get_user_usage', { user_uuid: userId });
  
  const currentLimit = currentUsage?.[0]?.message_limit || 0;
  console.log(`💳 User currently has ${currentLimit} total credits`);
  
  // 3. ADD the new plan credits to their existing balance
  await adminSupabase.rpc('increment_credits', {
    p_user_id: userId,
    p_delta: planCredits,
    p_transaction_type: 'stripe_subscription',
    p_reference_id: subscription.id,
    p_notes: `Stripe subscription: ${plan.name} (+${planCredits} credits)`
  });
  
  console.log(`✅ Added ${planCredits} credits from Stripe plan to user ${userId}`);
  console.log(`🎯 User now has ${currentLimit + planCredits} total credits`);
  
  // 4. Create subscription record for tracking but keep user on credit-based system
  const subscriptionData = {
    user_id: userId,
    plan_id: 'credits', // Use a special 'credits' plan ID to indicate credit-based billing
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    status: subscription.status as any,
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : undefined,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
  };

  // Check if user already has any subscription
  const existingSubscription = await serverBillingService.getUserSubscription(userId);
  console.log('Existing subscription:', existingSubscription);
  
  if (existingSubscription) {
    console.log('User has existing subscription, updating to credit-based system');
    
    // Update existing subscription to use credit-based system
    await serverBillingService.updateUserSubscription(userId, subscriptionData);
    
    console.log('✅ Successfully updated subscription to credit-based system for user:', userId);
  } else {
    // Create new subscription using credit-based system
    console.log('Creating new credit-based subscription for user:', userId);
    await serverBillingService.createUserSubscription(subscriptionData);
    
    console.log('✅ Successfully created new credit-based subscription for user:', userId);
  }
  
  // Log the credit addition event
  await serverBillingService.createBillingEvent({
    user_id: userId,
    event_type: 'credits_added_stripe',
    stripe_event_id: subscription.id,
    data: {
      plan_name: plan.name,
      credits_added: planCredits,
      previous_total: currentLimit,
      new_total: currentLimit + planCredits,
      subscription_id: subscription.id,
    },
    processed: true,
  });
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  serverBillingService: ServerBillingService
): Promise<void> {
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.warn('⚠️ Missing user ID in subscription metadata (likely a test event)');
    console.log('Skipping subscription update for test event without proper metadata');
    return; // Skip processing for test events
  }

  console.log('Updating subscription for user:', userId);

  // Update user subscription
  await serverBillingService.updateUserSubscription(userId, {
    status: subscription.status as any,
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : undefined,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
    // Detect plan change – first price on the subscription is our source of truth
    ...(extractPlanId(subscription) ? { plan_id: extractPlanId(subscription)! } : {}),
  });

  // If a cancellation was scheduled (cancel_at_period_end true) mark status as "canceling" so UI can warn
  if (subscription.cancel_at_period_end) {
    await serverBillingService.updateUserSubscription(userId, { status: 'canceling' as any });
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  serverBillingService: ServerBillingService
): Promise<void> {
  const userId = subscription.metadata.userId;

  if (!userId) {
    throw new Error('Missing user ID in subscription metadata');
  }

  console.log('Deleting subscription for user:', userId);

  // Update subscription status to canceled and revert to free plan
  await serverBillingService.updateUserSubscription(userId, {
    status: 'canceled',
    plan_id: 'free',
  });
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  serverBillingService: ServerBillingService
): Promise<void> {
  const subscription = (invoice as any).subscription as string;
  
  if (!subscription) {
    return; // Not a subscription invoice
  }

  console.log('Payment succeeded for subscription:', subscription);

  // Log successful payment event
  await serverBillingService.createBillingEvent({
    user_id: extractUserIdFromInvoice(invoice),
    event_type: 'payment_succeeded',
    stripe_event_id: invoice.id,
    data: {
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      subscription_id: subscription,
    },
    processed: true,
  });
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  serverBillingService: ServerBillingService
): Promise<void> {
  const subscription = (invoice as any).subscription as string;
  
  if (!subscription) {
    return; // Not a subscription invoice
  }

  console.log('Payment failed for subscription:', subscription);

  // Mark subscription as past_due so frontend blocks paid features
  try {
    const stripe = invoice as any; // avoid extra import
    const sub = (invoice.lines?.data?.[0]?.subscription as string) || subscription;
    if (sub) {
      // We need user_id to update row
      const userId = extractUserIdFromInvoice(invoice);
      if (userId && userId !== 'unknown') {
        await serverBillingService.updateUserSubscription(userId, { status: 'past_due' as any });
      }
    }
  } catch (e) {
    console.error('Failed to mark sub past_due', e);
  }

  // Log failed payment event
  await serverBillingService.createBillingEvent({
    user_id: extractUserIdFromInvoice(invoice),
    event_type: 'payment_failed',
    stripe_event_id: invoice.id,
    data: {
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      subscription_id: subscription,
      attempt_count: invoice.attempt_count,
    },
    processed: true,
  });
}

function extractUserIdFromEvent(event: Stripe.Event): string {
  const obj = event.data.object as any;
  
  // Try to get user ID from metadata
  if (obj.metadata?.userId) {
    return obj.metadata.userId;
  }
  
  // For subscription events
  if (obj.subscription?.metadata?.userId) {
    return obj.subscription.metadata.userId;
  }
  
  // Fallback - this should not happen in production
  return 'unknown';
}

function extractUserIdFromInvoice(invoice: Stripe.Invoice): string {
  // Try to get user ID from subscription metadata
  if ((invoice as any).subscription_details?.metadata?.userId) {
    return (invoice as any).subscription_details.metadata.userId;
  }
  
  // Fallback - this should not happen in production
  return 'unknown';
}

function extractPlanId(subscription: Stripe.Subscription): string | null {
  // Try metadata first
  if (subscription.metadata?.planId) return subscription.metadata.planId;
  // Fallback to price metadata
  const price = subscription.items.data[0]?.price;
  if (price?.metadata?.plan_id) return price.metadata.plan_id as string;
  return null;
}
