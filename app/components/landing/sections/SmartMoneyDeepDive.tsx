import { useState, useEffect } from 'react';
import { Coins, Zap, Shield, Globe2, TrendingUp, Clock, Users, ArrowRight, CheckCircle, Wallet } from 'lucide-react';
import { useAuth } from '~/components/auth/AuthProvider';
import { useNavigate } from '@remix-run/react';

export default function SmartMoneyDeepDive() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeComparison, setActiveComparison] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetAICurrency = () => {
    if (user) {
      // User is logged in, navigate to wallet page for MetaMask integration
      navigate('/wallet');
    } else {
      // User not logged in, navigate to wallet page which will show signup modal
      navigate('/wallet');
    }
  };

  const benefits = [
    {
      icon: Zap,
      title: 'Instant Transactions',
      description: 'Money moves in seconds, not days',
      details: ['Payments processed instantly worldwide', 'No waiting for bank transfers', 'Real-time balance updates'],
      oldWay: 'Bank transfers: 3-5 business days',
      newWay: 'AI Currency: 2-3 seconds'
    },
    {
      icon: Globe2,
      title: 'Global Access',
      description: 'Works everywhere, no borders',
      details: ['Accept payments from any country', 'No currency conversion fees', 'Single global payment system'],
      oldWay: 'International fees: 3-7% per transaction',
      newWay: 'AI Currency: 0.1% network fee'
    },
    {
      icon: Shield,
      title: 'Military-Grade Security',
      description: 'Safer than traditional banking',
      details: ['Blockchain-secured transactions', 'Encrypted wallet protection', 'Fraud prevention built-in'],
      oldWay: 'Credit card fraud: $28 billion annually',
      newWay: 'Blockchain security: Nearly fraud-proof'
    },
    {
      icon: Users,
      title: 'No Bank Required',
      description: 'Be your own bank',
      details: ['Direct peer-to-peer payments', 'No account minimums or fees', 'Full control of your money'],
      oldWay: 'Banks: Monthly fees, minimums, restrictions',
      newWay: 'AI Currency: Your money, your control'
    }
  ];

  const useCases = [
    {
      title: 'E-commerce Store Owner',
      problem: 'Losing sales due to complex checkout and international payment issues',
      solution: 'AI Currency checkout increases conversions by 40% with one-click global payments',
      result: 'More sales, happier customers, instant money in your account'
    },
    {
      title: 'Freelance Designer',
      problem: 'Clients pay late, international transfers cost 5-10%, bank holds funds',
      solution: 'Get paid instantly in AI Currency, convert to local currency when needed',
      result: 'Improved cash flow, no more chasing payments, keep more of what you earn'
    },
    {
      title: 'Small Restaurant',
      problem: 'Credit card fees eating into thin margins, slow payment processing',
      solution: 'Accept AI Currency payments with minimal fees, instant settlement',
      result: 'Higher profit margins, faster cash flow, modern payment experience'
    },
    {
      title: 'Online Course Creator',
      problem: 'Students from different countries struggle with payment methods',
      solution: 'AI Currency works globally, students can pay easily from anywhere',
      result: 'Increased enrollment, global reach, simplified payment management'
    }
  ];

  const comparisonData = [
    {
      feature: 'Transaction Speed',
      traditional: '3-5 business days',
      aiCurrency: '2-3 seconds',
      advantage: '99.9% faster'
    },
    {
      feature: 'International Fees',
      traditional: '3-7% + exchange rates',
      aiCurrency: '0.1% network fee',
      advantage: '95% cheaper'
    },
    {
      feature: 'Operating Hours',
      traditional: 'Business hours only',
      aiCurrency: '24/7/365',
      advantage: 'Always available'
    },
    {
      feature: 'Geographic Reach',
      traditional: 'Limited by banking partnerships',
      aiCurrency: 'Global by default',
      advantage: 'Unlimited reach'
    },
    {
      feature: 'Account Requirements',
      traditional: 'Credit checks, documentation, minimums',
      aiCurrency: 'Just a digital wallet',
      advantage: 'Instant access'
    }
  ];

  return (
    <section id="smart-money-deep-dive" className="py-32 monzed-bg-secondary relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold monzed-text-primary mb-6 monzed-font-dm-sans transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Money That <span className="text-transparent bg-gradient-to-r from-monzed-accent to-mint-cyber bg-clip-text">Actually Works</span>
          </h2>
          
          <p className={`text-base sm:text-lg lg:text-xl monzed-text-secondary max-w-4xl mx-auto leading-relaxed px-2 sm:px-0 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Imagine if money worked like the internet - instant, global, always available. That's AI Currency. 
            Digital money designed for the modern world, not the banking system from 1950.
          </p>
        </div>

        {/* Comparison Table */}
        <div className={`mb-20 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-3xl font-bold monzed-text-primary mb-12 text-center">
            Old Money vs Smart Money
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full max-w-5xl mx-auto">
              <thead>
                <tr className="border-b monzed-border">
                  <th className="text-left py-4 px-6 monzed-text-primary font-bold">Feature</th>
                  <th className="text-left py-4 px-6 monzed-text-secondary">Traditional Banking</th>
                  <th className="text-left py-4 px-6 text-monzed-accent font-bold">AI Currency</th>
                  <th className="text-left py-4 px-6 text-mint-cyber font-bold">Advantage</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr 
                    key={index}
                    className={`border-b monzed-border hover:monzed-bg-primary/30 transition-colors cursor-pointer ${
                      activeComparison === index ? 'monzed-bg-primary/50' : ''
                    }`}
                    onClick={() => setActiveComparison(index)}
                  >
                    <td className="py-4 px-6 font-semibold monzed-text-primary">{row.feature}</td>
                    <td className="py-4 px-6 monzed-text-secondary">{row.traditional}</td>
                    <td className="py-4 px-6 text-monzed-accent font-semibold">{row.aiCurrency}</td>
                    <td className="py-4 px-6 text-mint-cyber font-bold">{row.advantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold monzed-text-primary mb-12 text-center">
            Why Businesses Choose AI Currency
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={index}
                  className={`p-8 rounded-2xl monzed-bg-primary border monzed-border hover:border-monzed-accent/30 transition-all duration-500 hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${800 + index * 100}ms` }}
                >
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-monzed-accent/20 to-mint-cyber/20 border border-monzed-accent/30 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-monzed-accent" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-xl font-bold monzed-text-primary mb-2">{benefit.title}</h4>
                      <p className="monzed-text-secondary mb-4 leading-relaxed">{benefit.description}</p>
                      
                      <ul className="space-y-2 mb-6">
                        {benefit.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center gap-2 text-sm monzed-text-secondary">
                            <CheckCircle className="w-4 h-4 text-monzed-accent flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                      
                      <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-green-500/10 border border-monzed-accent/20">
                        <div className="text-sm monzed-text-secondary mb-1">❌ {benefit.oldWay}</div>
                        <div className="text-sm text-monzed-accent font-semibold">✅ {benefit.newWay}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-World Use Cases */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold monzed-text-primary mb-12 text-center">
            Real Success Stories
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl monzed-bg-primary border monzed-border transition-all duration-500 hover:border-monzed-accent/30 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${1000 + index * 100}ms` }}
              >
                <h4 className="text-lg font-bold monzed-text-primary mb-4">{useCase.title}</h4>
                
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-sm font-medium text-red-400">Problem:</span>
                    <p className="text-sm monzed-text-secondary mt-1">{useCase.problem}</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <span className="text-sm font-medium text-blue-400">Solution:</span>
                    <p className="text-sm monzed-text-secondary mt-1">{useCase.solution}</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-sm font-medium text-green-400">Result:</span>
                    <p className="text-sm monzed-text-secondary mt-1">{useCase.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className={`text-center transition-all duration-1000 delay-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="p-8 rounded-2xl bg-gradient-to-br from-monzed-accent/5 to-mint-cyber/5 border border-monzed-accent/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold monzed-text-primary mb-4">
              Ready for Money That Actually Works?
            </h3>
            <p className="text-lg monzed-text-secondary mb-6 leading-relaxed">
              Join thousands of businesses already using AI Currency for faster, cheaper, 
              more secure payments. Setup takes less than 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetAICurrency}
                className="monzed-btn-primary group"
              >
                <Wallet className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                <span>Get AI Wallet</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="monzed-btn-secondary">
                <span>See Live Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
