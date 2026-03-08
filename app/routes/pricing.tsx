import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json, useLoaderData, useLocation, useNavigate } from '@remix-run/react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { classNames } from '~/utils/classNames';
import { UnifiedHeader } from '~/components/header/UnifiedHeader';
import { Footer } from '~/components/footer/Footer';
import { ClientOnly } from 'remix-utils/client-only';
import NeuralNetworkLines from '~/components/ui/NeuralNetworkLines';
import { toast, ToastContainer } from 'react-toastify';
import { billingService } from '~/lib/billing/billingService';
import { ServerBillingService } from '~/lib/billing/billingService.server';
import type { SubscriptionPlan } from '~/lib/billing/billingService';
import { useAuth } from '~/components/auth/AuthProvider';



interface UiPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonStyle: 'primary' | 'secondary';
  popular: boolean;
  hasDropdown?: boolean;
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Pricing Plans - Starsky | AI Business Builder - Affordable Plans to Turn Ideas Into Income' },
    { name: 'description', content: 'Start building your online business with Starsky\'s flexible pricing plans. From free to enterprise, choose the perfect plan to turn your ideas into income with our AI-powered business builder.' },
    { name: 'keywords', content: 'Starsky pricing, AI business builder pricing, online business plans, AI entrepreneur pricing, business creation plans, startup builder pricing, digital business pricing, income generation plans' },
    { property: 'og:title', content: 'Starsky Pricing Plans | AI Business Builder' },
    { property: 'og:description', content: 'Choose the perfect plan to build your online business with Starsky. Flexible pricing for AI-powered business creation - from free to enterprise solutions.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '/images/badge.png' },
    { property: 'og:url', content: 'https://sharelock.cc/pricing' },
    { property: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:title', content: 'Starsky Pricing Plans | AI Business Builder' },
    { property: 'twitter:description', content: 'Choose the perfect plan to build your online business with Starsky. Flexible pricing for AI-powered business creation - from free to enterprise solutions.' },
    { property: 'twitter:image', content: '/images/badge.png' },
    { name: 'robots', content: 'index, follow, max-image-preview:large' },
  ];
};

// Loader to fetch plans from database
export async function loader({ request, context }: LoaderFunctionArgs) {
  try {
    // Get all active plans from database
    const serverBillingService = new ServerBillingService(request, context?.cloudflare?.env);
    const plans = await serverBillingService.getSubscriptionPlans();

    // Separate scale plans for dropdown
    const scalePlans = plans.filter(plan => plan.id.startsWith('scale')).sort((a, b) => {
      const aNum = parseInt(a.id.replace('scale', ''));
      const bNum = parseInt(b.id.replace('scale', ''));
      return aNum - bNum;
    });

    // Get non-scale plans (excluding free plan for pricing page)
    const regularPlans = plans.filter(plan =>
      !plan.id.startsWith('scale') &&
      plan.id !== 'free'
    );

    return json({
      plans: regularPlans,
      scalePlans,
      success: true,
      error: null,
    });
  } catch (error) {
    console.error('Failed to load pricing plans:', error);

    // Return fallback data if database fails
    return json({
      plans: [],
      scalePlans: [],
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load plans',
    });
  }
}

// Helper function to determine button text and behavior
function getButtonConfig(planId: string, userSubscription: any, user: any, selectedScaleOption: any) {
  if (!user) {
    return { text: 'Sign In to Subscribe', action: 'signin' };
  }

  const hasStripeSub = !!userSubscription?.stripe_subscription_id;
  const planIdLower = (userSubscription?.plan_id || '').toLowerCase();

  // Treat users without subscription like free for subscription UI
  if (!userSubscription || planIdLower === 'free' || !hasStripeSub) {
    return { text: 'Subscribe', action: 'subscribe' };
  }

  // For scale plans, check the specific scale option
  let actualPlanId = planId;
  if (planId === 'scale') {
    actualPlanId = selectedScaleOption.id;
  }

  if (userSubscription.plan_id === actualPlanId) {
    return { text: 'Manage Plan', action: 'manage' };
  }

  return { text: 'Change Plan', action: 'change' };
}

// Helper function to convert database plan to UI plan format
function convertDbPlanToUiPlan(
  plan: SubscriptionPlan,
  userSubscription: any = null,
  user: any = null,
  selectedScaleOption: any = null
): UiPlan {
  const buttonConfig = getButtonConfig(plan.id, userSubscription, user, selectedScaleOption);

  return {
    id: plan.id,
    name: plan.name,
    price: plan.price_cents === 0 ? 'Free' : `$${plan.price_cents / 100}`,
    period: plan.price_cents === 0 ? '' : '/month',
    description: plan.description || '',
    features: plan.features || [],
    buttonText: buttonConfig.text,
    buttonStyle: plan.id === 'pro' ? 'primary' : 'secondary' as const,
    popular: plan.id === 'pro', // Mark Pro as popular
  };
}

// Helper function to get scale options from database plans
function getScaleOptionsFromPlans(scalePlans: SubscriptionPlan[]) {
  return scalePlans.map(plan => ({
    id: plan.id,
    messages: plan.message_limit,
    price: plan.price_cents / 100,
    name: plan.name,
    description: plan.description,
    features: plan.features,
  }));
}

const getPlans = (
  dbPlans: SubscriptionPlan[],
  userSubscription: any = null,
  user: any = null,
  selectedScaleOption: any = null
): UiPlan[] => {
  const regularUiPlans = dbPlans
    .filter(p => !p.id.startsWith('scale') && p.id !== 'free')
    
    .map(p => convertDbPlanToUiPlan(p, userSubscription, user, selectedScaleOption));

  const scalePlansFromDb = dbPlans.filter(p => p.id.startsWith('scale'));
  const hasScalePlans = scalePlansFromDb.length > 0;
  let scaleUiPlan: UiPlan[] = [];

  if (hasScalePlans) {
    const firstScalePlan = dbPlans.find(p => p.id === 'scale0') || dbPlans.find(p => p.id.startsWith('scale'));
    if (firstScalePlan) {
      const scaleButtonConfig = getButtonConfig('scale', userSubscription, user, selectedScaleOption);

      scaleUiPlan.push({
        id: 'scale',
        name: firstScalePlan.name,
        price: `$${firstScalePlan.price_cents / 100}`,
        period: '/month',
        description: firstScalePlan.description || 'For growing teams and high usage',
        features: firstScalePlan.features || [],
        buttonText: scaleButtonConfig.text,
        buttonStyle: 'secondary',
        popular: false,
        hasDropdown: true,
      });
    }
  }

  const customUiPlan: UiPlan = {
    id: 'custom',
    name: 'Custom',
    price: 'Contact us',
    period: '',
    description: 'For enterprise and custom needs',
    features: [
      'Unlimited messages',
      'All AI models & providers',
      'Custom AI model integration',
      'Dedicated support team',
      'Custom deployment options',
      'SSO & enterprise security',
      'SLA guarantees',
      'White-label solutions',
    ],
    buttonText: 'Contact Sales',
    buttonStyle: 'secondary',
    popular: false,
  };

  return [...regularUiPlans, ...scaleUiPlan, customUiPlan];
};

export default function Pricing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const loaderData = useLoaderData<typeof loader>();
  const location = useLocation();

  // Get scale options from database
  const scaleOptions = getScaleOptionsFromPlans(loaderData.scalePlans ? loaderData.scalePlans as SubscriptionPlan[] : []);
  const [selectedScaleOption, setSelectedScaleOption] = useState(scaleOptions[0] || { id: 'scale0', messages: 1000, price: 50 });
  const [loadingPlans, setLoadingPlans] = useState<string[]>([]);
  const [sessionProcessed, setSessionProcessed] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any>(null);

  // Fetch user subscription when user is available
  useEffect(() => {
    if (user && !authLoading) {
      billingService.getUserSubscription(user.id)
        .then(subscription => {
          setUserSubscription(subscription);
        })
        .catch(error => {
          console.error('Failed to fetch user subscription:', error);
        });
    }
  }, [user, authLoading]);

  // Get plans from database
  const plans = getPlans([
    ...(loaderData.plans ? loaderData.plans as SubscriptionPlan[] : []),
    ...(loaderData.scalePlans ? loaderData.scalePlans as SubscriptionPlan[] : [])
  ], userSubscription, user, selectedScaleOption);

  // Check URL parameters for subscription status
  useEffect(() => {
    // Don't process anything while auth is still loading
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting before processing subscription...');
      return;
    }

    const searchParams = new URLSearchParams(location.search);

    // Helper function to clean up URL parameters
    const cleanupUrl = (paramsToRemove: string[]) => {
      const newUrl = new URL(window.location.href);
      paramsToRemove.forEach(param => {
        newUrl.searchParams.delete(param);
      });
      // Also handle malformed URLs
      if (newUrl.search.includes('?session_id=')) {
        newUrl.search = newUrl.search.replace(/\?session_id=[^&]*/, '');
      }
      window.history.replaceState({}, '', newUrl.toString());
      console.log('🧹 Cleaned up URL:', newUrl.toString());
    };

    // Handle malformed URLs with double question marks (legacy fix)
    let sessionId = searchParams.get('session_id');
    if (!sessionId && location.search.includes('?session_id=')) {
      // Extract session_id from malformed URL like ?success=true?session_id=cs_test_...
      const match = location.search.match(/\?session_id=([^&]+)/);
      if (match) {
        sessionId = match[1];
        console.log('🔧 Extracted session ID from malformed URL:', sessionId);
      }
    }

    // Skip processing if session ID is a template placeholder
    if (sessionId === '{CHECKOUT_SESSION_ID}') {
      console.log('⚠️ Session ID is template placeholder, cleaning up URL');
      cleanupUrl(['session_id']);
      return;
    }

    // Check for session ID (returning from Stripe)
    if (sessionId && !sessionProcessed) {
      console.log('🔍 Processing session ID:', sessionId);
      setSessionProcessed(true);

      // Clean up URL immediately to prevent reprocessing
      cleanupUrl(['session_id']);

      // Fetch session details and process subscription
      fetch(`/api/stripe/checkout?session_id=${sessionId}`)
        .then(response => {
          console.log('📡 Session API response status:', response.status);
          return response.json();
        })
        .then((data) => {
          const typedData = data as { status?: string; error?: string; customerEmail?: string; subscriptionId?: string };
          console.log('📊 Session API response data:', typedData);
          if (typedData.status === 'paid') {
            // Show success message
            toast.success('🎉 Subscription Successful! Your plan has been activated. You can now enjoy your new features!', {
              autoClose: 8000,
              style: {
                background: '#10B981',
                color: 'white',
              }
            });

            // Force refresh user subscription data without page reload
            if (user) {
              console.log('🔄 Starting subscription data refresh for user:', user.id);
              console.log('🔄 User object:', { id: user.id, email: user.email });
              billingService.getUserSubscription(user.id, true)
                .then((refreshedSubscription) => {
                  console.log('✅ Subscription data refreshed successfully:', refreshedSubscription);
                  // Notify the rest of the app to refresh usage/subscription data without a full reload
                  window.dispatchEvent(new Event('refreshUsage'));
                })
                .catch(error => {
                  console.error('❌ Failed to refresh subscription:', error);
                });
            } else {
              console.error('❌ No user object available for subscription refresh');
              console.log('🔍 Auth loading state:', authLoading);
              console.log('🔍 User state:', user);
            }
          } else if (typedData.error) {
            console.error('❌ Subscription error:', typedData.error);
            toast.error(`Subscription failed: ${typedData.error}`);
          } else {
            console.log('⚠️ Unexpected session status:', typedData.status);
          }
        })
        .catch(error => {
          console.error('❌ Error fetching session:', error);
          toast.error('Failed to verify subscription status');
        });
    }
    // Check for subscription success (fallback for direct success parameter)
    else if (searchParams.get('success') === 'true' && !sessionProcessed) {
      console.log('🔍 Processing success parameter');
      setSessionProcessed(true);

      // Clean up URL immediately
      cleanupUrl(['success']);

      toast.success('🎉 Subscription Successful! Thank you for subscribing to Starsky.', {
        autoClose: 5000,
        style: {
          background: '#10B981',
          color: 'white',
        }
      });

      // Refresh subscription data without page reload
      if (user) {
        console.log('🔄 Starting subscription data refresh for user (success param):', user.id);
        billingService.getUserSubscription(user.id, true)
          .then((refreshedSubscription) => {
            console.log('✅ Subscription data refreshed successfully (success param):', refreshedSubscription);
          })
          .catch(error => {
            console.error('❌ Failed to refresh subscription (success param):', error);
          });
      } else {
        console.error('❌ No user object available for subscription refresh (success param)');
        console.log('🔍 Auth loading state:', authLoading);
        console.log('🔍 User state:', user);
      }
    }

    // Check for subscription cancellation
    else if (searchParams.get('canceled') === 'true' && !sessionProcessed) {
      // Clean up URL immediately
      cleanupUrl(['canceled']);

      // Mark as processed to avoid duplicate toasts in StrictMode
      setSessionProcessed(true);

      toast.info('Subscription Canceled. Your subscription process was canceled.', {
        toastId: 'subscription-canceled',
        autoClose: 4000
      });
    }
  }, [location.search, user, sessionProcessed, authLoading]);

  // Handle loading error
  if (!loaderData.success) {
    return (
      <div className="min-h-screen monzed-bg-primary">

        <UnifiedHeader variant="landing" />
        <div className="flex items-center justify-center min-h-[60vh] pt-20">
          <div className="text-center">
            <div className="i-ph:warning-circle w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold monzed-text-primary mb-2">
              Failed to Load Pricing Plans
            </h2>
            <p className="monzed-text-secondary mb-4">
              {loaderData.error || 'Unable to fetch current pricing information'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gradient-to-r from-monzed-glow to-monzed-accent text-black rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }


  const handleSubscribe = async (planId: string) => {
    console.log('Subscribe button clicked for plan:', planId);

    if (!user) {
      console.log('No user found, redirecting to /login');
      window.location.href = `/login?redirect=${encodeURIComponent(location.pathname)}`;
      return;
    }

    console.log('User authenticated:', user.id);

    // Check what action this button should perform
    const buttonConfig = getButtonConfig(planId, userSubscription, user, selectedScaleOption);

    // If this is a "Manage Plan" or "Change Plan" action, redirect to Customer Portal
    if (buttonConfig.action === 'manage' || buttonConfig.action === 'change') {
      console.log(`Button action: ${buttonConfig.action}, redirecting to Customer Portal`);

      try {
        const response = await fetch('/api/stripe/portal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            returnUrl: window.location.href
          }),
        });

        if (response.ok) {
          const data = await response.json() as { url: string };
          toast.info('Redirecting to Customer Portal...', {
            autoClose: 2000,
          });
          setTimeout(() => {
            window.location.href = data.url;
          }, 500);
          return;
        } else {
          const errorData = await response.json() as { error?: string; details?: string };
          console.error('Portal API error response:', errorData);
          throw new Error(errorData.details || errorData.error || 'Failed to create portal session');
        }
      } catch (error) {
        console.error('Failed to redirect to customer portal:', error);
        toast.error(`Failed to open billing portal: ${error instanceof Error ? error.message : 'Please try again.'}`);
        return;
      }
    }

    // Continue with normal subscription flow for new subscriptions

    if (loadingPlans.includes(planId)) {
      console.log('Already processing this plan, returning');
      return;
    }

    setLoadingPlans(prev => [...prev, planId]);
    console.log('Set loading state for plan:', planId);

    try {
      // For scale plan, use the selected scale option ID
      let actualPlanId = planId;
      if (planId === 'scale') {
        actualPlanId = selectedScaleOption.id;
        console.log('Scale plan selected:', actualPlanId, selectedScaleOption);
      }

      // Continue with new subscription creation (free → paid)

      // Create Stripe checkout session
      console.log('Creating checkout session for plan:', actualPlanId);
      
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

        console.log('Checkout API response status:', response.status);
        const data = await response.json() as {
          sessionId?: string;
          url?: string;
          error?: string;
          details?: string;
        };
        console.log('Checkout API response data:', data);

        if (!response.ok) {
          throw new Error(data.error || data.details || 'Failed to create checkout session');
        }

        // Redirect to Stripe Checkout
        if (data.url) {
          console.log('Redirecting to Stripe checkout:', data.url);
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        toast.error(fetchError instanceof Error ? fetchError.message : 'Failed to connect to payment service');
        throw fetchError;
      }

    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start subscription process');
    } finally {
      console.log('Clearing loading state for plan:', planId);
      setLoadingPlans(prev => prev.filter(id => id !== planId));
    }
  };



  // Set body attribute for scrolling
  useEffect(() => {
    document.body.setAttribute('data-landing', 'true');
    return () => {
      document.body.removeAttribute('data-landing');
    };
  }, []);

  return (
    <div className="h-full monzed-bg-primary overflow-y-auto modern-scrollbar">
      {/* Neural network background lines */}
      <NeuralNetworkLines />
      {/* Header */}
      <UnifiedHeader variant="landing" showNavigation={true} />

      {/* Main Content */}
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-6xl font-bold monzed-text-primary mb-6">
            Simple, transparent{' '}
            <span className="bg-gradient-to-r from-monzed-glow to-monzed-accent bg-clip-text text-transparent">
              pricing
            </span>
          </h1>
          <p className="text-lg monzed-text-secondary max-w-2xl mx-auto">
            Choose the perfect plan for your AI needs. Start free and scale as you grow.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={classNames(
                'relative rounded-2xl p-8 border flex flex-col h-full transition-all duration-300 hover:shadow-xl',
                plan.popular
                  ? 'border-monzed-accent bg-gradient-to-br from-monzed-accent/10 via-monzed-bright/5 to-transparent shadow-xl shadow-monzed-accent/20 scale-105'
                  : 'monzed-border monzed-bg-secondary hover:border-monzed-accent/30 hover:shadow-lg',
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-monzed-glow to-monzed-accent text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-semibold monzed-text-primary mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  {plan.hasDropdown ? (
                    <div className="text-center">
                      <div className="mb-2 flex justify-center">
                        <select
                          value={selectedScaleOption.id}
                          onChange={(e) => {
                            const option = scaleOptions.find(opt => opt.id === e.target.value);
                            if (option) setSelectedScaleOption(option);
                          }}
                          className="appearance-none px-4 py-2 text-lg font-bold monzed-text-primary monzed-bg-tertiary border-2 border-monzed-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-monzed-accent focus:ring-offset-2 focus:ring-offset-transparent transition-all cursor-pointer hover:border-monzed-glow max-w-fit"
                        >
                          {scaleOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.messages.toLocaleString()} messages/month
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-3xl font-bold monzed-text-primary">
                        ${selectedScaleOption.price}
                      </div>
                      <div className="text-lg monzed-text-secondary">/month</div>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl font-bold monzed-text-primary">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="monzed-text-secondary">{plan.period}</span>
                      )}
                    </>
                  )}
                </div>
                <p className="monzed-text-secondary mb-6">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-monzed-accent/10 flex items-center justify-center">
                      <div className="i-ph:check w-3 h-3 text-monzed-accent" />
                    </div>
                    <span className="text-sm monzed-text-secondary">
                      {plan.hasDropdown && (feature.includes('messages per month') || feature.includes('𝑥 messages'))
                        ? `${selectedScaleOption.messages.toLocaleString()} messages per month`
                        : feature
                      }
                    </span>
                  </li>
                ))}
              </ul>

              {plan.id === 'custom' ? (
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=hello@sharelock.cc&su=Custom%20Plan%20Inquiry&body=Hi%20Digimetrix%20team,%0A%0AI'm%20interested%20in%20learning%20more%20about%20your%20custom%20enterprise%20plans.%0A%0APlease%20contact%20me%20with%20more%20information.%0A%0AThank%20you!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border monzed-border monzed-text-primary hover:monzed-bg-tertiary"
                >
                  <div className="i-ph:envelope w-4 h-4" />
                  {plan.buttonText}
                </a>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlans.includes(plan.id)}
                  className={classNames(
                    'w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2',
                    plan.buttonStyle === 'primary'
                      ? 'bg-gradient-to-r from-monzed-glow to-monzed-accent text-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'bg-gradient-to-r from-monzed-glow to-monzed-accent text-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {loadingPlans.includes(plan.id) ? (
                    <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
                  ) : (
                    <div className="i-ph:lightning w-4 h-4" />
                  )}
                  {loadingPlans.includes(plan.id) ? 'Processing...' : plan.buttonText}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-24 text-center"
        >
          <h2 className="text-2xl font-bold monzed-text-primary mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-left p-6 rounded-lg monzed-bg-secondary border monzed-border">
              <h3 className="font-semibold monzed-text-primary mb-2">
                Can I change plans anytime?
              </h3>
              <p className="monzed-text-secondary">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="text-left p-6 rounded-lg monzed-bg-secondary border monzed-border">
              <h3 className="font-semibold monzed-text-primary mb-2">
                What happens if I exceed my message limit?
              </h3>
              <p className="monzed-text-secondary">
                You'll be notified when approaching your limit. You can upgrade your plan or wait for the next billing cycle.
              </p>
            </div>
          </div>
        </motion.div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Toast Container for notifications */}
      <ToastContainer
        closeButton={({ closeToast }) => {
          return (
            <button className="Toastify__close-button" onClick={closeToast}>
              <div className="i-ph:x text-lg" />
            </button>
          );
        }}
        icon={({ type }) => {
          switch (type) {
            case 'success': {
              return <div className="i-ph:check-bold text-monzed-elements-icon-success text-2xl" />;
            }
            case 'error': {
              return <div className="i-ph:warning-circle-bold text-monzed-elements-icon-error text-2xl" />;
            }
          }
          return undefined;
        }}
        position="bottom-right"
        pauseOnFocusLoss
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnHover
        draggable
        theme="dark"
      />
    </div>
  );
}
