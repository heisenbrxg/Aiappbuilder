import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react';
import type { ProgressAnnotation } from '~/types/context';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';

export default function ProgressCompilation({ data }: { data?: ProgressAnnotation[] }) {
  const [progressList, setProgressList] = React.useState<ProgressAnnotation[]>([]);
  const [expanded, setExpanded] = useState(false);
  React.useEffect(() => {
    if (!data || data.length == 0) {
      setProgressList([]);
      setExpanded(false); // Also reset expanded state when clearing
      return;
    }

    const progressMap = new Map<string, ProgressAnnotation>();
    data.forEach((x) => {
      // Filter out "Response Generated" messages to reduce UI clutter
      if (x.message === 'Response Generated') {
        return;
      }
      
      const existingProgress = progressMap.get(x.label);

      if (existingProgress && existingProgress.status === 'complete') {
        return;
      }

      progressMap.set(x.label, x);
    });

    const newData = Array.from(progressMap.values());
    newData.sort((a, b) => a.order - b.order);
    setProgressList(newData);
  }, [data]);

  if (progressList.length === 0) {
    return <></>;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full max-w-chat mx-auto p-3 rounded-lg bg-gradient-to-r from-monzed-glow/10 via-monzed-accent/10 to-mint-cyber/10 border border-monzed-accent/20 shadow-lg backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <AnimatePresence>
              {expanded ? (
                <motion.div
                  className="actions"
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: '0px' }}
                  transition={{ duration: 0.15 }}
                >
                  {progressList.map((x, i) => {
                    return <ProgressItem key={i} progress={x} />;
                  })}
                </motion.div>
              ) : (
                <ProgressItem progress={progressList.slice(-1)[0]} />
              )}
            </AnimatePresence>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-monzed-accent/20 hover:bg-monzed-accent/30 border border-monzed-accent/50 text-monzed-accent font-semibold text-xs transition-all duration-200"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            <span>{expanded ? 'Hide' : 'Show'} Progress</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

const ProgressItem = ({ progress }: { progress: ProgressAnnotation }) => {
  return (
    <motion.div
      className="flex items-center gap-3 py-2"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-shrink-0">
        {progress.status === 'in-progress' ? (
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Clock className="w-4 h-4 text-monzed-accent" />
          </motion.div>
        ) : progress.status === 'complete' ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 20 
            }}
          >
            <CheckCircle className="w-4 h-4 text-mint-cyber" />
          </motion.div>
        ) : null}
      </div>
      <div className="flex-1">
        <p className="text-sm monzed-text-primary font-medium">
          {progress.message}
        </p>
        {progress.label && (
          <p className="text-xs monzed-text-secondary mt-0.5">
            {progress.label}
          </p>
        )}
      </div>
    </motion.div>
  );
};
