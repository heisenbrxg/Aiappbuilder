import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useLocation } from '@remix-run/react';
import { classNames } from '~/utils/classNames';
import { profileStore } from '~/lib/stores/profile';
import { useAuth } from '~/components/auth/AuthProvider';
import { ControlPanel } from '~/components/@settings/core/ControlPanel';
import { useUsageGuard } from '~/lib/hooks/useUsageGuard';
import type { Profile } from '~/components/@settings/core/types';

export function UserAccount() {
  const { user, signOut } = useAuth();
  const profile = useStore(profileStore) as Profile;
  const location = useLocation();
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);
  // Controls Radix dropdown state to hide it when modal opens
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/' || location.pathname === '/currency';

  // Get usage information for display in dropdown
  const {
    usage,
    subscription,
    isLoading: usageLoading,
    hasExceededLimit,
    isApproachingLimit,
    formatUsage,
  } = useUsageGuard();

  // Add event listener for opening Control Panel from anywhere in the app
  useEffect(() => {
    const handleOpenControlPanel = (event: CustomEvent) => {
      const { initialTab: tab } = event.detail || {};
      setInitialTab(tab);
      setShowControlPanel(true);
    };

    window.addEventListener('openControlPanel', handleOpenControlPanel as EventListener);
    
    return () => {
      window.removeEventListener('openControlPanel', handleOpenControlPanel as EventListener);
    };
  }, []);

  if (!user) return null;

  // Get user initials for avatar fallback
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const displayName = profile?.username || user.email?.split('@')[0] || 'User';
  const initials = getInitials(profile?.username, user.email);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenu.Trigger asChild>
          <motion.button
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-monzed-elements-background-depth-2 transition-colors focus:outline-none"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={`${displayName} (${user.email})`}
          >
            {/* Avatar Only */}
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-r from-monzed-glow to-monzed-accent flex items-center justify-center">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="sync"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {initials}
                </span>
              )}
            </div>
          </motion.button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={classNames(
              'min-w-[200px] z-[250]',
              'bg-white dark:bg-[#141414]',
              'border border-gray-200 dark:border-gray-700',
              'rounded-lg shadow-lg',
              'p-2'
            )}
            sideOffset={5}
            align="end"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-r from-monzed-glow to-monzed-accent flex items-center justify-center">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="sync"
                    />
                  ) : (
                    <span className="text-white font-semibold">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-monzed-elements-textPrimary truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-monzed-elements-textSecondary truncate">
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Usage Counter - Only show in workspace */}
              {!isLandingPage && !usageLoading && usage && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setInitialTab('billing');
                    setShowControlPanel(true);
                  }}
                  className="mt-3 pt-3 border-t border-gray-200/30 dark:border-gray-800/30 w-full text-left hover:bg-monzed-elements-background-depth-2 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="i-ph:chat-circle w-4 h-4 text-monzed-elements-textSecondary" />
                      <div className="flex flex-col">
                        <span className="text-xs text-monzed-elements-textSecondary">Messages this month</span>
                        {subscription && (
                          <span className="text-[10px] text-monzed-elements-textSecondary/70 capitalize">
                            {subscription.plan_id} plan
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={classNames(
                        'text-xs font-medium',
                        hasExceededLimit ? 'text-red-500' :
                        isApproachingLimit ? 'text-orange-500' :
                        'text-monzed-elements-textPrimary'
                      )}>
                        {formatUsage()?.current || 0} / {formatUsage()?.limit || 0}
                      </span>
                      {(hasExceededLimit || isApproachingLimit) && (
                        <div className={classNames(
                          'w-2 h-2 rounded-full',
                          hasExceededLimit ? 'bg-red-500' : 'bg-orange-500'
                        )} />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                    <div
                      className={classNames(
                        'h-1.5 rounded-full transition-all duration-300',
                        hasExceededLimit ? 'bg-red-500' :
                        isApproachingLimit ? 'bg-orange-500' :
                        'bg-green-500'
                      )}
                      style={{
                        width: `${Math.min(100, usage.usage_percentage)}%`
                      }}
                    />
                  </div>

                  {/* Status Text */}
                  {(hasExceededLimit || isApproachingLimit) && (
                    <div className="mt-1 text-xs text-center">
                      <span className={classNames(
                        'font-medium',
                        hasExceededLimit ? 'text-red-500' : 'text-orange-500'
                      )}>
                        {hasExceededLimit ? 'Limit exceeded' : 'Approaching limit'}
                      </span>
                    </div>
                  )}
                </button>
              )}
            </div>

            {/* Menu Items */}
            {isLandingPage ? (
              // Landing page: Only show sign out
              <>
                <DropdownMenu.Item
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer focus:outline-none"
                  style={{ color: '#dc2626' }}
                  onClick={() => {
                    setMenuOpen(false);
                    handleSignOut();
                  }}
                >
                  <div className="i-ph:sign-out w-4 h-4" style={{ color: '#dc2626' }} />
                  Sign Out
                </DropdownMenu.Item>
              </>
            ) : (
              // Workspace: Show all features
              <>
                <DropdownMenu.Item
                  className="flex items-center gap-3 px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-background-depth-2 cursor-pointer focus:outline-none"
                  onClick={() => {
                    setMenuOpen(false);
                    setInitialTab('billing');
                    setShowControlPanel(true);
                  }}
                >
                  <div className="i-ph:credit-card w-4 h-4" />
                  Billing & Usage
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  className="flex items-center gap-3 px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-background-depth-2 cursor-pointer focus:outline-none"
                  onClick={() => {
                    setMenuOpen(false);
                    setInitialTab('features');
                    setShowControlPanel(true);
                  }}
                >
                  <div className="i-ph:gear-six w-4 h-4" />
                  Settings
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  className="flex items-center gap-3 px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-background-depth-2 cursor-pointer focus:outline-none"
                  onClick={() => {
                    setMenuOpen(false);
                    setInitialTab('connection');
                    setShowControlPanel(true);
                  }}
                >
                  <div className="i-ph:plugs-connected w-4 h-4" />
                  Connection
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-gray-200/50 dark:bg-gray-800/50 my-1" />

                <DropdownMenu.Item
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer focus:outline-none"
                  style={{ color: '#dc2626' }}
                  onClick={() => {
                    setMenuOpen(false);
                    handleSignOut();
                  }}
                >
                  <div className="i-ph:sign-out w-4 h-4" style={{ color: '#dc2626' }} />
                  Sign Out
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Control Panel */}
      {showControlPanel && (
        <ControlPanel
          open={showControlPanel}
          onClose={() => {
            setShowControlPanel(false);
            setInitialTab(undefined);
          }}
          initialTab={initialTab as any}
        />
      )}
    </>
  );
}
