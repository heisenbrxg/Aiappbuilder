import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Terminal as XTerm } from '@xterm/xterm';
import { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';
import type { Theme } from '~/lib/stores/theme';
import { createScopedLogger } from '~/utils/logger';
import { getTerminalTheme } from './theme';

const logger = createScopedLogger('Terminal');

export interface TerminalRef {
  reloadStyles: () => void;
  reset: () => void;
  isHealthy: () => boolean;
  getTerminal: () => XTerm | undefined;
}

export interface TerminalProps {
  className?: string;
  theme: Theme;
  readonly?: boolean;
  id: string;
  onTerminalReady?: (terminal: XTerm) => void;
  onTerminalResize?: (cols: number, rows: number) => void;
}

export const Terminal = memo(
  forwardRef<TerminalRef, TerminalProps>(
    ({ className, theme, readonly, id, onTerminalReady, onTerminalResize }, ref) => {
      const terminalElementRef = useRef<HTMLDivElement>(null);
      const terminalRef = useRef<XTerm>();
      const fitAddonRef = useRef<FitAddon>();
      const lastActivityRef = useRef<number>(Date.now());
      const healthCheckIntervalRef = useRef<NodeJS.Timeout>();
      const cleanupRef = useRef<(() => void) | undefined>();
      const resizeObserverRef = useRef<ResizeObserver>();

      const initializeTerminal = () => {
        const element = terminalElementRef.current;
        if (!element) return;

        try {
          // Clean up existing terminal if any
          if (terminalRef.current) {
            try {
              terminalRef.current.dispose();
            } catch (error) {
              logger.error(`Error disposing terminal [${id}]:`, error);
            }
          }

          const fitAddon = new FitAddon();
          const webLinksAddon = new WebLinksAddon();
          fitAddonRef.current = fitAddon;

          const terminal = new XTerm({
            cursorBlink: true,
            convertEol: true,
            disableStdin: readonly,
            theme: getTerminalTheme(readonly ? { cursor: '#00000000' } : {}),
            fontSize: 12,
            fontFamily: 'Arial',
          });

          terminalRef.current = terminal;

          // Track activity for health monitoring
          terminal.onData(() => {
            lastActivityRef.current = Date.now();
          });

          terminal.onKey(() => {
            lastActivityRef.current = Date.now();
          });

          // Load addons with error handling
          try {
            terminal.loadAddon(fitAddon);
            terminal.loadAddon(webLinksAddon);
          } catch (error) {
            logger.error(`Error loading terminal addons [${id}]:`, error);
          }

          terminal.open(element);

          // Clean up old resize observer if exists
          if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
          }

          const resizeObserver = new ResizeObserver(() => {
            try {
              fitAddon.fit();
              onTerminalResize?.(terminal.cols, terminal.rows);
            } catch (error) {
              logger.error(`Error resizing terminal [${id}]:`, error);
            }
          });

          resizeObserverRef.current = resizeObserver;
          resizeObserver.observe(element);

          onTerminalReady?.(terminal);

          return () => {
            resizeObserver.disconnect();
            terminal.dispose();
          };
        } catch (error) {
          logger.error(`Fatal error initializing terminal [${id}]:`, error);
          throw error;
        }
      };

      useEffect(() => {
        const cleanup = initializeTerminal();
        cleanupRef.current = cleanup;

        // Health check every 5 seconds
        healthCheckIntervalRef.current = setInterval(() => {
          const terminal = terminalRef.current;
          if (!terminal) return;

          try {
            // Check if terminal buffer is valid
            const isHealthy = terminal.buffer && terminal.buffer.active;
            const timeSinceActivity = Date.now() - lastActivityRef.current;

            if (!isHealthy || timeSinceActivity > 30000) {
              // Terminal will be reset via the reset() method if needed
            }
          } catch (error) {
            // Silent health check - errors handled internally
          }
        }, 5000);

        return () => {
          if (healthCheckIntervalRef.current) {
            clearInterval(healthCheckIntervalRef.current);
          }
          cleanup?.();
        };
      }, []);

      useEffect(() => {
        const terminal = terminalRef.current!;

        // we render a transparent cursor in case the terminal is readonly
        terminal.options.theme = getTerminalTheme(readonly ? { cursor: '#00000000' } : {});

        terminal.options.disableStdin = readonly;
      }, [theme, readonly]);

      useImperativeHandle(ref, () => {
        return {
          reloadStyles: () => {
            const terminal = terminalRef.current;
            if (terminal) {
              terminal.options.theme = getTerminalTheme(readonly ? { cursor: '#00000000' } : {});
            }
          },
          reset: () => {
            logger.info(`Resetting terminal [${id}]`);
            try {
              // Clean up existing terminal first
              if (cleanupRef.current) {
                try {
                  cleanupRef.current();
                } catch (error) {
                  logger.error(`Error during terminal cleanup [${id}]:`, error);
                }
              }

              // Reinitialize terminal
              const cleanup = initializeTerminal();
              cleanupRef.current = cleanup;
              lastActivityRef.current = Date.now();
              logger.info(`Terminal reset successful [${id}]`);
            } catch (error) {
              logger.error(`Terminal reset failed [${id}]:`, error);
              throw error;
            }
          },
          isHealthy: () => {
            const terminal = terminalRef.current;
            if (!terminal) return false;

            try {
              // Check buffer validity
              const hasValidBuffer = terminal.buffer && terminal.buffer.active;
              // Check recent activity (within last 60 seconds is considered healthy)
              const timeSinceActivity = Date.now() - lastActivityRef.current;
              const hasRecentActivity = timeSinceActivity < 60000;

              return hasValidBuffer && hasRecentActivity;
            } catch (error) {
              logger.error(`Health check error [${id}]:`, error);
              return false;
            }
          },
          getTerminal: () => {
            return terminalRef.current;
          },
        };
      }, [readonly, id]);

      return <div className={className} ref={terminalElementRef} />;
    },
  ),
);
