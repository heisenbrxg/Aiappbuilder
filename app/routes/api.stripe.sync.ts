/**
 * Stripe Sync API route for processing database-to-Stripe synchronization
 * This endpoint processes the sync queue and updates Stripe when database changes
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createStripeInstance, syncPlanToStripe } from '~/lib/billing/stripe';
import { createClient } from '~/lib/supabase/client';
import { requireAuth } from '~/lib/api/auth';
import { billingService } from '~/lib/billing/billingService';

interface SyncQueueItem {
  id: string;
  plan_id: string;
  action: 'create' | 'update' | 'deactivate';
  plan_data: {
    id: string;
    name: string;
    description: string;
    price_cents: number;
    message_limit: number;
    features: string[];
    stripe_price_id?: string;
    is_active: boolean;
  };
  attempts: number;
  created_at: string;
}

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
        message: 'STRIPE_SECRET_KEY environment variable is required'
      }, { status: 500 });
    }

    // Parse request body
    const body = await request.json() as { action?: string; limit?: number };
    const { action: syncAction, limit = 10 } = body;

    // Initialize Stripe and Supabase
    const stripe = createStripeInstance(stripeSecretKey);
    const supabase = createClient();

    if (syncAction === 'process_queue') {
      console.log('🔄 Processing Stripe sync queue...');
      
      // Get pending sync requests
      const { data: pendingSync, error: fetchError } = await supabase
        .rpc('get_pending_stripe_syncs')
        .limit(limit);

      if (fetchError) {
        throw new Error(`Failed to fetch sync queue: ${fetchError.message}`);
      }

      if (!pendingSync || pendingSync.length === 0) {
        return json({
          success: true,
          message: 'No pending sync requests',
          processed: 0,
          results: [],
        });
      }

      console.log(`📋 Found ${pendingSync.length} pending sync requests`);

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        details: [] as Array<{
          planId: string;
          action: string;
          status: 'success' | 'failed';
          message: string;
          priceId?: string;
        }>,
      };

      // Process each sync request
      for (const syncItem of pendingSync as SyncQueueItem[]) {
        try {
          console.log(`🔧 Processing ${syncItem.action} for plan: ${syncItem.plan_id}`);
          
          let priceId: string | null = null;
          let message = '';

          if (syncItem.action === 'deactivate') {
            // For deactivation, we don't delete from Stripe, just mark as inactive
            message = `Plan ${syncItem.plan_id} marked for deactivation (Stripe product preserved)`;
          } else {
            // Create or update in Stripe
            priceId = await syncPlanToStripe(stripe, syncItem.plan_data);
            message = `Successfully ${syncItem.action}d plan ${syncItem.plan_id} in Stripe`;
          }

          // Mark sync as completed
          const { error: completeError } = await supabase
            .rpc('mark_sync_completed', {
              sync_id: syncItem.id,
              new_stripe_price_id: priceId,
            });

          if (completeError) {
            throw new Error(`Failed to mark sync as completed: ${completeError.message}`);
          }

          results.successful++;
          results.details.push({
            planId: syncItem.plan_id,
            action: syncItem.action,
            status: 'success',
            message,
            priceId: priceId || undefined,
          });

          console.log(`✅ ${message}`);

        } catch (error) {
          console.error(`❌ Failed to sync plan ${syncItem.plan_id}:`, error);

          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          // Mark sync as failed
          const { error: failError } = await supabase
            .rpc('mark_sync_failed', {
              sync_id: syncItem.id,
              error_message: errorMessage,
            });

          if (failError) {
            console.error('Failed to mark sync as failed:', failError);
          }

          results.failed++;
          results.details.push({
            planId: syncItem.plan_id,
            action: syncItem.action,
            status: 'failed',
            message: errorMessage,
          });
        }

        results.processed++;
      }

      return json({
        success: true,
        message: `Processed ${results.processed} sync requests`,
        results,
        summary: {
          total: results.processed,
          successful: results.successful,
          failed: results.failed,
        },
      });

    } else if (syncAction === 'cleanup') {
      // Clean up old sync records
      console.log('🧹 Cleaning up old sync records...');
      
      const { data: deletedCount, error: cleanupError } = await supabase
        .rpc('cleanup_stripe_sync_queue');

      if (cleanupError) {
        throw new Error(`Cleanup failed: ${cleanupError.message}`);
      }

      return json({
        success: true,
        message: `Cleaned up ${deletedCount || 0} old sync records`,
        deleted: deletedCount || 0,
      });

    } else if (syncAction === 'status') {
      // Get sync queue status
      const { data: queueStatus, error: statusError } = await supabase
        .from('stripe_sync_queue')
        .select('status, count(*)')
        .group('status');

      if (statusError) {
        throw new Error(`Failed to get queue status: ${statusError.message}`);
      }

      return json({
        success: true,
        message: 'Sync queue status',
        status: queueStatus || [],
      });

    } else if (syncAction === 'sync_subscription') {
      // Require authentication with environment variables
      const user = await requireAuth(request, context?.cloudflare?.env);

      // Sync the user's subscription with Stripe
      await billingService.syncUserSubscriptionWithStripe(user.id);
      
      // Get the updated subscription
      const subscription = await billingService.getUserSubscription(user.id);
      
      // Get updated usage data
      const usage = await billingService.getUserUsage(user.id);
      
      return json({ 
        success: true, 
        message: 'Subscription and usage data synchronized successfully',
        subscription,
        usage
      });

    } else {
      return json({ 
        error: 'Invalid action',
        available_actions: ['process_queue', 'cleanup', 'status', 'sync_subscription']
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Stripe sync error:', error);
    return json({ 
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// GET endpoint for sync status
export async function loader() {
  return json({
    message: 'Stripe Sync API',
    description: 'Process database-to-Stripe synchronization queue',
    endpoints: {
      'POST /api/stripe/sync': {
        description: 'Process sync queue and update Stripe',
        actions: {
          process_queue: 'Process pending sync requests (limit: number)',
          cleanup: 'Clean up old sync records',
          status: 'Get current sync queue status',
          sync_subscription: 'Sync a user\'s subscription with Stripe',
        },
        example_request: {
          action: 'process_queue',
          limit: 10
        }
      }
    },
    workflow: [
      '1. Database plan changes trigger sync queue entries',
      '2. Call process_queue to sync changes to Stripe',
      '3. Database is updated with new Stripe price IDs',
      '4. Pricing page reflects current database values',
    ],
    automation: 'Set up a cron job to call process_queue regularly for automatic sync'
  });
}
