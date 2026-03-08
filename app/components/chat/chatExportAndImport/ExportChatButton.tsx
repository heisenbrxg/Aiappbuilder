import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { useAuthGuard } from '~/hooks/useAuthGuard';
import { useSubscription } from '~/lib/hooks/useSubscription';
import { toast } from 'react-toastify';

export const ExportChatButton = ({ exportChat }: { exportChat?: () => void }) => {
  const { requireAuth } = useAuthGuard();
  const { subscription } = useSubscription();

  return (
    <div className="flex border border-monzed-elements-borderColor rounded-md overflow-hidden mr-2 text-sm">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs bg-monzed-elements-background-depth-2 text-monzed-elements-textPrimary [&:not(:disabled,.disabled)]:hover:bg-monzed-elements-button-primary-backgroundHover outline-accent-500 flex gap-1.5">
          <span className="i-ph:download-simple w-3.5 h-3.5" />
          Export
          <span className={classNames('i-ph:caret-down transition-transform')} />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className={classNames(
            'z-[250]',
            'bg-monzed-elements-background-depth-2',
            'rounded-lg shadow-lg',
            'border border-monzed-elements-borderColor',
            'animate-in fade-in-0 zoom-in-95',
            'py-1',
          )}
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            className={classNames(
              'cursor-pointer flex items-center w-auto px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-item-backgroundActive gap-2 rounded-md group relative',
              subscription?.plan === 'free' ? 'opacity-50 cursor-not-allowed' : ''
            )}
            onClick={() => {
              if (!requireAuth()) return;
              if (subscription?.plan === 'free') {
                toast.error('Export features are only available for paid plans. Please upgrade to continue.');
                return;
              }
              workbenchStore.downloadZip();
            }}
            disabled={subscription?.plan === 'free'}
          >
            <div className="i-ph:code size-4.5"></div>
            <span>Download Code</span>
            {subscription?.plan === 'free' && <span className="i-ph:lock-simple ml-auto" />}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={classNames(
              'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-item-backgroundActive gap-2 rounded-md group relative',
              subscription?.plan === 'free' ? 'opacity-50 cursor-not-allowed' : ''
            )}
            onClick={() => {
              if (!requireAuth()) return;
              if (subscription?.plan === 'free') {
                toast.error('Export features are only available for paid plans. Please upgrade to continue.');
                return;
              }
              exportChat?.();
            }}
            disabled={subscription?.plan === 'free'}
          >
            <div className="i-ph:chat size-4.5"></div>
            <span>Export Chat</span>
            {subscription?.plan === 'free' && <span className="i-ph:lock-simple ml-auto" />}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
};
