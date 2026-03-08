import ignore from 'ignore';
import { useGit } from '~/lib/hooks/useGit';
import type { Message } from 'ai';
import { createChatFromFolder } from '~/utils/folderImport';
import { workbenchStore } from '~/lib/stores/workbench';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import { RepositorySelectionDialog } from '~/components/@settings/tabs/connections/components/RepositorySelectionDialog';
import { classNames } from '~/utils/classNames';
import { Button } from '~/components/ui/Button';
import type { IChatMetadata } from '~/lib/persistence/db';
import { useAuthGuard } from '~/hooks/useAuthGuard';
import { useSubscription } from '~/lib/hooks/useSubscription';

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',

  // Include this so npm install runs much faster '**/*lock.json',
  '**/*lock.yaml',
];

const ig = ignore().add(IGNORE_PATTERNS);

const MAX_FILE_SIZE = 100 * 1024; // 100KB limit per file
const MAX_TOTAL_SIZE = 500 * 1024; // 500KB total limit

interface GitCloneButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[], metadata?: IChatMetadata) => Promise<void>;
}

export default function GitCloneButton({ importChat, className }: GitCloneButtonProps) {
  const { ready, gitClone } = useGit();
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { requireAuth } = useAuthGuard();
  const { subscription } = useSubscription();

    const handleClone = async (repoUrl: string) => {
    if (!ready) {
      return;
    }

    setLoading(true);

    try {
      const { workdir, data } = await gitClone(repoUrl);

            if (importChat) {
        const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));
        const textDecoder = new TextDecoder('utf-8');
        const textExtRegex = /\.(txt|md|astro|mjs|js|jsx|ts|tsx|json|html?|css|scss|less|yml|yaml|xml|svg|vue|svelte|c|cpp|h|hpp|java|py|go|rs|rb|php|sh|cfg|ini)$/i;
        const textArtifacts: { path: string; content: string }[] = [];
        const binaryFilePaths: string[] = [];
        let totalSize = 0;

        for (const filePath of filePaths) {
          const { data: fileData, encoding } = data[filePath];
          const fullPath = `${workdir}/${filePath}`;

          if (fileData instanceof Uint8Array && !textExtRegex.test(filePath) && encoding !== 'utf8') {
            // Binary file
            await workbenchStore.createFile(fullPath, fileData);
            binaryFilePaths.push(filePath);
            continue;
          }

          let textContent: string = '';

          if (typeof fileData === 'string') {
            textContent = fileData;
          } else {
            // Uint8Array case
            if (encoding === 'utf8' || textExtRegex.test(filePath)) {
              try {
                textContent = textDecoder.decode(fileData as Uint8Array);
              } catch {
                /* decoding failed -> treat as binary */
              }
            }
          }

          if (!textContent) {
            binaryFilePaths.push(filePath);
            continue;
          }
          await workbenchStore.createFile(fullPath, textContent);

          const fileSize = new TextEncoder().encode(textContent).length;

          // Respect size limits for AI payload, but always write to FS
          if (fileSize > MAX_FILE_SIZE || totalSize + fileSize > MAX_TOTAL_SIZE) {
            binaryFilePaths.push(filePath);
            continue;
          }

          totalSize += fileSize;
          textArtifacts.push({ path: filePath, content: textContent });
        }

        const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'repository';
        let messages = await createChatFromFolder(textArtifacts, binaryFilePaths, repoName);
        // Tweak first two messages to reference git repo rather than generic folder
        if (messages.length >= 2) {
          messages[0].content = `Clone the \"${repoName}\" repository from ${repoUrl}`;
          messages[1].content = messages[1].content.replace(`\"${repoName}\" folder`, `\"${repoName}\" repository cloned from ${repoUrl}`);
        }

        await importChat(`Git Project: ${repoName}`, messages);
      }
    } catch (error) {
      console.error('Error during import:', error);
      toast.error('Failed to import repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          if (!requireAuth()) return;
          if (subscription?.plan === 'free') {
            toast.error('Clone features are only available for paid plans. Please upgrade to continue.');
            return;
          }
          setIsDialogOpen(true);
        }}
        title="Clone a Git repository to start working on an existing project"
        variant="default"
        size="lg"
        className={classNames(
          'gap-2 monzed-glass border monzed-border-bright',
          'monzed-text-primary',
          'hover:border-monzed-accent/50 hover:shadow-[0_0_20px_rgba(244,211,94,0.2)]',
          'h-10 px-4 py-2 sm:min-w-[120px] justify-center rounded-xl',
          'transition-all duration-200 ease-in-out monzed-font-dm-sans',
          className,
          subscription?.plan === 'free' ? 'opacity-50 cursor-not-allowed' : ''
        )}
        disabled={!ready || loading || subscription?.plan === 'free'}
      >
        <span className="i-ph:github-logo w-4 h-4" />
        <span className="hidden sm:inline">Clone</span>
        {subscription?.plan === 'free' && <span className="i-ph:lock-simple ml-1" />}
      </Button>

      <RepositorySelectionDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSelect={handleClone} />

      {loading && <LoadingOverlay message="Please wait while we clone the repository..." />}
    </>
  );
}
