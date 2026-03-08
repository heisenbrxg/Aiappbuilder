import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '~/components/auth/AuthProvider';
import { useNavigate } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';

export default function CallToAction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useStore(themeStore);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const handleGetStarted = () => {
    navigate('/workspace');
  };

  return (
    <section id="cta" className="py-24 monzed-bg-primary relative overflow-hidden" ref={sectionRef}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-left">
            {/* Main Heading with stagger animation */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold monzed-text-primary mb-6 leading-[0.9] tracking-tight monzed-font-dm-sans">
              <span className={`block transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>Turn Your Ideas Into</span>
              <span className={`block text-transparent bg-gradient-to-r from-monzed-accent to-mint-cyber bg-clip-text transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                Income in Minutes
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl monzed-text-secondary mb-8 sm:mb-12 leading-relaxed max-w-2xl">
              Starsky is your super-smart business partner that builds complete online businesses in minutes, not months. From websites to payments to marketing – everything you need to turn ideas into income. Join thousands building their dreams today.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <button 
                onClick={handleGetStarted}
                className="monzed-btn-primary group text-lg px-8 py-4"
              >
                <span>Start Building</span>
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => navigate('/pricing')}
                className="monzed-btn-secondary text-lg px-8 py-4"
              >
                View Pricing
              </button>
            </div>
          </div>

          {/* Right Column - 3D Coins Image */}
          <div className="relative lg:ml-8">
            <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <img 
                src="/images/badge.png" 
                alt="Starsky Logo" 
                className="w-full max-w-sm mx-auto h-auto object-contain select-none rounded-2xl"
                draggable="false"
              />
              
              {/* Static floating elements around the image */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-monzed-accent/20 rounded-full blur-md"></div>
              <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-mint-cyber/20 rounded-full blur-lg"></div>
              <div className="absolute top-1/3 -right-8 w-6 h-6 bg-monzed-glow/30 rounded-full blur-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
