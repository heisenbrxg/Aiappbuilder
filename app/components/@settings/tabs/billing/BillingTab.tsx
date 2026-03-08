/**
 * Billing Tab component for the Control Panel
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { UsageDashboard } from '~/components/billing/UsageDashboard';
import { useAuth } from '~/components/auth/AuthProvider';
import { billingService } from '~/lib/billing/billingService';
import type { SubscriptionPlan, UserSubscription } from '~/lib/billing/billingService';
import { toast } from 'react-toastify';

export function BillingTab() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBillingData();
    }
  }, [user]);

  const loadBillingData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const userSubscription = await billingService.getUserSubscription(user.id);
      setSubscription(userSubscription);
    } catch (err) {
      console.error('Failed to load billing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing information');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="i-ph:user-circle w-16 h-16 mx-auto mb-4 text-monzed-elements-textSecondary" />
          <h3 className="text-lg font-medium text-monzed-elements-textPrimary mb-2">
            Sign in required
          </h3>
          <p className="text-monzed-elements-textSecondary">
            Please sign in to view your billing information.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-monzed-elements-background-depth-3 rounded w-1/3"></div>
          <div className="h-32 bg-monzed-elements-background-depth-3 rounded"></div>
          <div className="h-48 bg-monzed-elements-background-depth-3 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="i-ph:warning-circle w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-monzed-elements-textPrimary mb-2">
            Error loading billing information
          </h3>
          <p className="text-monzed-elements-textSecondary mb-6">
            {error}
          </p>
          <button
            onClick={loadBillingData}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-monzed-elements-textPrimary mb-2">
          Billing & Usage
        </h2>
        <p className="text-sm sm:text-base text-monzed-elements-textSecondary">
          Manage your subscription and monitor your message usage.
        </p>
      </div>

      {/* Usage Dashboard */}
      <div className="bg-monzed-elements-background-depth-2 rounded-lg p-6 border border-monzed-elements-borderColor">
        <h3 className="text-lg font-semibold text-monzed-elements-textPrimary mb-4">
          Current Usage
        </h3>
        <UsageDashboard showHeader={false} compact={false} />
      </div>

      {/* Subscription Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-monzed-elements-background-depth-2 rounded-lg p-6 border border-monzed-elements-borderColor"
      >
        <h3 className="text-lg font-semibold text-monzed-elements-textPrimary mb-4">
          Subscription Status
        </h3>

        {subscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-monzed-elements-textPrimary capitalize">
                  {subscription.plan_id} Plan
                </h4>
                <p className="text-sm text-monzed-elements-textSecondary">
                  Status: <span className={classNames(
                    'font-medium',
                    subscription.status === 'active' ? 'text-green-500' :
                    subscription.status === 'canceled' ? 'text-red-500' :
                    'text-orange-500'
                  )}>
                    {subscription.status}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-monzed-elements-textSecondary">
                  Next billing date
                </p>
                <p className="font-medium text-monzed-elements-textPrimary">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="i-ph:credit-card w-12 h-12 mx-auto mb-4 text-monzed-elements-textSecondary" />
            <h4 className="font-medium text-monzed-elements-textPrimary mb-2">
              No active subscription
            </h4>
            <p className="text-monzed-elements-textSecondary mb-6">
              You're currently using the free tier with limited messages.
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <div className="i-ph:lightning w-4 h-4" />
              Upgrade Now
            </a>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-monzed-elements-background-depth-2 rounded-lg p-4 sm:p-6 border border-monzed-elements-borderColor"
      >
        <h3 className="text-base sm:text-lg font-semibold text-monzed-elements-textPrimary mb-4">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <a
            href="/pricing"
            className="flex items-center gap-3 p-4 bg-monzed-elements-background-depth-3 rounded-lg hover:bg-monzed-elements-background-depth-4 transition-colors"
          >
            <div className="i-ph:lightning w-6 h-6 text-red-500" />
            <div>
              <h4 className="font-medium text-monzed-elements-textPrimary">
                {subscription ? 'Change Plan' : 'Subscribe Now'}
              </h4>
              <p className="text-sm text-monzed-elements-textSecondary">
                {subscription ? 'Upgrade or downgrade your plan' : 'Get started with a paid plan'}
              </p>
            </div>
          </a>

          {subscription && (
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/stripe/portal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: user.id,
                      returnUrl: window.location.href,
                    }),
                  });
                  
                  const data = await response.json() as { url?: string; error?: string };
                  if (response.ok) {
                    window.location.href = data.url!;
                  } else {
                    toast.error(data.error || 'Failed to open customer portal');
                  }
                } catch (error) {
                  toast.error('Failed to open customer portal');
                }
              }}
              className="flex items-center gap-3 p-4 bg-monzed-elements-background-depth-3 rounded-lg hover:bg-monzed-elements-background-depth-4 transition-colors text-left"
            >
              <div className="i-ph:gear w-6 h-6 text-blue-500" />
              <div>
                <h4 className="font-medium text-monzed-elements-textPrimary">
                  Manage Subscription
                </h4>
                <p className="text-sm text-monzed-elements-textSecondary">
                  Update payment method and billing details
                </p>
              </div>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
