import { memo } from 'react';
import { classNames } from '~/utils/classNames';

interface PanelHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const PanelHeader = memo(({ className, children }: PanelHeaderProps) => {
  return (
    <div
      className={classNames(
        'flex items-center gap-2 overflow-x-auto bg-monzed-elements-background-depth-2 text-monzed-elements-textSecondary border-b border-monzed-elements-borderColor sm:px-4 px-2 sm:py-1 py-1 sm:min-h-[34px] min-h-[30px] sm:text-sm text-xs',
        className,
      )}
    >
      {children}
    </div>
  );
});
