import { motion } from 'framer-motion';

export default function PreviewLoadingSpinner() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <div className="relative w-12 h-12">
        <motion.div
          className="absolute inset-0 border-4 border-blue-500/20 rounded-full"
        />
        <motion.div
          className="absolute inset-0 border-t-4 border-t-monzed-accent rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
         <motion.div
            className="absolute inset-2 border-t-2 border-t-mint-cyber rounded-full"
            animate={{ rotate: -360 }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
            }}
        />
      </div>
    </div>
  );
}
