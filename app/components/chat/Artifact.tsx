import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useEffect, useRef, useState } from 'react';
import { codeToHtml } from '~/utils/highlighter/prismAdapter';
import type { ActionState } from '~/lib/runtime/action-runner';
import { workbenchStore } from '~/lib/stores/workbench';
import { setShowWorkbench, syncWorkbenchState } from '~/lib/stores/uiState';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { WORK_DIR } from '~/utils/constants';
import { FileIcon } from '~/components/ui/FileIcon';


interface ArtifactProps {
  messageId: string;
  artifactId?: string;
}

export const Artifact = memo(({ messageId, artifactId }: ArtifactProps) => {
  const userToggledActions = useRef(false);
  const [showActions, setShowActions] = useState(false);
  const [allActionFinished, setAllActionFinished] = useState(false);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);

  const artifacts = useStore(workbenchStore.artifacts);
  const artifact = artifacts[artifactId || messageId];

  // Safety check: return null if artifact not found
  if (!artifact) {
    console.error('Artifact not found:', { artifactId, messageId, availableArtifacts: Object.keys(artifacts) });
    return null;
  }

  const actions = useStore(
    computed(artifact.runner.actions, (actions) => {
      // Filter out Supabase actions except for migrations
      return Object.values(actions).filter((action) => {
        // Exclude actions with type 'supabase' or actions that contain 'supabase' in their content
        return action.type !== 'supabase' && !(action.type === 'shell' && action.content?.includes('supabase'));
      });
    }),
  );

  const toggleActions = () => {
    userToggledActions.current = true;
    setShowActions(!showActions);
  };

  // Rotate through running actions
  useEffect(() => {
    if (!allActionFinished && actions.length > 0) {
      const runningActions = actions.filter(a => a.status === 'running' || a.status === 'pending');
      if (runningActions.length > 0) {
        const interval = setInterval(() => {
          setCurrentActionIndex((prev) => (prev + 1) % runningActions.length);
        }, 2000); // Change every 2 seconds
        return () => clearInterval(interval);
      }
    }
  }, [actions, allActionFinished]);

  useEffect(() => {
    if (actions.length !== 0 && artifact.type === 'bundled') {
      const finished = !actions.find(
        (action) => action.status !== 'complete' && !(action.type === 'start' && action.status === 'running'),
      );

      if (allActionFinished !== finished) {
        setAllActionFinished(finished);
      }
    }
  }, [actions, artifact.type, allActionFinished]);

  // Determine the dynamic title based on state for bundled artifacts
  const dynamicTitle =
    artifact?.type === 'bundled'
      ? allActionFinished
        ? artifact.id === 'restored-project-setup'
          ? 'Project Restored' // Title when restore is complete
          : 'Project Created' // Title when initial creation is complete
        : artifact.id === 'restored-project-setup'
          ? 'Restoring Project...' // Title during restore
          : 'Creating Project...' // Title during initial creation
      : artifact?.title; // Fallback to original title for non-bundled or if artifact is missing

  // Get current running action for rotation
  const runningActions = actions.filter(a => a.status === 'running' || a.status === 'pending');
  const currentRunningAction = runningActions[currentActionIndex % runningActions.length];
  
  // Get action display text
  const getActionText = (action: ActionState) => {
    if (action.type === 'file') {
      const fileName = action.filePath.split('/').pop();
      return `Create ${fileName}`;
    } else if (action.type === 'shell') {
      return 'Installing dependencies';
    } else if (action.type === 'start') {
      return 'Starting application';
    } else if (action.type === 'build') {
      return 'Building project';
    }
    return 'Processing...';
  };

  return (
    <>
      <div className="artifact w-full">
        {/* Shimmer text with icon - similar to "Thinking..." */}
        <div className="flex items-center gap-1.5 py-1">
          <div className="text-sm text-monzed-elements-textSecondary" style={{ marginBlockStart: '5px' }}>
            {allActionFinished ? (
              <div className="i-ph:check-circle"></div>
            ) : (
              <div className="i-ph:sparkle"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 flex items-center gap-1">
            <h3 
              className={classNames(
                'text-sm font-medium leading-tight truncate',
                allActionFinished 
                  ? 'text-monzed-elements-textPrimary'
                  : 'bg-gradient-to-r from-monzed-elements-textPrimary via-monzed-elements-textSecondary to-monzed-elements-textPrimary bg-clip-text text-transparent animate-shimmer'
              )}
              style={{ backgroundSize: '200% 100%' }}
            >
              {artifact?.title || dynamicTitle}
            </h3>
            
            {/* Dropdown toggle button - right next to title */}
            {actions.length > 0 && (
              <button
                onClick={toggleActions}
                className="text-monzed-elements-textSecondary hover:text-monzed-elements-textPrimary transition-colors flex-shrink-0 leading-none"
                title={showActions ? 'Hide actions' : 'Show actions'}
                style={{ marginBlockStart: '5px' }}
              >
                <div className="text-[10px] i-ph:caret-down" style={{ display: showActions ? 'none' : 'block' }}></div>
                <div className="text-[10px] i-ph:caret-up" style={{ display: showActions ? 'block' : 'none' }}></div>
              </button>
            )}
          </div>
        </div>
        
        {/* Rotating action text - on separate line */}
        <div className="pl-7">
          <AnimatePresence mode="wait">
            {!allActionFinished && currentRunningAction ? (
              <motion.div
                key={currentActionIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-monzed-elements-textSecondary bg-gradient-to-r from-monzed-elements-textSecondary via-monzed-elements-textTertiary to-monzed-elements-textSecondary bg-clip-text text-transparent animate-shimmer truncate"
                style={{ backgroundSize: '200% 100%' }}
              >
                {getActionText(currentRunningAction)}
              </motion.div>
            ) : allActionFinished ? (
              <button
                onClick={() => {
                  const showWorkbench = workbenchStore.showWorkbench.get();
                  workbenchStore.showWorkbench.set(!showWorkbench);
                  setShowWorkbench(!showWorkbench);
                  syncWorkbenchState();
                }}
                className="text-xs text-monzed-elements-textSecondary hover:text-monzed-accent transition-colors text-left px-2 py-1 rounded bg-transparent hover:bg-monzed-elements-background-depth-2"
              >
                Click to open/hide preview
              </button>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Expandable actions list */}
        <AnimatePresence>
          {showActions && actions.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pl-8 pr-4 pb-2 pt-1">
                <ActionList actions={actions} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

interface ShellCodeBlockProps {
  classsName?: string;
  code: string;
}

function ShellCodeBlock({ classsName, code }: ShellCodeBlockProps) {
  const [highlightedCode, setHighlightedCode] = useState<string>('');

  useEffect(() => {
    const highlightCode = async () => {
      try {
        const highlighted = await codeToHtml(code, { lang: 'shell', theme: 'light-plus' });
        setHighlightedCode(highlighted);
      } catch (error) {
        console.warn('Error highlighting shell code:', error);
        const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        setHighlightedCode(`<pre class="language-bash"><code class="language-bash">${escaped}</code></pre>`);
      }
    };
    
    highlightCode();
  }, [code]);

  return (
    <div
      className={classNames('text-xs', classsName)}
      dangerouslySetInnerHTML={{
        __html: highlightedCode,
      }}
    ></div>
  );
}

interface ActionListProps {
  actions: ActionState[];
}

const actionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function openArtifactInWorkbench(filePath: any) {
  if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${filePath}`);
}

const ActionList = memo(({ actions }: ActionListProps) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <ul className="list-none space-y-2.5">
        {actions.map((action, index) => {
          const { status, type, content } = action;
          const isLast = index === actions.length - 1;

          return (
            <motion.li
              key={index}
              variants={actionVariants}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.2,
                ease: cubicEasingFn,
              }}
            >
              <div className="flex items-center gap-1.5 text-sm">
                <div className={classNames('text-lg', getIconColor(action.status))}>
                  {status === 'running' ? (
                    <>
                      {type !== 'start' ? (
                        <div className="i-svg-spinners:90-ring-with-bg"></div>
                      ) : (
                        <div className="i-ph:terminal-window-duotone"></div>
                      )}
                    </>
                  ) : status === 'pending' ? (
                    <div className="i-ph:circle-duotone"></div>
                  ) : status === 'complete' ? (
                    <div className="i-ph:check"></div>
                  ) : status === 'failed' || status === 'aborted' ? (
                    <div className="i-ph:x"></div>
                  ) : null}
                </div>
                {type === 'file' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-monzed-elements-textSecondary">Create</span>
                    <code
                      className="bg-monzed-elements-artifacts-inlineCode-background text-monzed-elements-artifacts-inlineCode-text px-2 py-1.5 rounded-md text-monzed-elements-item-contentAccent hover:underline cursor-pointer flex items-center gap-2 transition-all hover:bg-monzed-elements-artifacts-inlineCode-background/80"
                      onClick={() => openArtifactInWorkbench(action.filePath)}
                    >
                      <FileIcon filename={action.filePath} className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">{action.filePath}</span>
                    </code>
                  </div>
                ) : type === 'shell' ? (
                  <div className="flex items-center w-full min-h-[28px]">
                    <span className="flex-1">Run command</span>
                  </div>
                ) : type === 'start' ? (
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      workbenchStore.currentView.set('preview');
                    }}
                    className="flex items-center w-full min-h-[28px]"
                  >
                    <span className="flex-1">Start Application</span>
                  </a>
                ) : null}
              </div>
              {(type === 'shell' || type === 'start') && (
                <ShellCodeBlock
                  classsName={classNames('mt-1', {
                    'mb-3.5': !isLast,
                  })}
                  code={content}
                />
              )}
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
});

function getIconColor(status: ActionState['status']) {
  switch (status) {
    case 'pending': {
      return 'text-monzed-elements-textTertiary';
    }
    case 'running': {
      return 'text-monzed-elements-loader-progress';
    }
    case 'complete': {
      return 'text-monzed-elements-textPrimary';
    }
    case 'aborted': {
      return 'text-monzed-elements-textSecondary';
    }
    case 'failed': {
      return 'text-monzed-elements-icon-error';
    }
    default: {
      return undefined;
    }
  }
}
