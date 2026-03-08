import { ExternalLink, Github, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const theme = useStore(themeStore);

  return (
    <footer className="monzed-bg-secondary border-t monzed-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center mb-4 sm:mb-6">
              <img 
                src={theme === 'dark' ? "/logo-white.png" : "/logo-dark.png"} 
                alt="Starsky" 
                className="h-8 sm:h-10 lg:h-12 w-auto" 
              />
            </div>
            <p className="monzed-text-secondary text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
              Starsky: Your super-smart business partner that builds complete online businesses in minutes. Turn your ideas into income with AI-powered business creation.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <a href="https://twitter.com/Starsky_ai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-monzed-accent/10 border border-monzed-accent/20 rounded-xl flex items-center justify-center hover:bg-monzed-accent/20 hover:border-monzed-accent/40 hover:scale-105 transition-all duration-300 group">
                <Twitter className="h-5 w-5 text-monzed-accent group-hover:text-white" />
              </a>
              <a href="https://discord.gg/Starsky-ai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-monzed-accent/10 border border-monzed-accent/20 rounded-xl flex items-center justify-center hover:bg-monzed-accent/20 hover:border-monzed-accent/40 hover:scale-105 transition-all duration-300 group">
                <MessageCircle className="h-5 w-5 text-monzed-accent group-hover:text-white" />
              </a>
              <a href="https://linkedin.com/company/Starsky-ai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-monzed-accent/10 border border-monzed-accent/20 rounded-xl flex items-center justify-center hover:bg-monzed-accent/20 hover:border-monzed-accent/40 hover:scale-105 transition-all duration-300 group">
                <Linkedin className="h-5 w-5 text-monzed-accent group-hover:text-white" />
              </a>
              <a href="https://github.com/Starsky-ai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-monzed-accent/10 border border-monzed-accent/20 rounded-xl flex items-center justify-center hover:bg-monzed-accent/20 hover:border-monzed-accent/40 hover:scale-105 transition-all duration-300 group">
                <Github className="h-5 w-5 text-monzed-accent group-hover:text-white" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm sm:text-base font-bold monzed-text-primary mb-3 sm:mb-4 lg:mb-6">Product</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li><a href="/pricing" className="text-sm monzed-text-secondary hover:text-monzed-accent transition-colors">Pricing</a></li>
              <li><a href="/#testimonials" className="text-sm monzed-text-secondary hover:text-monzed-accent transition-colors">Reviews</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm sm:text-base font-bold monzed-text-primary mb-3 sm:mb-4 lg:mb-6">Company</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li><a href="/about" className="text-sm monzed-text-secondary hover:text-monzed-accent transition-colors">About</a></li>
              <li><a href="/support" className="text-sm monzed-text-secondary hover:text-monzed-accent transition-colors">Support</a></li>
            </ul>
          </div>
        </div>
        
        
        <div className="mt-8 sm:mt-12 lg:mt-16 pt-6 sm:pt-8 border-t monzed-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <div className="flex flex-col space-y-1 text-center md:text-left">
              <p className="monzed-text-tertiary text-xs sm:text-sm">
                &copy; {currentYear} Starsky. All rights reserved.
              </p>
              <p className="monzed-text-tertiary text-[10px] sm:text-xs">
                Powered by Starsky
              </p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm">
              <a href="/privacy" className="monzed-text-tertiary hover:text-monzed-accent transition-colors whitespace-nowrap">Privacy Policy</a>
              <a href="/terms" className="monzed-text-tertiary hover:text-monzed-accent transition-colors whitespace-nowrap">Terms of Service</a>
              <a href="/cookie-policy" className="monzed-text-tertiary hover:text-monzed-accent transition-colors whitespace-nowrap">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
