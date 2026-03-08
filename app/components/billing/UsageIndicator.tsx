/**
 * Compact usage indicator for header display
 */

import { motion } from 'framer-motion';
import { useUsageGuard } from '~/lib/hooks/useUsageGuard';
import { useAuth } from '~/components/auth/AuthProvider';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { useNavigate } from '@remix-run/react';

interface UsageIndicatorProps {
  onClick?: () => void;
  className?: string;
}

export function UsageIndicator({ onClick, className }: UsageIndicatorProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    usage,
    isLoading,
    hasExceededLimit,
    isApproachingLimit,
    formatUsage,
    subscription,
  } = useUsageGuard();

  const formattedUsage = formatUsage();
  
  // Determine status color based on usage limits
  const statusColor = hasExceededLimit ? 'red' : isApproachingLimit ? 'orange' : 'green';

  if (!user || isLoading || !usage) {
    return null;
  }

  const getIndicatorColor = () => {
    if (hasExceededLimit) return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (isApproachingLimit) return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    return 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  const getProgressBarColor = () => {
    if (hasExceededLimit) return 'bg-red-500';
    if (isApproachingLimit) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    // Show usage information in toast
    if (hasExceededLimit) {
      toast.error(`You've reached your message limit of ${formattedUsage?.limit}. Please upgrade your plan to continue.`, {
        autoClose: 5000,
        onClick: () => navigate('/pricing'),
        style: { cursor: 'pointer' }
      });
    } else if (isApproachingLimit) {
      toast.warning(`You've used ${Math.round(usage.usage_percentage)}% of your monthly message limit (${formattedUsage?.current}/${formattedUsage?.limit}). Consider upgrading soon.`, {
        autoClose: 5000,
        onClick: () => navigate('/pricing'),
        style: { cursor: 'pointer' }
      });
    } else {
      toast.info(`Current usage: ${formattedUsage?.current}/${formattedUsage?.limit} messages (${Math.round(usage.usage_percentage)}%). Plan: ${subscription?.plan_id || 'Free'}`, {
        autoClose: 3000
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={classNames(
        'flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors cursor-pointer',
        getIndicatorColor(),
        'hover:opacity-80',
        className
      )}
      onClick={handleClick}
      title="Click to view detailed usage information"
    >
      {/* Usage Icon */}
      <div className="flex items-center gap-2">
        <div className="i-ph:chart-bar w-4 h-4" />
        <span className="text-sm font-medium">
          {formattedUsage?.current || 0}/{formattedUsage?.limit || 0}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-white dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, usage.usage_percentage)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={classNames('h-full rounded-full', getProgressBarColor())}
          />
        </div>
        <span className="text-xs font-medium min-w-[3ch]">
          {Math.round(usage.usage_percentage)}%
        </span>
      </div>

      {/* Status Indicator */}
      {(hasExceededLimit || isApproachingLimit) && (
        <div className={classNames(
          'w-2 h-2 rounded-full',
          hasExceededLimit ? 'bg-red-500' : 'bg-orange-500'
        )} />
      )}
    </motion.div>
  );
}
