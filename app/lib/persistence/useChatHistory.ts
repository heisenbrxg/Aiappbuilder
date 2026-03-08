import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { useState, useEffect, useCallback } from 'react';
import { atom } from 'nanostores';
import { generateId, type JSONValue, type Message } from 'ai';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import { setShowWorkbench, syncWorkbenchState } from '~/lib/stores/uiState';
import { logStore } from '~/lib/stores/logs'; // Import logStore
import {
  getMessages,
  getNextId,
  getUrlId,
  generateUniqueUrlId,
  openDatabase,
  setMessages,
  duplicateChat,
  createChatFromMessages,
  getSnapshot,
  setSnapshot,
  type IChatMetadata,
} from './db';
import { SupabaseDB } from './supabaseDb';
import { billingService } from '~/lib/billing/billingService';
import type { FileMap } from '~/lib/stores/files';
import type { Snapshot } from './types';
import { webcontainer } from '~/lib/webcontainer';
import { detectProjectCommands, createCommandActionsString } from '~/utils/projectCommands';
import type { ContextAnnotation } from '~/types/context';
import { useAuth } from '~/components/auth/AuthProvider';
import { generateChatUrlId } from '~/utils/fileUtils';
import { createSnapshotRestoreMessage, filterOutExecutableActions } from '~/utils/snapshotUtils';

function normalizeMessageContent(m: Message): Message {
  // Ensure message.content is a plain string for user/assistant messages
  if (Array.isArray(m.content)) {
    const textPart = (m.content as any).find((item: any) => item && item.type === 'text');
    const text = typeof textPart?.text === 'string' ? textPart.text : String(textPart?.text ?? '');
    return { ...m, content: text } as Message;
  }
  if (typeof m.content !== 'string') {
    return { ...m, content: String((m as any).content ?? '') } as Message;
  }
  return m;
}

export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: Message[];
  timestamp: string;
  metadata?: IChatMetadata;
}

const persistenceEnabled = !import.meta.env.VITE_DISABLE_PERSISTENCE;

export const db = persistenceEnabled ? await openDatabase() : undefined;

export const chatId = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);
export const chatMetadata = atom<IChatMetadata | undefined>(undefined);
export function useChatHistory() {
  const navigate = useNavigate();
  const loaderData = useLoaderData<{ id?: string }>();
  const { id: mixedId } = loaderData || {};
  const [searchParams] = useSearchParams();

  const [archivedMessages, setArchivedMessages] = useState<Message[]>([]);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [urlId, setUrlId] = useState<string | undefined>();
  const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false);
  const [lastProcessedMessages, setLastProcessedMessages] = useState<string>('');
  const { user } = useAuth();
  const supabaseDB = new SupabaseDB();

  useEffect(() => {
    const abortController = new AbortController();

    const loadChatData = async () => {
      if (!mixedId) {
        setReady(true);
        return;
      }

      // Check if the request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      try {
        if (user) {
          // Load from Supabase when authenticated (primary SaaS flow)
          const [storedMessages, snapshot] = await Promise.all([
            supabaseDB.getMessages(user.id, mixedId),
            supabaseDB.getSnapshot(user.id, mixedId)
          ]);

          if (storedMessages && storedMessages.messages.length > 0) {
            // Set the chatId atom for authenticated users
            chatId.set(storedMessages.id);
            setUrlId(storedMessages.url_id);

            // Convert Supabase snapshot to IndexedDB format
            const validSnapshot = snapshot ? {
              chatIndex: snapshot.snapshot_message_id || '',  // Use correct field
              files: snapshot.files || {},
              summary: snapshot.summary
            } : { chatIndex: '', files: {} };

            const rewindId = searchParams.get('rewindTo');
            let startingIdx = -1;
            const endingIdx = rewindId
              ? storedMessages.messages.findIndex((m) => m.id === rewindId) + 1
              : storedMessages.messages.length;
            const snapshotIndex = storedMessages.messages.findIndex((m) => m.id === validSnapshot.chatIndex);

            if (snapshotIndex >= 0 && snapshotIndex < endingIdx) {
              startingIdx = snapshotIndex;
            }

            if (snapshotIndex > 0 && storedMessages.messages[snapshotIndex].id == rewindId) {
              startingIdx = -1;
            }

            let filteredMessages = storedMessages.messages.slice(startingIdx + 1, endingIdx);
            let archivedMessages: Message[] = [];

            if (startingIdx >= 0) {
              archivedMessages = storedMessages.messages.slice(0, startingIdx + 1);
            }

            // Filter out shell and start actions from previous messages
            let processedMessages = filterOutExecutableActions(filteredMessages);
            
            setArchivedMessages(archivedMessages);
            
            if (validSnapshot?.files && Object.keys(validSnapshot.files).length > 0) {
              await restoreSnapshot(mixedId, validSnapshot);
              if (snapshot?.locked_files) {
                Object.entries(snapshot.locked_files).forEach(([p, s]) => {
                  if ((s as any)?.isLocked) {
                    workbenchStore.lockFile(p);
                  }
                });
              }
            }
            processedMessages = storedMessages.messages;
            
            const normalizedProcessed = processedMessages.map(normalizeMessageContent);
            setInitialMessages(normalizedProcessed);
            setUrlId(storedMessages.url_id);
            description.set(storedMessages.description || '');
            chatMetadata.set(storedMessages.metadata || { gitUrl: '' });
          } else {
            navigate('/', { replace: true });
          }
        } else if (db) {
          // Limited IndexedDB fallback for non-authenticated users (basic functionality only)
          // Note: Deploy and advanced features require authentication
          const [storedMessages, snapshot] = await Promise.all([
            getMessages(db, mixedId),
            getSnapshot(db, mixedId)
          ]);

          if (storedMessages && storedMessages.messages.length > 0) {
            // Set the chatId atom for IndexedDB users (limited functionality)
            chatId.set(storedMessages.id);
            
            // Process IndexedDB data (same logic as before)
            const validSnapshot = snapshot || { chatIndex: '', files: {} };
            const rewindId = searchParams.get('rewindTo');
            let startingIdx = -1;
            const endingIdx = rewindId
              ? storedMessages.messages.findIndex((m) => m.id === rewindId) + 1
              : storedMessages.messages.length;
            const snapshotIndex = storedMessages.messages.findIndex((m) => m.id === validSnapshot.chatIndex);

            if (snapshotIndex >= 0 && snapshotIndex < endingIdx) {
              startingIdx = snapshotIndex;
            }

            if (snapshotIndex > 0 && storedMessages.messages[snapshotIndex].id == rewindId) {
              startingIdx = -1;
            }

            let filteredMessages = storedMessages.messages.slice(startingIdx + 1, endingIdx);
            let archivedMessages: Message[] = [];

            if (startingIdx >= 0) {
              archivedMessages = storedMessages.messages.slice(0, startingIdx + 1);
            }

            // Filter out shell and start actions from previous messages
            let processedMessages = filterOutExecutableActions(filteredMessages);
            
            setArchivedMessages(archivedMessages);
            
            // Load files from snapshot and restore to WebContainer (like bolt.diy-main)
            if (startingIdx > 0 && validSnapshot?.files && Object.keys(validSnapshot.files).length > 0) {
              // Create inline restoration message with files AND commands (like bolt.diy-main)
              const files = Object.entries(validSnapshot.files)
                .filter(([_, value]) => value?.type === 'file')
                .map(([path, dirent]) => ({ content: (dirent as any)?.content || '', path }));
              
              const projectCommands = await detectProjectCommands(files);
              const commandActionsString = createCommandActionsString(projectCommands);

              // Create restore message with both files and commands inline
              const restoreMessages: Message[] = [
                {
                  id: generateId(),
                  role: 'user',
                  content: `Restore project from snapshot`,
                  annotations: ['no-store', 'hidden'] as any,
                },
                {
                  id: storedMessages.messages[snapshotIndex].id,
                  role: 'assistant',
                  content: `monzed Restored your chat from a snapshot. You can revert this message to load the full chat history.
                  <boltArtifact id="restored-project-setup" title="Restored Project & Setup" type="bundled">
                  ${Object.entries(validSnapshot.files)
                    .map(([key, value]) => {
                      if (value?.type === 'file') {
                        return `
                      <boltAction type="file" filePath="${key}">
${(value as any).content}
                      </boltAction>
                      `;
                      }
                      return '';
                    })
                    .join('\n')}
                  ${commandActionsString}
                  </boltArtifact>
                  `,
                  annotations: ['no-store'] as any,
                },
              ];

              // Add restore messages at the beginning
              processedMessages = [...restoreMessages, ...processedMessages];
              
              // CRITICAL: Write files to WebContainer filesystem (like bolt.diy-main)
              restoreSnapshot(mixedId, validSnapshot);
            }
            
            const normalizedProcessed = processedMessages.map(normalizeMessageContent);
            setInitialMessages(normalizedProcessed);
            setUrlId(storedMessages.urlId);
            description.set(storedMessages.description || '');
            chatMetadata.set(storedMessages.metadata || { gitUrl: '' });
          } else {
            navigate('/', { replace: true });
          }
        }

        setReady(true);
      } catch (error) {
        // Don't show error if the request was aborted
        if (abortController.signal.aborted) {
          return;
        }
        console.error('Failed to load chat data:', error);
        logStore.logError('Failed to load chat messages or snapshot', error);
        toast.error('Failed to load chat: ' + (error instanceof Error ? error.message : 'Unknown error'));
        navigate('/', { replace: true });
      }
    };

    loadChatData();

    // Cleanup function to abort the request if component unmounts or dependencies change
    return () => {
      abortController.abort();
    };
  }, [mixedId, db, navigate, searchParams]); // Added db, navigate, searchParams dependencies

  const takeSnapshot = useCallback(
    async (chatIdx: string, files: FileMap, _chatId?: string | undefined, chatSummary?: string) => {
      try {
        // Only save snapshot if there are actual files to save
        const hasFiles = Object.keys(files).length > 0;
        if (!hasFiles) {
          return;
        }

        if (user && urlId) {
          // Use Supabase when authenticated - we need to get the chat ID first
          const chat = await supabaseDB.getMessages(user.id, urlId);
          if (chat) {
            // Extract locked files from the FileMap
            const lockedFiles = Object.entries(files)
              .filter(([_, file]) => file?.type === 'file' && file.isLocked)
              .reduce((acc, [path, file]) => {
                if (file && file.type === 'file') {
                  return {
                    ...acc,
                    [path]: { 
                      isLocked: file.isLocked, 
                      lockedByFolder: file.lockedByFolder 
                    }
                  };
                }
                return acc;
              }, {});

            await supabaseDB.setSnapshot(
              user.id, 
              chat.id, 
              files, 
              lockedFiles,
              chatIdx,  // Pass snapshot message ID
              chatSummary
            );
          }
        } else if (db) {
          // Fallback to IndexedDB when not authenticated
          const id = chatId.get();
          if (!id) {
            return;
          }

          const snapshot: Snapshot = {
            chatIndex: chatIdx,
            files,
            summary: chatSummary,
          };

          await setSnapshot(db, id, snapshot);
        }
      } catch (error) {
        console.error('Failed to save snapshot:', error);
        toast.error('Failed to save chat snapshot.');
      }
    },
    [user, urlId, db],
  );

  const restoreSnapshot = useCallback(async (id: string, snapshot?: Snapshot) => {
    // const snapshotStr = localStorage.getItem(`snapshot:${id}`); // Remove localStorage usage
    const container = await webcontainer;

    const validSnapshot = snapshot || { chatIndex: '', files: {} };

    if (!validSnapshot?.files) {
      return;
    }

    Object.entries(validSnapshot.files).forEach(async ([key, value]) => {
      if (key.startsWith(container.workdir)) {
        key = key.replace(container.workdir, '');
      }

      if (value?.type === 'folder') {
        await container.fs.mkdir(key, { recursive: true });
      }
    });
    Object.entries(validSnapshot.files).forEach(async ([key, value]) => {
      if (value?.type === 'file') {
        if (key.startsWith(container.workdir)) {
          key = key.replace(container.workdir, '');
        }

        await container.fs.writeFile(key, value.content, { encoding: value.isBinary ? undefined : 'utf8' });
      } else {
      }
    });

    // Automatically reveal the workbench so the user sees the restored project
    workbenchStore.showWorkbench.set(true);
    setShowWorkbench(true);
    syncWorkbenchState();
  }, []);

  return {
    ready: !mixedId || ready,
    initialMessages,
    updateChatMestaData: async (metadata: IChatMetadata) => {
      if (!urlId) {
        return;
      }

      try {
        if (user) {
          // Use Supabase when authenticated
          await supabaseDB.updateChatMetadata(user.id, urlId, metadata);
        } else if (db) {
          // Fallback to IndexedDB when not authenticated
          const id = chatId.get();
          if (id) {
            await setMessages(db, id, initialMessages, urlId, description.get(), undefined, metadata);
          }
        }
        chatMetadata.set(metadata);
      } catch (error) {
        toast.error('Failed to update chat metadata');
        console.error(error);
      }
    },
    storeMessageHistory: async (messages: Message[]) => {
      if (messages.length === 0) {
        return;
      }

      // Prevent duplicate processing of the same messages
      const messagesHash = JSON.stringify(messages.map(m => ({ id: m.id, content: m.content, role: m.role })));
      if (messagesHash === lastProcessedMessages) {
        return;
      }
      setLastProcessedMessages(messagesHash);

      const { firstArtifact } = workbenchStore;
      messages = messages.filter((m) => !m.annotations?.includes('no-store'));

      let _urlId = urlId;

      try {
        if (user) {
          // Use Supabase when authenticated
          if (!urlId && firstArtifact?.id && !isCreatingChat) {
            // Prevent duplicate chat creation with atomic flag
            setIsCreatingChat(true);
            try {
              console.log('Creating new chat for user:', user.id);
              // Generate a unique URL ID for new chats using Supabase's unique check
              _urlId = await supabaseDB.generateUniqueUrlId(user.id);
              console.log('Generated URL ID:', _urlId);
              navigateChat(_urlId);
              setUrlId(_urlId);
            } catch (error) {
              console.error('Failed to create new chat:', error);
              throw error;
            } finally {
              setIsCreatingChat(false);
            }
          }

          let chatSummary: string | undefined = undefined;
          const lastMessage = messages[messages.length - 1];

          if (lastMessage.role === 'assistant') {
            const annotations = lastMessage.annotations as JSONValue[];
            const filteredAnnotations = (annotations?.filter(
              (annotation: JSONValue) =>
                annotation && typeof annotation === 'object' && Object.keys(annotation).includes('type'),
            ) || []) as { type: string; value: any } & { [key: string]: any }[];

            if (filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')) {
              chatSummary = filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')?.summary;
            }
          }

          if (!description.get() && firstArtifact?.title) {
            description.set(firstArtifact?.title);
          }

          // Save messages to Supabase and get chat ID
          const { urlId: savedUrlId, chatId: supabaseChatId } = await supabaseDB.setMessages(
            user.id,
            [...archivedMessages, ...messages],
            _urlId,
            description.get(),
            chatMetadata.get(),
          );

          // Set the chatId atom for authenticated users
          chatId.set(supabaseChatId);

          // Track message usage for billing
          try {
            const billingPeriod = await billingService.getCurrentBillingPeriod(user.id);
            await billingService.trackMessageUsage(
              user.id,
              supabaseChatId,
              messages,
              billingPeriod.period_start,
              billingPeriod.period_end,
              savedUrlId // Pass URL ID for permanent reference
            );
            console.log('✅ Message usage tracked for billing');
          } catch (error) {
            console.warn('Failed to track message usage:', error);
            // Don't throw here - message saving is more important than usage tracking
          }

          // Only save snapshot if files have actually changed
          const currentFiles = workbenchStore.files.get();
          const hasFiles = Object.keys(currentFiles).length > 0;

          if (hasFiles) {
            try {
              // Extract locked files
              const lockedFiles = Object.entries(currentFiles)
                .filter(([_, file]) => file?.type === 'file' && file.isLocked)
                .reduce((acc, [path, file]) => {
                  if (file && file.type === 'file') {
                    return {
                      ...acc,
                      [path]: { 
                        isLocked: file.isLocked, 
                        lockedByFolder: file.lockedByFolder 
                      }
                    };
                  }
                  return acc;
                }, {});

              // Get the last message ID for snapshot point
              const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : undefined;

              await supabaseDB.setSnapshot(user.id, supabaseChatId, currentFiles, lockedFiles, lastMessageId);
            } catch (snapshotError) {
              console.warn('Failed to save snapshot, but chat was saved successfully:', snapshotError);
              // Don't throw here - chat is saved, snapshot is secondary
            }
          }

        } else if (db) {
          // Fallback to IndexedDB when not authenticated
          if (!urlId && firstArtifact?.id) {
            const newUrlId = await generateUniqueUrlId(db);
            _urlId = newUrlId;
            navigateChat(newUrlId);
            setUrlId(newUrlId);
          }

          let chatSummary: string | undefined = undefined;
          const lastMessage = messages[messages.length - 1];

          if (lastMessage.role === 'assistant') {
            const annotations = lastMessage.annotations as JSONValue[];
            const filteredAnnotations = (annotations?.filter(
              (annotation: JSONValue) =>
                annotation && typeof annotation === 'object' && Object.keys(annotation).includes('type'),
            ) || []) as { type: string; value: any } & { [key: string]: any }[];

            if (filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')) {
              chatSummary = filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')?.summary;
            }
          }

          takeSnapshot(messages[messages.length - 1].id, workbenchStore.files.get(), _urlId, chatSummary);

          if (!description.get() && firstArtifact?.title) {
            description.set(firstArtifact?.title);
          }

          if (initialMessages.length === 0 && !chatId.get()) {
            const nextId = await getNextId(db);
            chatId.set(nextId);

            if (!urlId) {
              const newUrlId = await generateUniqueUrlId(db);
              setUrlId(newUrlId);
              navigateChat(newUrlId);
              _urlId = newUrlId;
            }
          }

          const finalChatId = chatId.get();
          if (!finalChatId) {
            console.error('Cannot save messages, chat ID is not set.');
            toast.error('Failed to save chat messages: Chat ID missing.');
            return;
          }

          await setMessages(
            db,
            finalChatId,
            [...archivedMessages, ...messages],
            _urlId,
            description.get(),
            undefined,
            chatMetadata.get(),
          );
        }
      } catch (error) {
        console.error('Failed to store message history:', error);
        toast.error('Failed to save chat: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    },
    duplicateCurrentChat: async (listItemId: string) => {
      if ((!mixedId && !listItemId)) {
        return;
      }

      try {
        let newId: string;
        if (user) {
          // Use Supabase when authenticated
          newId = await supabaseDB.duplicateChat(user.id, mixedId || listItemId);
        } else if (db) {
          // Fallback to IndexedDB when not authenticated
          newId = await duplicateChat(db, mixedId || listItemId);
        } else {
          toast.error('No database available');
          return;
        }

        navigate(`/chat/${newId}`);
        toast.success('Chat duplicated successfully');
      } catch (error) {
        toast.error('Failed to duplicate chat');
        console.log(error);
      }
    },
    importChat: async (description: string, messages: Message[], metadata?: IChatMetadata) => {
      try {
        let newId: string;
        if (user) {
          // Use Supabase when authenticated
          newId = await supabaseDB.createChatFromMessages(user.id, description, messages, metadata);
        } else if (db) {
          // Fallback to IndexedDB when not authenticated
          newId = await createChatFromMessages(db, description, messages, metadata);
        } else {
          toast.error('No database available');
          return;
        }

        // Use client-side navigation for smooth transition (no page reload)
        // Workbench is already shown by ImportFolderButton before calling this
        navigate(`/chat/${newId}`, { replace: true });
        
        toast.success('Chat imported successfully');
      } catch (error) {
        console.error('Failed to import chat:', error);
        if (error instanceof Error) {
          toast.error('Failed to import chat: ' + error.message);
        } else {
          toast.error('Failed to import chat');
        }
      }
    },
    exportChat: async (id = urlId) => {
      if (!id) {
        console.error('No chat ID provided for export');
        toast.error('No chat ID available for export');
        return;
      }

      console.log('Exporting chat with ID:', id);
      
      try {
        let chat: any;

        if (user) {
          // Export from Supabase when authenticated
          console.log('Exporting from Supabase with user ID:', user.id, 'and chat ID:', id);
          chat = await supabaseDB.getMessages(user.id, id);
        } else if (db) {
          // Fallback to IndexedDB when not authenticated
          console.log('Exporting from IndexedDB with chat ID:', id);
          chat = await getMessages(db, id);
        } else {
          console.error('No database available for export');
          toast.error('No database available');
          return;
        }

        if (!chat) {
          console.error('Chat not found for export, ID:', id);
          toast.error('Chat not found');
          return;
        }

        console.log('Chat found for export:', { 
          id: chat.id,
          urlId: chat.url_id || chat.urlId,
          messageCount: chat.messages?.length || 0
        });

        const chatData = {
          messages: chat.messages,
          description: chat.description || chat.title,
          exportDate: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Chat export completed successfully');
        toast.success('Chat exported successfully');
      } catch (error) {
        console.error('Failed to export chat:', error);
        toast.error('Failed to export chat');
      }
    },
  };
}

function navigateChat(nextId: string) {
  /**
   * Use Remix's navigate function for proper routing
   * This will be handled by the navigate function passed from the component
   * For now, just update the URL and let React Router handle the rest
   */
  console.log('Navigating to chat:', nextId);

  // Use Remix's navigate function for proper routing
  // This will be handled by the navigate function passed from the component
  // For now, just update the URL and let React Router handle the rest
  const url = new URL(window.location.href);
  url.pathname = `/chat/${nextId}`;

  // Use replaceState to update URL without adding to history
  window.history.replaceState({ chatId: nextId }, '', url);

  // Set the chatId atom to the URL ID for consistency
  // Note: This is the URL ID, not the internal database ID
  // The actual database ID will be set when the chat loads
  chatId.set(nextId);

  // Dispatch a custom event to notify components of the navigation
  window.dispatchEvent(new CustomEvent('chatNavigation', {
    detail: { chatId: nextId }
  }));
}
