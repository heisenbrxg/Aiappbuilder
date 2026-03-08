import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { classNames } from '~/utils/classNames';
import type { TabVisibilityConfig } from '~/components/@settings/core/types';
import { TAB_LABELS, TAB_ICONS } from '~/components/@settings/core/constants';

interface TabTileProps {
  tab: TabVisibilityConfig;
  onClick?: () => void;
  isActive?: boolean;
  hasUpdate?: boolean;
  statusMessage?: string;
  description?: string;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const TabTile: React.FC<TabTileProps> = ({
  tab,
  onClick,
  isActive,
  hasUpdate,
  statusMessage,
  description,
  isLoading,
  className,
  children,
}: TabTileProps) => {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <motion.div
            onClick={onClick}
            className={classNames(
              'relative flex flex-col items-center p-4 rounded-2xl cursor-pointer',
              'w-full h-full min-h-[140px] sm:min-h-[160px]',
              'bg-monzed-elements-background-depth-2',
              'border-2 transition-all duration-200',
              'group overflow-hidden',
              isActive 
                ? 'border-monzed-accent bg-monzed-accent/5' 
                : 'border-monzed-elements-borderColor hover:border-monzed-accent/50',
              'hover:shadow-xl hover:shadow-monzed-accent/5',
              isLoading ? 'cursor-wait opacity-70' : '',
              className || '',
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Main Content */}
            <div className="flex flex-col items-center justify-center flex-1 w-full">
              {/* Icon */}
              <motion.div
                className={classNames(
                  'relative',
                  'w-12 h-12 sm:w-14 sm:h-14',
                  'flex items-center justify-center',
                  'rounded-lg',
                  isActive ? 'bg-monzed-accent/20' : 'bg-monzed-accent/10',
                  'group-hover:bg-monzed-accent/20',
                  'transition-colors duration-200',
                )}
                whileHover={{ rotate: 5 }}
              >
                <motion.div
                  className={classNames(
                    TAB_ICONS[tab.id],
                    'w-6 h-6 sm:w-7 sm:h-7',
                    isActive ? 'text-monzed-accent' : 'text-monzed-accent',
                  )}
                />
              </motion.div>

              {/* Label and Description */}
              <div className="flex flex-col items-center mt-3 sm:mt-4 w-full">
                <h3
                  className={classNames(
                    'text-sm sm:text-base font-bold',
                    'text-monzed-elements-textPrimary',
                    'transition-colors duration-200',
                    isActive ? 'text-monzed-accent' : '',
                  )}
                >
                  {TAB_LABELS[tab.id]}
                </h3>
                {description && (
                  <p
                    className={classNames(
                      'text-xs sm:text-sm mt-1',
                      'text-monzed-elements-textSecondary',
                      'text-center px-2',
                      'line-clamp-2',
                    )}
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Update Indicator with Tooltip */}
            {hasUpdate && (
              <>
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-monzed-accent animate-pulse" />
                <Tooltip.Portal>
                  <Tooltip.Content
                    className={classNames(
                      'px-3 py-1.5 rounded-lg',
                      'bg-[#18181B] text-white',
                      'text-sm font-medium',
                      'select-none',
                      'z-[100]',
                    )}
                    side="top"
                    sideOffset={5}
                  >
                    {statusMessage}
                    <Tooltip.Arrow className="fill-[#18181B]" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </>
            )}

            {/* Children (e.g. Beta Label) */}
            {children}
          </motion.div>
        </Tooltip.Trigger>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
