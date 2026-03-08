import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@remix-run/react';
import { Menu, X as XIcon, Linkedin, Github, ExternalLink } from 'lucide-react';
import { useAuth } from '~/components/auth/AuthProvider';
import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useStore(themeStore);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/workspace');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen flex flex-col monzed-bg-primary">
      {/* Navigation - futuristic x.ai design */}
      <header 
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'monzed-bg-primary/95 backdrop-blur-md border-b monzed-border' 
            : 'monzed-bg-primary/80 backdrop-blur-sm'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center h-16">
            {/* Logo - Left */}
            <div className="flex items-center justify-start">
              <Link to="/">
                <img 
                  src={theme === 'dark' ? "/logo-white.png" : "/logo-dark.png"} 
                  alt="sharelock.cc" 
                  className="h-32 w-auto" 
                />
              </Link>
            </div>
            
            {/* Desktop Navigation - Center */}
            <div className="hidden md:flex items-center justify-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium monzed-text-secondary hover:monzed-text-primary transition-colors duration-200 relative group"
              >
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 monzed-bg-accent group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-sm font-medium monzed-text-secondary hover:monzed-text-primary transition-colors duration-200 relative group"
              >
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 monzed-bg-accent group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-sm font-medium monzed-text-secondary hover:monzed-text-primary transition-colors duration-200 relative group"
              >
                Reviews
                <span className="absolute bottom-0 left-0 w-0 h-0.5 monzed-bg-accent group-hover:w-full transition-all duration-300"></span>
              </button>
            </div>
              
            {/* Auth Buttons - Right */}
            <div className="hidden md:flex items-center justify-end space-x-3">
                {user ? (
                  <button 
                    onClick={() => navigate('/workspace')}
                    className="px-3 py-1.5 bg-gradient-to-r from-monzed-glow to-monzed-accent text-bg-primary text-xs font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    Go to Workspace
                  </button>
                ) : (
                  <>
                    <Link 
                      to="/login"
                      className="px-3 py-1.5 monzed-text-secondary hover:monzed-text-primary text-xs font-medium transition-colors duration-200"
                    >
                      Sign In
                    </Link>
                    <button 
                      onClick={handleGetStarted}
                      className="px-3 py-1.5 bg-gradient-to-r from-monzed-glow to-monzed-accent text-white text-xs font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      Get Started
                    </button>
                  </>
                )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex justify-end">
              <button 
                className="p-2 monzed-text-primary hover:monzed-bg-secondary rounded-xl transition-colors monzed-border-bright"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <XIcon size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 monzed-bg-secondary border-b monzed-border shadow-xl z-50">
              <div className="px-6 py-4 space-y-3 flex flex-col items-center w-full">
                <button 
                  onClick={() => {
                    scrollToSection('features');
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-center py-3 monzed-text-secondary hover:monzed-text-primary transition-colors font-medium"
                >
                  Features
                </button>
                <button 
                  onClick={() => {
                    scrollToSection('pricing');
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-center py-3 monzed-text-secondary hover:monzed-text-primary transition-colors font-medium"
                >
                  Pricing
                </button>
                <button 
                  onClick={() => {
                    scrollToSection('testimonials');
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-center py-3 monzed-text-secondary hover:monzed-text-primary transition-colors font-medium"
                >
                  Reviews
                </button>
                
                {/* Mobile Auth Buttons */}
                {user ? (
                  <button 
                    onClick={() => {
                      navigate('/workspace');
                      setIsMobileMenuOpen(false);
                    }}
                    className="monzed-btn-primary w-full mt-4"
                  >
                    Go to Workspace
                  </button>
                ) : (
                  <div className="flex flex-col w-full gap-2 mt-4">
                    <Link 
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="monzed-btn-secondary w-full text-center"
                    >
                      Sign In
                    </Link>
                    <button 
                      onClick={() => {
                        handleGetStarted();
                        setIsMobileMenuOpen(false);
                      }}
                      className="monzed-btn-primary w-full"
                    >
                      Get Started
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="monzed-bg-secondary border-t monzed-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <img 
                  src={theme === 'dark' ? "/logo-white.png" : "/logo-dark.png"} 
                  alt="sharelock.cc" 
                  className="h-32 w-auto" 
                />
              </div>
              <p className="monzed-text-secondary text-base leading-relaxed mb-6">
                The complete AI ecosystem that's as refreshing as monzed. Launch businesses at light speed with one unified workflow.
              </p>
              <div className="flex space-x-4">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 monzed-bg-secondary monzed-border rounded-lg flex items-center justify-center hover:bg-monzed-accent/10 hover:border-monzed-accent/30 transition-all duration-300 group">
                  <XIcon className="h-4 w-4 monzed-text-secondary group-hover:text-monzed-accent" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 monzed-bg-secondary monzed-border rounded-lg flex items-center justify-center hover:bg-monzed-accent/10 hover:border-monzed-accent/30 transition-all duration-300 group">
                  <Linkedin className="h-4 w-4 monzed-text-secondary group-hover:text-monzed-accent" />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 monzed-bg-secondary monzed-border rounded-lg flex items-center justify-center hover:bg-monzed-accent/10 hover:border-monzed-accent/30 transition-all duration-300 group">
                  <Github className="h-4 w-4 monzed-text-secondary group-hover:text-monzed-accent" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-base font-bold monzed-text-primary mb-6">Product</h3>
              <ul className="space-y-3">
                <li><a href="#pricing" className="monzed-text-secondary hover:text-monzed-accent transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="monzed-text-secondary hover:text-monzed-accent transition-colors">Reviews</a></li>
                <li><a href="#" className="monzed-text-secondary hover:text-monzed-accent transition-colors">API Docs</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-base font-bold monzed-text-primary mb-6">Company</h3>
              <ul className="space-y-3">
                <li><a href="/about" className="monzed-text-secondary hover:text-monzed-accent transition-colors">About Us</a></li>
                <li><a href="/support" className="monzed-text-secondary hover:text-monzed-accent transition-colors">Support</a></li>
                <li><a href="#" className="monzed-text-secondary hover:text-monzed-accent transition-colors">Contact</a></li>
                <li><a href="#" className="monzed-text-secondary hover:text-monzed-accent transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t monzed-border">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex flex-col space-y-1">
                <p className="monzed-text-tertiary text-sm">
                  &copy; {new Date().getFullYear()} sharelock.cc. All rights reserved.
                </p>
                <p className="monzed-text-tertiary text-xs">
                  Powered by{' '}
                  <a 
                    href="https://sharelock.cc" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-monzed-accent hover:underline inline-flex items-center"
                  >
                    Network Coin AI <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
              </div>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="monzed-text-tertiary hover:text-monzed-accent transition-colors">Privacy Policy</a>
                <a href="#" className="monzed-text-tertiary hover:text-monzed-accent transition-colors">Terms of Service</a>
                <a href="#" className="monzed-text-tertiary hover:text-monzed-accent transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
