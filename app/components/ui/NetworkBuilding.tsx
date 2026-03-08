import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface NetworkBuildingProps {
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

export default function NetworkBuilding({ isVisible }: NetworkBuildingProps) {
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
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      {/* Main content container - centered */}
      <div className="flex flex-col items-center space-y-6">
        {/* Sparkles icon */}
        <div className="i-ph:sparkle text-4xl monzed-text-accent" />
        
        {/* Rotating text with shimmer effect */}
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center"
        >
          <h3 className="text-lg font-medium bg-gradient-to-r from-monzed-elements-textPrimary via-monzed-elements-textSecondary to-monzed-elements-textPrimary bg-clip-text text-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}>
            {buildingSteps[currentStep].text}
          </h3>
        </motion.div>
      </div>
    </div>
  );
}
