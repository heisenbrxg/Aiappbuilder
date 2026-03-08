import type { ITheme } from '@xterm/xterm';

const style = getComputedStyle(document.documentElement);
const cssVar = (token: string) => style.getPropertyValue(token) || undefined;

export function getTerminalTheme(overrides?: ITheme): ITheme {
  return {
    cursor: cssVar('--monzed-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--monzed-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--monzed-elements-terminal-textColor'),
    background: cssVar('--monzed-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--monzed-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--monzed-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--monzed-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--monzed-elements-terminal-color-black'),
    red: cssVar('--monzed-elements-terminal-color-red'),
    green: cssVar('--monzed-elements-terminal-color-green'),
    yellow: cssVar('--monzed-elements-terminal-color-yellow'),
    blue: cssVar('--monzed-elements-terminal-color-blue'),
    magenta: cssVar('--monzed-elements-terminal-color-magenta'),
    cyan: cssVar('--monzed-elements-terminal-color-cyan'),
    white: cssVar('--monzed-elements-terminal-color-white'),
    brightBlack: cssVar('--monzed-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--monzed-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--monzed-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--monzed-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--monzed-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--monzed-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--monzed-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--monzed-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}
