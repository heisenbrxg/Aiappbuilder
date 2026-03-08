/**
 * Stripe integration utilities for Starsky billing system
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key
export function createStripeInstance(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: '2025-07-30.basil',
    typescript: true,
  });
}

// Subscription plan configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0, // $0.00 in cents
    messageLimit: 20,
    features: [
      '20 messages per month',
      'Auto AI provider (automatically selects best model)',
      'Code editor with syntax highlighting',
      'Live preview',
      'Community support',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 1000, // $10.00 in cents
    messageLimit: 100,
    features: [
      '100 messages per month',
      'Basic AI models (GPT-4o, Claude Haiku, Gemini)',
      'Git integration & GitHub push',
      'Vercel & Netlify deployment',
      'Chat export/import',
      'Folder import/export',
      'Project export (ZIP)',
      'Prompt Library',
      'Community support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 2000, // $20.00 in cents
    messageLimit: 300,
    features: [
      '300 messages per month',
      'Advanced AI models (GPT-4o, Claude 3.5 Sonnet, Gemini Pro)',
      'Advanced context optimization',
      'Git integration & GitHub push',
      'Vercel & Netlify deployment',
      'Chat export/import',
      'Folder import/export',
      'Project export (ZIP)',
      'Prompt Library',
      'Priority support',
    ],
  },
  // Scale plan variants for dropdown
  scale0: {
    id: 'scale0',
    name: 'Scale',
    price: 10000, // $100.00 in cents
    messageLimit: 1000,
    features: [
      '1,000 messages per month',
      'All AI Providers (9+ providers, 30+ Models)',
      'Advanced context optimization',
      'Git integration & GitHub push',
      'Vercel & Netlify deployment',
      'Chat export/import',
      'Folder import/export',
      'Project export (ZIP)',
      'Prompt Library',
      'Dedicated support',
    ],
  },
  scale1: {
    id: 'scale1',
    name: 'Scale',
    price: 15000, // $150.00 in cents
    messageLimit: 2000,
    features: [
      '2,000 messages per month',
      'All AI Providers (9+ providers, 30+ Models)',
      'Advanced context optimization',
      'Git integration & GitHub push',
      'Vercel & Netlify deployment',
      'Chat export/import',
      'Folder import/export',
      'Project export (ZIP)',
      'Prompt Library',
      'Dedicated support',
    ],
  },
  scale2: {
    id: 'scale2',
    name: 'Scale',
    price: 20000, // $200.00 in cents
    messageLimit: 3000,
    features: [
      '3,000 messages per month',
      'All AI Providers (9+ providers, 30+ Models)',
      'Advanced context optimization',
      'Git integration & GitHub push',
      'Vercel & Netlify deployment',
      'Chat export/import',
      'Folder import/export',
      'Project export (ZIP)',
      'Prompt Library',
      'Dedicated support',
    ],
  },
  scale3: {
    id: 'scale3',
    name: 'Scale',
    price: 25000, // $250.00 in cents
    messageLimit: 4000,
    features: [
      '4,000 messages per month',
      'All AI Providers (9+ providers, 30+ Models)',
      'Advanced context optimization',
      'Git integration & GitHub push',
      'Vercel & Netlify deployment',
      'Chat export/import',
      'Folder import/export',
      'Project export (ZIP)',
      'Prompt Library',
      'Dedicated support',
    ],
  },
  scale4: {
    id: 'scale4',
    name: 'Scale',
    price: 30000, // $300.00 in cents
    messageLimit: 5000,
    features: [
      '5,000 messages per month',
      'All AI Providers (9+ providers, 30+ Models)',
      'Advanced context optimization',
      'Git integration & GitHub push',
      'Vercel & Netlify deployment',
      'Chat export/import',
      'Folder import/export',
      'Project export (ZIP)',
      'Prompt Library',
      'Dedicated support',
    ],
  },
  scale5: {
    id: 'scale5',
    name: 'Scale',
    price: 35000, // $350.00 in cents
    messageLimit: 6000,
    features: [
      '6,000 messages per month',
      'All AI Providers (9+ providers, 30+ Models)',
      'Advanced context optimization',
      'Git integration & GitHub push',
      'Vercel & Netlify deployment',
      'Chat export/import',
      'Folder import/export',
      'Project export (ZIP)',
      'Prompt Library',
      'Dedicated support',
    ],
  },
  scale6: {
    id: 'scale6',
    name: 'Scale',
    price: 40000, // $400.00 in cents
    messageLimit: 7000,
    features: [
      '7,000 messages per month',
      'All AI Providers (9+ providers, 30+ Models)',
      'Advanced context optimization',
      'Git integration & GitHub push',
      'Vercel & Netlify deployment',
      'Chat export/import',
      'Folder import/export',
      'Project export (ZIP)',
      'Prompt Library',
      'Dedicated support',
    ],
  },
  scale7: {
    id: 'scale7',
    name: 'Scale',
    price: 45000, // $450.00 in cents
    messageLimit: 8000,
    features: [
      '8,000 messages per month',
      'All AI Providers (9+ providers, 30+ Models)',
      'Advanced context optimization',
      'Git integration & GitHub push',
      'Vercel & Netlify deployment',
      'Chat export/import',
      'Folder import/export',
      'Project export (ZIP)',
      'Prompt Library',
      'Dedicated support',
    ],
  },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;

// Stripe webhook event types we handle
export const STRIPE_WEBHOOK_EVENTS = {
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
} as const;

// Helper function to format price for display
export function formatPrice(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

// Auto-create Stripe product and price if they don't exist
export async function ensureStripeProductExists(
  stripe: Stripe,
  planId: PlanId
): Promise<string> {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error(`Plan ${planId} not found in configuration`);
  }

  // Skip free plan (no Stripe product needed)
  if (plan.price === 0) {
    throw new Error('Free plan does not require Stripe product');
  }

  try {
    // First, try to find existing product by metadata
    const existingProducts = await stripe.products.search({
      query: `metadata['plan_id']:'${planId}'`,
      limit: 1,
    });

    let productId: string;

    if (existingProducts.data.length > 0) {
      productId = existingProducts.data[0].id;
      console.log(`✅ Found existing Stripe product for ${planId}:`, productId);
    } else {
      // Create new product
      console.log(`🔧 Creating new Stripe product for ${planId}...`);

      const product = await stripe.products.create({
        name: `Starsky ${plan.name}`,
        description: plan.features.join(', '),
        metadata: {
          plan_id: planId,
          message_limit: plan.messageLimit.toString(),
        },
      });

      productId = product.id;
      console.log(`✅ Created Stripe product for ${planId}:`, productId);
    }

    // Now check for existing price
    const existingPrices = await stripe.prices.search({
      query: `product:'${productId}' AND metadata['plan_id']:'${planId}'`,
      limit: 1,
    });

    if (existingPrices.data.length > 0) {
      const priceId = existingPrices.data[0].id;
      console.log(`✅ Found existing Stripe price for ${planId}:`, priceId);
      return priceId;
    } else {
      // Create new price
      console.log(`🔧 Creating new Stripe price for ${planId}...`);

      const price = await stripe.prices.create({
        product: productId,
        unit_amount: plan.price,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          plan_id: planId,
          message_limit: plan.messageLimit.toString(),
        },
      });

      console.log(`✅ Created Stripe price for ${planId}:`, price.id);
      return price.id;
    }

  } catch (error) {
    console.error(`❌ Failed to ensure Stripe product exists for ${planId}:`, error);
    throw new Error(`Failed to create/find Stripe product for ${planId}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Bulk create all Stripe products and prices for all plans
export async function setupAllStripeProducts(stripe: Stripe): Promise<{
  created: string[];
  existing: string[];
  errors: string[];
}> {
  const results = {
    created: [] as string[],
    existing: [] as string[],
    errors: [] as string[],
  };

  console.log('🚀 Setting up all Stripe products and prices...');

  // Get all paid plans (skip free plan)
  const paidPlans = Object.keys(SUBSCRIPTION_PLANS).filter(
    planId => SUBSCRIPTION_PLANS[planId as PlanId].price > 0
  ) as PlanId[];

  for (const planId of paidPlans) {
    try {
      console.log(`\n🔧 Processing plan: ${planId}`);

      const priceId = await ensureStripeProductExists(stripe, planId);

      if (priceId.startsWith('price_')) {
        results.existing.push(`${planId}: ${priceId}`);
      } else {
        results.created.push(`${planId}: ${priceId}`);
      }

    } catch (error) {
      console.error(`❌ Failed to setup ${planId}:`, error);
      results.errors.push(`${planId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('\n📊 Stripe setup results:');
  console.log('✅ Created:', results.created.length);
  console.log('🔍 Existing:', results.existing.length);
  console.log('❌ Errors:', results.errors.length);

  return results;
}

// Helper function to get environment variable name for a plan
export function getStripePriceEnvKey(planId: string): string {
  return `STRIPE_PRICE_${planId.toUpperCase()}`;
}

// Generate environment variables template for all plans
export function generateStripeEnvTemplate(): string {
  const paidPlans = Object.keys(SUBSCRIPTION_PLANS).filter(
    planId => SUBSCRIPTION_PLANS[planId as PlanId].price > 0
  );

  const envLines = paidPlans.map(planId => {
    const plan = SUBSCRIPTION_PLANS[planId as PlanId];
    const envKey = getStripePriceEnvKey(planId);
    return `${envKey}=price_...  # ${plan.name} - $${plan.price/100}/month for ${plan.messageLimit} messages`;
  });

  return [
    '# Stripe Price IDs (auto-generated template)',
    '# You can either set these environment variables OR let the system auto-create them',
    '',
    ...envLines,
    '',
    '# Note: Free plan does not need a Stripe price ID',
  ].join('\n');
}

// Sync database plan to Stripe (create or update)
export async function syncPlanToStripe(
  stripe: Stripe,
  plan: {
    id: string;
    name: string;
    description: string;
    price_cents: number;
    message_limit: number;
    features: string[];
    stripe_price_id?: string;
  }
): Promise<string | null> {
  // Skip free plan
  if (plan.price_cents === 0) {
    console.log(`⏭️ Skipping free plan: ${plan.id}`);
    return null;
  }

  try {
    console.log(`🔄 Syncing plan to Stripe: ${plan.id}`);

    // Check if we have an existing Stripe price ID
    let currentPriceId = plan.stripe_price_id;
    let needsNewPrice = false;

    if (currentPriceId) {
      // Verify the existing price still exists and matches
      try {
        const existingPrice = await stripe.prices.retrieve(currentPriceId);

        // Check if price amount matches
        if (existingPrice.unit_amount !== plan.price_cents) {
          console.log(`💰 Price changed for ${plan.id}: ${existingPrice.unit_amount} → ${plan.price_cents}`);
          needsNewPrice = true;
        }
      } catch (error) {
        console.log(`❌ Existing price not found for ${plan.id}, will create new one`);
        needsNewPrice = true;
      }
    } else {
      needsNewPrice = true;
    }

    // Find or create product
    let productId: string;
    const existingProducts = await stripe.products.search({
      query: `metadata['plan_id']:'${plan.id}'`,
      limit: 1,
    });

    if (existingProducts.data.length > 0) {
      productId = existingProducts.data[0].id;

      // Update product details
      await stripe.products.update(productId, {
        name: `Starsky ${plan.name}`,
        description: plan.description,
        metadata: {
          plan_id: plan.id,
          message_limit: plan.message_limit.toString(),
        },
      });

      console.log(`✅ Updated Stripe product: ${productId}`);
    } else {
      // Create new product
      const product = await stripe.products.create({
        name: `Starsky ${plan.name}`,
        description: plan.description,
        metadata: {
          plan_id: plan.id,
          message_limit: plan.message_limit.toString(),
        },
      });

      productId = product.id;
      console.log(`✅ Created Stripe product: ${productId}`);
    }

    // Create new price if needed
    if (needsNewPrice) {
      const newPrice = await stripe.prices.create({
        product: productId,
        unit_amount: plan.price_cents,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          plan_id: plan.id,
          message_limit: plan.message_limit.toString(),
        },
      });

      console.log(`✅ Created new Stripe price for ${plan.id}: ${newPrice.id}`);
      return newPrice.id;
    }

    return currentPriceId ?? null;

  } catch (error) {
    console.error(`❌ Failed to sync plan ${plan.id} to Stripe:`, error);
    throw error;
  }
}

// Sync all database plans to Stripe
export async function syncAllPlansToStripe(
  stripe: Stripe,
  plans: Array<{
    id: string;
    name: string;
    description: string;
    price_cents: number;
    message_limit: number;
    features: string[];
    stripe_price_id?: string;
  }>
): Promise<{
  synced: Array<{ planId: string; priceId: string }>;
  skipped: string[];
  errors: Array<{ planId: string; error: string }>;
}> {
  const results = {
    synced: [] as Array<{ planId: string; priceId: string }>,
    skipped: [] as string[],
    errors: [] as Array<{ planId: string; error: string }>,
  };

  console.log(`🚀 Syncing ${plans.length} plans to Stripe...`);

  for (const plan of plans) {
    try {
      const priceId = await syncPlanToStripe(stripe, plan);

      if (priceId) {
        results.synced.push({ planId: plan.id, priceId });
      } else {
        results.skipped.push(plan.id);
      }
    } catch (error) {
      results.errors.push({
        planId: plan.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  console.log(`📊 Sync results: ${results.synced.length} synced, ${results.skipped.length} skipped, ${results.errors.length} errors`);
  return results;
}

// Helper function to get plan by ID
export function getPlanById(planId: string): typeof SUBSCRIPTION_PLANS[PlanId] | null {
  return SUBSCRIPTION_PLANS[planId as PlanId] || null;
}

// Helper function to validate webhook signature
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string,
  stripe: Stripe
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Create Stripe customer
export async function createStripeCustomer(
  stripe: Stripe,
  email: string,
  userId: string,
  name?: string
): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
      platform: 'Starsky-v3',
    },
  });
}

// Create checkout session for subscription
export async function createCheckoutSession(
  stripe: Stripe,
  {
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    userId,
    planId,
    metadata = {},
  }: {
    customerId?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    userId: string;
    planId: string;
    metadata?: Record<string, string>;
  }
): Promise<Stripe.Checkout.Session> {
  // For subscription updates, we'll handle them through the Customer Portal instead
  // This function now only handles new subscription creation

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planId,
      ...metadata,
    },
    subscription_data: {
      metadata: {
        userId,
        planId,
        ...metadata,
      },
    },
  };

  // If customer exists, use it; otherwise let Stripe create one
  if (customerId) {
    sessionParams.customer = customerId;
  } else {
    sessionParams.customer_creation = 'always';
  }

  return await stripe.checkout.sessions.create(sessionParams);
}

// Create customer portal session
export async function createCustomerPortalSession(
  stripe: Stripe,
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  try {
    console.log('🔄 Creating Stripe Customer Portal session...');
    console.log('Customer ID:', customerId);
    console.log('Return URL:', returnUrl);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log('✅ Customer Portal session created:', session.id);
    return session;
  } catch (error) {
    console.error('❌ Stripe Customer Portal error:', error);

    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('billing portal')) {
      throw new Error('Stripe Customer Portal is not configured. Please activate it in your Stripe dashboard.');
    }

    throw error;
  }
}

// Get subscription by ID
export async function getSubscription(
  stripe: Stripe,
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

// Cancel subscription
export async function cancelSubscription(
  stripe: Stripe,
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });
}

// Update subscription
export async function updateSubscription(
  stripe: Stripe,
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });
}

// Get customer by ID
export async function getCustomer(
  stripe: Stripe,
  customerId: string
): Promise<Stripe.Customer> {
  const customer = await stripe.customers.retrieve(customerId);
  
  if (customer.deleted) {
    throw new Error('Customer has been deleted');
  }
  
  return customer as Stripe.Customer;
}

// List customer subscriptions
export async function getCustomerSubscriptions(
  stripe: Stripe,
  customerId: string
): Promise<Stripe.Subscription[]> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  });
  
  return subscriptions.data;
}

// Get usage for current billing period
export function calculateUsagePercentage(currentUsage: number, limit: number): number {
  return Math.round((currentUsage / limit) * 100);
}

// Check if user is approaching limit
export function isApproachingLimit(currentUsage: number, limit: number, threshold: number = 0.8): boolean {
  return currentUsage >= limit * threshold;
}

// Check if user has exceeded limit
export function hasExceededLimit(currentUsage: number, limit: number): boolean {
  return currentUsage >= limit;
}

// Get next billing date
export function getNextBillingDate(subscription: Stripe.Subscription): Date {
  return new Date((subscription as any).current_period_end * 1000);
}

// Get current billing period
export function getCurrentBillingPeriod(subscription: Stripe.Subscription): {
  start: Date;
  end: Date;
} {
  return {
    start: new Date((subscription as any).current_period_start * 1000),
    end: new Date((subscription as any).current_period_end * 1000),
  };
}

// Format subscription status for display
export function formatSubscriptionStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'canceled':
      return 'Canceled';
    case 'incomplete':
      return 'Incomplete';
    case 'incomplete_expired':
      return 'Expired';
    case 'past_due':
      return 'Past Due';
    case 'trialing':
      return 'Trial';
    case 'unpaid':
      return 'Unpaid';
    default:
      return 'Unknown';
  }
}

// Error handling for Stripe operations
export class StripeError extends Error {
  constructor(
    message: string,
    public code?: string,
    public type?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'StripeError';
  }
}

export function handleStripeError(error: any): StripeError {
  if (error.type) {
    // This is a Stripe error
    return new StripeError(
      error.message || 'Stripe operation failed',
      error.code,
      error.type,
      error.statusCode
    );
  }
  
  // Generic error
  return new StripeError(
    error.message || 'Payment processing failed',
    'unknown',
    'api_error'
  );
}
