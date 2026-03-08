import { useState } from 'react';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import { webcontainer } from '~/lib/webcontainer';
import { path } from '~/utils/path';
// JSZip loaded dynamically to avoid circular dependency
import { saveAs } from 'file-saver';
import type { ActionCallbackData } from '~/lib/runtime/message-parser';

/**
 * Hook that builds the current project and downloads the build output as a ZIP
 * archive suitable for uploading to cPanel (public_html). It automatically
 * includes a `.htaccess` file with HTML5 History API rewrite rules and a
 * `README.txt` file with deployment instructions.
 */
export function useCpanelDeploy() {
  const [isDeploying, setIsDeploying] = useState(false);

  const handleCpanelDeploy = async () => {
    try {
      setIsDeploying(true);

      const artifact = workbenchStore.firstArtifact;

      if (!artifact) {
        toast.error('No active project found');
        return false;
      }

      // Create a deployment artifact for visual feedback
      const deploymentId = `deploy-cpanel-project`;
      workbenchStore.addArtifact({
        id: deploymentId,
        messageId: deploymentId,
        title: 'cPanel Deployment',
        type: 'standalone',
      });

      const deployArtifact = workbenchStore.artifacts.get()[deploymentId];

      // Notify that build is starting
      deployArtifact.runner.handleDeployAction('building', 'running');

      // Trigger build inside webcontainer
      const actionId = 'build-' + Date.now();
      const actionData: ActionCallbackData = {
        messageId: 'cpanel build',
        artifactId: artifact.id,
        actionId,
        action: {
          type: 'build' as const,
          content: 'npm run build',
        },
      };

      artifact.runner.addAction(actionData);
      await artifact.runner.runAction(actionData);

      if (!artifact.runner.buildOutput) {
        deployArtifact.runner.handleDeployAction('building', 'failed', {
          error: 'Build failed. Check the terminal for details.',
          source: 'netlify' as const,
        });
        toast.error('Build failed. Check the terminal for details.');
        return false;
      }

      // Notify that zipping is starting
      deployArtifact.runner.handleDeployAction('deploying', 'running');

      const container = await webcontainer;
      const buildPath = artifact.runner.buildOutput.path.replace('/home/project', '');

      // Attempt to find existing build directory
      let finalBuildPath = buildPath;
      const commonDirs = [buildPath, '/dist', '/build', '/out', '/output', '/.next', '/public'];
      let found = false;

      for (const dir of commonDirs) {
        try {
          await container.fs.readdir(dir);
          finalBuildPath = dir;
          found = true;
          break;
        } catch {
          // silently continue
        }
      }

      if (!found) {
        deployArtifact.runner.handleDeployAction('deploying', 'failed', {
          error: 'Could not find build output directory.',
        });
        toast.error('Could not find build output directory.');
        return false;
      }

      // Recursively collect all files under finalBuildPath
      async function getAllFiles(dirPath: string): Promise<Record<string, string>> {
        const files: Record<string, string> = {};
        const entries = await container.fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isFile()) {
            const content = await container.fs.readFile(fullPath, 'utf-8');
            const deployPath = fullPath.replace(finalBuildPath, '').replace(/^\//, '');
            files[deployPath] = content;
          } else if (entry.isDirectory()) {
            Object.assign(files, await getAllFiles(fullPath));
          }
        }

        return files;
      }

      const files = await getAllFiles(finalBuildPath);

      // Create ZIP archive (dynamic import to avoid circular dependency)
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const [relativePath, content] of Object.entries(files)) {
        zip.file(relativePath, content);
      }

      // Add .htaccess file for SPA routing
      const htaccessContent = `RewriteEngine On\nRewriteBase /\nRewriteRule ^index\\.html$ - [L]\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteCond %{REQUEST_FILENAME} !-l\nRewriteRule . /index.html [L]\n`;
      zip.file('.htaccess', htaccessContent);

      // Add README instructions
      const readmeContent = `How to deploy to cPanel (public_html)\n\n1. Extract the contents of this ZIP archive.\n2. Upload ALL extracted files and folders to your server's public_html directory using the cPanel File Manager or an FTP client.\n3. Ensure the included .htaccess file is located at the root of public_html so that single-page application routing works correctly.\n4. Once uploaded, navigate to your domain in a browser to verify the site loads.\n`;
      zip.file('README.txt', readmeContent);

      // Generate and download ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'cpanel-deployment.zip');

      deployArtifact.runner.handleDeployAction('complete', 'complete');

      toast.success('Build zipped and downloaded successfully.');
      return true;
    } catch (error) {
      console.error('cPanel deploy error:', error);
      toast.error(error instanceof Error ? error.message : 'Deployment failed');
      return false;
    } finally {
      setIsDeploying(false);
    }
  };

  return {
    isDeploying,
    handleCpanelDeploy,
  };
}
