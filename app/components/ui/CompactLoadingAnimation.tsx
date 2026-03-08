import { motion } from 'framer-motion';

interface CompactLoadingAnimationProps {
  isVisible: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  text?: string;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl', 
  lg: 'text-3xl'
};



export default function CompactLoadingAnimation({ 
  isVisible, 
  className = "", 
  size = 'md',
  showText = true,
  text = "Loading..."
}: CompactLoadingAnimationProps) {
  if (!isVisible) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Animated monzed */}
      <motion.div 
        className={sizeClasses[size]}
        animate={{ 
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        🤖
      </motion.div>



      {/* Optional text */}
      {showText && (
        <motion.span 
          className="text-sm monzed-text-secondary font-medium"
          animate={{ 
            opacity: [0.7, 1, 0.7] 
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.span>
      )}
    </div>
  );
}
