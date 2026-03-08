/**
 * Usage guard hook for enforcing message limits and billing restrictions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '~/components/auth/AuthProvider';
import { billingService } from '~/lib/billing/billingService';
import type { UsageStats } from '~/lib/billing/billingService';
import { toast } from 'react-toastify';
import { createClient } from '~/lib/supabase/client';
import React from 'react';

// LocalStorage key and cooldown (in hours) for upgrade-prompt dismissal
const DISMISS_KEY = 'upgradePromptDismissedAt';
const DISMISS_COOLDOWN_HOURS = 24;

export interface UsageGuardState {
  isLoading: boolean;
  canSendMessage: boolean;
  usage: UsageStats | null;
  isApproachingLimit: boolean;
  hasExceededLimit: boolean;
  subscription: any | null;
  error: string | null;
  showUpgradePrompt: boolean;
  upgradeReason: 'low_credits' | 'no_credits' | null;
}

export function useUsageGuard() {
  const { user } = useAuth();
  const [state, setState] = useState<UsageGuardState>({
    isLoading: true,
    canSendMessage: true,
    usage: null,
    isApproachingLimit: false,
    hasExceededLimit: false,
    subscription: null,
    error: null,
    showUpgradePrompt: false,
    upgradeReason: null,
  });
  const supabaseClient = useRef(createClient());
  const subscriptionRef = useRef<any>(null);

  // Check usage and limits
  const checkUsage = useCallback(async () => {
    if (!user) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        canSendMessage: false,
        error: 'User not authenticated',
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get user's current usage and subscription
      const [usage, subscription, canSend] = await Promise.all([
        billingService.getUserUsage(user.id),
        billingService.getUserSubscription(user.id),
        billingService.canUserSendMessage(user.id),
      ]);

      const isApproachingLimit = usage.usage_percentage >= 80;
      const hasExceededLimit = usage.usage_percentage >= 100;

      // Determine if the user has recently dismissed the upgrade prompt
      let dismissedRecently = false;
      try {
        const dismissedStr = typeof window !== 'undefined' ? localStorage.getItem(DISMISS_KEY) : null;
        if (dismissedStr) {
          const diffMs = Date.now() - new Date(dismissedStr).getTime();
          dismissedRecently = diffMs < DISMISS_COOLDOWN_HOURS * 60 * 60 * 1000;
        }
      } catch (_) {
        /* ignore storage errors */
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        canSendMessage: canSend,
        usage,
        isApproachingLimit,
        hasExceededLimit,
        subscription,
        error: null,
      }));

      // Show upgrade prompts for usage limits
      if (hasExceededLimit && !dismissedRecently) {
        setState(prev => ({
          ...prev,
          showUpgradePrompt: true,
          upgradeReason: 'no_credits'
        }));
      } else if (isApproachingLimit && usage.usage_percentage >= 80 && !dismissedRecently) {
        // Show low credits warning when at 80% usage
        setState(prev => ({
          ...prev,
          showUpgradePrompt: true,
          upgradeReason: 'low_credits'
        }));
      } else if (isApproachingLimit && usage.usage_percentage >= 80 && !dismissedRecently) {
        toast.info(
          `Approaching Limit! You've used ${usage.usage_percentage}% of your monthly messages.`,
          {
            toastId: 'usage-approaching',
            autoClose: 6000
          }
        );
      }

    } catch (error) {
      console.error('Failed to check usage:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check usage',
      }));
    }
  }, [user]);

  // Set up real-time subscription for usage updates
  useEffect(() => {
    if (!user) return;

    // Set up Supabase real-time subscription for message_usage table
    const setupRealtimeSubscription = async () => {
      try {
        // Clean up any existing subscription
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }

        // Subscribe to changes in the message_usage table for this user
        subscriptionRef.current = supabaseClient.current
          .channel('message-usage-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'message_usage',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              // When a new message is tracked, refresh usage data
              console.log('🔄 Real-time update: Message usage changed, refreshing data');
    checkUsage();
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Failed to set up real-time subscription:', error);
      }
    };

    setupRealtimeSubscription();
    checkUsage();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [user, checkUsage]);

  // Format usage for display
  const formatUsage = useCallback(() => {
    if (!state.usage) return null;

    return {
      current: state.usage.user_messages,
      limit: state.usage.message_limit,
      remaining: state.usage.message_limit - state.usage.user_messages,
      percentage: state.usage.usage_percentage,
    };
  }, [state.usage]);

  // Check if user can send a message
  const checkCanSendMessage = useCallback(async () => {
    if (!user) {
      return false;
    }

    try {
      const canSend = await billingService.canUserSendMessage(user.id);
      setState(prev => ({ ...prev, canSendMessage: canSend }));

      if (!canSend) {
        // Trigger upgrade prompt instead of just showing toast
        setState(prev => ({ ...prev, showUpgradePrompt: true, upgradeReason: 'no_credits' }));
      }

      return canSend;
    } catch (error) {
      console.error('Failed to check if user can send message:', error);
      return false;
    }
  }, [user]);

  // Manually refresh usage data
  const refreshUsage = useCallback(() => {
    return checkUsage();
  }, [checkUsage]);

  // Listen for global refreshUsage events dispatched elsewhere (e.g., after Stripe checkout)
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Global refreshUsage event received');
      refreshUsage();
    };
    window.addEventListener('refreshUsage', handleRefresh);
    return () => window.removeEventListener('refreshUsage', handleRefresh);
  }, [refreshUsage]);

  // Control upgrade prompt
  const showUpgradePrompt = useCallback((reason: 'low_credits' | 'no_credits') => {
    try {
      const dismissedStr = localStorage.getItem(DISMISS_KEY);
      if (dismissedStr) {
        const diffMs = Date.now() - new Date(dismissedStr).getTime();
        if (diffMs < DISMISS_COOLDOWN_HOURS * 60 * 60 * 1000) {
          // User recently dismissed the prompt; respect cooldown.
          return;
        }
      }
    } catch (_) {
      /* ignore storage errors */
    }

    setState(prev => ({
      ...prev,
      showUpgradePrompt: true,
      upgradeReason: reason,
    }));
  }, []);

  const hideUpgradePrompt = useCallback(() => {
    // Persist dismissal timestamp so we don't nag the user again immediately
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch (_) {
      /* ignore storage errors */
    }

    setState(prev => ({
      ...prev,
      showUpgradePrompt: false,
      upgradeReason: null,
    }));
  }, []);

  // Optimistically update usage after sending a message
  const optimisticUpdateAfterSend = useCallback(() => {
    if (!state.usage) return;

    const updatedUsage = {
      ...state.usage,
      user_messages: state.usage.user_messages + 1,
      total_messages: state.usage.total_messages + 1,
      usage_percentage: Math.min(
        100,
        ((state.usage.user_messages + 1) / state.usage.message_limit) * 100
      ),
    };

    const isApproachingLimit = updatedUsage.usage_percentage >= 80;
    const hasExceededLimit = updatedUsage.usage_percentage >= 100;

    setState(prev => ({
      ...prev,
      usage: updatedUsage,
      isApproachingLimit,
      hasExceededLimit,
      canSendMessage: !hasExceededLimit,
      // Show upgrade prompt automatically when thresholds are crossed
      showUpgradePrompt: hasExceededLimit || isApproachingLimit ? true : prev.showUpgradePrompt,
      upgradeReason: hasExceededLimit ? 'no_credits' : isApproachingLimit ? 'low_credits' : prev.upgradeReason,
    }));

    // Real update will come from the subscription
  }, [state.usage]);

  return {
    ...state,
    checkUsage,
    checkCanSendMessage,
    refreshUsage,
    optimisticUpdateAfterSend,
    formatUsage,
    showUpgradePrompt,
    hideUpgradePrompt,
  };
}

// Hook for checking usage before sending messages
export function useMessageGuard() {
  const { checkCanSendMessage, optimisticUpdateAfterSend } = useUsageGuard();

  const guardedSendMessage = useCallback(async (sendFunction: () => Promise<void> | void) => {
    const canSend = await checkCanSendMessage();
    
    if (canSend) {
      await sendFunction();
      // Update UI optimistically right after sending
      optimisticUpdateAfterSend();
    }
  }, [checkCanSendMessage, optimisticUpdateAfterSend]);

  return { guardedSendMessage };
}
