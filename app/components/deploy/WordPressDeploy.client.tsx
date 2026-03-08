import { useState } from 'react';
import { toast } from 'react-toastify';
// JSZip loaded dynamically to avoid circular dependency
import { saveAs } from 'file-saver';
import { workbenchStore } from '~/lib/stores/workbench';
import { description } from '~/lib/persistence';
import { webcontainer } from '~/lib/webcontainer';
import { path } from '~/utils/path';
import type { ActionCallbackData } from '~/lib/runtime/message-parser';
import { WPThemeBuilder } from '~/lib/services/wpThemeBuilder';
import type { FileMap } from '~/lib/stores/files';

/**
 * Hook that builds the current project and downloads the result as a WordPress theme ZIP.
 * The process:
 * 1. Run `npm run build` inside the WebContainer.
 * 2. Locate the generated build directory.
 * 3. Convert the built files to a WordPress theme using WPThemeBuilder.
 * 4. Zip and trigger download.
 */
export function useWordPressDeploy() {
  const [isDeploying, setIsDeploying] = useState(false);

  const handleWordPressDeploy = async () => {
    try {
      setIsDeploying(true);

      const artifact = workbenchStore.firstArtifact;
      if (!artifact) {
        toast.error('No active project found');
        return false;
      }

      // Create a deployment artifact for UI feedback
      const deploymentId = `deploy-wordpress-theme-${Date.now()}`;
      workbenchStore.addArtifact({
        id: deploymentId,
        messageId: deploymentId,
        title: 'WordPress Theme Export',
        type: 'standalone',
      });
      const deployArtifact = workbenchStore.artifacts.get()[deploymentId];
      deployArtifact.runner.handleDeployAction('building', 'running');

      // Build inside WebContainer
      const actionId = 'build-' + Date.now();
      const actionData: ActionCallbackData = {
        messageId: 'wordpress build',
        artifactId: artifact.id,
        actionId,
        action: { type: 'build', content: 'npm run build' },
      };

      artifact.runner.addAction(actionData);
      await artifact.runner.runAction(actionData);

      if (!artifact.runner.buildOutput) {
        deployArtifact.runner.handleDeployAction('building', 'failed', {
          error: 'Build failed. Check terminal logs.'
        });
        toast.error('Build failed. Check terminal logs.');
        return false;
      }

      // Collect built files
      deployArtifact.runner.handleDeployAction('deploying', 'running');

      const container = await webcontainer;
      const buildPath = artifact.runner.buildOutput.path.replace('/home/project', '');
      const candidateDirs = [buildPath, '/dist', '/build', '/out', '/output', '/.next', '/public'];
      let finalBuildPath = '';
      for (const dir of candidateDirs) {
        try {
          await container.fs.readdir(dir);
          finalBuildPath = dir;
          break;
        } catch {
          /* ignore */
        }
      }
      if (!finalBuildPath) {
        deployArtifact.runner.handleDeployAction('deploying', 'failed', {
          error: 'Could not locate build output directory.'
        });
        toast.error('Could not locate build output directory.');
        return false;
      }

      async function collectFiles(dirPath: string): Promise<Record<string, string>> {
        const out: Record<string, string> = {};
        const entries = await container.fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isFile()) {
            // For binary detection we just mark text for now; binary assets will still be copied fine as base64? We'll treat as string.
            const content = await container.fs.readFile(fullPath, 'utf-8');
            const rel = fullPath.replace(finalBuildPath, '').replace(/^\//, '');
            out[rel] = content;
          } else if (entry.isDirectory()) {
            Object.assign(out, await collectFiles(fullPath));
          }
        }
        return out;
      }

      const builtFiles = await collectFiles(finalBuildPath);

      // Convert to FileMap
      const fileMap: FileMap = {};
      for (const [rel, content] of Object.entries(builtFiles)) {
        fileMap[rel] = { type: 'file', content, isBinary: false }; // naive binary flag
      }

      const builder = new WPThemeBuilder();
      const projectName = (description.value ?? 'Digimetrix_project').split(' ').join('_');
      const themeFiles = await builder.buildTheme(fileMap, {
        themeName: projectName,
        author: 'Starsky AI',
        description: `Theme generated from Starsky project ${projectName}`,
        version: '1.0.0',
      });

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const [rel, content] of Object.entries(themeFiles)) {
        zip.file(rel, content);
      }

      const readme = `How to use this theme:\n1. In WordPress admin, go to Appearance > Themes > Add New.\n2. Upload this zip and activate.\n3. If the site uses client-side routing, set a homepage template or adjust permalinks as needed.`;
      zip.file('README.txt', readme);

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${projectName}-wordpress-theme.zip`);

      deployArtifact.runner.handleDeployAction('complete', 'complete');
      toast.success('WordPress theme downloaded!');
      return true;
    } catch (err) {
      console.error('WordPress deploy error', err);
      toast.error(err instanceof Error ? err.message : 'WordPress deployment failed');
      return false;
    } finally {
      setIsDeploying(false);
    }
  };

  return { isDeploying, handleWordPressDeploy };
}
