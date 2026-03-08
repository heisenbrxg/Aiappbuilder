import { useUsageGuard } from '~/lib/hooks/useUsageGuard';
import { UpgradePrompt } from './UpgradePrompt';

interface UsageGuardWrapperProps {
  children: React.ReactNode;
}

export function UsageGuardWrapper({ children }: UsageGuardWrapperProps) {
  const { 
    showUpgradePrompt, 
    upgradeReason, 
    hideUpgradePrompt, 
    usage, 
    subscription 
  } = useUsageGuard();

  const getUsagePercentage = () => {
    if (!usage || !usage.message_limit || usage.message_limit === 0) return 0;
    const percentage = Math.round((usage.user_messages / usage.message_limit) * 100);
    return isNaN(percentage) ? 0 : percentage;
  };

  const getMessagesRemaining = () => {
    if (!usage || !usage.message_limit) return 0;
    const remaining = Math.max(0, usage.message_limit - usage.user_messages);
    return isNaN(remaining) ? 0 : remaining;
  };

  return (
    <>
      {children}
      
      {!!showUpgradePrompt && upgradeReason && (
        <UpgradePrompt
          currentPlan={subscription?.plan_id || 'free'}
          usagePercentage={getUsagePercentage()}
          messagesRemaining={getMessagesRemaining()}
          trigger={upgradeReason}
          onClose={hideUpgradePrompt}
        />
      )}
    </>
  );
}
