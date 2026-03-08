import { Zap, Brain, Code, Globe, Shield, Database, Rocket, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';

export default function Features() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Development',
      description: 'Just describe what you want in plain language. Build websites, mobile apps, web applications, or blockchain DApps - all without writing code yourself.',
      gradient: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Code,
      title: 'Full-Stack Applications',
      description: 'Create complete applications with frontend, backend, databases, and APIs. From simple landing pages to complex enterprise systems - all production-ready.',
      gradient: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Rocket,
      title: 'Deploy Anywhere Instantly',
      description: 'One-click deployment to Netlify, Vercel, GitHub Pages, or blockchain networks. From traditional hosting to Web3 platforms - we handle the deployment.',
      gradient: 'from-purple-400 to-pink-500'
    },
    {
      icon: Database,
      title: 'Integrated Backend Services',
      description: 'Built-in database integration with Supabase, authentication, file storage, and payment systems. Everything you need to build production apps.',
      gradient: 'from-green-400 to-emerald-500'
    },
    {
      icon: Zap,
      title: 'Real-Time Development',
      description: 'See your changes instantly with live preview. Code, test, and iterate in real-time. Debug with integrated terminal and console - all in your browser.',
      gradient: 'from-indigo-400 to-purple-500'
    },
    {
      icon: Shield,
      title: 'Enterprise-Grade Security',
      description: 'Your code and data are protected with industry-standard security. Secure authentication, encrypted connections, and isolated development environments.',
      gradient: 'from-red-400 to-pink-500'
    }
  ];

  return (
    <section id="features" className="py-32 monzed-bg-primary relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - clean and consistent */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold monzed-text-primary mb-4 sm:mb-6 monzed-font-dm-sans transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Complete Digital <span className="text-transparent bg-gradient-to-r from-monzed-accent to-mint-cyber bg-clip-text">Ecosystem</span>
          </h2>
          <p className={`text-base sm:text-lg lg:text-xl monzed-text-secondary max-w-3xl mx-auto leading-relaxed px-2 sm:px-0 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Everything you need to build, launch, and scale modern applications.
            From mobile apps to websites, full-stack platforms to Web3 DApps - all powered by AI.
          </p>
        </div>

        {/* Features Grid - Clean 3x2 Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className={`group relative p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 transition-all duration-500 hover:scale-105 hover:border-white/20 hover:shadow-2xl hover:shadow-monzed-accent/20 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${600 + index * 100}ms` }}
              >
                {/* Gradient overlay on hover - consistent with Hero */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-monzed-accent/0 to-monzed-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon with monzed theme (no colorful gradients) */}
                <div
                  className={
                    `relative inline-flex p-4 rounded-2xl border border-monzed-accent/30 bg-monzed-accent/10 text-monzed-accent mb-6 ` +
                    `transform group-hover:scale-110 transition-transform duration-300`
                  }
                >
                  <IconComponent size={28} className="text-monzed-accent" strokeWidth={1.5} />
                </div>
                
                {/* Content */}
                <div className="relative">
                  <h3 className="text-xl font-bold monzed-text-primary mb-4 monzed-font-dm-sans group-hover:text-monzed-accent transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="monzed-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl">
                  <div className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-br from-monzed-accent/20 to-transparent rotate-45" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA - consistent with overall design */}
        <div className={`text-center transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-monzed-accent/10 to-mint-cyber/10 backdrop-blur-sm border border-monzed-accent/20">
            <div className="text-left">
              <h3 className="text-lg font-semibold monzed-text-primary mb-1">Ready to experience all features?</h3>
              <p className="text-sm monzed-text-secondary">Start building with sharelock.cc today</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-monzed-accent to-mint-cyber text-black font-semibold hover:shadow-lg hover:shadow-monzed-accent/25 transform hover:scale-105 transition-all duration-300"
            >
              Start Building
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
