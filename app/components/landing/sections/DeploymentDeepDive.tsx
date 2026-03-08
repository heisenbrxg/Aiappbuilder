import { useState, useEffect } from 'react';
import { Globe, Server, Shield, Zap, Code, Layers, ArrowRight, CheckCircle, ExternalLink } from 'lucide-react';

export default function DeploymentDeepDive() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('web2');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const web2Options = [
    {
      icon: Globe,
      name: 'Traditional Hosting',
      description: 'Standard web hosting like you know',
      platforms: ['cPanel/Shared Hosting', 'VPS/Dedicated Servers', 'WordPress.com'],
      useCase: 'Perfect for local businesses, portfolios, blogs',
      pros: ['Familiar to most people', 'Lots of hosting providers', 'Easy to understand'],
      pricing: '$5-50/month'
    },
    {
      icon: Zap,
      name: 'Modern Cloud Platforms',
      description: 'Fast, scalable, professional hosting',
      platforms: ['Vercel', 'Netlify', 'Cloudflare Pages'],
      useCase: 'Great for businesses that need reliability and speed',
      pros: ['Lightning fast', 'Auto-scaling', 'Global CDN'],
      pricing: 'Free tier available, scales with usage'
    },
    {
      icon: Code,
      name: 'WordPress Export',
      description: 'Convert to WordPress theme',
      platforms: ['WordPress.org', 'WordPress.com', 'Custom WordPress'],
      useCase: 'If you want to use WordPress ecosystem',
      pros: ['Huge plugin library', 'Easy content management', 'SEO friendly'],
      pricing: 'Free (WordPress) + hosting costs'
    }
  ];

  const web3Options = [
    {
      icon: Shield,
      name: 'Ethereum Network',
      description: 'Most established blockchain platform',
      platforms: ['Mainnet', 'Polygon', 'Arbitrum'],
      useCase: 'For maximum security and established ecosystem',
      pros: ['Highest security', 'Largest user base', 'Most dApps'],
      pricing: 'Gas fees vary ($1-50 per transaction)'
    },
    {
      icon: Layers,
      name: 'Starsky Chain',
      description: 'Our optimized blockchain network',
      platforms: ['Mainnet', 'Testnet'],
      useCase: 'Best integration with AI Currency and our tools',
      pros: ['AI Currency native', 'Lower fees', 'Faster transactions'],
      pricing: 'Minimal fees (under $0.10 per transaction)'
    },
    {
      icon: Server,
      name: 'IPFS/Decentralized',
      description: 'Fully decentralized hosting',
      platforms: ['IPFS', 'Arweave', 'Filecoin'],
      useCase: 'For permanent, censorship-resistant apps',
      pros: ['Permanent storage', 'No single point of failure', 'Censorship resistant'],
      pricing: 'One-time storage fees'
    }
  ];

  const comparisonFeatures = [
    {
      feature: 'Setup Complexity',
      web2: 'Simple',
      web3: 'Moderate (we handle it)',
      explanation: 'Web2 is like renting an apartment, Web3 is like owning your digital real estate'
    },
    {
      feature: 'Control Level',
      web2: 'Hosting provider controls',
      web3: 'You control everything',
      explanation: 'Web3 gives you true ownership of your digital assets'
    },
    {
      feature: 'Censorship Risk',
      web2: 'Possible',
      web3: 'Nearly impossible',
      explanation: 'Web3 apps run on distributed networks, not single servers'
    },
    {
      feature: 'Global Access',
      web2: 'Good',
      web3: 'Excellent',
      explanation: 'Web3 works everywhere without geographic restrictions'
    },
    {
      feature: 'Payment Integration',
      web2: 'Traditional methods',
      web3: 'AI Currency native',
      explanation: 'Web3 apps can accept payments directly without third parties'
    }
  ];

  const deploymentSteps = [
    {
      step: 1,
      title: 'Choose Your Path',
      description: 'Select your deployment platform - Netlify, Vercel, GitHub, or blockchain',
      action: 'Our AI will recommend based on your business needs'
    },
    {
      step: 2,
      title: 'Configure Settings',
      description: 'We handle all the technical configuration automatically',
      action: 'Just approve the settings - no technical knowledge needed'
    },
    {
      step: 3,
      title: 'Deploy Instantly',
      description: 'Your app goes live in minutes, not hours or days',
      action: 'Get a live URL you can share immediately'
    },
    {
      step: 4,
      title: 'Monitor & Scale',
      description: 'We handle updates, security, and scaling automatically',
      action: 'Focus on your business while we handle the technical stuff'
    }
  ];

  return (
    <section id="deployment-deep-dive" className="py-32 monzed-bg-primary relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold monzed-text-primary mb-6 monzed-font-dm-sans transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Launch <span className="text-transparent bg-gradient-to-r from-monzed-accent to-mint-cyber bg-clip-text">Everywhere</span>
          </h2>
          
          <p className={`text-base sm:text-lg lg:text-xl monzed-text-secondary max-w-4xl mx-auto leading-relaxed px-2 sm:px-0 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Deploy to Netlify, Vercel, GitHub Pages, or blockchain networks with one click. 
            From traditional hosting to Web3 platforms - we support all deployment options and handle the technical complexity.
          </p>
        </div>

        {/* Web2 vs Web3 Tabs */}
        <div className={`mb-20 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-full monzed-bg-secondary border monzed-border">
              <button
                onClick={() => setActiveTab('web2')}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  activeTab === 'web2'
                    ? 'bg-monzed-accent'
                    : 'monzed-text-secondary hover:monzed-text-primary'
                }`}
                style={activeTab === 'web2' ? { color: '#FFFFFF' } : {}}
              >
                Web2 (Traditional)
              </button>
              <button
                onClick={() => setActiveTab('web3')}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  activeTab === 'web3'
                    ? 'bg-monzed-accent'
                    : 'monzed-text-secondary hover:monzed-text-primary'
                }`}
                style={activeTab === 'web3' ? { color: '#FFFFFF' } : {}}
              >
                Web3 (Blockchain)
              </button>
            </div>
          </div>

          {/* Web2 Options */}
          {activeTab === 'web2' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold monzed-text-primary mb-4">Traditional Internet Hosting</h3>
                <p className="monzed-text-secondary max-w-3xl mx-auto">
                  Deploy to the regular internet using proven hosting platforms. Perfect for most businesses and familiar to everyone.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {web2Options.map((option, index) => {
                  const IconComponent = option.icon;
                  return (
                    <div key={index} className="p-6 rounded-2xl monzed-bg-secondary border monzed-border hover:border-monzed-accent/30 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-monzed-accent/20 to-mint-cyber/20 border border-monzed-accent/30 flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-monzed-accent" />
                        </div>
                        <h4 className="text-lg font-bold monzed-text-primary">{option.name}</h4>
                      </div>
                      
                      <p className="monzed-text-secondary text-sm mb-4">{option.description}</p>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs font-semibold monzed-text-primary">Platforms:</span>
                          <ul className="text-xs monzed-text-secondary">
                            {option.platforms.map((platform, i) => (
                              <li key={i}>• {platform}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <span className="text-xs font-semibold monzed-text-primary">Best for:</span>
                          <p className="text-xs monzed-text-secondary">{option.useCase}</p>
                        </div>
                        
                        <div>
                          <span className="text-xs font-semibold monzed-text-primary">Pricing:</span>
                          <p className="text-xs text-monzed-accent font-semibold">{option.pricing}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Web3 Options */}
          {activeTab === 'web3' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold monzed-text-primary mb-4">Blockchain Network Deployment</h3>
                <p className="monzed-text-secondary max-w-3xl mx-auto">
                  Deploy to blockchain networks for enhanced security, global accessibility, and native AI Currency integration.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {web3Options.map((option, index) => {
                  const IconComponent = option.icon;
                  return (
                    <div key={index} className="p-6 rounded-2xl monzed-bg-secondary border monzed-border hover:border-monzed-accent/30 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-monzed-accent/20 to-mint-cyber/20 border border-monzed-accent/30 flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-monzed-accent" />
                        </div>
                        <h4 className="text-lg font-bold monzed-text-primary">{option.name}</h4>
                      </div>
                      
                      <p className="monzed-text-secondary text-sm mb-4">{option.description}</p>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs font-semibold monzed-text-primary">Networks:</span>
                          <ul className="text-xs monzed-text-secondary">
                            {option.platforms.map((platform, i) => (
                              <li key={i}>• {platform}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <span className="text-xs font-semibold monzed-text-primary">Best for:</span>
                          <p className="text-xs monzed-text-secondary">{option.useCase}</p>
                        </div>
                        
                        <div>
                          <span className="text-xs font-semibold monzed-text-primary">Costs:</span>
                          <p className="text-xs text-monzed-accent font-semibold">{option.pricing}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Feature Comparison */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold monzed-text-primary mb-12 text-center">
            Web2 vs Web3: What's the Difference?
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full max-w-5xl mx-auto">
              <thead>
                <tr className="border-b monzed-border">
                  <th className="text-left py-4 px-6 monzed-text-primary font-bold">Feature</th>
                  <th className="text-left py-4 px-6 monzed-text-secondary">Web2 (Traditional)</th>
                  <th className="text-left py-4 px-6 text-monzed-accent font-bold">Web3 (Blockchain)</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, index) => (
                  <tr key={index} className="border-b monzed-border hover:monzed-bg-secondary/30 transition-colors">
                    <td className="py-4 px-6 font-semibold monzed-text-primary">{row.feature}</td>
                    <td className="py-4 px-6 monzed-text-secondary">{row.web2}</td>
                    <td className="py-4 px-6 text-monzed-accent font-semibold">{row.web3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-8 p-6 rounded-xl monzed-bg-secondary border monzed-border max-w-4xl mx-auto">
            <h4 className="font-bold monzed-text-primary mb-2">Simple Explanation:</h4>
            <p className="monzed-text-secondary text-sm leading-relaxed">
              Think of Web2 like renting an apartment (simple, familiar, someone else manages it) and Web3 like owning your own house 
              (more control, permanent ownership, but requires understanding). Both are great options - choose based on your needs and comfort level.
            </p>
          </div>
        </div>

        {/* Deployment Process */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold monzed-text-primary mb-12 text-center">
            How Deployment Actually Works
          </h3>
          
          <div className="space-y-6 max-w-4xl mx-auto">
            {deploymentSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-start gap-6 p-6 rounded-2xl monzed-bg-secondary border monzed-border transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
                style={{ transitionDelay: `${1000 + index * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-monzed-accent to-mint-cyber flex items-center justify-center text-white font-bold flex-shrink-0">
                  {step.step}
                </div>
                
                <div className="flex-1">
                  <h4 className="text-lg font-bold monzed-text-primary mb-2">{step.title}</h4>
                  <p className="monzed-text-secondary mb-3 leading-relaxed">{step.description}</p>
                  <div className="p-3 rounded-lg bg-monzed-accent/10 border border-monzed-accent/20">
                    <span className="text-sm font-medium text-monzed-accent">What you do: </span>
                    <span className="text-sm monzed-text-secondary">{step.action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-1000 delay-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="p-8 rounded-2xl bg-gradient-to-br from-monzed-accent/5 to-mint-cyber/5 border border-monzed-accent/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold monzed-text-primary mb-4">
              Ready to Launch Your Digital Business?
            </h3>
            <p className="text-lg monzed-text-secondary mb-6 leading-relaxed">
              Whether you choose traditional hosting or cutting-edge blockchain deployment, 
              we handle all the technical complexity. You focus on your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="monzed-btn-primary group">
                <span>Start Building & Deploy</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="monzed-btn-secondary group">
                <span>See Deployment Demo</span>
                <ExternalLink className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
