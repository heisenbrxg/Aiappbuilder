import { useState, useEffect } from 'react';
import { Brain, Code, Wand2, Smartphone, Globe, Database, ArrowRight, CheckCircle } from 'lucide-react';

export default function AIBuilderDeepDive() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeDemo, setActiveDemo] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const capabilities = [
    {
      icon: Globe,
      title: 'Websites & Web Apps',
      description: 'From simple landing pages to complex web applications',
      examples: ['Online stores', 'Portfolio websites', 'Booking systems', 'Community platforms']
    },
    {
      icon: Smartphone,
      title: 'Mobile Applications',
      description: 'Cross-platform mobile apps that work on iOS and Android',
      examples: ['Restaurant apps', 'Fitness trackers', 'Learning platforms', 'Social networks']
    },
    {
      icon: Code,
      title: 'Web3 & Blockchain DApps',
      description: 'Decentralized applications with wallet integration',
      examples: ['NFT marketplaces', 'DeFi platforms', 'Token systems', 'Smart contracts']
    },
    {
      icon: Database,
      title: 'Full-Stack Platforms',
      description: 'Complete systems with frontend, backend, and databases',
      examples: ['SaaS platforms', 'Admin dashboards', 'API services', 'Real-time apps']
    }
  ];

  const conversationDemo = [
    {
      user: "I want to create an online store for my handmade jewelry",
      ai: "Perfect! I'll create a beautiful e-commerce website for your jewelry business. What style do you prefer - modern minimalist, vintage boutique, or elegant luxury?",
      result: "AI understands your business type and asks relevant questions"
    },
    {
      user: "Modern minimalist with a clean white background",
      ai: "Excellent choice! I'm building your store with: clean product galleries, secure payment processing, inventory management, and mobile-responsive design. What payment methods would you like to accept?",
      result: "AI builds core functionality while asking for business preferences"
    },
    {
      user: "Credit cards and our AI Currency",
      ai: "Done! Your jewelry store is ready with integrated AI Currency payments. I've also added features like customer reviews, social media integration, and automated order tracking. Ready to preview?",
      result: "Complete, functional online store ready in minutes"
    }
  ];

  const businessTypes = [
    { name: 'Restaurants', example: 'Menu websites, ordering systems, delivery tracking' },
    { name: 'Healthcare', example: 'Appointment booking, patient portals, telemedicine platforms' },
    { name: 'Education', example: 'Online courses, student management, virtual classrooms' },
    { name: 'Retail', example: 'E-commerce stores, inventory systems, customer loyalty programs' },
    { name: 'Real Estate', example: 'Property listings, virtual tours, client management' },
    { name: 'Professional Services', example: 'Booking systems, client portals, project management' },
    { name: 'Creative Arts', example: 'Portfolio sites, client galleries, commission systems' },
    { name: 'Non-Profit', example: 'Donation platforms, volunteer management, event organization' }
  ];

  return (
    <section id="ai-builder-deep-dive" className="py-32 monzed-bg-primary relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold monzed-text-primary mb-6 monzed-font-dm-sans transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Your <span className="text-transparent bg-gradient-to-r from-monzed-accent to-mint-cyber bg-clip-text">Intelligent</span> Business Partner
          </h2>
          
          <p className={`text-base sm:text-lg lg:text-xl monzed-text-secondary max-w-4xl mx-auto leading-relaxed px-2 sm:px-0 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Imagine having a super-smart business partner who never sleeps, understands exactly what you need, and can build anything digital in minutes instead of months.
          </p>
        </div>

        {/* Conversation Demo */}
        <div className={`mb-20 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-2xl font-bold monzed-text-primary mb-8 text-center">
            See How Simple It Is
          </h3>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {conversationDemo.map((step, index) => (
              <div
                key={index}
                className={`transition-all duration-500 ${activeDemo >= index ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}
              >
                {/* User Message */}
                <div className="flex justify-end mb-4">
                  <div className="max-w-2xl bg-monzed-accent/10 border border-monzed-accent/20 rounded-2xl rounded-tr-sm p-4">
                    <p className="monzed-text-primary font-medium">{step.user}</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start mb-4">
                  <div className="max-w-2xl monzed-bg-secondary border monzed-border rounded-2xl rounded-tl-sm p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-monzed-accent to-mint-cyber flex items-center justify-center flex-shrink-0">
                        <Wand2 className="w-4 h-4 text-black" />
                      </div>
                      <p className="monzed-text-primary">{step.ai}</p>
                    </div>
                  </div>
                </div>

                {/* Result Explanation */}
                <div className="flex justify-center mb-8">
                  <div className="px-4 py-2 bg-mint-cyber/10 border border-mint-cyber/20 rounded-full">
                    <p className="text-sm monzed-text-secondary italic">{step.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Demo Controls */}
          <div className="flex justify-center mt-8 gap-4">
            {conversationDemo.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveDemo(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeDemo >= index ? 'bg-monzed-accent' : 'bg-monzed-accent/30'
                }`}
              />
            ))}
            <button
              onClick={() => setActiveDemo((prev) => (prev + 1) % (conversationDemo.length + 1))}
              className="ml-4 px-4 py-2 text-sm font-medium text-monzed-accent border border-monzed-accent/30 rounded-full hover:border-monzed-accent transition-colors"
            >
              Next Step
            </button>
          </div>
        </div>

        {/* What You Can Build */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold monzed-text-primary mb-12 text-center">
            What Can You Build?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((capability, index) => {
              const IconComponent = capability.icon;
              return (
                <div
                  key={index}
                  className={`p-6 rounded-2xl monzed-bg-secondary border monzed-border hover:border-monzed-accent/30 transition-all duration-500 hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${800 + index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-monzed-accent/20 to-mint-cyber/20 border border-monzed-accent/30 flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-monzed-accent" />
                  </div>
                  
                  <h4 className="text-lg font-bold monzed-text-primary mb-2">{capability.title}</h4>
                  <p className="monzed-text-secondary text-sm mb-4 leading-relaxed">{capability.description}</p>
                  
                  <ul className="space-y-1">
                    {capability.examples.map((example, exampleIndex) => (
                      <li key={exampleIndex} className="flex items-center gap-2 text-xs monzed-text-secondary">
                        <CheckCircle className="w-3 h-3 text-monzed-accent flex-shrink-0" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Industry Examples */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold monzed-text-primary mb-12 text-center">
            Built for Every Industry
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {businessTypes.map((business, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl monzed-bg-secondary/50 border monzed-border hover:border-monzed-accent/30 transition-all duration-300 hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${1000 + index * 50}ms` }}
              >
                <h4 className="font-bold monzed-text-primary mb-2">{business.name}</h4>
                <p className="text-xs monzed-text-secondary leading-relaxed">{business.example}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-1000 delay-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="p-8 rounded-2xl bg-gradient-to-br from-monzed-accent/5 to-mint-cyber/5 border border-monzed-accent/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold monzed-text-primary mb-4">
              Ready to Build Your Digital Business?
            </h3>
            <p className="text-lg monzed-text-secondary mb-6 leading-relaxed">
              Join thousands of entrepreneurs who've already built successful businesses with our AI. 
              No technical skills required - just your vision and our AI intelligence.
            </p>
            <button className="monzed-btn-primary group">
              <span>Start Building Now</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
