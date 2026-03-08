import { motion } from 'framer-motion';
import { CheckCircle, Zap, RefreshCw } from 'lucide-react';

interface ResponseGeneratedAlertProps {
  onRegenerate: () => void;
  isStreaming: boolean;
}

export default function ResponseGeneratedAlert({ onRegenerate, isStreaming }: ResponseGeneratedAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full max-w-chat mx-auto p-3 rounded-lg bg-gradient-to-r from-monzed-glow/20 via-monzed-accent/20 to-mint-cyber/20 border border-monzed-accent/30 shadow-lg backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left side content */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <CheckCircle className="w-6 h-6 text-mint-cyber" />
          </motion.div>
          <div>
            <p className="font-semibold monzed-text-primary text-sm">
              Response Generated
            </p>
            <p className="text-xs monzed-text-secondary">
              AI has finished. You can regenerate if needed.
            </p>
          </div>
        </div>

        {/* Right side action button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRegenerate}
          disabled={isStreaming}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-monzed-accent/20 hover:bg-monzed-accent/30 border border-monzed-accent/50 text-monzed-accent font-semibold text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStreaming ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
          <span>Regenerate</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
