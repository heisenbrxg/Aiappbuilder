import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { useAuth } from '~/components/auth/AuthProvider';
import { useNavigate } from '@remix-run/react';
import { billingService } from '~/lib/billing/billingService';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import type { SubscriptionPlan } from '~/lib/billing/billingService';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsage?: {
    current: number;
    limit: number;
    percentage: number;
  };
}

export function PricingModal({ isOpen, onClose, currentUsage }: PricingModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedScalePlan, setSelectedScalePlan] = useState<string>('scale0');
  const [showScaleDropdown, setShowScaleDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper functions
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

  // Fetch plans from database
  useEffect(() => {
    if (isOpen) {
      billingService.getSubscriptionPlans()
        .then(fetchedPlans => {
          // Get all plans except free
          const displayPlans = fetchedPlans.filter(p => p.id !== 'free');
          setPlans(displayPlans);
        })
        .catch(error => {
          console.error('Failed to fetch plans:', error);
        });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowScaleDropdown(false);
      }
    };

    if (showScaleDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showScaleDropdown]);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/login');
      onClose();
      return;
    }

    // For scale plan, use the selected scale plan ID
    let actualPlanId = planId;
    if (planId === 'scale') {
      actualPlanId = selectedScalePlan;
    }

    setLoadingPlan(planId);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: actualPlanId,
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.display_name || user.email,
          successUrl: `${window.location.origin}/pricing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      const data = await response.json() as {
        url?: string;
        error?: string;
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

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Customer Portal')) {
          toast.error('Please use the subscription management portal to change your plan.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to start subscription. Please try again.');
      }
    } finally {
      setLoadingPlan(null);
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

  // Create display plans with grouped scale plans
  const getDisplayPlans = () => {
    const { individualPlans, scalePlans } = getGroupedPlans();

    const displayPlans = [...individualPlans];

    // Add grouped scale plan if scale plans exist
    if (scalePlans.length > 0) {
      const selectedScale = getSelectedScalePlan();
      if (selectedScale) {
        displayPlans.push({
          ...selectedScale,
          id: 'scale', // Use 'scale' as the display ID
          hasDropdown: true,
        } as SubscriptionPlan & { hasDropdown: boolean });
      }
    }

    return displayPlans;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-monzed-elements-background-depth-1 rounded-2xl shadow-xl max-w-5xl w-full pointer-events-auto">
              {/* Header */}
              <div className="bg-monzed-elements-background-depth-1 border-b border-monzed-elements-borderColor p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-monzed-elements-textPrimary">
                      Message Limit Reached!
                    </h2>
                    {currentUsage && (
                      <p className="text-monzed-elements-textSecondary mt-1">
                        You've used {currentUsage.current} of {currentUsage.limit} messages this month
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-monzed-elements-background-depth-2 transition-colors"
                  >
                    <div className="i-ph:x w-5 h-5 text-monzed-elements-textSecondary" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-center text-monzed-elements-textSecondary mb-8">
                  Upgrade your plan to continue creating amazing projects with Starsky
                </p>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {getDisplayPlans().map((plan) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={classNames(
                        'relative rounded-xl p-6 border-2 transition-all flex flex-col h-full',
                        plan.id === 'pro'
                          ? 'border-red-500 bg-red-500/5 shadow-lg shadow-red-500/10'
                          : 'border-monzed-elements-borderColor bg-monzed-elements-background-depth-2',
                      )}
                    >
                      {plan.id === 'pro' && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                            RECOMMENDED
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-monzed-elements-textPrimary mb-2">
                          {plan.name}
                        </h3>
                        <div className="mb-2">
                          {plan.id === 'scale' ? (
                            <div className="relative" ref={plan.id === 'scale' ? dropdownRef : undefined}>
                              <button
                                onClick={() => plan.id === 'scale' && setShowScaleDropdown(!showScaleDropdown)}
                                className="flex items-center justify-center gap-2 mx-auto text-3xl font-bold text-monzed-elements-textPrimary hover:text-red-500 transition-colors"
                              >
                                <span>{getSelectedScalePlan()?.message_limit.toLocaleString()} messages</span>
                                <div className={classNames(
                                  "i-ph:caret-down w-5 h-5 text-lg transition-transform",
                                  showScaleDropdown && plan.id === 'scale' ? 'rotate-180' : ''
                                )} />
                              </button>
                              {showScaleDropdown && plan.id === 'scale' && (
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-monzed-elements-background-depth-1 border border-monzed-elements-borderColor rounded-lg shadow-lg z-20 min-w-[200px]">
                                  {getGroupedPlans().scalePlans.map((scalePlan) => (
                                    <button
                                      key={scalePlan.id}
                                      onClick={() => {
                                        setSelectedScalePlan(scalePlan.id);
                                        setShowScaleDropdown(false);
                                      }}
                                      className="w-full px-4 py-3 text-left hover:bg-monzed-elements-background-depth-2 transition-colors border-b border-monzed-elements-borderColor last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
                                    >
                                      <div className="font-semibold text-monzed-elements-textPrimary">
                                        {scalePlan.message_limit.toLocaleString()} messages/month
                                      </div>
                                      <div className="text-sm text-monzed-elements-textSecondary">
                                        {formatPrice(scalePlan.price_cents)}/month
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className="text-lg text-monzed-elements-textSecondary mt-1">{formatPrice(getSelectedScalePlan()?.price_cents || 0)}/month</div>
                            </div>
                          ) : (
                            <>
                              <span className="text-3xl font-bold text-monzed-elements-textPrimary">
                                {formatPrice(plan.price_cents)}
                              </span>
                              <span className="text-monzed-elements-textSecondary">/month</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-red-500 font-medium mt-2">
                          {plan.id === 'scale'
                            ? `${getSelectedScalePlan()?.message_limit.toLocaleString()} messages/month`
                            : `${plan.message_limit} messages/month`
                          }
                        </p>
                      </div>

                      <ul className="space-y-3 mb-6 flex-1">
                        {(plan.features || []).slice(0, 5).map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5 shrink-0">
                              <div className="i-ph:check w-2.5 h-2.5 text-red-500" />
                            </div>
                            <span className="text-sm text-monzed-elements-textSecondary">
                              {plan.id === 'scale' && (feature.includes('messages per month') || feature.includes('𝑥 messages'))
                                ? `${getSelectedScalePlan()?.message_limit.toLocaleString()} messages per month`
                                : feature
                              }
                            </span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={loadingPlan === plan.id}
                        className={classNames(
                          'w-full py-3 rounded-lg font-medium transition-all',
                          plan.id === 'pro'
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-monzed-elements-background-depth-3 text-monzed-elements-textPrimary hover:bg-monzed-elements-background-depth-4',
                          {
                            'opacity-50 cursor-not-allowed': loadingPlan === plan.id
                          }
                        )}
                      >
                        {loadingPlan === plan.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="i-ph:spinner-gap animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          'Upgrade Now'
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-8 text-center">
                  <p className="text-monzed-elements-textSecondary mb-4">
                    Need more messages? Check out our{' '}
                    <a
                      href="/pricing"
                      className="text-red-500 hover:text-red-600 underline"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open('/pricing', '_blank');
                      }}
                    >
                      Scale plans
                    </a>
                  </p>
                  {!user && (
                    <button
                      onClick={() => {
                        navigate('/login');
                        onClose();
                      }}
                      className="text-red-500 hover:text-red-600 font-medium"
                    >
                      Sign in to subscribe
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 