import type { ToolInvocationUIPart } from '@ai-sdk/ui-utils';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useMemo, useState, useEffect } from 'react';
import { codeToHtml } from '~/utils/highlighter/prismAdapter';
import { classNames } from '~/utils/classNames';
import {
  TOOL_EXECUTION_APPROVAL,
  TOOL_EXECUTION_DENIED,
  TOOL_EXECUTION_ERROR,
  TOOL_NO_EXECUTE_FUNCTION,
} from '~/utils/constants';
import { cubicEasingFn } from '~/utils/easings';
import { logger } from '~/utils/logger';
import { themeStore, type Theme } from '~/lib/stores/theme';
import { useStore } from '@nanostores/react';
import type { ToolCallAnnotation } from '~/types/context';
import { formatJson } from '~/utils/json';

// Using Prism for syntax highlighting (Starsky standard)

interface JsonCodeBlockProps {
  className?: string;
  code: any;
  theme: Theme;
}

function JsonCodeBlock({ className, code, theme }: JsonCodeBlockProps) {
  const [html, setHtml] = useState<string>('');
  
  useEffect(() => {
    // Use the safe formatJson utility
    const formattedCode = formatJson(code, 2);

    // Render the highlighted code
    codeToHtml(formattedCode, {
      lang: 'json',
      theme: theme === 'dark' ? 'dark-plus' : 'light-plus',
    }).then(setHtml).catch((error) => {
      logger.error('Failed to highlight JSON', { error });
      // Fallback to plain text
      setHtml(`<pre><code>${formattedCode}</code></pre>`);
    });
  }, [code, theme]);

  return (
    <div
      className={classNames('text-xs rounded-md overflow-hidden mcp-tool-invocation-code', className)}
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        padding: '0',
        margin: '0',
      }}
    ></div>
  );
}

interface ToolInvocationsProps {
  toolInvocations: ToolInvocationUIPart[];
  toolCallAnnotations: ToolCallAnnotation[];
  addToolResult: ({ toolCallId, result }: { toolCallId: string; result: any }) => void;
}

export const ToolInvocations = memo(({ toolInvocations, toolCallAnnotations, addToolResult }: ToolInvocationsProps) => {
  const theme = useStore(themeStore);
  const [showDetails, setShowDetails] = useState(false);

  const toggleDetails = () => {
    setShowDetails((prev) => !prev);
  };

  const toolCalls = useMemo(
    () => toolInvocations.filter((inv) => inv.toolInvocation.state === 'call'),
    [toolInvocations],
  );

  const toolResults = useMemo(
    () => toolInvocations.filter((inv) => inv.toolInvocation.state === 'result'),
    [toolInvocations],
  );

  const hasToolCalls = toolCalls.length > 0;
  const hasToolResults = toolResults.length > 0;

  if (!hasToolCalls && !hasToolResults) {
    return null;
  }

  const allToolsFinished = hasToolResults && !hasToolCalls;

  return (
    <div className="tool-invocation w-full">
      {/* Shimmer text with icon - styled like ActionsRunner */}
      <div className="flex items-center gap-1.5 py-1">
        <div className="text-sm text-monzed-elements-textSecondary" style={{ marginBlockStart: '5px' }}>
          {allToolsFinished ? (
            <div className="i-ph:check-circle"></div>
          ) : (
            <div className="i-ph:wrench"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex items-center gap-1">
          <h3 
            className={classNames(
              'text-sm font-medium leading-tight truncate',
              allToolsFinished 
                ? 'text-monzed-elements-textPrimary'
                : 'bg-gradient-to-r from-monzed-elements-textPrimary via-monzed-elements-textSecondary to-monzed-elements-textPrimary bg-clip-text text-transparent animate-shimmer'
            )}
            style={{ backgroundSize: '200% 100%' }}
          >
            MCP Tool Invocations
          </h3>
          
          {/* Tool count badge */}
          {hasToolResults && (
            <span className="text-xs text-monzed-elements-textSecondary">
              ({toolResults.length} tool{toolResults.length > 1 ? 's' : ''} used)
            </span>
          )}
          
          {/* Dropdown toggle button - right next to title */}
          {hasToolResults && (
            <button
              onClick={toggleDetails}
              className="text-monzed-elements-textSecondary hover:text-monzed-elements-textPrimary transition-colors flex-shrink-0 leading-none"
              title={showDetails ? 'Hide details' : 'Show details'}
              style={{ marginBlockStart: '5px' }}
              aria-label={showDetails ? 'Collapse details' : 'Expand details'}
            >
              <div className="text-[10px] i-ph:caret-down" style={{ display: showDetails ? 'none' : 'block' }}></div>
              <div className="text-[10px] i-ph:caret-up" style={{ display: showDetails ? 'block' : 'none' }}></div>
            </button>
          )}
        </div>
      </div>
      
      {/* Expandable tool details section */}
      <AnimatePresence>
        {hasToolCalls && (
          <motion.div
            className="details"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: '0px' }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-monzed-elements-artifacts-borderColor h-[1px]" />

            <div className="px-3 py-3 text-left bg-monzed-elements-background-depth-2">
              <ToolCallsList
                toolInvocations={toolCalls}
                toolCallAnnotations={toolCallAnnotations}
                addToolResult={addToolResult}
                theme={theme}
              />
            </div>
          </motion.div>
        )}

        {hasToolResults && showDetails && (
          <motion.div
            className="details"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: '0px' }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-monzed-elements-artifacts-borderColor h-[1px]" />

            <div className="px-3 py-3 text-left bg-monzed-elements-background-depth-2">
              <ToolResultsList toolInvocations={toolResults} toolCallAnnotations={toolCallAnnotations} theme={theme} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const toolVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface ToolResultsListProps {
  toolInvocations: ToolInvocationUIPart[];
  toolCallAnnotations: ToolCallAnnotation[];
  theme: Theme;
}

const ToolResultsList = memo(({ toolInvocations, toolCallAnnotations, theme }: ToolResultsListProps) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <ul className="list-none space-y-4">
        {toolInvocations.map((tool, index) => {
          const toolCallState = tool.toolInvocation.state;

          if (toolCallState !== 'result') {
            return null;
          }

          const { toolName, toolCallId } = tool.toolInvocation;

          const annotation = toolCallAnnotations.find((annotation) => {
            return annotation.toolCallId === toolCallId;
          });

          const isErrorResult = [TOOL_NO_EXECUTE_FUNCTION, TOOL_EXECUTION_DENIED, TOOL_EXECUTION_ERROR].includes(
            tool.toolInvocation.result,
          );

          return (
            <motion.li
              key={index}
              variants={toolVariants}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.2,
                ease: cubicEasingFn,
              }}
            >
              <div className="flex items-center gap-1.5 text-xs mb-1">
                {isErrorResult ? (
                  <div className="text-lg text-monzed-elements-icon-error">
                    <div className="i-ph:x"></div>
                  </div>
                ) : (
                  <div className="text-lg text-monzed-elements-icon-success">
                    <div className="i-ph:check"></div>
                  </div>
                )}
                <div className="text-monzed-elements-textSecondary text-xs">Server:</div>
                <div className="text-monzed-elements-textPrimary font-semibold">{annotation?.serverName}</div>
              </div>

              <div className="ml-6 mb-2">
                <div className="text-monzed-elements-textSecondary text-xs mb-1">
                  Tool: <span className="text-monzed-elements-textPrimary font-semibold">{toolName}</span>
                </div>
                <div className="text-monzed-elements-textSecondary text-xs mb-1">
                  Description:{' '}
                  <span className="text-monzed-elements-textPrimary font-semibold">{annotation?.toolDescription}</span>
                </div>
                <div className="text-monzed-elements-textSecondary text-xs mb-1">Parameters:</div>
                <div className="bg-[#FAFAFA] dark:bg-[#0A0A0A] p-3 rounded-md">
                  <JsonCodeBlock className="mb-0" code={tool.toolInvocation.args} theme={theme} />
                </div>
                <div className="text-monzed-elements-textSecondary text-xs mt-3 mb-1">Result:</div>
                <div className="bg-[#FAFAFA] dark:bg-[#0A0A0A] p-3 rounded-md">
                  <JsonCodeBlock className="mb-0" code={tool.toolInvocation.result} theme={theme} />
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
});

interface ToolCallsListProps {
  toolInvocations: ToolInvocationUIPart[];
  toolCallAnnotations: ToolCallAnnotation[];
  addToolResult: ({ toolCallId, result }: { toolCallId: string; result: any }) => void;
  theme: Theme;
}

const ToolCallsList = memo(({ toolInvocations, toolCallAnnotations, addToolResult }: ToolCallsListProps) => {
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});

  // OS detection for shortcut display
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    const expandedState: { [id: string]: boolean } = {};
    toolInvocations.forEach((inv) => {
      if (inv.toolInvocation.state === 'call') {
        expandedState[inv.toolInvocation.toolCallId] = true;
      }
    });
    setExpanded(expandedState);
  }, [toolInvocations]);

  // Keyboard shortcut logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input/textarea/contenteditable
      const active = document.activeElement as HTMLElement | null;

      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
        return;
      }

      if (Object.keys(expanded).length === 0) {
        return;
      }

      const openId = Object.keys(expanded).find((id) => expanded[id]);

      if (!openId) {
        return;
      }

      // Cancel: Cmd/Ctrl + Backspace
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault();
        addToolResult({
          toolCallId: openId,
          result: TOOL_EXECUTION_APPROVAL.REJECT,
        });
      }

      // Run tool: Cmd/Ctrl + Enter
      if ((isMac ? e.metaKey : e.ctrlKey) && (e.key === 'Enter' || e.key === 'Return')) {
        e.preventDefault();
        addToolResult({
          toolCallId: openId,
          result: TOOL_EXECUTION_APPROVAL.APPROVE,
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded, addToolResult, isMac]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <ul className="list-none space-y-4">
        {toolInvocations.map((tool, index) => {
          const toolCallState = tool.toolInvocation.state;

          if (toolCallState !== 'call') {
            return null;
          }

          const { toolName, toolCallId } = tool.toolInvocation;
          const annotation = toolCallAnnotations.find((annotation) => annotation.toolCallId === toolCallId);

          return (
            <motion.li
              key={index}
              variants={toolVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.2, ease: cubicEasingFn }}
            >
              <div className="bg-monzed-elements-background-depth-3 rounded-lg p-2">
                <div key={toolCallId} className="flex gap-1">
                  <div className="flex flex-col items-center ">
                    <span className="mr-auto font-light font-normal text-md text-monzed-elements-textPrimary rounded-md">
                      {toolName}
                    </span>
                    <span className="text-xs text-monzed-elements-textSecondary font-light break-words max-w-64">
                      {annotation?.toolDescription}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2 ml-auto">
                    <button
                      className={classNames(
                        'h-10 px-2.5 py-1.5 rounded-lg text-xs h-auto',
                        'bg-transparent',
                        'text-monzed-elements-textTertiary hover:text-monzed-elements-textPrimary',
                        'transition-all duration-200',
                        'flex items-center gap-2',
                      )}
                      onClick={() =>
                        addToolResult({
                          toolCallId,
                          result: TOOL_EXECUTION_APPROVAL.REJECT,
                        })
                      }
                    >
                      Cancel
                    </button>
                    <button
                      className={classNames(
                        'h-10 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-normal rounded-lg transition-colors',
                        'bg-monzed-elements-background-depth-2 border border-monzed-elements-borderColor',
                        'text-accent-500 hover:text-monzed-elements-textPrimary',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      )}
                      onClick={() =>
                        addToolResult({
                          toolCallId,
                          result: TOOL_EXECUTION_APPROVAL.APPROVE,
                        })
                      }
                    >
                      Run tool
                    </button>
                  </div>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
});
