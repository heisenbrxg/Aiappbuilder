import React, { useState } from 'react';
import { classNames } from '~/utils/classNames';
import { motion } from 'framer-motion';
import { Tooltip } from './Tooltip';

interface ErrorDisplayProps {
  error: string;
  title?: string;
  className?: string;
  showCopy?: boolean;
  compact?: boolean;
}

export function ErrorDisplay({ 
  error, 
  title = 'Error Details', 
  className,
  showCopy = true,
  compact = false 
}: ErrorDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(error);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatError = (errorText: string) => {
    // Split error into logical sections
    const lines = errorText.split('\n');
    const formattedLines: Array<{ type: 'error' | 'stack' | 'info' | 'code', content: string, highlight?: boolean }> = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        formattedLines.push({ type: 'info', content: '' });
        return;
      }
      
      // Error type detection
      if (trimmedLine.includes('Error:') || trimmedLine.includes('Exception:')) {
        formattedLines.push({ type: 'error', content: trimmedLine, highlight: true });
      } else if (trimmedLine.startsWith('at ') || trimmedLine.includes('stack trace')) {
        formattedLines.push({ type: 'stack', content: trimmedLine });
      } else if (trimmedLine.includes('Port:') || trimmedLine.includes('File:') || trimmedLine.includes('Line:')) {
        formattedLines.push({ type: 'info', content: trimmedLine });
      } else {
        formattedLines.push({ type: 'code', content: trimmedLine });
      }
    });
    
    return formattedLines;
  };

  const formattedError = formatError(error);

  const getLineStyle = (type: string, highlight?: boolean) => {
    const base = 'px-3 py-1 rounded-sm transition-colors';
    
    if (highlight) {
      return `${base} bg-red-500/15 border-l-2 border-red-500 text-red-700 dark:text-red-400`;
    }
    
    switch (type) {
      case 'error':
        return `${base} text-red-600 dark:text-red-400 font-medium`;
      case 'stack':
        return `${base} text-monzed-elements-textTertiary dark:text-monzed-elements-textTertiary-dark text-sm`;
      case 'info':
        return `${base} text-blue-600 dark:text-blue-400`;
      case 'code':
        return `${base} text-monzed-elements-textPrimary dark:text-monzed-elements-textPrimary-dark font-mono text-sm`;
      default:
        return `${base} text-monzed-elements-textPrimary dark:text-monzed-elements-textPrimary-dark`;
    }
  };

  return (
    <div
      className={classNames(
        'rounded-lg overflow-hidden border border-red-300 dark:border-red-600/50',
        'bg-red-50/50 dark:bg-red-950/30',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-red-100/70 dark:bg-red-900/50 border-b border-red-200 dark:border-red-600/30">
        <div className="flex items-center gap-2">
          <span className="i-ph:warning-circle w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-red-800 dark:text-red-300">
            {title}
          </span>
        </div>
        {showCopy && (
          <Tooltip content={copied ? 'Copied!' : 'Copy error'}>
            <motion.button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-200/50 dark:hover:bg-red-800/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? (
                <span className="i-ph:check w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <span className="i-ph:copy w-4 h-4" />
              )}
            </motion.button>
          </Tooltip>
        )}
      </div>

      {/* Error content */}
      <div className={classNames(
        'overflow-auto custom-scrollbar',
        compact ? 'max-h-40' : 'max-h-96',
        'p-3 space-y-1'
      )}>
        {formattedError.map((line, index) => (
          <div
            key={index}
            className={classNames(
              getLineStyle(line.type, line.highlight),
              'whitespace-pre-wrap break-words'
            )}
          >
            {line.content || '\u00A0'} {/* Non-breaking space for empty lines */}
          </div>
        ))}
      </div>
    </div>
  );
}
