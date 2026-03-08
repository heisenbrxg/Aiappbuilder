import { globSync } from 'fast-glob';
import fs from 'node:fs/promises';
import { basename } from 'node:path';
import { defineConfig, presetIcons, presetUno, transformerDirectives } from 'unocss';

const iconPaths = globSync('./icons/*.svg');

const collectionName = 'monzed';

const customIconCollection = iconPaths.reduce(
  (acc, iconPath) => {
    const [iconName] = basename(iconPath).split('.');

    acc[collectionName] ??= {};
    acc[collectionName][iconName] = async () => fs.readFile(iconPath, 'utf8');

    return acc;
  },
  {} as Record<string, Record<string, () => Promise<string>>>,
);

const BASE_COLORS = {
  white: '#FFFFFF',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  accent: {
    50: '#EBF4FF',
    100: '#DBEAFE', 
    200: '#FECBA0',
    300: '#FDB070',
    400: '#FD9641',
    500: '#FC7C11', // Electric Blue primary
    600: '#FC7C11',
    700: '#FC7C11',
    800: '#B0570C',
    900: '#653207',
    950: '#0F172A',
  },
  // monzed theme colors - Electric Blue values (keeping variable names for compatibility)
  monzed: {
    accent: '#FC7C11',  // Electric Blue primary (was monzed)
    bright: '#FC7C11',  // Royal Azure (was bright monzed)
    cream: '#FECBA0',   // Sky Blue (was cream)
    glow: '#FC7C11',    // Electric glow (was monzed glow)
  },
  mint: {
    cyber: '#FECBA0',   // Sky Blue (was mint green)
  },
  citrus: {
    electric: '#FC7C11', // Royal Azure (was citrus green)
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  orange: {
    50: '#EBF4FF',
    100: '#DBEAFE',
    200: '#FECBA0',
    300: '#FDB070',
    400: '#FD9641',
    500: '#FC7C11',
    600: '#FC7C11',
    700: '#B0570C',
    800: '#653207',
    900: '#0F172A',
  },
  red: {
    50: '#F0FDF4',
    100: '#DCFCE7', 
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Fresh green for errors/warnings - more friendly
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  // Starsky theme primary colors
  primary: {
    50: '#EBF4FF',
    100: '#DBEAFE',
    200: '#FECBA0',
    300: '#FDB070',
    400: '#FD9641',
    500: '#FC7C11', // Electric Blue primary
    600: '#FC7C11',
    700: '#FC7C11',
    800: '#B0570C',
    900: '#653207',
    950: '#0F172A',
  },
};

const COLOR_PRIMITIVES = {
  ...BASE_COLORS,
  alpha: {
    white: generateAlphaPalette(BASE_COLORS.white),
    gray: generateAlphaPalette(BASE_COLORS.gray[900]),
    red: generateAlphaPalette(BASE_COLORS.red[500]),
    accent: generateAlphaPalette(BASE_COLORS.accent[500]),
  },
};

export default defineConfig({
  safelist: [...Object.keys(customIconCollection[collectionName] || {}).map((x) => `i-monzed:${x}`)],
  shortcuts: {
    'monzed-ease-cubic-bezier': 'ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transition-theme': 'transition-[background-color,border-color,color] duration-150 monzed-ease-cubic-bezier',
    kdb: 'bg-monzed-elements-code-background text-monzed-elements-code-text py-1 px-1.5 rounded-md',
    'max-w-chat': 'max-w-[var(--chat-max-width)]',
  },
  rules: [
    /**
     * This shorthand doesn't exist in Tailwind and we overwrite it to avoid
     * any conflicts with minified CSS classes.
     */
    ['b', {}],
    // Starsky theme color utilities
    [/^text-monzed-(accent|bright|glow|cream)$/, ([, color]) => ({ color: `var(--color-monzed-${color})` })],
    [/^bg-monzed-(accent|bright|glow|cream)$/, ([, color]) => ({ 'background-color': `var(--color-monzed-${color})` })],
    [/^border-monzed-(accent|bright|glow|cream)$/, ([, color]) => ({ 'border-color': `var(--color-monzed-${color})` })],
    [/^text-mint-cyber$/, () => ({ color: 'var(--color-mint-cyber)' })],
    [/^text-citrus-electric$/, () => ({ color: 'var(--color-citrus-electric)' })],
    // Primary color utilities (mapped to monzed accent)
    [/^text-primary-(\d+)$/, ([, shade]) => ({ color: `var(--color-monzed-accent)` })],
    [/^bg-primary-(\d+)$/, ([, shade]) => ({ 'background-color': `var(--color-monzed-accent)` })],
    [/^border-primary-(\d+)$/, ([, shade]) => ({ 'border-color': `var(--color-monzed-accent)` })],
    // Danger/error utilities (keep red but integrate with theme)
    [/^text-danger$/, () => ({ color: 'var(--monzed-elements-icon-error)' })],
    [/^bg-danger$/, () => ({ 'background-color': 'var(--monzed-elements-button-danger-background)' })],
    [/^border-danger$/, () => ({ 'border-color': 'var(--monzed-elements-icon-error)' })],
    // Gradient utilities
    [/^from-monzed-(accent|bright|glow|cream)$/, ([, color]) => ({ '--un-gradient-from': `var(--color-monzed-${color})`, '--un-gradient-to': `var(--color-monzed-${color})`, '--un-gradient-stops': 'var(--un-gradient-from), var(--un-gradient-to)' })],
    [/^via-monzed-(accent|bright|glow|cream)$/, ([, color]) => ({ '--un-gradient-to': `var(--color-monzed-${color})`, '--un-gradient-stops': `var(--un-gradient-from), var(--color-monzed-${color}), var(--un-gradient-to)` })],
    [/^to-monzed-(accent|bright|glow|cream)$/, ([, color]) => ({ '--un-gradient-to': `var(--color-monzed-${color})` })],
    [/^from-mint-cyber$/, () => ({ '--un-gradient-from': 'var(--color-mint-cyber)', '--un-gradient-to': 'var(--color-mint-cyber)', '--un-gradient-stops': 'var(--un-gradient-from), var(--un-gradient-to)' })],
    [/^via-mint-cyber$/, () => ({ '--un-gradient-to': 'var(--color-mint-cyber)', '--un-gradient-stops': 'var(--un-gradient-from), var(--color-mint-cyber), var(--un-gradient-to)' })],
    [/^to-mint-cyber$/, () => ({ '--un-gradient-to': 'var(--color-mint-cyber)' })],
    [/^from-citrus-electric$/, () => ({ '--un-gradient-from': 'var(--color-citrus-electric)', '--un-gradient-to': 'var(--color-citrus-electric)', '--un-gradient-stops': 'var(--un-gradient-from), var(--un-gradient-to)' })],
    [/^to-citrus-electric$/, () => ({ '--un-gradient-to': 'var(--color-citrus-electric)' })],
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['Inter', 'sans-serif'],
      primary: ['Inter', 'sans-serif'],
    },
    colors: {
      ...COLOR_PRIMITIVES,
      monzed: {
        elements: {
          borderColor: 'var(--monzed-elements-borderColor)',
          borderColorActive: 'var(--monzed-elements-borderColorActive)',
          background: {
            depth: {
              1: 'var(--monzed-elements-bg-depth-1)',
              2: 'var(--monzed-elements-bg-depth-2)',
              3: 'var(--monzed-elements-bg-depth-3)',
              4: 'var(--monzed-elements-bg-depth-4)',
            },
          },
          textPrimary: 'var(--monzed-elements-textPrimary)',
          textSecondary: 'var(--monzed-elements-textSecondary)',
          textTertiary: 'var(--monzed-elements-textTertiary)',
          code: {
            background: 'var(--monzed-elements-code-background)',
            text: 'var(--monzed-elements-code-text)',
          },
          button: {
            primary: {
              background: 'var(--monzed-elements-button-primary-background)',
              backgroundHover: 'var(--monzed-elements-button-primary-backgroundHover)',
              text: 'var(--monzed-elements-button-primary-text)',
            },
            secondary: {
              background: 'var(--monzed-elements-button-secondary-background)',
              backgroundHover: 'var(--monzed-elements-button-secondary-backgroundHover)',
              text: 'var(--monzed-elements-button-secondary-text)',
            },
            danger: {
              background: 'var(--monzed-elements-button-danger-background)',
              backgroundHover: 'var(--monzed-elements-button-danger-backgroundHover)',
              text: 'var(--monzed-elements-button-danger-text)',
            },
          },
          item: {
            contentDefault: 'var(--monzed-elements-item-contentDefault)',
            contentActive: 'var(--monzed-elements-item-contentActive)',
            contentAccent: 'var(--monzed-elements-item-contentAccent)',
            contentDanger: 'var(--monzed-elements-item-contentDanger)',
            backgroundDefault: 'var(--monzed-elements-item-backgroundDefault)',
            backgroundActive: 'var(--monzed-elements-item-backgroundActive)',
            backgroundAccent: 'var(--monzed-elements-item-backgroundAccent)',
            backgroundDanger: 'var(--monzed-elements-item-backgroundDanger)',
          },
          actions: {
            background: 'var(--monzed-elements-actions-background)',
            code: {
              background: 'var(--monzed-elements-actions-code-background)',
            },
          },
          artifacts: {
            background: 'var(--monzed-elements-artifacts-background)',
            backgroundHover: 'var(--monzed-elements-artifacts-backgroundHover)',
            borderColor: 'var(--monzed-elements-artifacts-borderColor)',
            inlineCode: {
              background: 'var(--monzed-elements-artifacts-inlineCode-background)',
              text: 'var(--monzed-elements-artifacts-inlineCode-text)',
            },
          },
          messages: {
            background: 'var(--monzed-elements-messages-background)',
            linkColor: 'var(--monzed-elements-messages-linkColor)',
            code: {
              background: 'var(--monzed-elements-messages-code-background)',
            },
            inlineCode: {
              background: 'var(--monzed-elements-messages-inlineCode-background)',
              text: 'var(--monzed-elements-messages-inlineCode-text)',
            },
          },
          icon: {
            success: 'var(--monzed-elements-icon-success)',
            error: 'var(--monzed-elements-icon-error)',
            primary: 'var(--monzed-elements-icon-primary)',
            secondary: 'var(--monzed-elements-icon-secondary)',
            tertiary: 'var(--monzed-elements-icon-tertiary)',
          },
          preview: {
            addressBar: {
              background: 'var(--monzed-elements-preview-addressBar-background)',
              backgroundHover: 'var(--monzed-elements-preview-addressBar-backgroundHover)',
              backgroundActive: 'var(--monzed-elements-preview-addressBar-backgroundActive)',
              text: 'var(--monzed-elements-preview-addressBar-text)',
              textActive: 'var(--monzed-elements-preview-addressBar-textActive)',
            },
          },
          terminals: {
            background: 'var(--monzed-elements-terminals-background)',
            buttonBackground: 'var(--monzed-elements-terminals-buttonBackground)',
          },
          dividerColor: 'var(--monzed-elements-dividerColor)',
          loader: {
            background: 'var(--monzed-elements-loader-background)',
            progress: 'var(--monzed-elements-loader-progress)',
          },
          prompt: {
            background: 'var(--monzed-elements-prompt-background)',
          },
          sidebar: {
            dropdownShadow: 'var(--monzed-elements-sidebar-dropdownShadow)',
            buttonBackgroundDefault: 'var(--monzed-elements-sidebar-buttonBackgroundDefault)',
            buttonBackgroundHover: 'var(--monzed-elements-sidebar-buttonBackgroundHover)',
            buttonText: 'var(--monzed-elements-sidebar-buttonText)',
          },
          cta: {
            background: 'var(--monzed-elements-cta-background)',
            text: 'var(--monzed-elements-cta-text)',
          },
        },
      },
    },
  },
  transformers: [transformerDirectives()],
  presets: [
    presetUno({
      dark: {
        light: '[data-theme="light"]',
        dark: '[data-theme="dark"]',
      },
    }),
    presetIcons({
      warn: true,
      collections: {
        ...customIconCollection,
      },
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
      unit: 'em',
    }),
  ],
});

/**
 * Generates an alpha palette for a given hex color.
 *
 * @param hex - The hex color code (without alpha) to generate the palette from.
 * @returns An object where keys are opacity percentages and values are hex colors with alpha.
 *
 * Example:
 *
 * ```
 * {
 *   '1': '#FFFFFF03',
 *   '2': '#FFFFFF05',
 *   '3': '#FFFFFF08',
 * }
 * ```
 */
function generateAlphaPalette(hex: string) {
  return [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].reduce(
    (acc, opacity) => {
      const alpha = Math.round((opacity / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      acc[opacity] = `${hex}${alpha}`;

      return acc;
    },
    {} as Record<number, string>,
  );
}
