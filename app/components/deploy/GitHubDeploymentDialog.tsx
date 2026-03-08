import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { getLocalStorage } from '~/lib/persistence/localStorage';
import { logStore } from '~/lib/stores/logs';

interface GitHubDeploymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  files: Record<string, string>;
}

export function GitHubDeploymentDialog({ isOpen, onClose, projectName, files }: GitHubDeploymentDialogProps) {
  const [repoName, setRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState<'input' | 'deploying' | 'success'>('input');
  const [repoUrl, setRepoUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRepoName(projectName.replace(/\s+/g, '-').toLowerCase());
      setDeploymentStep('input');
    }
  }, [isOpen, projectName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const connection = getLocalStorage('github_connection');

    if (!connection?.token || !connection?.user) {
      toast.error('Please connect your GitHub account in Settings > Connections first');
      return;
    }

    if (!repoName.trim()) {
      toast.error('Repository name is required');
      return;
    }

    setIsLoading(true);
    setDeploymentStep('deploying');

    try {
      // Create repository
      const createResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${connection.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          private: isPrivate,
          auto_init: false,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json() as { message?: string };
        throw new Error(error.message || 'Failed to create repository');
      }

      const repo = await createResponse.json() as { html_url: string };
      setRepoUrl(repo.html_url);

      // Upload files to repository
      const fileEntries = Object.entries(files);
      let uploadedCount = 0;

      for (const [filePath, content] of fileEntries) {
        try {
          await fetch(`https://api.github.com/repos/${connection.user.login}/${repoName}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'Authorization': `Bearer ${connection.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Add ${filePath}`,
              content: btoa(unescape(encodeURIComponent(content))),
            }),
          });
          uploadedCount++;
        } catch (error) {
          console.warn(`Failed to upload ${filePath}:`, error);
        }
      }

      toast.success(`Successfully deployed ${uploadedCount} files to GitHub!`);
      setDeploymentStep('success');
    } catch (error) {
      logStore.logError('GitHub deployment failed', { error });
      toast.error(error instanceof Error ? error.message : 'Deployment failed');
      setDeploymentStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
        <Dialog.Content
          className={classNames(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'bg-monzed-elements-background-depth-1 rounded-lg shadow-xl',
            'w-full max-w-2xl max-h-[85vh] overflow-y-auto',
            'border border-monzed-elements-borderColor',
            'z-[101]',
            'p-6',
          )}
        >
          <Dialog.Title className="text-xl font-semibold text-monzed-elements-textPrimary mb-4">
            Deploy to GitHub
          </Dialog.Title>

          {deploymentStep === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-monzed-elements-textPrimary mb-2">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full px-3 py-2 bg-monzed-elements-background-depth-2 border border-monzed-elements-borderColor rounded-md text-monzed-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="my-awesome-project"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private-repo"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded border border-monzed-elements-borderColor bg-monzed-elements-background-depth-2 checked:bg-accent-500 checked:border-accent-500 focus:ring-2 focus:ring-accent-500 focus:ring-offset-0 cursor-pointer transition-colors"
                  style={{ accentColor: 'var(--color-accent-500)' }}
                />
                <label htmlFor="private-repo" className="text-sm text-monzed-elements-textPrimary cursor-pointer">
                  Make repository private
                </label>
              </div>

              <div className="bg-monzed-elements-background-depth-2 border border-monzed-elements-borderColor rounded-md p-4">
                <p className="text-sm text-monzed-elements-textSecondary">
                  {Object.keys(files).length} files will be deployed to your GitHub repository
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-monzed-elements-textPrimary bg-monzed-elements-background-depth-2 border border-monzed-elements-borderColor rounded-md hover:bg-monzed-elements-background-depth-3"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-accent-500 rounded-md hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deploying...' : 'Deploy to GitHub'}
                </button>
              </div>
            </form>
          )}

          {deploymentStep === 'deploying' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mb-4"></div>
              <p className="text-monzed-elements-textPrimary">Deploying to GitHub...</p>
              <p className="text-sm text-monzed-elements-textSecondary mt-2">This may take a moment</p>
            </div>
          )}

          {deploymentStep === 'success' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-monzed-elements-textPrimary mb-2">
                Deployment Successful!
              </h3>
              <p className="text-monzed-elements-textSecondary mb-4">
                Your project has been deployed to GitHub
              </p>
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium text-white bg-accent-500 rounded-md hover:bg-accent-600"
                >
                  View Repository
                </a>
              )}
              <button
                onClick={onClose}
                className="mt-4 text-sm text-monzed-elements-textSecondary hover:text-monzed-elements-textPrimary"
              >
                Close
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
