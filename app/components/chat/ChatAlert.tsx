import { AnimatePresence, motion } from 'framer-motion';
import type { ActionAlert } from '~/types/actions';
import { classNames } from '~/utils/classNames';
import { getErrorContext } from '~/utils/error-context';

interface Props {
  alert: ActionAlert;
  clearAlert: () => void;
  postMessage: (message: string) => void;
}

export default function ChatAlert({ alert, clearAlert, postMessage }: Props) {
  const { description, content, source } = alert;

  const isPreview = source === 'preview';
  const title = isPreview ? 'Preview Error' : 'Terminal Error';
  const message = isPreview
    ? 'We encountered an error while running the preview. Would you like Starsky to analyze and help resolve this issue?'
    : 'We encountered an error while running terminal commands. Would you like Starsky to analyze and help resolve this issue?';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`alert-${alert.title}-${description}-${Date.now()}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`rounded-lg border border-monzed-elements-borderColor bg-monzed-elements-background-depth-2 p-4 mb-2`}
      >
        <div className="flex items-start">
          {/* Icon */}
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`i-ph:warning-duotone text-xl text-monzed-elements-button-danger-text`}></div>
          </motion.div>
          {/* Content */}
          <div className="ml-3 flex-1">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`text-sm font-medium text-monzed-elements-textPrimary`}
            >
              {title}
            </motion.h3>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`mt-2 text-sm text-monzed-elements-textSecondary`}
            >
              <p>{message}</p>
              {description && (
                <div className="text-xs text-monzed-elements-textSecondary p-2 bg-monzed-elements-background-depth-3 rounded mt-4 mb-4">
                  Error: {description}
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={classNames(' flex gap-2')}>
                <button
                  onClick={async () => {
                    const errorContext = await getErrorContext(alert);
                    
                    // Create a clean, user-friendly message with icons (no emojis)
                    const userMessage = `<span class="i-ph:wrench mr-1 align-middle"></span> Fix this '${isPreview ? 'preview' : 'terminal'}' error`;
                    
                    // Create expandable error details section (only essential info)
                    const errorDetails = `
<details>
<summary><span class="i-ph:clipboard-text mr-1 align-middle"></span> Error Details (Click to expand)</summary>

**Error:** ${description || 'Unknown error'}

<details>
<summary><span class="i-ph:monitor mr-1 align-middle"></span> Terminal Output (Click to expand)</summary>

\`\`\`${isPreview ? 'js' : 'sh'}
${content}
\`\`\`

</details>

</details>`;
                    
                    // Pass technical context as HTML comment (invisible to user, available to AI)
                    const messageWithContext = `${userMessage}${errorDetails}

<!--
${errorContext.replace(/TECHNICAL_CONTEXT_START\n|\nTECHNICAL_CONTEXT_END/g, '')}
-->`;
                    
                    postMessage(messageWithContext);
                  }}
                  className={classNames(
                    `px-2 py-1.5 rounded-md text-sm font-medium`,
                    'bg-monzed-elements-button-primary-background',
                    'hover:bg-monzed-elements-button-primary-backgroundHover',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-monzed-elements-button-danger-background',
                    'text-monzed-elements-button-primary-text',
                    'flex items-center gap-1.5',
                  )}
                >
                  <div className="i-ph:chat-circle-duotone"></div>
                  Quick Fix
                </button>
                <button
                  onClick={clearAlert}
                  className={classNames(
                    `px-2 py-1.5 rounded-md text-sm font-medium`,
                    'bg-monzed-elements-button-secondary-background',
                    'hover:bg-monzed-elements-button-secondary-backgroundHover',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-monzed-elements-button-secondary-background',
                    'text-monzed-elements-button-secondary-text',
                  )}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
