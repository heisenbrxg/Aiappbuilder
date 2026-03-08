import { motion } from 'framer-motion';

export const LoadingOverlay = ({
  message = 'Loading...',
  progress,
  progressText,
}: {
  message?: string;
  progress?: number;
  progressText?: string;
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center monzed-bg-primary z-[9999]">
      <div className="flex flex-col items-center gap-3">
        {/* Sparkle Icon */}
        <div className="i-ph:sparkle text-2xl monzed-text-secondary" />
        
        {/* Shimmer text - adapts to light and dark mode */}
        <motion.span
          className="text-base font-medium bg-gradient-to-r from-gray-400 via-gray-900 to-gray-400 dark:from-white/40 dark:via-white dark:to-white/40 bg-clip-text text-transparent"
          style={{
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '200% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {message}
        </motion.span>

        {/* Optional Progress Bar */}
        {progress !== undefined && (
          <div className="w-64 flex flex-col gap-2 mt-4">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-monzed-accent transition-all duration-300 ease-out rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            {progressText && <p className="text-sm monzed-text-secondary text-center">{progressText}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
