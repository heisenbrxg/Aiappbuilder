/**
 * Usage Dashboard component for displaying message usage and billing information
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '~/components/auth/AuthProvider';
import { useUsageGuard } from '~/lib/hooks/useUsageGuard';
import { billingService } from '~/lib/billing/billingService';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { useNavigate } from '@remix-run/react';

interface UsageDashboardProps {
  showHeader?: boolean;
  compact?: boolean;
}

export function UsageDashboard({ showHeader = true, compact = false }: UsageDashboardProps = {}) {
  const { user } = useAuth();
  const {
    usage,
    subscription,
    isLoading,
    hasExceededLimit,
    isApproachingLimit,
    formatUsage,
    refreshUsage,
  } = useUsageGuard();

  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const formattedUsage = formatUsage();
  const statusColor = useMemo(() => {
    if (hasExceededLimit) return 'red';
    if (isApproachingLimit) return 'orange';
    return 'green';
  }, [hasExceededLimit, isApproachingLimit]);

  const statusText = useMemo(() => {
    if (hasExceededLimit) return 'Limit exceeded';
    if (isApproachingLimit) return 'Approaching limit';
    return 'Within limit';
  }, [hasExceededLimit, isApproachingLimit]);

  const handleManageSubscription = async () => {
    if (!user || !subscription) {
      toast.error('No active subscription found');
      return;
    }

    setIsManagingSubscription(true);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          returnUrl: window.location.href,
        }),
      });

      // Guard against non-JSON responses (e.g. HTML error pages)
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('application/json')) {
        throw new Error(`Unexpected response (${response.status})`);
      }

      const data = await response.json() as { error?: string; url?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open customer portal');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url!;

    } catch (error) {
      console.error('Failed to open customer portal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to open subscription management');
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const handleSyncSubscription = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch('/api/stripe/sync', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync subscription data');
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('application/json')) {
        throw new Error(`Unexpected response (${response.status})`);
      }

      const result = await response.json() as { success?: boolean; error?: string };
      if (result.success) {
        toast.success('Subscription data synced successfully');
        refreshUsage();
      } else {
        toast.error(result.error || 'Failed to sync subscription data');
      }
    } catch (error) {
      console.error('Failed to sync subscription data:', error);
      toast.error('Failed to sync subscription data');
    } finally {
      setIsSyncing(false);
    }
  };

  const getProgressBarColor = () => {
    if (hasExceededLimit) return 'bg-red-500';
    if (isApproachingLimit) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getProgressBarBgColor = () => {
    if (hasExceededLimit) return 'bg-red-100 dark:bg-red-900/20';
    if (isApproachingLimit) return 'bg-orange-100 dark:bg-orange-900/20';
    return 'bg-green-100 dark:bg-green-900/20';
  };

  if (isLoading) {
    return (
      <div className="bg-monzed-elements-background-depth-2 rounded-lg p-6 border border-monzed-elements-borderColor">
        <div className="animate-pulse">
          <div className="h-4 bg-monzed-elements-background-depth-3 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-monzed-elements-background-depth-3 rounded w-full mb-2"></div>
          <div className="h-4 bg-monzed-elements-background-depth-3 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="bg-monzed-elements-background-depth-2 rounded-lg p-6 border border-monzed-elements-borderColor">
        <p className="text-monzed-elements-textSecondary">Unable to load usage information</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={classNames(
        compact ? 'p-4' : 'p-6',
        showHeader ? 'bg-monzed-elements-background-depth-2 rounded-lg border border-monzed-elements-borderColor' : ''
      )}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-monzed-elements-textPrimary">
            Message Usage
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSyncSubscription}
              disabled={isSyncing}
              className="p-2 text-monzed-elements-textSecondary hover:text-monzed-elements-textPrimary transition-colors flex items-center gap-1"
              title="Sync subscription data"
            >
              {isSyncing ? (
                <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
              ) : (
                <div className="i-ph:arrows-clockwise w-4 h-4" />
              )}
              {!compact && <span className="text-sm">Sync</span>}
            </button>
            <button
              onClick={refreshUsage}
              className="p-2 text-monzed-elements-textSecondary hover:text-monzed-elements-textPrimary transition-colors"
              title="Refresh usage data"
            >
              <div className="i-ph:arrow-clockwise w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Usage Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-monzed-elements-textPrimary">
            Messages this month
          </span>
          <span className={classNames(
            'text-sm font-medium',
            statusColor === 'red' ? 'text-red-500' :
            statusColor === 'orange' ? 'text-orange-500' :
            'text-green-500'
          )}>
            {statusText}
          </span>
        </div>

        <div className={classNames(
          'w-full h-3 rounded-full overflow-hidden',
          getProgressBarBgColor()
        )}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, usage.usage_percentage)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={classNames('h-full rounded-full', getProgressBarColor())}
          />
        </div>

        <div className="flex items-center justify-between mt-2 text-sm text-monzed-elements-textSecondary">
          <span>{formattedUsage?.current || 0} used</span>
          <span>{formattedUsage?.limit || 0} limit</span>
        </div>
      </div>

      {/* Usage Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-monzed-elements-background-depth-3 rounded-lg">
          <div className="text-2xl font-bold text-monzed-elements-textPrimary">
            {formattedUsage?.remaining || 0}
          </div>
          <div className="text-sm text-monzed-elements-textSecondary">
            Messages remaining
          </div>
        </div>
        <div className="text-center p-3 bg-monzed-elements-background-depth-3 rounded-lg">
          <div className="text-2xl font-bold text-monzed-elements-textPrimary">
            {Math.round(usage.usage_percentage)}%
          </div>
          <div className="text-sm text-monzed-elements-textSecondary">
            Usage percentage
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      {subscription && (
        <div className="border-t border-monzed-elements-borderColor pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium text-monzed-elements-textPrimary capitalize">
                {subscription.plan_id} Plan
              </h4>
              <p className="text-sm text-monzed-elements-textSecondary">
                Status: {subscription.status}
              </p>
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={isManagingSubscription}
              className="px-4 py-2 bg-gradient-to-r from-monzed-glow to-monzed-accent text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
            >
              {isManagingSubscription ? (
                <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
              ) : (
                <div className="i-ph:gear w-4 h-4" />
              )}
              {isManagingSubscription ? 'Opening...' : 'Manage'}
            </button>
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {(hasExceededLimit || isApproachingLimit) && (
        <div className="border-t border-monzed-elements-borderColor pt-4">
          <div className={classNames(
            'p-4 rounded-lg',
            hasExceededLimit ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
            'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
          )}>
            <div className="flex items-center gap-3">
              <div className={classNames(
                'w-8 h-8 rounded-full flex items-center justify-center',
                hasExceededLimit ? 'bg-red-100 dark:bg-red-800' : 'bg-orange-100 dark:bg-orange-800'
              )}>
                <div className={classNames(
                  'w-4 h-4',
                  hasExceededLimit ? 'i-ph:warning text-red-600 dark:text-red-400' :
                  'i-ph:warning text-orange-600 dark:text-orange-400'
                )} />
              </div>
              <div className="flex-1">
                <h5 className={classNames(
                  'font-medium',
                  hasExceededLimit ? 'text-red-800 dark:text-red-200' : 'text-orange-800 dark:text-orange-200'
                )}>
                  {hasExceededLimit ? 'Message limit exceeded' : 'Approaching message limit'}
                </h5>
                <p className={classNames(
                  'text-sm',
                  hasExceededLimit ? 'text-red-600 dark:text-red-300' : 'text-orange-600 dark:text-orange-300'
                )}>
                  {hasExceededLimit 
                    ? 'Upgrade your plan to continue sending messages'
                    : 'Consider upgrading to avoid interruption'
                  }
                </p>
              </div>
              <a
                href="/pricing"
                className="px-4 py-2 bg-gradient-to-r from-monzed-glow to-monzed-accent text-black rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
              >
                Upgrade Now
              </a>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
