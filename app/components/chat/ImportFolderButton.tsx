import React, { useState } from 'react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { MAX_FILES, isBinaryFile, shouldIncludeFile } from '~/utils/fileUtils';
import { WORK_DIR } from '~/utils/constants';
import { workbenchStore } from '~/lib/stores/workbench';
import { createChatFromFolder } from '~/utils/folderImport';
import { logStore } from '~/lib/stores/logs'; // Assuming logStore is imported from this location
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { useAuthGuard } from '~/hooks/useAuthGuard';
import { setShowWorkbench, syncWorkbenchState } from '~/lib/stores/uiState';

interface ImportFolderButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  isFreePlan?: boolean;
}

export const ImportFolderButton: React.FC<ImportFolderButtonProps> = ({ className, importChat, isFreePlan }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { requireAuth } = useAuthGuard();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!requireAuth()) return;
    
    if (isFreePlan) {
      toast.error('Upload features are only available for paid plans. Please upgrade to continue.');
      e.target.value = '';
      return;
    }

    const allFiles = Array.from(e.target.files || []);

    const filteredFiles = allFiles.filter((file) => {
      const path = file.webkitRelativePath.split('/').slice(1).join('/');
      const include = shouldIncludeFile(path);

      return include;
    });

    if (filteredFiles.length === 0) {
      const error = new Error('No valid files found');
      logStore.logError('File import failed - no valid files', error, { folderName: 'Unknown Folder' });
      toast.error('No files found in the selected folder');

      return;
    }

    if (filteredFiles.length > MAX_FILES) {
      const error = new Error(`Too many files: ${filteredFiles.length}`);
      logStore.logError('File import failed - too many files', error, {
        fileCount: filteredFiles.length,
        maxFiles: MAX_FILES,
      });
      toast.error(
        `This folder contains ${filteredFiles.length.toLocaleString()} files. This product is not yet optimized for very large projects. Please select a folder with fewer than ${MAX_FILES.toLocaleString()} files.`,
      );

      return;
    }

    const folderName = filteredFiles[0]?.webkitRelativePath.split('/')[0] || 'Unknown Folder';
    setIsLoading(true);

    // Show workbench immediately for smooth UX (same as sending a message)
    workbenchStore.showWorkbench.set(true);
    setShowWorkbench(true);
    syncWorkbenchState();

    const loadingToast = toast.loading(`Importing ${folderName}...`);

    try {
      // Detect binaries up front
      const fileChecks = await Promise.all(
        filteredFiles.map(async (file) => ({
          file,
          isBinary: await isBinaryFile(file),
        })),
      );

            const textArtifacts: { path: string; content: string }[] = [];
      const binaryFilePaths: string[] = [];

      // Write every file to WebContainer FS
      await Promise.all(
        fileChecks.map(async ({ file, isBinary }) => {
          const relativePath = file.webkitRelativePath.split('/').slice(1).join('/');
          const fullPath = `${WORK_DIR}/${relativePath}`;

          if (isBinary) {
            const buffer = new Uint8Array(await file.arrayBuffer());
            await workbenchStore.createFile(fullPath, buffer);
            binaryFilePaths.push(relativePath);
          } else {
            const content = await file.text();
            await workbenchStore.createFile(fullPath, content);
            textArtifacts.push({ path: relativePath, content });
          }
        }),
      );

      if (textArtifacts.length === 0) {
        const error = new Error('No text files found');
        logStore.logError('File import failed - no text files', error, { folderName });
        toast.error('No text files found in the selected folder');

        return;
      }



            if (binaryFilePaths.length > 0) {
        logStore.logSystem('Stored binary files during import', {
          folderName,
          binaryCount: binaryFilePaths.length,
        });
        toast.info(`Stored ${binaryFilePaths.length} binary files`);
      }

      const messages = await createChatFromFolder(textArtifacts, binaryFilePaths, folderName);

      if (importChat) {
        await importChat(folderName, [...messages]);
      }

      logStore.logSystem('Folder imported successfully', {
        folderName,
        textFileCount: textArtifacts.length,
        binaryFileCount: binaryFilePaths.length,
      });
      toast.success('Folder imported successfully');
    } catch (error) {
      logStore.logError('Failed to import folder', error, { folderName });
      console.error('Failed to import folder:', error);
      toast.error('Failed to import folder');
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToast);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <>
      <input
        type="file"
        id="folder-import"
        className="hidden"
        webkitdirectory=""
        directory=""
        onChange={handleFileChange}
        {...({} as any)}
      />
      <Button
        onClick={() => {
          if (!requireAuth()) return;
          if (isFreePlan) {
            toast.error('Upload features are only available for paid plans. Please upgrade to continue.');
            return;
          }
          const input = document.getElementById('folder-import');
          input?.click();
        }}
        title="Upload a folder with your project files"
        variant="ghost"
        size="lg"
        className={classNames(
          'gap-2',
          'text-monzed-elements-textPrimary',
          'border border-monzed-elements-borderColor',
          'h-10 px-4 py-2 sm:min-w-[120px] justify-center',
          'transition-all duration-200 ease-in-out',
          className,
          isFreePlan ? 'opacity-50 cursor-not-allowed' : ''
        )}
        disabled={isLoading || isFreePlan}
      >
        <span className="i-ph:upload w-4 h-4" />
        <span className={isLoading ? '' : 'hidden sm:inline'}>{isLoading ? 'Uploading...' : 'Upload'}</span>
        {isFreePlan && <span className="i-ph:lock-simple ml-1" />}
      </Button>
    </>
  );
};
