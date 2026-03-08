import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { isInChatSelector, showWorkbenchSelector } from '~/lib/stores/uiState';
import { themeStore } from '~/lib/stores/theme';
import { classNames } from '~/utils/classNames';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { useAuthGuard } from '~/hooks/useAuthGuard';
import { UserAccount } from './UserAccount';
import { useAuth } from '~/components/auth/AuthProvider';
import { useEffect, useState, useMemo } from 'react';
import { Menu, X as XIcon } from 'lucide-react';
import { useLocation, useNavigate } from '@remix-run/react';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { Slider, type SliderOptions } from '~/components/ui/Slider';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { DeployButton } from '~/components/deploy/DeployButton';
import { streamingState } from '~/lib/stores/streaming';

interface NavigationLink {
  href: string;
  label: string;
  external?: boolean;
  requiresAuth?: boolean;
}

interface UnifiedHeaderProps {
  variant?: 'landing' | 'workspace' | 'chat';
  showNavigation?: boolean;
  showChatActions?: boolean;
}

// Slider options for workbench view switcher
const sliderOptions: SliderOptions<WorkbenchViewType> = {
  left: {
    value: 'code',
    text: <div className="i-ph:code text-lg" title="Code" />,
  },
  middle: {
    value: 'diff',
    text: <div className="i-ph:git-diff text-lg" title="Diff" />,
  },
  right: {
    value: 'preview',
    text: <div className="i-ph:eye text-lg" title="Preview" />,
  },
};

export function UnifiedHeader({ 
  variant = 'landing', 
  showNavigation = true,
  showChatActions = false 
}: UnifiedHeaderProps) {
  const isInChat = useStore(isInChatSelector);
  const showWorkbench = useStore(showWorkbenchSelector);
  const theme = useStore(themeStore);
  const { isAuthenticated } = useAuthGuard();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWrenchMenuOpen, setIsWrenchMenuOpen] = useState(false);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  
  // Get theme immediately from DOM to avoid hydration delay
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });
  
  // Sync with theme store changes AND listen to DOM changes
  useEffect(() => {
    setCurrentTheme(theme);
    
    // Also listen for direct DOM attribute changes (for instant updates)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
          if (newTheme) {
            setCurrentTheme(newTheme);
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    return () => observer.disconnect();
  }, [theme]);
  
  // Workbench view state
  const selectedView = useStore(workbenchStore.currentView);
  const setSelectedView = (view: WorkbenchViewType) => {
    workbenchStore.currentView.set(view);
  };
  
  // Chat and streaming state
  const isStreaming = useStore(streamingState);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[0];
  const shouldShowDeployButton = !isStreaming && activePreview;
  const shouldShowDownloadButton = !isStreaming && variant === 'workspace';

  // Memoize workspace detection to avoid recalculation on every render
  const isWorkspace = useMemo(() => location.pathname === '/workspace', [location.pathname]);

  // Memoize shouldShowChatActions to avoid re-renders
  const shouldShowChatActions = useMemo(() => showChatActions && isInChat, [showChatActions, isInChat]);

  // Determine what to show in the header based on context
  const shouldShowNavigation = useMemo(() => {
    if (!showNavigation) return false;
    // Hide links only when the Workbench is active
    return !showWorkbench;
  }, [showNavigation, showWorkbench]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle browser back button with smooth workbench close animation
  useEffect(() => {
    const handlePopState = () => {
      if (showWorkbench) {
        workbenchStore.showWorkbench.set(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showWorkbench]);

  // Memoize navigation links to avoid recreating array on every render
  const navigationLinks: NavigationLink[] = useMemo(() => {
    // All users see the same navigation - no authentication required for viewing
    return [
      { href: '/about', label: 'About' },
      { href: '/pricing', label: 'Pricing' },
      { href: 'https://discord.gg/Starsky-ai', label: 'Community', external: true },
      { href: '/support', label: 'Support' },
    ];
  }, []);


  return (
    <>
    <header
className={`fixed w-full z-50 will-change-transform border-b monzed-bg-secondary backdrop-blur-md monzed-border transition-all duration-300 ${
        isInChat || scrolled
          ? 'border-b-monzed-accent'
          : 'border-transparent'
      }`}
      style={{
        transform: scrolled ? 'translateZ(0)' : 'translateZ(0)',
        transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 300ms cubic-bezier(0.4, 0, 0.2, 1), border 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <nav className="w-full px-3 lg:px-4">
        <div className={`flex justify-between ${shouldShowNavigation ? 'md:grid md:grid-cols-3' : ''} items-center h-12 w-full`}>
          {/* Left Side: Logo + Title */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <a 
              href="/" 
              className="flex items-center flex-shrink-0"
              onClick={(e) => {
                // If workbench is open, animate it closed before navigation
                if (showWorkbench) {
                  e.preventDefault();
                  workbenchStore.showWorkbench.set(false);
                  // Wait for animation to complete before navigating
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 200);
                }
              }}
            >
              <img 
                src={currentTheme === 'dark' ? "/logo-white.png" : "/logo-dark.png"} 
                alt="Starsky" 
                className="h-[2.5rem] w-auto" 
              />
            </a>
            
            {/* Vertical Separator + Lock Icon + Project Description (only in workbench) */}
            {showWorkbench && (isWorkspace || variant === 'chat') && (
              <>
                <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="hidden lg:flex items-center gap-2 min-w-0" style={{ width: '17.3rem' }}>
                  <div className="i-ph:lock text-sm monzed-text-secondary flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <ClientOnly fallback={
                      <span className="block overflow-hidden whitespace-nowrap monzed-text-secondary font-medium text-sm italic">
                        Untitled Project
                      </span>
                    }>
                      {() => {
                        const DescriptionComponent = <ChatDescription />;
                        return DescriptionComponent || (
                          <span className="block overflow-hidden whitespace-nowrap monzed-text-secondary font-medium text-sm italic">
                            Untitled Project
                          </span>
                        );
                      }}
                    </ClientOnly>
                  </div>
                </div>
                
                {/* Flexible spacer to push separator to the right */}
                <div className="hidden lg:block flex-1 min-w-[83px]"></div>
                
                {/* Vertical Separator before slider */}
                <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                
                {/* Workbench View Slider - visible on all screens */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Slider selected={selectedView} options={sliderOptions} setSelected={setSelectedView} />
                  
                  {/* Unified Wrench Dropdown Menu - visible on all screens */}
                  <DropdownMenu.Root open={isWrenchMenuOpen} onOpenChange={setIsWrenchMenuOpen}>
                    <DropdownMenu.Trigger asChild>
                      <button 
                        className="p-1.5 rounded-md monzed-text-secondary hover:monzed-text-primary hover:bg-monzed-elements-item-backgroundActive transition-colors"
                        title="Settings"
                      >
                        <div className="i-ph:wrench text-lg" />
                      </button>
                    </DropdownMenu.Trigger>
                    
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="min-w-[220px] bg-monzed-elements-background-depth-1 rounded-lg shadow-lg border border-monzed-elements-borderColor p-1 z-[100]"
                        sideOffset={5}
                        align="end"
                      >
                        {/* Deploy Button - Mobile only, when preview available */}
                        {shouldShowDeployButton && (
                          <div className="md:hidden">
                            <DropdownMenu.Item asChild>
                              <div className="px-3 py-1.5">
                                <DeployButton />
                              </div>
                            </DropdownMenu.Item>
                          </div>
                        )}

                        {/* Download Code */}
                        {shouldShowDownloadButton && (
                          <DropdownMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-sm monzed-text-primary hover:bg-monzed-elements-item-backgroundActive rounded-md cursor-pointer outline-none"
                            onSelect={() => {
                              workbenchStore.downloadZip();
                              setIsWrenchMenuOpen(false);
                            }}
                          >
                            <div className="i-ph:code text-base" />
                            <span>Download Code</span>
                          </DropdownMenu.Item>
                        )}
                        
                        {shouldShowDownloadButton && <DropdownMenu.Separator className="h-px bg-monzed-elements-borderColor my-1" />}
                        
                        {/* MCP Servers */}
                        <DropdownMenu.Item
                          className="flex items-center gap-2 px-3 py-2 text-sm monzed-text-primary hover:bg-monzed-elements-item-backgroundActive rounded-md cursor-pointer outline-none"
                          onSelect={() => {
                            setSelectedView('mcp');
                            setIsWrenchMenuOpen(false);
                          }}
                        >
                          <div className="i-ph:hard-drives-bold text-base" />
                          <span>MCP Servers</span>
                        </DropdownMenu.Item>
                        
                        {/* Separator */}
                        <DropdownMenu.Separator className="h-px bg-monzed-elements-borderColor my-1" />
                        
                        {/* Supabase Connection */}
                        <DropdownMenu.Item
                          className="flex items-center gap-2 px-3 py-2 text-sm monzed-text-primary hover:bg-monzed-elements-item-backgroundActive rounded-md cursor-pointer outline-none"
                          onSelect={() => {
                            document.dispatchEvent(new CustomEvent('open-supabase-connection'));
                            setIsWrenchMenuOpen(false);
                          }}
                        >
                          <img
                            className="w-4 h-4"
                            crossOrigin="anonymous"
                            src="https://cdn.simpleicons.org/supabase"
                            alt="Supabase"
                          />
                          <span>Connect Supabase</span>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </>
            )}
          </div>

          {/* Center: Navigation Links (only on landing page) */}
          {shouldShowNavigation && (
            <div className="hidden md:flex items-center justify-center">
              <div className="flex items-center space-x-6">
                {navigationLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-sm font-medium monzed-text-secondary hover:monzed-text-primary transition-colors duration-200 relative group"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 monzed-bg-accent group-hover:w-full transition-transform duration-300 will-change-transform" style={{ transformOrigin: 'left center' }}></span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Right Side Actions */}
          <div className={`flex items-center space-x-2 sm:space-x-4 ${shouldShowNavigation ? 'md:justify-end' : ''} shrink-0`}>

            {/* Theme Switch - Desktop only (mobile has it in hamburger menu) */}
            <div className="hidden md:block">
              <ClientOnly>
                {() => <ThemeSwitch className="monzed-text-secondary hover:monzed-text-primary" />}
              </ClientOnly>
            </div>

            {/* Toggle Chat/Preview Button - mobile only, in chat view */}
            {isInChat && variant !== 'landing' && (
              <button
                onClick={() => {
                  const currentShowWorkbench = workbenchStore.showWorkbench.get();
                  workbenchStore.showWorkbench.set(!currentShowWorkbench);
                }}
                className="md:hidden p-1.5 rounded-md monzed-text-secondary hover:monzed-text-primary hover:bg-monzed-elements-item-backgroundActive transition-colors"
                title={showWorkbench ? "Show Chat" : "Show Preview"}
              >
                <div className={showWorkbench ? "i-ph:chats-circle text-xl" : "i-ph:eye text-xl"} />
              </button>
            )}

            {/* User Account (desktop only) */}
            {isAuthenticated && (
              <div className="hidden md:block">
                <UserAccount />
              </div>
            )}

            
            {/* Deploy Button (when preview is available) - hide on mobile, shown in overflow menu */}
            {shouldShowDeployButton && (
              <div className="hidden md:block">
                <DeployButton />
              </div>
            )}
            
            {/* User Account or Auth Buttons */}
            {!isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-3">
                <a
                  href="/login"
                  className="px-2.5 py-1 monzed-text-secondary hover:monzed-text-primary text-xs font-medium transition-colors duration-200"
                >
                  Sign In
                </a>
                <a
                  href="/signup"
                  className="px-2.5 py-1 bg-gradient-to-r from-monzed-glow to-monzed-accent text-white text-xs font-semibold rounded-lg hover:shadow-lg will-change-transform"
                  style={{
                    transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05) translateZ(0)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateZ(0)';
                  }}
                >
                  Get Started
                </a>
              </div>
            ) : null}

            {/* Mobile Menu Button - Always visible on mobile */}
            <button
              className="md:hidden p-1.5 monzed-text-primary hover:monzed-bg-secondary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-monzed-accent"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <XIcon size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden absolute top-full left-0 right-0 monzed-bg-secondary border-b monzed-border shadow-xl z-50 transition-all duration-300 ease-out ${
            isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <div className="px-4 py-4 space-y-2">
            {/* Mobile Navigation Links */}
            {shouldShowNavigation && navigationLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block w-full text-left py-3 px-4 monzed-text-secondary hover:monzed-text-primary transition-all duration-200 font-medium hover:bg-monzed-accent/10 rounded-lg ${
                  isMobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
                style={{
                  transitionDelay: isMobileMenuOpen ? `${index * 50}ms` : '0ms'
                }}
              >
                {link.label}
              </a>
            ))}

            {/* User Account Section (if authenticated) */}
            {isAuthenticated && (
              <div className="pt-2 border-t monzed-border">
                <UserAccount />
              </div>
            )}

            {/* Mobile Theme Switch */}
            <div className="flex justify-start py-2">
              <ClientOnly>
                {() => <ThemeSwitch className="monzed-text-secondary hover:monzed-text-primary" />}
              </ClientOnly>
            </div>

            {/* Mobile Auth Buttons (if not authenticated) */}
            {!isAuthenticated && (
              <div className="flex flex-col w-full gap-2 pt-2 border-t monzed-border">
                <a
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 monzed-text-secondary hover:monzed-text-primary border monzed-border rounded-lg transition-colors font-medium"
                >
                  Sign In
                </a>
                <a
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 bg-gradient-to-r from-monzed-accent to-mint-cyber text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Get Started
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
    </>
  );
}
