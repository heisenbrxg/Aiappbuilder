import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { classNames } from '~/utils/classNames';

export const SupportButton = () => {
  const handleEmailClick = () => {
    // Open Gmail compose with pre-filled subject
    const subject = encodeURIComponent('Starsky Support Request');
    const body = encodeURIComponent('Hi Starsky Team,\n\nI need help with:\n\n[Please describe your issue here]\n\nBest regards');
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=hello@sharelock.cc&su=${subject}&body=${body}`, '_blank');
  };

  const handleDiscordClick = () => {
    // Open Discord invite link
    window.open('https://discord.gg/Starsky-ai', '_blank');
  };

  return (
    <div className="flex border border-monzed-elements-borderColor rounded-md overflow-hidden mr-2 text-sm">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs bg-monzed-elements-background-depth-2 text-monzed-elements-textPrimary [&:not(:disabled,.disabled)]:hover:bg-monzed-elements-button-primary-backgroundHover outline-accent-500 flex gap-1.5">
          <span className="i-ph:question w-3.5 h-3.5" />
          Support
          <span className={classNames('i-ph:caret-down transition-transform')} />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className={classNames(
            'z-[250]',
            'bg-monzed-elements-background-depth-2',
            'border border-monzed-elements-borderColor',
            'rounded-lg',
            'shadow-lg',
            'min-w-[200px]',
            'p-1'
          )}
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            className={classNames(
              'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-item-backgroundActive gap-2 rounded-md group relative',
            )}
            onClick={handleEmailClick}
          >
            <div className="i-ph:envelope size-4.5"></div>
            <span>Email Support</span>
            <div className="i-ph:arrow-square-out size-3.5 ml-auto opacity-60"></div>
          </DropdownMenu.Item>
          
          <DropdownMenu.Item
            className={classNames(
              'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-item-backgroundActive gap-2 rounded-md group relative',
            )}
            onClick={handleDiscordClick}
          >
            <div className="i-ph:chat-circle-text size-4.5 text-[#5865F2]"></div>
            <span>Discord Community</span>
            <div className="i-ph:arrow-square-out size-3.5 ml-auto opacity-60"></div>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
};
