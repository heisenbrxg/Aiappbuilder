/**
 * Server-side billing service for use in Remix loaders and API routes
 */

import { createServerClient, createServiceRoleClient } from '../supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionPlan, UserSubscription, MessageUsage, UsageStats, BillingEvent } from './billingService';

export class ServerBillingService {
  private supabase: SupabaseClient;
  private adminSupabase: SupabaseClient;
  private env?: any;

  constructor(request: Request, env?: any) {
    this.supabase = createServerClient(request, env);
    // Use service role client for admin operations that need to bypass RLS
    this.adminSupabase = createServiceRoleClient(env);
    this.env = env;
  }

  // =====================================================
  // SUBSCRIPTION MANAGEMENT
  // =====================================================

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    console.log('Fetching subscription plans from database...');
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_cents', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error.message);
      throw new Error(`Failed to fetch subscription plans: ${error.message}`);
    }

    console.log('Fetched plans:', data);

    return data || [];
  }

  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Plan not found
      }
      throw new Error(`Failed to fetch plan ${planId}: ${error.message}`);
    }

    return data;
  }

  async updatePlanStripeId(planId: string, stripePriceId: string): Promise<void> {
    const { error } = await this.supabase
      .from('subscription_plans')
      .update({
        stripe_price_id: stripePriceId,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);

    if (error) {
      throw new Error(`Failed to update plan ${planId} with Stripe price ID: ${error.message}`);
    }

    console.log(`✅ Updated plan ${planId} with Stripe price ID: ${stripePriceId}`);
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No subscription found
      }
      throw new Error(`Failed to fetch user subscription: ${error.message}`);
    }

    return data;
  }

  async createUserSubscription(subscription: Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>): Promise<UserSubscription> {
    console.log(`Creating subscription for user ${subscription.user_id}:`, subscription);

    const { data, error } = await this.adminSupabase
      .from('user_subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) {
      console.error(`Failed to create subscription:`, error);
      throw new Error(`Failed to create user subscription: ${error.message}`);
    }

    console.log(`Successfully created subscription:`, data);
    return data;
  }

  async updateUserSubscription(userId: string, updates: Partial<UserSubscription>): Promise<UserSubscription> {
    // First check if a subscription exists for this user (using regular client for read)
    const { data: existingData, error: checkError } = await this.supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (checkError) {
      throw new Error(`Failed to check existing subscription: ${checkError.message}`);
    }

    if (!existingData || existingData.length === 0) {
      throw new Error(`No subscription found for user ${userId}`);
    }

    if (existingData.length > 1) {
      console.warn(`Multiple subscriptions found for user ${userId}, using the first one`);
    }

    // Update the subscription using admin client to bypass RLS
    console.log(`Updating subscription for user ${userId} with:`, updates);
    console.log(`Existing subscription data:`, existingData[0]);

    const updatePayload = { ...updates, updated_at: new Date().toISOString() };
    console.log(`Update payload:`, updatePayload);

    const { data, error } = await this.adminSupabase
      .from('user_subscriptions')
      .update(updatePayload)
      .eq('user_id', userId)
      .select();

    console.log(`Update result - data:`, data, `error:`, error);

    if (error) {
      console.error(`Supabase update error:`, error);
      throw new Error(`Failed to update user subscription: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.error(`No rows were updated for user ${userId}. Using admin client but still failed.`);
      throw new Error(`No subscription was updated for user ${userId}`);
    }

    // Return the first (and should be only) updated subscription
    return data[0];
  }

  async deleteUserSubscription(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete user subscription: ${error.message}`);
    }
  }

  // =====================================================
  // USAGE TRACKING
  // =====================================================

  async getUserUsage(userId: string): Promise<UsageStats> {
    const { data, error } = await this.supabase
      .rpc('get_user_usage', { user_uuid: userId });

    if (error) {
      throw new Error(`Failed to get user usage: ${error.message}`);
    }

    return data[0] || {
      total_messages: 0,
      user_messages: 0,
      assistant_messages: 0,
      message_limit: 20, // Default to free plan limit
      usage_percentage: 0,
    };
  }

  async checkMessageLimit(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('check_message_limit', { user_uuid: userId });

    if (error) {
      throw new Error(`Failed to check message limit: ${error.message}`);
    }

    return data || false;
  }

  async getCurrentBillingPeriod(userId: string): Promise<{ period_start: string; period_end: string }> {
    const { data, error } = await this.supabase
      .rpc('get_current_billing_period', { user_uuid: userId });

    if (error) {
      throw new Error(`Failed to get billing period: ${error.message}`);
    }

    return data[0] || {
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  // =====================================================
  // BILLING EVENTS
  // =====================================================

  async createBillingEvent(event: Omit<BillingEvent, 'id' | 'created_at'>): Promise<BillingEvent> {
    const { data, error } = await this.supabase
      .from('billing_events')
      .insert(event)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create billing event: ${error.message}`);
    }

    return data;
  }

  async markBillingEventProcessed(eventId: string): Promise<void> {
    const { error } = await this.supabase
      .from('billing_events')
      .update({ processed: true })
      .eq('id', eventId);

    if (error) {
      throw new Error(`Failed to mark billing event as processed: ${error.message}`);
    }
  }

  async getBillingEvents(userId: string, limit: number = 50): Promise<BillingEvent[]> {
    const { data, error } = await this.supabase
      .from('billing_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get billing events: ${error.message}`);
    }

    return data || [];
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  async getUserPlan(userId: string): Promise<SubscriptionPlan | null> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single();

    if (error) {
      throw new Error(`Failed to get user plan: ${error.message}`);
    }

    return data;
  }

  async isUserSubscribed(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return subscription?.status === 'active';
  }

  async canUserSendMessage(userId: string): Promise<boolean> {
    const hasExceededLimit = await this.checkMessageLimit(userId);
    return !hasExceededLimit;
  }

  async syncUserSubscriptionWithStripe(userId: string): Promise<void> {
    console.log(`🔄 Server: Syncing subscription with Stripe for user: ${userId}`);

    // Get the user's Stripe customer ID
    const { data: customer } = await this.supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!customer?.stripe_customer_id) {
      console.log(`No Stripe customer ID found for user ${userId}`);
      return;
    }

    try {
      // Import Stripe functions (these are server-side only)
      const { createStripeInstance, getCustomerSubscriptions } = await import('~/lib/billing/stripe');

      // Get Stripe secret key from environment (Cloudflare Workers or Node.js)
      const stripeSecretKey = this.env?.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY not configured');
      }

      // Get the latest subscription data from Stripe
      const stripe = createStripeInstance(stripeSecretKey);
      const subscriptions = await getCustomerSubscriptions(stripe, customer.stripe_customer_id);

      if (subscriptions.length === 0) {
        console.log(`No subscriptions found for customer ${customer.stripe_customer_id}`);
        return;
      }

      // Get the most recent active subscription
      const activeSubscription = subscriptions
        .filter(sub => sub.status === 'active' || sub.status === 'trialing')
        .sort((a, b) => b.created - a.created)[0];

      if (!activeSubscription) {
        console.log(`No active subscription found for customer ${customer.stripe_customer_id}`);
        return;
      }

      // Extract plan ID from subscription metadata
      const extractPlanId = (subscription: any): string | null => {
        // Try metadata first
        if (subscription.metadata?.planId) return subscription.metadata.planId;
        // Fallback to price metadata
        const price = subscription.items.data[0]?.price;
        if (price?.metadata?.plan_id) return price.metadata.plan_id as string;
        return null;
      };

      const planId = extractPlanId(activeSubscription);
      console.log(`Extracted plan ID from Stripe subscription: ${planId}`);

      // Update the subscription in our database
      const updateData: any = {
        stripe_subscription_id: activeSubscription.id,
        status: activeSubscription.status,
        current_period_start: new Date((activeSubscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((activeSubscription as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: activeSubscription.cancel_at_period_end,
      };

      // Only update plan_id if we successfully extracted it
      if (planId) {
        updateData.plan_id = planId;
        console.log(`Updating subscription with plan ID: ${planId}`);
      } else {
        console.warn(`Could not extract plan ID from subscription ${activeSubscription.id}`);
      }

      await this.updateUserSubscription(userId, updateData);

      console.log(`✅ Successfully synced subscription for user ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to sync subscription for user ${userId}:`, error);
      throw new Error(`Failed to sync subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  formatPrice(cents: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  }

  // =====================================================
  // WEBHOOK EVENT TRACKING
  // =====================================================

  async getBillingEventByStripeId(stripeEventId: string): Promise<BillingEvent | null> {
    const { data, error } = await this.supabase
      .from('billing_events')
      .select('*')
      .eq('stripe_event_id', stripeEventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Event not found
      }
      throw new Error(`Failed to fetch billing event: ${error.message}`);
    }

    return data;
  }

  async recordBillingEvent(stripeEventId: string, eventType: string, processed: boolean = true): Promise<void> {
    console.log(`Recording billing event: ${stripeEventId} (${eventType}) - processed: ${processed}`);
  }

  async updateBillingEvent(stripeEventId: string, updates: {
    processed: boolean;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('billing_events')
      .update(updates)
      .eq('stripe_event_id', stripeEventId);

    if (error) {
      throw new Error(`Failed to update billing event: ${error.message}`);
    }

    console.log(`Updated billing event: ${stripeEventId} - processed: ${updates.processed}`);
  }
}
