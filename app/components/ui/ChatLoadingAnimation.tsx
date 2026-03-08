import { motion } from 'framer-motion';

interface ChatLoadingAnimationProps {
  isVisible: boolean;
  className?: string;
}

export default function ChatLoadingAnimation({ isVisible, className = "" }: ChatLoadingAnimationProps) {
  if (!isVisible) return null;

  return (
    <div className={`flex items-center gap-2 py-4 px-4 ${className}`}>
      {/* Brain Icon */}
      <div className="i-ph:brain text-lg text-monzed-elements-textSecondary" />
      
      {/* Thinking text with shimmer effect inside letters */}
      <motion.span
        className="text-sm font-medium bg-gradient-to-r from-gray-500/40 via-gray-900 to-gray-500/40 dark:from-white/40 dark:via-white dark:to-white/40 bg-clip-text text-transparent"
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
        Thinking...
      </motion.span>
    </div>
  );
}
