/**
 * Billing service for managing subscriptions and usage tracking
 */

import { createClient } from '../supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Message } from 'ai';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  message_limit: number;
  features: string[];
  stripe_price_id?: string;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_start?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageUsage {
  id: string;
  user_id: string;
  chat_id?: string; // Optional - no foreign key constraint
  chat_url_id?: string; // Permanent reference even after chat deletion
  message_type: 'user' | 'assistant' | 'system';
  message_count: number;
  billing_period_start: string;
  billing_period_end: string;
  created_at: string;
}

export interface UsageStats {
  total_messages: number;
  user_messages: number;
  assistant_messages: number;
  message_limit: number;
  usage_percentage: number;
}

export interface BillingEvent {
  id: string;
  user_id: string;
  event_type: string;
  stripe_event_id?: string;
  data: Record<string, any>;
  processed: boolean;
  created_at: string;
}

export class BillingService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // =====================================================
  // SUBSCRIPTION MANAGEMENT
  // =====================================================

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_cents', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch subscription plans: ${error.message}`);
    }

    return data || [];
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

  async getUserSubscription(userId: string, forceRefresh: boolean = false): Promise<UserSubscription | null> {
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

    // If force refresh is requested, check for updates from Stripe
    if (forceRefresh && data && data.stripe_subscription_id) {
      try {
        console.log(`Force refreshing subscription data for user ${userId}`);
        await this.syncUserSubscriptionWithStripe(userId);
        
        // Get the updated subscription data
        const { data: refreshedData, error: refreshError } = await this.supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (refreshError) {
          console.error(`Error refreshing subscription: ${refreshError.message}`);
        } else if (refreshedData) {
          console.log(`Successfully refreshed subscription data for user ${userId}`);
          return refreshedData;
        }
      } catch (refreshError) {
        console.error(`Failed to refresh subscription from Stripe: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`);
        // Continue with existing data if refresh fails
      }
    }

    return data;
  }

  async createUserSubscription(subscription: Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>): Promise<UserSubscription> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user subscription: ${error.message}`);
    }

    return data;
  }

  async updateUserSubscription(userId: string, updates: Partial<UserSubscription>): Promise<UserSubscription> {
    // First check if a subscription exists for this user
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

    // Update the subscription
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select();

    if (error) {
      throw new Error(`Failed to update user subscription: ${error.message}`);
    }

    if (!data || data.length === 0) {
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

  async trackMessageUsage(
    userId: string,
    chatId: string,
    messages: Message[],
    billingPeriodStart: string,
    billingPeriodEnd: string,
    chatUrlId?: string
  ): Promise<void> {
    try {
      // Count only USER messages as billable (not AI responses)
      // This ensures 1 user request = 1 billable message, regardless of AI response length
      const userMessages = messages.filter(m => m.role === 'user');

      if (userMessages.length === 0) {
        return; // No billable messages to track
      }

      // Get the most recent user message ID for tracking
      // This ensures we only count new messages, not the entire history
      const lastUserMessageId = userMessages[userMessages.length - 1].id;

      // Check if we've already tracked this specific message to prevent duplicates
      try {
        const { data: existingData, error: existingError } = await this.supabase
          .from('message_usage')
          .select('id')
          .eq('user_id', userId)
          .eq('chat_id', chatId)
          .eq('message_id', String(lastUserMessageId)); // Ensure message_id is a string

        if (existingError) {
          console.warn(`Error checking for existing message usage: ${existingError.message}`);
          // Continue with tracking - better to potentially duplicate than miss tracking
        } else if (existingData && existingData.length > 0) {
          console.log(`⚠️ Skipping duplicate message tracking for message ID: ${lastUserMessageId}`);
          return;
        }
      } catch (checkError) {
        console.warn(`Exception checking for existing message: ${checkError instanceof Error ? checkError.message : String(checkError)}`);
        // Continue with tracking - better to potentially duplicate than miss tracking
      }

      console.log(`📊 Tracking user message with ID ${lastUserMessageId} for billing`);
      console.log('📋 Message breakdown:', {
        total: messages.length,
        user: userMessages.length,
        assistant: messages.filter(m => m.role === 'assistant').length,
        system: messages.filter(m => m.role === 'system').length,
        chatId,
        chatUrlId,
        billingPeriod: `${billingPeriodStart} to ${billingPeriodEnd}`
      });

      // Create usage record for the specific user message
      const usageRecord = {
        user_id: userId,
        chat_id: chatId,
        chat_url_id: chatUrlId || null, // Ensure null instead of undefined
        message_id: String(lastUserMessageId), // Ensure message_id is a string
        message_type: 'user',
        message_count: 1, // Always count as 1 message per record
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
      };

      // Implement retry logic for better reliability
      let retries = 3;
      let success = false;

      while (retries > 0 && !success) {
        const { error } = await this.supabase
          .from('message_usage')
          .insert([usageRecord]);

        if (error) {
          console.warn(`Failed to track message usage (attempts left: ${retries}): ${error.message}`);
          retries--;
          
          if (retries === 0) {
            console.error(`Failed to track message usage after multiple attempts: ${error.message}`);
            // Don't throw error here, just log it - this is a non-critical operation
            break;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          success = true;
        }
      }

      // Update usage summary
      await this.updateUsageSummary(userId, billingPeriodStart, billingPeriodEnd);
    } catch (error) {
      // Log the error but don't let it propagate to the UI
      console.error('Error in trackMessageUsage:', error);
    }
  }

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
    try {
      const { data, error } = await this.supabase
        .rpc('check_message_limit', { user_uuid: userId });

      if (error) {
        // Log the error but don't block the user. Treat as within limit.
        console.error('checkMessageLimit RPC error:', error);
        return false;
      }

      return data || false;
    } catch (err) {
      // Network or unexpected error (e.g. browser offline)
      console.error('checkMessageLimit network/unexpected error:', err);
      // Gracefully fallback to allowing the user to send a message
      return false;
    }
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

  private async updateUsageSummary(
    userId: string,
    billingPeriodStart: string,
    billingPeriodEnd: string
  ): Promise<void> {
    // Get current usage for the period
    const { data: usageData, error: usageError } = await this.supabase
      .from('message_usage')
      .select('message_type, message_count')
      .eq('user_id', userId)
      .eq('billing_period_start', billingPeriodStart)
      .eq('billing_period_end', billingPeriodEnd);

    if (usageError) {
      throw new Error(`Failed to get usage data: ${usageError.message}`);
    }

    // Calculate totals (only user messages are billable)
    const totals = (usageData || []).reduce(
      (acc, usage) => {
        // Only count user messages for billing totals
        if (usage.message_type === 'user') {
          acc.total_messages += usage.message_count;
          acc.user_messages += usage.message_count;
        }
        return acc;
      },
      {
        total_messages: 0,
        user_messages: 0,
        assistant_messages: 0,
        system_messages: 0,
      }
    );

    // Note: usage_summaries table was removed from schema as it was unused
    // Usage data is calculated on-demand via the get_user_usage() function
    // This method is kept for backward compatibility but does nothing
    console.debug(`Usage summary update skipped for user ${userId} (table removed, using on-demand calculation)`);
  }

  // =====================================================
  // BILLING EVENTS
  // =====================================================

  async createBillingEvent(event: {
    user_id: string;
    event_type: string;
    stripe_event_id: string;
    data: any;
    processed: boolean;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('billing_events')
      .insert([event]);

    if (error) {
      throw new Error(`Failed to create billing event: ${error.message}`);
    }
  }

  async getBillingEventByStripeId(stripeEventId: string): Promise<{
    id: string;
    user_id: string;
    event_type: string;
    stripe_event_id: string;
    data: any;
    processed: boolean;
    created_at: string;
  } | null> {
    const { data, error } = await this.supabase
      .from('billing_events')
      .select('*')
      .eq('stripe_event_id', stripeEventId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Failed to get billing event: ${error.message}`);
    }

    return data;
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
  }

  async recordBillingEvent(stripeEventId: string, eventType: string, processed: boolean = true): Promise<void> {
    // For now, just log the event
    // In a production system, you might want to store this in a database
    console.log(`Recording billing event: ${stripeEventId} (${eventType}) - processed: ${processed}`);
  }

  // =====================================================
  // SUBSCRIPTION SYNCHRONIZATION
  // =====================================================

  async syncUserSubscriptionWithStripe(userId: string): Promise<void> {
    console.log(`🔄 Syncing subscription with Stripe for user: ${userId}`);

    try {
      // Call the server-side sync API endpoint
      const response = await fetch('/api/stripe/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_subscription'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to sync subscription');
      }

      const result = await response.json();
      console.log(`✅ Successfully synced subscription for user ${userId}:`, result);

    } catch (error) {
      console.error(`❌ Failed to sync subscription for user ${userId}:`, error);
      throw new Error(`Failed to sync subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  formatPrice(cents: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  }
}

// Export singleton instance
export const billingService = new BillingService();
