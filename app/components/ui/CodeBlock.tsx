import React, { useState, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { motion } from 'framer-motion';
import { codeToHtml } from '~/utils/highlighter';
import { FileIcon } from './FileIcon';
import { Tooltip } from './Tooltip';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  maxHeight?: string;
  className?: string;
  onCopy?: () => void;
}

export function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers = true,
  highlightLines = [],
  maxHeight = '400px',
  className,
  onCopy,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedLines, setHighlightedLines] = useState<string[]>([]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  useEffect(() => {
    const processCode = async () => {
      // Trim trailing empty lines from code
      const trimmedCode = code.replace(/\n+$/, '');
      
      if (language) {
        try {
          // Use prismAdapter to highlight the code
          const highlightedHTML = await codeToHtml(trimmedCode, { 
            lang: language, 
            theme: 'dark-plus' 
          });
          
          // Extract the inner content from the pre/code tags and split into lines
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = highlightedHTML;
          const codeElement = tempDiv.querySelector('code');
          
          if (codeElement) {
            // Split the highlighted content by lines, preserving HTML tags
            const highlightedContent = codeElement.innerHTML;
            const lines = highlightedContent.split('\n');
            setHighlightedLines(lines);
          } else {
            // Fallback to plain text lines
            setHighlightedLines(trimmedCode.split('\n'));
          }
        } catch (error) {
          console.warn('Error highlighting code:', error);
          // Fallback to plain text
          setHighlightedLines(trimmedCode.split('\n'));
        }
      } else {
        // No language specified, use plain text
        setHighlightedLines(trimmedCode.split('\n'));
      }
    };

    processCode();
  }, [code, language]);

  const lines = highlightedLines.length > 0 ? highlightedLines : code.replace(/\n+$/, '').split('\n');

  return (
    <div
      className={classNames(
        'rounded-lg overflow-hidden border border-monzed-elements-borderColor dark:border-monzed-elements-borderColor-dark',
        'bg-monzed-elements-background-depth-2 dark:bg-monzed-elements-background-depth-3',
        'max-w-full',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-monzed-elements-background-depth-3 dark:bg-monzed-elements-background-depth-4 border-b border-monzed-elements-borderColor dark:border-monzed-elements-borderColor-dark">
        <div className="flex items-center gap-2">
          {filename && (
            <>
              <FileIcon filename={filename} size="sm" />
              <span className="text-xs font-medium text-monzed-elements-textSecondary dark:text-monzed-elements-textSecondary-dark">
                {filename}
              </span>
            </>
          )}
          {language && !filename && (
            <span className="text-xs font-medium text-monzed-elements-textSecondary dark:text-monzed-elements-textSecondary-dark uppercase">
              {language}
            </span>
          )}
        </div>
        <Tooltip content={copied ? 'Copied!' : 'Copy code'}>
          <motion.button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-monzed-elements-textTertiary hover:text-monzed-elements-textSecondary dark:text-monzed-elements-textTertiary-dark dark:hover:text-monzed-elements-textSecondary-dark hover:bg-monzed-elements-background-depth-2 dark:hover:bg-monzed-elements-background-depth-3 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {copied ? (
              // Check icon (inline SVG)
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              // Copy icon (inline SVG)
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="9" y="9" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="5" y="3" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            )}
          </motion.button>
        </Tooltip>
      </div>

      {/* Code content */}
      <div
        className={classNames('overflow-y-auto overflow-x-hidden', 'font-mono text-sm', 'custom-scrollbar', 'max-w-full')}
        style={{ maxHeight }}
      >
        {/* Use flexbox layout for error/log messages and table for regular code */}
        {language === 'error' || language === 'log' || language === 'js' && (code.includes('Error') || code.includes('SyntaxError') || code.includes('TypeError') || code.includes('ReferenceError') || code.includes('Stack trace')) || (!language && (code.includes('Error') || code.includes('Exception') || code.includes('Stack trace'))) ? (
          <div className="p-4 space-y-1">
            {lines.map((line, index) => {
              const isErrorLine = line.includes('Error') || line.includes('Exception') || line.includes('SyntaxError');
              const isStackLine = line.includes('at ') || line.includes('stack trace');
              const isInfoLine = line.includes('Port:') || line.includes('File:') || line.includes('Line:');
              
              return (
                <div
                  key={index}
                  className={classNames(
                    'flex',
                    highlightLines.includes(index + 1) ? 'bg-red-500/10 dark:bg-red-500/20 px-2 py-1 rounded' : '',
                    isErrorLine ? 'bg-red-500/15 border-l-2 border-red-500 px-2 py-1 rounded-r' : '',
                    'hover:bg-monzed-elements-background-depth-3 dark:hover:bg-monzed-elements-background-depth-4 rounded px-1 py-0.5 transition-colors',
                  )}
                >
                  {showLineNumbers && (
                    <div className="flex-shrink-0 w-8 text-right pr-3 select-none text-monzed-elements-textTertiary dark:text-monzed-elements-textTertiary-dark text-xs">
                      {index + 1}
                    </div>
                  )}
                  <div className={classNames(
                    'flex-1 whitespace-pre-wrap break-words min-h-[1.25rem]',
                    isErrorLine ? 'text-red-700 dark:text-red-400 font-medium' : '',
                    isStackLine ? 'text-monzed-elements-textTertiary dark:text-monzed-elements-textTertiary-dark text-sm' : '',
                    isInfoLine ? 'text-blue-600 dark:text-blue-400' : '',
                    !isErrorLine && !isStackLine && !isInfoLine ? 'text-monzed-elements-textPrimary dark:text-monzed-elements-textPrimary-dark' : ''
                  )}>
                    {language ? (
                      <span dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
                    ) : (
                      line || '\u00A0'
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <table className="w-full table-fixed border-collapse">
            <tbody>
              {lines.map((line, index) => (
                <tr
                  key={index}
                  className={classNames(
                    highlightLines.includes(index + 1) ? 'bg-red-500/10 dark:bg-red-500/20' : '',
                    'hover:bg-monzed-elements-background-depth-3 dark:hover:bg-monzed-elements-background-depth-4',
                  )}
                >
                  {showLineNumbers && (
                    <td className="py-1 pl-4 pr-2 text-right select-none text-monzed-elements-textTertiary dark:text-monzed-elements-textTertiary-dark border-r border-monzed-elements-borderColor dark:border-monzed-elements-borderColor-dark bg-monzed-elements-background-depth-2 dark:bg-monzed-elements-background-depth-3">
                      <span className="inline-block min-w-[1.5rem] text-xs">{index + 1}</span>
                    </td>
                  )}
                  <td className="py-1 pl-4 pr-4 text-monzed-elements-textPrimary dark:text-monzed-elements-textPrimary-dark whitespace-pre-wrap break-words bg-monzed-elements-background-depth-2 dark:bg-monzed-elements-background-depth-3">
                    <div className="max-w-full break-words min-h-[1.25rem]">
                      {language ? (
                        <span dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
                      ) : (
                        line || '\u00A0'
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
