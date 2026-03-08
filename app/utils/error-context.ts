import type { ActionAlert } from '~/types/actions';
import type { BoltPreviewError } from '~/types/errors';
import { webcontainer } from '~/lib/webcontainer';
import { usePreviewStore } from '~/lib/stores/previews';

export async function getErrorContext(alert: ActionAlert, actionRunner?: any): Promise<string> {
  try {
    // Extract error information from alert
    const { description, content, source } = alert;
    
    // Get terminal output - use the content from alert which contains the terminal output
    const terminalOutput = content || 'No terminal output available';

    // Retrieve related file content if available
    let fileContent = '';
    if ((alert as any).filePath) {
      try {
        const container = await webcontainer;
        fileContent = await container.fs.readFile((alert as any).filePath, 'utf-8');
      } catch (e) {
        fileContent = 'Error reading file content';
      }
    }

    // Get current PreviewInfo from the preview store
    let previewUrl = 'Unavailable';
    try {
      const previewStore = usePreviewStore();
      if (previewStore && previewStore.previews.get().length > 0) {
        const previews = previewStore.previews.get();
        previewUrl = previews[0]?.baseUrl || 'Unavailable';
      }
    } catch (e) {
      // Preview store might not be available in all contexts
      previewUrl = 'Unavailable';
    }

    // Get Vite version
    const viteVersion = getViteVersion();

    // Return ONLY technical context for AI (no user-visible formatting)
    // This will be added silently to the message for AI processing
    return `

TECHNICAL_CONTEXT_START
Environment: Vite ${viteVersion}, Preview: ${previewUrl}
Error: ${description}
Terminal Output: ${terminalOutput}
${fileContent ? `File Content: ${fileContent.slice(0, 1000)}${fileContent.length > 1000 ? '...[truncated]' : ''}` : ''}
TECHNICAL_CONTEXT_END`;
  } catch (error) {
    console.error('Error generating error context:', error);
    return 'TECHNICAL_CONTEXT_START\nError generating context\nTECHNICAL_CONTEXT_END';
  }
}

function getViteVersion(): string {
  try {
    // In browser environment, we can't directly require package.json
    // So we'll use a fallback or get it from build-time constants
    if (typeof window !== 'undefined') {
      return '5.4.19'; // From the package.json we saw earlier
    }
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}
