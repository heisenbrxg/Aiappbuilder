/**
 * Stripe Customer Portal API route for managing subscriptions
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createStripeInstance, createCustomerPortalSession } from '~/lib/billing/stripe';
import { ServerBillingService } from '~/lib/billing/billingService.server';
import { requireAuth } from '~/lib/api/auth';

interface PortalRequest {
  userId: string;
  returnUrl: string;
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Require authentication with environment variables
    const user = await requireAuth(request, context?.cloudflare?.env);
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get environment variables (support both local and Cloudflare environments)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || context.cloudflare?.env?.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      console.error('Missing Stripe configuration: STRIPE_SECRET_KEY not found');
      console.error('Checked process.env.STRIPE_SECRET_KEY and context.cloudflare.env.STRIPE_SECRET_KEY');
      return json({ error: 'Payment system not configured' }, { status: 500 });
    }

    console.log('✅ Stripe secret key found, proceeding with portal session creation');
    console.log('🔑 Stripe key mode:', stripeSecretKey.startsWith('sk_test_') ? 'TEST' : stripeSecretKey.startsWith('sk_live_') ? 'LIVE' : 'UNKNOWN');

    // Parse request body
    const body = await request.json() as PortalRequest;
    const { userId, returnUrl } = body;

    // Validate required fields
    if (!userId || !returnUrl) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate that the authenticated user matches the requested userId
    if (user.id !== userId) {
      console.error(`Authentication mismatch: user ${user.id} trying to access portal for user ${userId}`);
      return json({ error: 'Unauthorized access' }, { status: 403 });
    }

    // Initialize server-side billing service
    const serverBillingService = new ServerBillingService(request, context?.cloudflare?.env);

    // Get user's subscription
    const subscription = await serverBillingService.getUserSubscription(userId);
    
    if (!subscription || !subscription.stripe_customer_id) {
      return json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Parse customer ID (handle both string and JSON object formats)
    let customerId: string;
    try {
      const customerData = JSON.parse(subscription.stripe_customer_id);
      customerId = customerData.id;
      console.log('Parsed customer ID from JSON object:', customerId);
    } catch {
      // If it's not JSON, assume it's already a string ID
      customerId = subscription.stripe_customer_id;
      console.log('Using customer ID as string:', customerId);
    }

    if (!customerId || !customerId.startsWith('cus_')) {
      console.error('Invalid customer ID format:', customerId);
      return json({ error: 'Invalid customer account' }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = createStripeInstance(stripeSecretKey);
    console.log('✅ Stripe instance created successfully');

    try {
      console.log('Creating customer portal session for customer:', customerId);

      // First, let's verify the customer exists in Stripe
      try {
        const customer = await stripe.customers.retrieve(customerId);
        console.log('✅ Customer found in Stripe:', customer.id, (customer as any).email);
      } catch (customerError) {
        console.error('❌ Customer not found in Stripe:', customerError);
        return json({
          error: 'Customer not found in Stripe',
          details: customerError instanceof Error ? customerError.message : 'Unknown error'
        }, { status: 400 });
      }

      // Test if Customer Portal is configured by checking configurations
      try {
        const configurations = await stripe.billingPortal.configurations.list({ limit: 1 });
        console.log('✅ Customer Portal configurations found:', configurations.data.length);
        if (configurations.data.length === 0) {
          console.log('⚠️ No Customer Portal configurations found, creating default configuration...');
          try {
            const defaultConfig = await stripe.billingPortal.configurations.create({
              business_profile: {
                headline: 'Manage your subscription',
              },
              features: {
                invoice_history: { enabled: true },
                payment_method_update: { enabled: true },
                subscription_cancel: { enabled: true },
                subscription_update: {
                  enabled: true,
                  default_allowed_updates: ['price', 'quantity'],
                  proration_behavior: 'create_prorations',
                },
              },
            });
            console.log('✅ Created default Customer Portal configuration:', defaultConfig.id);
          } catch (createError) {
            console.error('❌ Failed to create default configuration:', createError);
            return json({
              error: 'Customer Portal not configured and failed to create default',
              details: 'Please manually configure the Customer Portal in your Stripe Dashboard'
            }, { status: 400 });
          }
        }
      } catch (configError) {
        console.error('❌ Failed to check Customer Portal configuration:', configError);
        // Continue anyway, as this might be a permissions issue
      }

      // Create customer portal session
      const portalSession = await createCustomerPortalSession(
        stripe,
        customerId,
        returnUrl
      );

      console.log('✅ Created customer portal session:', portalSession.id);

      // Log billing event
      try {
        await serverBillingService.createBillingEvent({
          user_id: userId,
          event_type: 'customer_portal_accessed',
          data: {
            portal_session_id: portalSession.id,
            customer_id: customerId,
          },
          processed: true,
        });
        console.log('✅ Logged billing event successfully');
      } catch (billingEventError) {
        console.error('⚠️ Failed to log billing event (non-critical):', billingEventError);
        // Don't fail the whole request for billing event logging
      }

      return json({
        url: portalSession.url,
      });

    } catch (error) {
      console.error('❌ Failed to create customer portal session:', error);
      return json({
        error: 'Failed to create portal session',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Customer portal API error:', error);
    return json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
