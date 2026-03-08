import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '~/components/auth/AuthProvider';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';

interface QuickUpgradeCardProps {
  currentPlan: string;
  usagePercentage: number;
  messagesRemaining: number;
  className?: string;
}

export function QuickUpgradeCard({ 
  currentPlan, 
  usagePercentage, 
  messagesRemaining,
  className 
}: QuickUpgradeCardProps) {
  const { user } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const getRecommendedPlan = () => {
    switch (currentPlan) {
      case 'free':
        return { id: 'starter', name: 'Starter', price: '$9', messages: 100 };
      case 'starter':
        return { id: 'pro', name: 'Pro', price: '$19', messages: 500 };
      case 'pro':
        return { id: 'scale1', name: 'Scale', price: '$75', messages: 2000 };
      default:
        return { id: 'pro', name: 'Pro', price: '$19', messages: 500 };
    }
  };

  const getUrgencyLevel = () => {
    if (usagePercentage >= 100) return 'critical';
    if (usagePercentage >= 80) return 'high';
    if (usagePercentage >= 60) return 'medium';
    return 'low';
  };

  const getUrgencyMessage = () => {
    const urgency = getUrgencyLevel();
    switch (urgency) {
      case 'critical':
        return '🚨 Out of messages! Upgrade now to continue.';
      case 'high':
        return `⚠️ Only ${messagesRemaining} messages left this month.`;
      case 'medium':
        return `📊 You've used ${usagePercentage}% of your monthly messages.`;
      default:
        return '🚀 Upgrade for more messages and features.';
    }
  };

  const handleQuickUpgrade = async () => {
    if (!user) {
      toast.error('Please sign in to upgrade');
      return;
    }

    const recommendedPlan = getRecommendedPlan();
    setIsUpgrading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: recommendedPlan.id,
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.email,
          successUrl: `${window.location.origin}/pricing?success=true`,
          cancelUrl: window.location.href,
        }),
      });

      const data = await response.json() as { error?: string; url?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      window.location.href = data.url!;
    } catch (error) {
      console.error('Quick upgrade error:', error);
      toast.error('Failed to start upgrade. Please try again.');
      setIsUpgrading(false);
    }
  };

  const recommendedPlan = getRecommendedPlan();
  const urgencyLevel = getUrgencyLevel();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={classNames(
        'bg-gradient-to-br from-monzed-elements-background-depth-1 to-monzed-elements-background-depth-2 rounded-xl p-6 border shadow-lg',
        urgencyLevel === 'critical' ? 'border-red-500 shadow-red-500/20' :
        urgencyLevel === 'high' ? 'border-yellow-500 shadow-yellow-500/20' :
        'border-monzed-elements-borderColor',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-monzed-elements-textPrimary">
          Quick Upgrade
        </h3>
        <div className={classNames(
          'px-2 py-1 rounded-full text-xs font-medium',
          urgencyLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
          urgencyLevel === 'high' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-blue-500/20 text-blue-400'
        )}>
          {urgencyLevel === 'critical' ? 'URGENT' :
           urgencyLevel === 'high' ? 'LOW CREDITS' :
           'RECOMMENDED'}
        </div>
      </div>

      {/* Usage Message */}
      <p className="text-monzed-elements-textSecondary mb-4">
        {getUrgencyMessage()}
      </p>

      {/* Usage Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-monzed-elements-textSecondary">Monthly Usage</span>
          <span className="text-monzed-elements-textPrimary font-medium">{usagePercentage}%</span>
        </div>
        <div className="w-full bg-monzed-elements-background-depth-2 rounded-full h-2">
          <div
            className={classNames(
              'h-2 rounded-full transition-all duration-500',
              urgencyLevel === 'critical' ? 'bg-red-500' :
              urgencyLevel === 'high' ? 'bg-yellow-500' :
              urgencyLevel === 'medium' ? 'bg-blue-500' :
              'bg-green-500'
            )}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Recommended Plan */}
      <div className="bg-monzed-elements-background-depth-1 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-monzed-elements-textSecondary">Upgrade to:</span>
          <span className="text-lg font-bold text-green-500">{recommendedPlan.price}/mo</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-monzed-elements-textPrimary">{recommendedPlan.name}</span>
          <span className="text-sm text-monzed-elements-textSecondary">{recommendedPlan.messages} messages/mo</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleQuickUpgrade}
        disabled={isUpgrading}
        className={classNames(
          'w-full py-3 px-4 rounded-lg font-medium transition-all duration-200',
          urgencyLevel === 'critical' ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25' :
          'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/25',
          'text-white disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105'
        )}
      >
        {isUpgrading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            Processing...
          </div>
        ) : (
          `Upgrade to ${recommendedPlan.name} - ${recommendedPlan.price}/mo`
        )}
      </button>

      {/* Additional Info */}
      <p className="text-xs text-monzed-elements-textSecondary text-center mt-3">
        Instant upgrade • Cancel anytime • Prorated billing
      </p>
    </motion.div>
  );
}
