import { motion } from 'framer-motion';

interface InlinemonzedSpinnerProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg'
};

export default function InlinemonzedSpinner({ size = 'sm', className = '' }: InlinemonzedSpinnerProps) {
  return (
    <motion.span
      className={`inline-block ${sizeClasses[size]} ${className}`}
      animate={{
        rotate: 360
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      🤖
    </motion.span>
  );
}
