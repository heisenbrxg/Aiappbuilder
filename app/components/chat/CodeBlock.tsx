import { memo, useEffect, useState } from 'react';
import { codeToHtml } from '~/utils/highlighter';
import { classNames } from '~/utils/classNames';
import { createScopedLogger } from '~/utils/logger';

import styles from './CodeBlock.module.scss';

const logger = createScopedLogger('CodeBlock');

interface CodeBlockProps {
  className?: string;
  code: string;
  language?: string;
  theme?: 'light-plus' | 'dark-plus';
  disableCopy?: boolean;
}

export const CodeBlock = memo(
  ({ className, code, language = 'plaintext', theme = 'dark-plus', disableCopy = false }: CodeBlockProps) => {
    const [html, setHTML] = useState<string | undefined>(undefined);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
      if (copied) {
        return;
      }

      navigator.clipboard.writeText(code);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    };

    useEffect(() => {
      const highlightCode = async () => {
        const effectiveLanguage = language || 'plaintext';
        
        logger.trace(`Language = ${effectiveLanguage}`);

        try {
          // Use prismAdapter which handles language mapping and fallbacks automatically
          const highlightedHTML = await codeToHtml(code, { 
            lang: effectiveLanguage, 
            theme 
          });
          setHTML(highlightedHTML);
        } catch (error) {
          logger.warn(`Error highlighting code with language '${effectiveLanguage}':`, error);
          // Fallback to plain text if adapter fails
          const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          setHTML(`<pre class="language-plaintext"><code class="language-plaintext">${escaped}</code></pre>`);
        }
      };

      highlightCode();
    }, [code, language, theme]);

    return (
      <div className={classNames('relative group text-left', className)}>
        <div
          className={classNames(
            styles.CopyButtonContainer,
            'bg-transparant absolute top-[10px] right-[10px] rounded-md z-10 text-lg flex items-center justify-center opacity-0 group-hover:opacity-100',
            {
              'rounded-l-0 opacity-100': copied,
            },
          )}
        >
          {!disableCopy && (
            <button
              className={classNames(
                'flex items-center bg-accent-500 p-[6px] justify-center before:bg-white before:rounded-l-md before:text-gray-500 before:border-r before:border-gray-300 rounded-md transition-theme',
                {
                  'before:opacity-0': !copied,
                  'before:opacity-100': copied,
                },
              )}
              title="Copy Code"
              onClick={() => copyToClipboard()}
            >
              <div className="i-ph:clipboard-text-duotone"></div>
            </button>
          )}
        </div>
        <div dangerouslySetInnerHTML={{ __html: html ?? '' }}></div>
      </div>
    );
  },
);
