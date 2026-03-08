import type { Variants } from 'framer-motion';

// Optimized smooth transition for fade effects
export const smoothTransition = {
  duration: 0.3,
  ease: 'easeOut',
};

// Keep spring physics for slide animations that involve movement
export const springTransition = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 30,
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: smoothTransition },
  exit: { opacity: 0, transition: smoothTransition },
};

export const slideIn: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: springTransition },
  exit: { opacity: 0, y: -20, transition: springTransition },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: smoothTransition },
  exit: { opacity: 0, scale: 0.8, transition: smoothTransition },
};

export const tabAnimation: Variants = {
  initial: { opacity: 0, scale: 0.8, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springTransition },
  exit: { opacity: 0, scale: 0.8, y: -20, transition: springTransition },
};

export const overlayAnimation: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: smoothTransition },
  exit: { opacity: 0, transition: smoothTransition },
};

export const modalAnimation: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springTransition },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: springTransition },
};

// Legacy transition for backwards compatibility
export const transition = {
  duration: 0.2,
};

// New optimized transition (for backwards compatibility, now pointing to smooth transition)
export const optimizedTransition = smoothTransition;
