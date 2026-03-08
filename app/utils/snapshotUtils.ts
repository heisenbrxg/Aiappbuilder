import type { FileMap } from '~/lib/stores/files';
import type { Message } from 'ai';
import { generateId } from './fileUtils';
import { detectProjectCommands, createCommandActionsString } from './projectCommands';

/**
 * Generates a restoration message with bundled commands for a snapshot
 */
export async function createSnapshotRestoreMessage(files: FileMap): Promise<Message | null> {
  // Convert FileMap to file content array for project detection
  const fileContents = Object.entries(files)
    .filter(([_, dirent]) => dirent?.type === 'file')
    .map(([path, dirent]) => ({
      path,
      content: (dirent as any)?.content || '',
    }));

  // Detect project type and commands
  const commands = await detectProjectCommands(fileContents);
  
  if (!commands.setupCommand && !commands.startCommand) {
    return null;
  }

  // Create a bundled restore message with all necessary commands
  const restoreMessage: Message = {
    id: generateId(),
    role: 'assistant',
    content: `I'm restoring your project. Let me set up the development environment for you.

<boltArtifact id="restored-project-setup" title="Restoring Project" type="bundled">
${createCommandActionsString(commands)}
</boltArtifact>`,
    createdAt: new Date(),
  };

  return restoreMessage;
}

/**
 * Checks if a message contains restore artifacts
 */
export function isRestoreMessage(message: Message): boolean {
  const content = typeof message.content === 'string' 
    ? message.content 
    : (message.content as any)?.find((item: any) => item.type === 'text')?.text || '';
  
  return content.includes('id="restored-project-setup"');
}

/**
 * Filters out shell and start actions from previous messages to prevent re-execution
 */
export function filterOutExecutableActions(messages: Message[]): Message[] {
  return messages.map(message => {
    if (message.role !== 'assistant') {
      return message;
    }

    const content = typeof message.content === 'string' 
      ? message.content 
      : (message.content as any)?.find((item: any) => item.type === 'text')?.text || '';

    // Skip if it's a restore message
    if (isRestoreMessage(message)) {
      return message;
    }

    // Remove shell and start actions from content
    const filteredContent = content
      .replace(/<boltAction\s+type="shell"[^>]*>[\s\S]*?<\/boltAction>/g, '')
      .replace(/<boltAction\s+type="start"[^>]*>[\s\S]*?<\/boltAction>/g, '');

    return {
      ...message,
      content: typeof message.content === 'string' 
        ? filteredContent
        : [{ type: 'text', text: filteredContent }],
    };
  });
}
