/**
 * Stripe Checkout API route for creating subscription checkout sessions
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createStripeInstance, createCheckoutSession, createStripeCustomer, getPlanById, ensureStripeProductExists } from '~/lib/billing/stripe';
import { billingService } from '~/lib/billing/billingService';
import { ServerBillingService } from '~/lib/billing/billingService.server';
import { createClient } from '~/lib/supabase/client';
import { processWebhookEvent } from './api.stripe.webhooks';

interface CheckoutRequest {
  planId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  successUrl: string;
  cancelUrl: string;
  existingSubscriptionId?: string; // Added to handle free plan upgrades
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    console.log('Method not allowed:', request.method);
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Get environment variables - try Cloudflare env first, then process.env
    let stripeSecretKey = context.cloudflare?.env?.STRIPE_SECRET_KEY;
    
    // Fallback to process.env for local development
    if (!stripeSecretKey && process.env.STRIPE_SECRET_KEY) {
      console.log('Using STRIPE_SECRET_KEY from process.env');
      stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    }
    
    if (!stripeSecretKey) {
      console.error('Missing Stripe configuration: STRIPE_SECRET_KEY');
      return json({ error: 'Payment system not configured' }, { status: 500 });
    }

    // Initialize Stripe instance
    const stripe = createStripeInstance(stripeSecretKey);
    console.log('Stripe instance created successfully');

    // Test Stripe connectivity
    try {
      await stripe.balance.retrieve();
      console.log('Stripe API connectivity verified');
    } catch (stripeTestError) {
      console.error('Stripe API connectivity test failed:', stripeTestError);
      return json({
        error: 'Payment system connectivity issue',
        details: stripeTestError instanceof Error ? stripeTestError.message : String(stripeTestError)
      }, { status: 500 });
    }

    // Parse request body
    const body = await request.json() as CheckoutRequest;
    console.log('Checkout request received:', {
      planId: body.planId,
      userId: body.userId,
      userEmail: body.userEmail,
      existingSubscriptionId: body.existingSubscriptionId
    });
    
    const { planId, userId, userEmail, userName, successUrl, cancelUrl, existingSubscriptionId } = body;

    // Validate required fields
    if (!planId || !userId || !userEmail || !successUrl || !cancelUrl) {
      console.error('Missing required fields:', { planId, userId, userEmail, successUrl, cancelUrl });
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize server-side billing service (has admin rights)
    const serverBillingService = new ServerBillingService(request, context?.cloudflare?.env);

    // Validate plan exists
    const plan = getPlanById(planId);
    if (!plan) {
      console.error('Invalid plan selected:', planId);
      return json({ error: 'Invalid plan selected' }, { status: 400 });
    }
    console.log('Plan found:', plan);

    // Check if user already has a subscription
    console.log('Checking for existing subscription for user:', userId);
    const existingSubscription = await serverBillingService.getUserSubscription(userId);
    console.log('Existing subscription:', existingSubscription);

    // For plan changes, users should use the Customer Portal
    // This API now only handles new subscriptions (free → paid)
    console.log('Checking subscription eligibility:', {
      hasSubscription: !!existingSubscription,
      status: existingSubscription?.status,
      planId: existingSubscription?.plan_id,
      hasStripeSubId: !!existingSubscription?.stripe_subscription_id,
      currentPeriodEnd: existingSubscription?.current_period_end
    });

    // Check if subscription has expired (current_period_end is in the past)
    const isExpired = existingSubscription?.current_period_end &&
      new Date(existingSubscription.current_period_end) < new Date();

    console.log('Subscription expiry check:', {
      currentPeriodEnd: existingSubscription?.current_period_end,
      isExpired,
      now: new Date().toISOString()
    });

    // Block only if user has an active, non-free, non-expired subscription
    if (existingSubscription &&
        existingSubscription.status === 'active' &&
        existingSubscription.plan_id !== 'free' &&
        existingSubscription.stripe_subscription_id &&
        !isExpired) {
      console.log('User has active paid subscription, should use Customer Portal for changes');
      return json({
        error: 'Please use the Customer Portal to manage your existing subscription',
        useCustomerPortal: true
      }, { status: 400 });
    }

    // Allow upgrades for free plans, canceled plans, expired plans, or past_due plans
    console.log('Subscription check passed, proceeding with checkout creation');

    // Get or create Stripe customer
    let customerId = existingSubscription?.stripe_customer_id;
    console.log('Existing customer ID:', customerId);

    // Validate existing customer ID if present
    if (customerId) {
      try {
        console.log('Validating existing Stripe customer:', customerId);
        await stripe.customers.retrieve(customerId);
        console.log('✅ Existing customer validated:', customerId);
      } catch (error) {
        console.log('❌ Existing customer invalid, will create new one:', error instanceof Error ? error.message : String(error));
        customerId = undefined; // Reset to create new customer
      }
    }

    if (!customerId) {
      try {
        // First, search for existing customer with this email
        console.log('Searching for existing Stripe customer with email:', userEmail);
        const existingCustomers = await stripe.customers.list({
          email: userEmail,
          limit: 1
        });

        if (existingCustomers.data.length > 0) {
          // Use existing customer
          customerId = existingCustomers.data[0].id;
          console.log('Found existing Stripe customer:', customerId);
        } else {
          // Create new customer
          console.log('Creating new Stripe customer for:', userEmail);
          const customer = await createStripeCustomer(stripe, userEmail, userId, userName);
          customerId = customer.id;
          console.log('Created new Stripe customer:', customerId);
        }

        // Update the existing subscription with the customer ID
        if (existingSubscription) {
          await serverBillingService.updateUserSubscription(userId, {
            stripe_customer_id: customerId
          });
          console.log('Updated subscription with customer ID:', customerId);
        }
      } catch (error: any) {
        console.error('Failed to create Stripe customer:', error);
        console.error('Error details:', {
          message: error?.message,
          type: error?.type,
          code: error?.code,
          param: error?.param,
          userEmail,
          userId,
          userName
        });
        return json({
          error: 'Failed to create customer account',
          details: error?.message || String(error),
          stripeError: {
            type: error?.type,
            code: error?.code,
            param: error?.param
          }
        }, { status: 500 });
      }
    }

    // Get Stripe price ID - try environment first, then auto-create if needed
    const envKey = `STRIPE_PRICE_${planId.toUpperCase()}`;
    let stripePriceId = (context.cloudflare?.env as any)?.[envKey];
    
    // Fallback to process.env for local development
    if (!stripePriceId && process.env[envKey]) {
      console.log(`Using ${envKey} from process.env`);
      stripePriceId = process.env[envKey];
    }

    console.log('Looking for price ID:', envKey, '→', stripePriceId);

    // If no environment variable set, auto-create the product/price in Stripe
    if (!stripePriceId) {
      console.log(`🔧 No environment variable found for ${planId}, auto-creating in Stripe...`);

      try {
        stripePriceId = await ensureStripeProductExists(stripe, planId as any);
        console.log(`✅ Auto-created/found Stripe price for ${planId}:`, stripePriceId);

        // Save the auto-created price ID back to the database
        try {
          await serverBillingService.updatePlanStripeId(planId, stripePriceId);
          console.log(`✅ Updated database with Stripe price ID for ${planId}: ${stripePriceId}`);
        } catch (dbError) {
          console.error(`⚠️ Failed to update database with price ID for ${planId}:`, dbError);
          // Don't fail the checkout, just log the warning
        }
      } catch (error: any) {
        console.error(`❌ Failed to auto-create Stripe product for ${planId}:`, error);
        return json({
          error: `Failed to setup payment for ${planId} plan. Please contact support.`,
          details: error?.message || String(error)
        }, { status: 500 });
      }
    }

    // Create checkout session
    try {
      // Fix URL parameter concatenation - check if successUrl already has parameters
      const separator = successUrl.includes('?') ? '&' : '?';
      const finalSuccessUrl = `${successUrl}${separator}session_id={CHECKOUT_SESSION_ID}`;

      console.log('Creating checkout session with:', {
        customerId,
        priceId: stripePriceId,
        successUrl: finalSuccessUrl,
        cancelUrl,
        userId,
        planId,
      });

      const session = await createCheckoutSession(stripe, {
        customerId,
        priceId: stripePriceId,
        successUrl: finalSuccessUrl,
        cancelUrl,
        userId,
        planId,
        metadata: {
          userId: userId,
          planId: planId,
          userEmail: userEmail
        }
      });

      console.log('Created checkout session:', session.id);

      // Log billing event using server-side billing service (has admin rights)
      await serverBillingService.createBillingEvent({
        user_id: userId,
        event_type: 'checkout_session_created',
        data: {
          session_id: session.id,
          plan_id: planId,
          customer_id: customerId,
          existing_subscription_id: null,
          is_upgrade: existingSubscription?.plan_id === 'free'
        },
        processed: false,
        stripe_event_id: session.id
      });

      return json({
        sessionId: session.id,
        url: session.url,
      });

    } catch (error: any) {
      console.error('Failed to create checkout session:', error);
      if (error?.type) {
        console.error('Stripe error type:', error.type);
        console.error('Stripe error message:', error.message);
      }
      return json({ 
        error: 'Failed to create checkout session',
        details: error?.message || String(error) 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Checkout API error:', error);
    return json({ 
      error: 'Internal server error',
      details: error?.message || String(error) 
    }, { status: 500 });
  }
}

// Handle GET requests for session status
export async function loader({ request, context }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    // Get environment variables - try Cloudflare env first, then process.env
    let stripeSecretKey = context.cloudflare?.env?.STRIPE_SECRET_KEY;
    
    // Fallback to process.env for local development
    if (!stripeSecretKey && process.env.STRIPE_SECRET_KEY) {
      console.log('Using STRIPE_SECRET_KEY from process.env in loader');
      stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    }
    
    if (!stripeSecretKey) {
      console.error('Missing Stripe configuration: STRIPE_SECRET_KEY in loader');
      return json({ error: 'Payment system not configured' }, { status: 500 });
    }

    const stripe = createStripeInstance(stripeSecretKey);
    
    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'subscription.default_payment_method'],
    });

    console.log('Retrieved checkout session:', sessionId);
    console.log('Payment status:', session.payment_status);
    console.log('Subscription ID:', typeof session.subscription === 'string' ? session.subscription : session.subscription?.id);
    
    // If payment was successful but subscription not processed yet, handle it directly
    if (session.payment_status === 'paid' && session.subscription) {
      console.log('Payment successful, processing subscription directly');
      
      try {
        // Initialize server-side billing service
        const serverBillingService = new ServerBillingService(request, context?.cloudflare?.env);
        
        // Get subscription details
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price.product', 'customer']
        });
        
        console.log('Subscription metadata:', subscription.metadata);
        
        // Extract user ID from metadata or customer metadata
        let userId = subscription.metadata.userId;
        console.log('🔍 Subscription metadata userId:', userId);
        if (!userId && subscription.customer) {
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          console.log('🔍 Customer metadata:', (customer as any).metadata);
          userId = (customer as any).metadata?.userId;
        }

        // Extract plan ID from metadata or price metadata
        let planId = subscription.metadata.planId;
        console.log('🔍 Subscription metadata planId:', planId);
        if (!planId && subscription.items.data[0]?.price?.metadata?.plan_id) {
          planId = subscription.items.data[0].price.metadata.plan_id;
          console.log('🔍 Price metadata planId:', planId);
        }

        console.log('🔍 Final extracted values:', { userId, planId });

        if (!userId || !planId) {
          console.error('❌ Missing user ID or plan ID in subscription metadata');
          console.error('Full subscription metadata:', subscription.metadata);
          console.error('Full price metadata:', subscription.items.data[0]?.price?.metadata);
          return json({
            error: 'Missing subscription metadata',
            status: session.payment_status,
            customerEmail: session.customer_details?.email,
            subscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
            debug: {
              subscriptionMetadata: subscription.metadata,
              priceMetadata: subscription.items.data[0]?.price?.metadata,
              customerMetadata: subscription.customer ? 'checked separately' : 'no customer'
            }
          });
        }
        
        console.log(`🔄 Processing subscription for user ${userId} with plan ${planId}`);

        // Check if user already has a subscription
        console.log('🔍 Checking for existing subscription...');
        const existingSubscription = await serverBillingService.getUserSubscription(userId);
        console.log('📋 Existing subscription found:', existingSubscription);
        
        if (existingSubscription) {
          // Update existing subscription
          console.log('🔄 Updating existing subscription...');
          try {
            await serverBillingService.updateUserSubscription(userId, {
              plan_id: planId,
              stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
              stripe_subscription_id: subscription.id,
              status: subscription.status as any,
              current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end || false,
              trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : undefined,
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
            });
            console.log('✅ Successfully updated existing subscription');
          } catch (updateError) {
            console.error('❌ Failed to update subscription:', updateError);
            throw updateError;
          }
        } else {
          // Create new subscription
          console.log('🆕 Creating new subscription...');
          try {
            await serverBillingService.createUserSubscription({
            user_id: userId,
            plan_id: planId,
            stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
            stripe_subscription_id: subscription.id,
            status: subscription.status as any,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : undefined,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
          });
          console.log('✅ Successfully created new subscription');
          } catch (createError) {
            console.error('❌ Failed to create subscription:', createError);
            throw createError;
          }
        }

        console.log('🎉 Successfully processed subscription - user should now have access to plan:', planId);
        
      } catch (error) {
        console.error('Error processing subscription:', error);
      }
    }

    return json({
      status: session.payment_status,
      customerEmail: session.customer_details?.email,
      subscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
    });

  } catch (error) {
    console.error('Failed to retrieve checkout session:', error);
    return json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
