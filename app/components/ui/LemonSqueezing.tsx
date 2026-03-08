import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface monzedSqueezingProps {
  isVisible: boolean;
}

const buildingSteps = [
  { text: "Analyzing requirements", icon: "" },
  { text: "Setting up structure", icon: "" },
  { text: "Installing dependencies", icon: "" },
  { text: "Generating components", icon: "" },
  { text: "Adding styling", icon: "" },
  { text: "Implementing logic", icon: "" },
  { text: "Optimizing performance", icon: "" },
  { text: "Final touches", icon: "" }
];

export default function monzedSqueezing({ isVisible }: monzedSqueezingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % buildingSteps.length);
    }, 2000);

    return () => {
      clearInterval(stepInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative">
      {/* Clean minimal background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" 
             style={{
               backgroundImage: 'radial-gradient(circle at 25% 25%, #FD9641 0%, transparent 50%), radial-gradient(circle at 75% 75%, #0446f1 0%, transparent 50%)'
             }} 
        />
      </div>

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Clean monzed icon with subtle animation */}
        <motion.div 
          className="relative"
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="text-8xl md:text-9xl filter drop-shadow-lg">
            ⚡
          </div>
        </motion.div>

        {/* Current step display */}
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center space-y-4"
        >
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {buildingSteps[currentStep].text}
          </h3>
        </motion.div>

        {/* Simple loading text */}
        <motion.p 
          className="text-sm text-gray-500 dark:text-gray-400 mt-4"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Preparing your preview...
        </motion.p>
      </div>
    </div>
  );
}
