import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '~/components/auth/AuthProvider';
import { billingService } from '~/lib/billing/billingService';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import type { SubscriptionPlan } from '~/lib/billing/billingService';

interface UpgradePromptProps {
  currentPlan: string;
  usagePercentage: number;
  messagesRemaining: number;
  onClose?: () => void;
  trigger?: 'low_credits' | 'no_credits' | 'manual';
}

export function UpgradePrompt({
  currentPlan,
  usagePercentage,
  messagesRemaining,
  onClose,
  trigger = 'manual'
}: UpgradePromptProps) {
  const { user } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [selectedScalePlan, setSelectedScalePlan] = useState<string>('scale0');
  const [selectedPlan, setSelectedPlan] = useState<string>('pro'); // Default to Pro as recommended



  // Fetch actual plans from database
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoadingPlans(true);
        const allPlans = await billingService.getSubscriptionPlans();
        // Filter to show only paid plans (exclude free)
        const paidPlans = allPlans.filter(plan => plan.id !== 'free');
        setPlans(paidPlans);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
        toast.error('Failed to load pricing plans');
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const formatPrice = (priceCents: number) => {
    return `$${(priceCents / 100).toFixed(0)}`;
  };

  // Group plans into individual plans and scale plans
  const getGroupedPlans = () => {
    const individualPlans = plans.filter(plan => !plan.id.startsWith('scale'));
    const scalePlans = plans.filter(plan => plan.id.startsWith('scale')).sort((a, b) => a.price_cents - b.price_cents);
    return { individualPlans, scalePlans };
  };

  const getSelectedScalePlan = () => {
    const { scalePlans } = getGroupedPlans();
    return scalePlans.find(plan => plan.id === selectedScalePlan) || scalePlans[0];
  };

  const getUrgencyMessage = () => {
    if (trigger === 'no_credits') {
      return {
        title: '🚨 Out of Credits!',
        message: 'You\'ve used all your messages for this month. Upgrade now to continue building.',
        urgency: 'high'
      };
    } else if (trigger === 'low_credits') {
      return {
        title: '⚠️ Running Low on Credits',
        message: `Only ${messagesRemaining} messages remaining. Upgrade to avoid interruption.`,
        urgency: 'medium'
      };
    } else {
      return {
        title: '🚀 Upgrade Your Plan',
        message: 'Get more messages and unlock advanced features.',
        urgency: 'low'
      };
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      toast.error('Please sign in to upgrade');
      return;
    }

    setIsUpgrading(true);

    try {
      // Create checkout session for upgrade
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.email,
          successUrl: `${window.location.origin}/pricing?success=true`,
          cancelUrl: window.location.href,
        }),
      });

      const data = await response.json() as {
        error?: string;
        url?: string;
        useCustomerPortal?: boolean;
      };

      if (!response.ok) {
        // If the API suggests using Customer Portal, redirect there
        if (data.useCustomerPortal) {
          console.log('Redirecting to Customer Portal for subscription management');
          handleManageSubscription();
          return;
        }

        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Customer Portal')) {
          toast.error('Please use the subscription management portal to change your plan.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to start upgrade process. Please try again.');
      }

      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

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

      const data = await response.json() as { error?: string; url?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open customer portal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Failed to open subscription management');
    }
  };

  const urgency = getUrgencyMessage();
  const safeUsagePercentage = isNaN(usagePercentage) ? 0 : usagePercentage;
  const safeMessagesRemaining = isNaN(messagesRemaining) ? 0 : messagesRemaining;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className={classNames(
            'bg-monzed-elements-background-depth-1 rounded-xl shadow-2xl max-w-md w-full p-6 border',
            urgency.urgency === 'high' ? 'border-red-500' : 
            urgency.urgency === 'medium' ? 'border-yellow-500' : 
            'border-monzed-elements-borderColor'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-monzed-elements-textPrimary">
              {urgency.title}
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-monzed-elements-textSecondary hover:text-monzed-elements-textPrimary"
              >
                <div className="i-ph:x w-5 h-5" />
              </button>
            )}
          </div>

          {/* Message */}
          <p className="text-monzed-elements-textSecondary mb-6">
            {urgency.message}
          </p>

          {/* Usage Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-monzed-elements-textSecondary">Usage this month</span>
              <span className="text-monzed-elements-textPrimary font-medium">{safeUsagePercentage}%</span>
            </div>
            <div className="w-full bg-monzed-elements-background-depth-2 rounded-full h-2">
              <div
                className={classNames(
                  'h-2 rounded-full transition-all duration-300',
                  safeUsagePercentage >= 90 ? 'bg-red-500' :
                  safeUsagePercentage >= 70 ? 'bg-yellow-500' :
                  'bg-green-500'
                )}
                style={{ width: `${Math.min(safeUsagePercentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-monzed-elements-textSecondary mt-1">
              {safeMessagesRemaining} messages remaining
            </div>
          </div>

          {/* All Plans - Horizontal Layout */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-monzed-elements-textPrimary mb-3">Choose your plan:</h4>
            {isLoadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500" />
                <span className="ml-2 text-monzed-elements-textSecondary">Loading plans...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Individual Plans (Starter, Pro) - Compact Horizontal */}
                {getGroupedPlans().individualPlans.map((plan: SubscriptionPlan) => (
                  <div
                    key={plan.id}
                    className={classNames(
                      'bg-monzed-elements-background-depth-2 rounded-lg p-3 border transition-all cursor-pointer hover:border-green-500',
                      selectedPlan === plan.id ? 'border-green-500 ring-2 ring-green-500 bg-green-500/5' : 'border-monzed-elements-borderColor',
                      plan.id === 'pro' ? 'ring-1 ring-green-500/50' : '' // Subtle highlight for recommended
                    )}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={classNames(
                          'w-4 h-4 rounded-full border-2 transition-all',
                          selectedPlan === plan.id
                            ? 'border-green-500 bg-green-500'
                            : 'border-monzed-elements-borderColor'
                        )}>
                          {selectedPlan === plan.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-monzed-elements-textPrimary">{plan.name}</span>
                            {plan.id === 'pro' && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-monzed-elements-textSecondary">
                            {plan.message_limit.toLocaleString()} messages/month
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-500">{formatPrice(plan.price_cents)}</div>
                        <div className="text-xs text-monzed-elements-textSecondary">/month</div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Scale Plans with Dropdown - Compact */}
                {getGroupedPlans().scalePlans.length > 0 && (
                  <div
                    className={classNames(
                      'bg-monzed-elements-background-depth-2 rounded-lg p-3 border transition-all cursor-pointer hover:border-green-500',
                      selectedPlan === 'scale' ? 'border-green-500 ring-2 ring-green-500 bg-green-500/5' : 'border-monzed-elements-borderColor'
                    )}
                    onClick={() => setSelectedPlan('scale')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={classNames(
                          'w-4 h-4 rounded-full border-2 transition-all',
                          selectedPlan === 'scale'
                            ? 'border-green-500 bg-green-500'
                            : 'border-monzed-elements-borderColor'
                        )}>
                          {selectedPlan === 'scale' && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-monzed-elements-textPrimary">Scale</span>
                          <div className="text-sm text-monzed-elements-textSecondary">
                            {getSelectedScalePlan()?.message_limit.toLocaleString()} messages/month
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-500">{formatPrice(getSelectedScalePlan()?.price_cents || 0)}</div>
                        <div className="text-xs text-monzed-elements-textSecondary">/month</div>
                      </div>
                    </div>

                    {/* Scale Plan Dropdown - Only show when Scale is selected */}
                    {selectedPlan === 'scale' && (
                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={selectedScalePlan}
                          onChange={(e) => setSelectedScalePlan(e.target.value)}
                          className="w-full bg-monzed-elements-background-depth-1 border border-monzed-elements-borderColor rounded-md px-3 py-2 text-sm text-monzed-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          {getGroupedPlans().scalePlans.map((scalePlan) => (
                            <option key={scalePlan.id} value={scalePlan.id}>
                              {scalePlan.message_limit.toLocaleString()} messages/month ({formatPrice(scalePlan.price_cents)}/mo)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions - Compact */}
          <div className="space-y-3">
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-lg font-medium text-monzed-elements-textSecondary hover:text-monzed-elements-textPrimary hover:bg-monzed-elements-background-depth-2 transition-colors border border-monzed-elements-borderColor"
              >
                Maybe Later
              </button>

              <button
                onClick={() => {
                  const actualPlanId = selectedPlan === 'scale' ? selectedScalePlan : selectedPlan;
                  handleUpgrade(actualPlanId);
                }}
                disabled={isUpgrading}
                className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {isUpgrading ? (
                  <>
                    <div className="i-ph:spinner-gap animate-spin w-4 h-4" />
                    Processing...
                  </>
                ) : (
                  'Proceed'
                )}
              </button>
            </div>

            {/* Secondary Actions - Compact */}
            <div className="flex gap-2 text-sm">
              {currentPlan !== 'free' && (
                <button
                  onClick={handleManageSubscription}
                  className="flex-1 py-2 px-3 rounded-lg font-medium text-monzed-elements-textSecondary hover:text-monzed-elements-textPrimary hover:bg-monzed-elements-background-depth-2 transition-colors"
                >
                  Manage Subscription
                </button>
              )}
              <button
                onClick={() => window.location.href = '/pricing'}
                className="flex-1 py-2 px-3 rounded-lg font-medium text-monzed-elements-textSecondary hover:text-monzed-elements-textPrimary hover:bg-monzed-elements-background-depth-2 transition-colors"
              >
                View All Plans
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
