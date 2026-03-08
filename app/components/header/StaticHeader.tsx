import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { useAuthGuard } from '~/hooks/useAuthGuard';
import { UserAccount } from './UserAccount';
import { useNavigate } from '@remix-run/react';
import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';

export function StaticHeader() {
  const { isAuthenticated } = useAuthGuard();
  const navigate = useNavigate();
  const theme = useStore(themeStore);

  return (
    <header
      className={classNames(
        'flex items-center justify-between px-4 border-b h-[var(--header-height)] relative bg-monzed-elements-background-depth-1 border-monzed-elements-borderColor'
      )}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2 z-logo text-monzed-elements-textPrimary">
        <a href="/" className="sm:text-2xl text-xl font-semibold text-accent flex items-center gap-2">
          <img src={theme === 'dark' ? "/logo-white.png" : "/logo-dark.png"} alt="sharelock.cc" className="h-32 w-auto" />
        </a>
      </div>

      {/* Center: Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
        <a
          href="/pricing"
          className="text-sm font-medium text-monzed-elements-textSecondary hover:text-red-500 transition-colors"
        >
          Pricing
        </a>
        <a
          href="/support"
          className="text-sm font-medium text-monzed-elements-textSecondary hover:text-red-500 transition-colors"
        >
          Support
        </a>
        <a
          href="/about"
          className="text-sm font-medium text-monzed-elements-textSecondary hover:text-red-500 transition-colors"
        >
          About
        </a>
      </nav>

      {/* Right: Social Media + Authentication */}
      <div className="flex-1 flex justify-end">
        <ClientOnly>
          {() => (
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Social Media Icons - Always visible, hidden on mobile */}
              <div className="hidden sm:flex items-center gap-3">
                <a
                  href="https://discord.gg/qqHmykZb75"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-5 h-5 text-monzed-elements-textSecondary hover:text-[#5865F2] transition-colors"
                  title="Join our Discord"
                >
                  <div className="i-ph:discord-logo w-full h-full" />
                </a>
                <a
                  href="https://www.linkedin.com/company/Starsky"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-5 h-5 text-monzed-elements-textSecondary hover:text-[#0A66C2] transition-colors"
                  title="Follow us on LinkedIn"
                >
                  <div className="i-ph:linkedin-logo w-full h-full" />
                </a>
                <a
                  href="https://www.youtube.com/@DigimetrixAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-5 h-5 text-monzed-elements-textSecondary hover:text-[#FF0000] transition-colors"
                  title="Subscribe to our YouTube"
                >
                  <div className="i-ph:youtube-logo w-full h-full" />
                </a>
                <a
                  href="https://www.instagram.com/sharelock.cc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-5 h-5 text-monzed-elements-textSecondary hover:text-[#E4405F] transition-colors"
                  title="Follow us on Instagram"
                >
                  <div className="i-ph:instagram-logo w-full h-full" />
                </a>
                <a
                  href="https://x.com/DigimetrixAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-5 h-5 text-monzed-elements-textSecondary hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
                  title="Follow us on X"
                >
                  <div className="i-ph:x-logo w-full h-full" />
                </a>
              </div>

              {/* Authentication Section */}
              {isAuthenticated ? (
                <UserAccount />
              ) : (
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm font-medium text-monzed-elements-textSecondary hover:text-red-500 transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-monzed-elements-background-depth-1"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          )}
        </ClientOnly>
      </div>
    </header>
  );
}
