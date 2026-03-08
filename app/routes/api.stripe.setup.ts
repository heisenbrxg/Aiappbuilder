/**
 * Stripe Setup API route for bulk creating products and prices
 * This endpoint helps developers set up all Stripe products automatically
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createStripeInstance, setupAllStripeProducts, generateStripeEnvTemplate, syncAllPlansToStripe } from '~/lib/billing/stripe';
import { billingService } from '~/lib/billing/billingService';

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Get environment variables
    const stripeSecretKey = context.cloudflare?.env?.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.error('Missing Stripe configuration');
      return json({ 
        error: 'Stripe not configured',
        message: 'STRIPE_SECRET_KEY environment variable is required',
        setup_guide: 'Please add STRIPE_SECRET_KEY to your environment variables'
      }, { status: 500 });
    }

    // Parse request body
    const body = await request.json() as { action?: string };
    const { action: setupAction } = body;

    // Initialize Stripe
    const stripe = createStripeInstance(stripeSecretKey);

    if (setupAction === 'setup_all') {
      // Bulk create all products and prices
      console.log('🚀 Starting bulk Stripe setup...');

      const results = await setupAllStripeProducts(stripe);

      return json({
        success: true,
        message: 'Stripe setup completed',
        results,
        next_steps: [
          'Copy the price IDs from the results',
          'Add them to your environment variables',
          'Or leave them empty to use auto-creation',
        ],
      });

    } else if (setupAction === 'sync_database') {
      // Sync database plans to Stripe
      console.log('🔄 Starting database-to-Stripe sync...');

      try {
        // Get all plans from database
        const dbPlans = await billingService.getSubscriptionPlans();
        console.log(`📋 Found ${dbPlans.length} plans in database`);

        // Sync to Stripe
        const syncResults = await syncAllPlansToStripe(stripe, dbPlans);

        // Update database with new Stripe price IDs
        for (const { planId, priceId } of syncResults.synced) {
          await billingService.updatePlanStripeId(planId, priceId);
        }

        return json({
          success: true,
          message: 'Database plans synced to Stripe',
          results: syncResults,
          database_updated: syncResults.synced.length > 0,
          next_steps: [
            'Database plans are now synchronized with Stripe',
            'Any price changes in database will be reflected in Stripe',
            'Pricing page will show current database values',
          ],
        });

      } catch (error) {
        console.error('Database sync failed:', error);
        return json({
          success: false,
          error: 'Database sync failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
      }

    } else if (setupAction === 'generate_env') {
      // Generate environment variables template
      const envTemplate = generateStripeEnvTemplate();
      
      return json({
        success: true,
        message: 'Environment template generated',
        env_template: envTemplate,
        instructions: [
          'Copy the template below to your .env file',
          'Replace price_... with actual Stripe price IDs',
          'Or leave them empty to use auto-creation',
        ],
      });

    } else {
      return json({
        error: 'Invalid action',
        available_actions: ['setup_all', 'sync_database', 'generate_env']
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Stripe setup error:', error);
    return json({ 
      error: 'Setup failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      troubleshooting: [
        'Check your STRIPE_SECRET_KEY is valid',
        'Ensure you have proper Stripe permissions',
        'Verify your Stripe account is active',
      ]
    }, { status: 500 });
  }
}

// GET endpoint for setup instructions
export async function loader() {
  return json({
    message: 'Stripe Setup API',
    description: 'Automatically create Stripe products and prices for all Starsky plans',
    endpoints: {
      'POST /api/stripe/setup': {
        description: 'Setup Stripe products and prices',
        actions: {
          setup_all: 'Create all missing products and prices in Stripe',
          generate_env: 'Generate environment variables template',
        },
        example_request: {
          action: 'setup_all'
        }
      }
    },
    plans_supported: [
      'starter ($9/month, 100 messages)',
      'pro ($19/month, 500 messages)', 
      'scale0 ($50/month, 1000 messages)',
      'scale1 ($75/month, 2000 messages)',
      'scale2 ($100/month, 3000 messages)',
      'scale3 ($125/month, 4000 messages)',
      'scale4 ($150/month, 5000 messages)',
      'scale5 ($175/month, 6000 messages)',
      'scale6 ($200/month, 7000 messages)',
      'scale7 ($225/month, 8000 messages)',
    ],
    note: 'Free plan does not require Stripe setup as it is handled internally'
  });
}
