import { Check, Zap, Crown, Rocket } from 'lucide-react';
import { useAuth } from '~/components/auth/AuthProvider';
import { useNavigate } from '@remix-run/react';

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = (plan: string) => {
    navigate('/login');
  };

  const plans = [
    {
      name: 'Explorer',
      price: 'Free',
      period: 'forever',
      description: 'Perfect for trying our AI ecosystem',
      icon: Zap,
      color: 'from-monzed-glow to-monzed-accent',
      features: [
        'Build simple websites & apps',
        'Basic AI assistant guidance',
        'Community support',
        'Learn about blockchain & Web3',
        'Free AI Currency welcome bonus'
      ],
      buttonText: 'Start Exploring',
      popular: false
    },
    {
      name: 'Creator',
      price: '$15',
      period: 'per month',
      description: 'For individuals building digital businesses',
      icon: Crown,
      color: 'from-monzed-accent to-mint-cyber',
      features: [
        'Build unlimited websites & apps',
        'Deploy to traditional hosting (Web2)',
        'Accept AI Currency payments',
        'Create simple smart contracts',
        'Email & chat support'
      ],
      buttonText: 'Become Creator',
      popular: false
    },
    {
      name: 'Business',
      price: '$45',
      period: 'per month',
      description: 'For serious entrepreneurs and small businesses',
      icon: Crown,
      color: 'from-mint-cyber to-monzed-bright',
      features: [
        'Everything in Creator',
        'Advanced smart contracts',
        'Blockchain deployment (Web3)',
        'Priority AI Currency processing',
        'Advanced security features',
        'Priority support'
      ],
      buttonText: 'Scale Business',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For large organizations and teams',
      icon: Rocket,
      color: 'from-mint-cyber to-citrus-electric',
      features: [
        'White-label AI Currency system',
        'Custom blockchain networks',
        'Dedicated AI models',
        'Advanced analytics & reporting',
        'Dedicated account manager',
        'Custom integrations'
      ],
      buttonText: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-24 monzed-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold monzed-text-primary mb-6 monzed-font-dm-sans">
            Simple <span className="text-transparent bg-gradient-to-r from-monzed-accent to-mint-cyber bg-clip-text">AI Currency</span> Pricing
          </h2>
          <p className="text-base sm:text-lg lg:text-xl monzed-text-secondary max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
            Pay with traditional money or our AI Currency. Build first, pay only when you're ready to launch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <div
                key={index}
                className={`relative p-8 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? 'monzed-bg-primary border-monzed-accent shadow-lg shadow-monzed-accent/20'
                    : 'monzed-bg-primary/50 monzed-border hover:border-monzed-accent/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-monzed-accent to-mint-cyber text-black px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${plan.color} mb-6`}>
                  <IconComponent size={24} className="text-black" strokeWidth={2} />
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold monzed-text-primary mb-2 monzed-font-dm-sans">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-4xl font-bold monzed-text-primary">{plan.price}</span>
                  {plan.period && (
                    <span className="text-lg monzed-text-secondary ml-2">/{plan.period}</span>
                  )}
                </div>

                {/* Description */}
                <p className="monzed-text-secondary mb-6 leading-relaxed">
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check size={16} className="text-monzed-accent flex-shrink-0" />
                      <span className="monzed-text-secondary text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleGetStarted(plan.name)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-monzed-accent to-mint-cyber text-black hover:scale-105 hover:shadow-lg'
                      : 'monzed-bg-secondary monzed-text-primary border monzed-border hover:border-monzed-accent/50'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            );
          })}
        </div>

        {/* AI Currency guarantee */}
        <div className="text-center mt-12">
          <p className="monzed-text-secondary">
            💰 30-day money-back guarantee • Pay with AI Currency or traditional payment • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
