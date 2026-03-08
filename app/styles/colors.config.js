/**
 * Unified Electric Blue Color System
 *  // Gradient Definitions - Electric Blue gradients with monzed names
  gradients: {
    monzed: 'linear-gradient(135deg, #FC7C11 0%, #FC7C11 100%)',
    cyber: 'linear-gradient(135deg, #C7FE470%, #FC7C11 100%)',
    glow: 'linear-gradient(135deg, #C7FE470%, #FC7C11 50%, #FC7C11 100%)', This file serves as the single source of truth for all colors across the application.
 * It's used by both the main app and the landing page to ensure consistency.
 * NOTE: Variable names kept as "monzed" for compatibility, but values are Electric Blue
 */

export const monzedColors = {
  // Core theme colors - Electric Blue values with monzed variable names
  monzed: {
    accent: '#FC7C11',      // Electric Blue primary (was monzed yellow)
    bright: '#FC7C11',      // Royal Azure (was bright monzed)
    cream: '#FECBA0',       // Sky Blue (was monzed cream)
    glow: '#FC7C11',        // Electric glow (was monzed glow)
  },
  
  // Accent Colors - Updated to Electric Blue spectrum
  citrus: {
    electric: '#FC7C11',    // Royal Azure (was citrus green)
  },
  
  mint: {
    cyber: '#FECBA0',       // Sky Blue (was mint green)
  },
  
  // Light Mode Backgrounds (converted from dark)
  bg: {
    primary: '#FFFFFF',     // Pure white background (was black)
    secondary: '#F8FAFC',   // Light gray background (was dark)
    tertiary: '#F1F5F9',    // Lighter gray (was darker gray)
  },
  
  // Light Mode Text Colors
  text: {
    primary: '#0F172A',     // Dark text on light background (was white)
    secondary: '#475569',   // Medium gray text (was light gray)
    tertiary: '#94A3B8',    // Light gray text (was darker gray)
  },
  
  // Light Mode Border Colors
  border: {
    default: '#E2E8F0',     // Light border (was dark)
    bright: '#CBD5E1',      // Medium border (was lighter)
  },
  
  // Gradient Definitions - Electric Blue only
  gradients: {
    electric: 'linear-gradient(135deg, #FC7C11 0%, #FC7C11 100%)',
    cyber: 'linear-gradient(135deg, #C7FE470%, #FC7C11 100%)',
    glow: 'linear-gradient(135deg, #C7FE470%, #FC7C11 50%, #FC7C11 100%)',
  },
};

// CSS Variable Mapping - Keep original variable names, Electric Blue values
export const cssVariables = {
  '--color-monzed-accent': monzedColors.monzed.accent,
  '--color-monzed-bright': monzedColors.monzed.bright,
  '--color-monzed-cream': monzedColors.monzed.cream,
  '--color-monzed-glow': monzedColors.monzed.glow,
  '--color-citrus-electric': monzedColors.citrus.electric,
  '--color-mint-cyber': monzedColors.mint.cyber,
  '--color-bg-primary': monzedColors.bg.primary,
  '--color-bg-secondary': monzedColors.bg.secondary,
  '--color-bg-tertiary': monzedColors.bg.tertiary,
  '--color-text-primary': monzedColors.text.primary,
  '--color-text-secondary': monzedColors.text.secondary,
  '--color-text-tertiary': monzedColors.text.tertiary,
  '--color-border': monzedColors.border.default,
  '--color-border-bright': monzedColors.border.bright,
  '--gradient-monzed': monzedColors.gradients.monzed,
  '--gradient-cyber': monzedColors.gradients.cyber,
  '--gradient-glow': monzedColors.gradients.glow,
};

// Export for use in Tailwind configs
export default monzedColors;
