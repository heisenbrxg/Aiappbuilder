import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ message = 'Loading...', className = '', fullPage = false }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${fullPage ? 'fixed inset-0 z-[9999]' : 'min-h-screen'} monzed-bg-primary ${className}`}>
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
      </div>
    </div>
  );
}
