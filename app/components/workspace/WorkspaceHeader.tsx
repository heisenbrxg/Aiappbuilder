import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from '@remix-run/react';
import { Menu, X as XIcon, User, LogOut } from 'lucide-react';
import { useAuth } from '~/components/auth/AuthProvider';
import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';

export default function WorkspaceHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const theme = useStore(themeStore);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-300 will-change-transform ${
        isScrolled 
          ? 'monzed-bg-primary border-b monzed-border' 
          : 'monzed-bg-primary border-b border-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/workspace">
              <img 
                src={theme === 'dark' ? "/logo-white.png" : "/logo-dark.png"} 
                alt="Starsky" 
                className="h-32 w-auto" 
              />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/workspace"
              className="text-sm font-medium monzed-text-secondary hover:monzed-text-primary transition-colors duration-200 relative group"
            >
              Workspace
              <span className="absolute bottom-0 left-0 w-0 h-0.5 monzed-bg-accent group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {/* User Menu */}
            <div ref={userMenuRef} className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-sm font-medium monzed-text-secondary hover:monzed-text-primary transition-colors duration-200"
              >
                <User size={16} />
                <span>{user?.email || 'User'}</span>
              </button>
              
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 monzed-bg-secondary border monzed-border rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm monzed-text-secondary hover:monzed-text-primary hover:monzed-bg-primary/50 transition-colors"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 monzed-text-primary hover:monzed-bg-secondary rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-monzed-accent"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <XIcon size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-full left-0 right-0 monzed-bg-secondary border-b monzed-border shadow-xl z-50 transition-all duration-300 ease-out ${
          isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}>
            <div className="px-6 py-4 space-y-3 flex flex-col items-center w-full">
              <Link 
                to="/workspace"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center py-3 monzed-text-secondary hover:monzed-text-primary transition-colors font-medium"
              >
                Workspace
              </Link>
              
              {/* Mobile User Menu */}
              <div className="flex flex-col w-full gap-2 mt-4 pt-4 border-t monzed-border">
                <div className="text-center py-2 monzed-text-secondary text-sm">
                  {user?.email || 'User'}
                </div>
                <button 
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center w-full py-2 monzed-text-secondary hover:monzed-text-primary transition-colors"
                >
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
      </nav>
    </header>
  );
}
