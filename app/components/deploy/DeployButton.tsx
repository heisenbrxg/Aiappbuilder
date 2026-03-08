import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useStore } from '@nanostores/react';
import { netlifyConnection } from '~/lib/stores/netlify';
import { vercelConnection } from '~/lib/stores/vercel';
import { workbenchStore } from '~/lib/stores/workbench';
import { streamingState } from '~/lib/stores/streaming';
import { classNames } from '~/utils/classNames';
import { useState } from 'react';
import { NetlifyDeploymentLink } from '~/components/chat/NetlifyDeploymentLink.client';
import { VercelDeploymentLink } from '~/components/chat/VercelDeploymentLink.client';
import { useVercelDeploy } from '~/components/deploy/VercelDeploy.client';
import { useNetlifyDeploy } from '~/components/deploy/NetlifyDeploy.client';
import { useAuthGuard } from '~/hooks/useAuthGuard';
import { useCpanelDeploy } from '~/components/deploy/CpanelDeploy.client';
import { useWordPressDeploy } from '~/components/deploy/WordPressDeploy.client';
import { useGitHubDeploy } from '~/components/deploy/GitHubDeploy.client';
import { GitHubDeploymentDialog } from '~/components/deploy/GitHubDeploymentDialog';

interface DeployButtonProps {
  onVercelDeploy?: () => Promise<void>;
  onNetlifyDeploy?: () => Promise<void>;
  onCpanelDeploy?: () => Promise<void>;
  onWordPressDeploy?: () => Promise<void>;
  onGitHubDeploy?: () => Promise<void>;
}

export const DeployButton = ({ onVercelDeploy, onNetlifyDeploy, onCpanelDeploy, onWordPressDeploy, onGitHubDeploy }: DeployButtonProps) => {
  const netlifyConn = useStore(netlifyConnection);
  const vercelConn = useStore(vercelConnection);
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployingTo, setDeployingTo] = useState<'netlify' | 'vercel' | 'cpanel' | 'wordpress' | 'github' | null>(null);
  const isStreaming = useStore(streamingState);
  const { requireAuth } = useAuthGuard();
  const { handleVercelDeploy } = useVercelDeploy();
  const { handleNetlifyDeploy } = useNetlifyDeploy();
  const { handleCpanelDeploy } = useCpanelDeploy();
  const { handleWordPressDeploy } = useWordPressDeploy();
  const { handleGitHubDeploy } = useGitHubDeploy();
  const [showGitHubDeploymentDialog, setShowGitHubDeploymentDialog] = useState(false);
  const [githubDeploymentFiles, setGithubDeploymentFiles] = useState<Record<string, string> | null>(null);
  const [githubProjectName, setGithubProjectName] = useState('');

  const handleVercelDeployClick = async () => {
    if (!requireAuth()) return;

    // Allow deployment for all plans including free
    // if (subscription?.plan === 'free') {
    //   toast.error('Deploy features are only available for paid plans. Please upgrade to continue.');
    //   return;
    // }

    // If not connected, trigger connection modal
    if (!vercelConn.user) {
      // Dispatch event to open control panel with connections tab
      window.dispatchEvent(new CustomEvent('openControlPanel', {
        detail: { initialTab: 'connection' }
      }));
      return;
    }

    setIsDeploying(true);
    setDeployingTo('vercel');

    try {
      if (onVercelDeploy) {
        await onVercelDeploy();
      } else {
        await handleVercelDeploy();
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  const handleNetlifyDeployClick = async () => {
    if (!requireAuth()) return;

    // Allow deployment for all plans including free
    // if (subscription?.plan === 'free') {
    //   toast.error('Deploy features are only available for paid plans. Please upgrade to continue.');
    //   return;
    // }

    // If not connected, trigger connection modal
    if (!netlifyConn.user) {
      // Dispatch event to open control panel with connections tab
      window.dispatchEvent(new CustomEvent('openControlPanel', {
        detail: { initialTab: 'connection' }
      }));
      return;
    }

    setIsDeploying(true);
    setDeployingTo('netlify');

    try {
      if (onNetlifyDeploy) {
        await onNetlifyDeploy();
      } else {
        await handleNetlifyDeploy();
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

    const handleCpanelDeployClick = async () => {
    if (!requireAuth()) return;

    // Allow deployment for all plans including free
    // if (subscription?.plan === 'free') {
    //   toast.error('Deploy features are only available for paid plans. Please upgrade to continue.');
    //   return;
    // }

    setIsDeploying(true);
    setDeployingTo('cpanel');

    try {
      if (onCpanelDeploy) {
        await onCpanelDeploy();
      } else {
        await handleCpanelDeploy();
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  const handleWordPressDeployClick = async () => {
    if (!requireAuth()) return;

    // Allow deployment for all plans including free
    // if (subscription?.plan === 'free') {
    //   toast.error('Deploy features are only available for paid plans. Please upgrade to continue.');
    //   return;
    // }
    
    setIsDeploying(true);
    setDeployingTo('wordpress');
    try {
      if (onWordPressDeploy) {
        await onWordPressDeploy();
      } else {
        await handleWordPressDeploy();
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  const handleGitHubDeployClick = async () => {
    if (!requireAuth()) return;

    setIsDeploying(true);
    setDeployingTo('github');

    try {
      if (onGitHubDeploy) {
        await onGitHubDeploy();
      } else {
        const result = await handleGitHubDeploy();
        
        if (result && result.success && result.files) {
          setGithubDeploymentFiles(result.files);
          setGithubProjectName(result.projectName);
          setShowGitHubDeploymentDialog(true);
        }
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  return (
    <>
      {showGitHubDeploymentDialog && githubDeploymentFiles && (
        <GitHubDeploymentDialog
          isOpen={showGitHubDeploymentDialog}
          onClose={() => {
            setShowGitHubDeploymentDialog(false);
            setGithubDeploymentFiles(null);
          }}
          projectName={githubProjectName}
          files={githubDeploymentFiles}
        />
      )}
    
    <div className="flex border border-monzed-elements-borderColor rounded-md overflow-hidden text-sm">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          disabled={isDeploying || !activePreview || isStreaming}
          className={classNames(
            "rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs bg-accent-500 text-white hover:text-white [&:not(:disabled,.disabled)]:hover:bg-monzed-elements-button-primary-backgroundHover outline-accent-500 flex gap-1.5"
          )}
        >
          {isDeploying ? (
            <>
              <span className="i-ph:spinner-gap w-3.5 h-3.5 animate-spin" />
              {`Deploying to ${deployingTo}...`}
            </>
          ) : (
            <>
              <span className="i-ph:rocket-launch w-3.5 h-3.5" />
              Deploy
            </>
          )}
          <span className={classNames('i-ph:caret-down transition-transform')} />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className={classNames(
            'z-[250]',
            'bg-monzed-elements-background-depth-2',
            'rounded-lg shadow-lg',
            'border border-monzed-elements-borderColor',
            'animate-in fade-in-0 zoom-in-95',
            'py-1',
          )}
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            className={classNames(
              'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-item-backgroundActive gap-2 rounded-md group relative',
              {
                'opacity-60 cursor-not-allowed': isDeploying || !activePreview,
              }
            )}
            disabled={isDeploying || !activePreview}
            onClick={handleNetlifyDeployClick}
          >
            <img
              className="w-5 h-5"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/netlify"
            />
            <span className="mx-auto">
              {!netlifyConn.user ? 'Connect to Netlify' : 'Deploy to Netlify'}
            </span>
            {netlifyConn.user && <NetlifyDeploymentLink />}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={classNames(
              'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-item-backgroundActive gap-2 rounded-md group relative',
              {
                'opacity-60 cursor-not-allowed': isDeploying || !activePreview,
              }
            )}
            disabled={isDeploying || !activePreview}
            onClick={handleVercelDeployClick}
          >
            <img
              className="w-5 h-5 bg-black p-1 rounded"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/vercel/white"
              alt="vercel"
            />
            <span className="mx-auto">
              {!vercelConn.user ? 'Connect to Vercel' : 'Deploy to Vercel'}
            </span>
            {vercelConn.user && <VercelDeploymentLink />}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={classNames(
              'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-item-backgroundActive gap-2 rounded-md group relative',
              {
                'opacity-60 cursor-not-allowed': isDeploying || !activePreview,
              }
            )}
            disabled={isDeploying || !activePreview}
            onClick={handleCpanelDeployClick}
          >
            <img
              className="w-5 h-5"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/cpanel"
              alt="cpanel"
            />
            <span className="mx-auto">
              Download Build for cPanel
            </span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={classNames(
              'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-item-backgroundActive gap-2 rounded-md group relative',
              {
                'opacity-60 cursor-not-allowed': isDeploying || !activePreview,
              }
            )}
            disabled={isDeploying || !activePreview}
            onClick={handleWordPressDeployClick}
          >
            <img
              className="w-5 h-5"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/wordpress"
              alt="wordpress"
            />
            <span className="mx-auto">
              Download WordPress Theme
            </span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={classNames(
              'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-item-backgroundActive gap-2 rounded-md group relative',
              {
                'opacity-60 cursor-not-allowed': isDeploying || !activePreview,
              }
            )}
            disabled={isDeploying || !activePreview}
            onClick={handleGitHubDeployClick}
          >
            <img
              className="w-5 h-5"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/github/white"
              alt="github"
            />
            <span className="mx-auto">
              Deploy to GitHub
            </span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
    </>
  );
};
