import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { ChevronRight, ExternalLink, Brain, Rocket } from 'lucide-react';

export default function EcosystemExplainer() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'smart-money-deep-dive') {
      navigate('/currency');
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const ecosystemSteps = [
    {
      icon: Brain,
      title: 'Tell Starsky Your Idea',
      subtitle: 'Describe Your Business in Plain English',
      description: 'Just tell Starsky what you want to build – like "I want to sell handmade jewelry" or "I need a consulting business with online courses".',
      details: [
        'Describe your business idea in simple, everyday language',
        'No technical knowledge or business jargon required',
        'Starsky understands context and fills in the gaps automatically'
      ],
      example: '"I want to sell handmade jewelry online with custom orders" → Starsky understands you need e-commerce, custom forms, payment processing, and inventory management',
      sectionId: 'ai-builder-deep-dive',
      learnMoreText: 'See example business ideas'
    },
    {
      icon: Rocket,
      title: 'Starsky Builds Everything',
      subtitle: 'Complete Business in Minutes',
      description: 'Starsky automatically creates your complete online business – website, payments, marketing, analytics, and everything you need.',
      details: [
        'Professional website with your branding and content',
        'Payment processing and checkout system',
        'Marketing tools and analytics dashboard',
        'Everything integrated and ready to make money'
      ],
      example: 'Complete business package: Website + Payments + Marketing + Analytics + Customer Management - all working together seamlessly',
      sectionId: 'smart-money-deep-dive',
      learnMoreText: 'See what Starsky builds'
    }
  ];

  return (
    <section id="how-it-works" className="pt-16 pb-32 monzed-bg-secondary relative overflow-hidden rounded-2xl" style={{ margin: '23px' }}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold monzed-text-primary mb-6 monzed-font-dm-sans transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            How it works
          </h2>
          
          <p className={`text-base sm:text-lg lg:text-xl monzed-text-secondary max-w-3xl mx-auto leading-relaxed px-2 sm:px-0 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            See how Starsky transforms the way businesses are built. From idea to income in minutes, not months.
          </p>
        </div>

        {/* Interactive Ecosystem Steps */}
        <div className="space-y-12">
          {ecosystemSteps.map((step, index) => {
            const IconComponent = step.icon;
            const isActive = activeStep === index;
            
            return (
              <div
                key={index}
                className={`group cursor-pointer transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${600 + index * 200}ms` }}
                onClick={() => setActiveStep(isActive ? -1 : index)}
              >
                <div className={`relative p-8 md:p-12 rounded-3xl border transition-all duration-500 ${
                  isActive 
                    ? 'monzed-bg-primary border-monzed-accent shadow-2xl shadow-monzed-accent/20 scale-[1.02]' 
                    : 'monzed-bg-primary/30 border-white/10 hover:border-monzed-accent/30 hover:scale-[1.01]'
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                    {/* Icon and Title */}
                    <div className="flex items-center gap-6 lg:min-w-[400px]">
                      <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                        isActive 
                          ? 'border-monzed-accent bg-monzed-accent/10' 
                          : 'border-monzed-accent/30 bg-monzed-accent/5'
                      }`}>
                        <IconComponent 
                          size={32} 
                          strokeWidth={1.5} 
                          style={{ color: '#FC7C11' }}
                        />
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-bold monzed-text-primary mb-1 monzed-font-dm-sans">
                          {step.title}
                        </h3>
                        <p className="text-monzed-accent font-semibold">
                          {step.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="flex-1">
                      <p className="text-lg monzed-text-secondary mb-4 leading-relaxed">
                        {step.description}
                      </p>
                      
                      {/* Expand indicator with clickable link */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-monzed-accent cursor-pointer" onClick={() => setActiveStep(isActive ? -1 : index)}>
                          <span className="text-sm font-medium">
                            {isActive ? (
                              <>Hide details <span style={{ color: '#FC7C11' }}>⬇</span></>
                            ) : (
                              <>Quick overview <span style={{ color: '#FC7C11' }}>➝</span></>
                            )}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => scrollToSection(step.sectionId)}
                          className="flex items-center gap-2 text-monzed-accent hover:text-monzed-bright transition-colors text-sm font-medium border border-monzed-accent/30 hover:border-monzed-accent px-3 py-1 rounded-full"
                        >
                          <span>{step.learnMoreText} <span style={{ color: '#FC7C11' }}>➝</span></span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <div className={`overflow-hidden transition-all duration-500 ${
                    isActive ? 'max-h-96 mt-8' : 'max-h-0'
                  }`}>
                    <div className="border-t border-white/10 pt-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        {/* Details List */}
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold monzed-text-primary mb-3 sm:mb-4">How it works:</h4>
                          <ul className="space-y-2 sm:space-y-3">
                            {step.details.map((detail, detailIndex) => (
                              <li key={detailIndex} className="flex items-start gap-2 sm:gap-3">
                                <div className="w-2 h-2 rounded-full bg-monzed-accent flex-shrink-0 mt-1.5 sm:mt-2"></div>
                                <span className="monzed-text-secondary text-xs sm:text-sm leading-relaxed">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Example */}
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold monzed-text-primary mb-3 sm:mb-4">Real example:</h4>
                          <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-monzed-accent/10 to-mint-cyber/10 border border-monzed-accent/20">
                            <p className="monzed-text-secondary text-xs sm:text-sm leading-relaxed italic break-words">
                              {step.example}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


        {/* Summary */}
        <div className={`mt-20 text-center transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="p-8 rounded-2xl bg-gradient-to-br from-monzed-accent/5 to-mint-cyber/5 border border-monzed-accent/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold monzed-text-primary mb-4">
              Ready to Build Your Business?
            </h3>
            <p className="text-lg monzed-text-secondary leading-relaxed">
              With Starsky, you can turn any business idea into a profitable online business in minutes. 
              No coding, no complexity - just tell Starsky what you want to build and watch it come to life.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
