/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useAnimate } from 'framer-motion';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { cssTransition, toast, ToastContainer } from 'react-toastify';
import { useMessageParser, usePromptEnhancer, useShortcuts } from '~/lib/hooks';
import { useMessageGuard, useUsageGuard } from '~/lib/hooks/useUsageGuard';
import { description, useChatHistory } from '~/lib/persistence';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROMPT_COOKIE_KEY, PROVIDER_LIST } from '~/utils/constants';
import { cubicEasingFn } from '~/utils/easings';
import { createScopedLogger, renderLogger } from '~/utils/logger';
import type { Project } from '~/lib/types';
import { BaseChat } from './BaseChat';
import Cookies from 'js-cookie';
import { debounce } from '~/utils/debounce';
import { useSettings } from '~/lib/hooks/useSettings';
import type { ProviderInfo } from '~/types/model';
import { useSearchParams } from '@remix-run/react';
import { createSampler } from '~/utils/sampler';
import { getTemplates, selectStarterTemplate } from '~/utils/selectStarterTemplate';
import { logStore } from '~/lib/stores/logs';
import { streamingState } from '~/lib/stores/streaming';
import { filesToArtifacts } from '~/utils/fileUtils';
import { supabaseConnection } from '~/lib/stores/supabase';
import { defaultDesignScheme, type DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import type { TextUIPart, FileUIPart, Attachment } from '@ai-sdk/ui-utils';
import { useMCPStore } from '~/lib/stores/mcp';
import { PricingModal } from '~/components/billing/PricingModal';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

const logger = createScopedLogger('Chat');

export function Chat({ projects, hasMore, totalProjects }: { projects: Project[], hasMore: boolean, totalProjects: number }) {
  renderLogger.trace('Chat');

  const { ready, initialMessages, storeMessageHistory, importChat, exportChat } = useChatHistory();
  const title = useStore(description);

  useEffect(() => {
    workbenchStore.setReloadedMessages(initialMessages.map((m) => m.id));
  }, [initialMessages]);

  return (
    <>
      {ready && (
        <ChatImpl
          projects={projects}
          hasMore={hasMore}
          totalProjects={totalProjects}
          description={title}
          initialMessages={initialMessages}
          exportChat={exportChat}
          storeMessageHistory={storeMessageHistory}
          importChat={importChat}
        />
      )}
    </>
  );
}



interface ChatProps {
  projects: Project[];
  hasMore: boolean;
  totalProjects: number;
  initialMessages: Message[];
  storeMessageHistory: (messages: Message[]) => Promise<void>;
  importChat: (description: string, messages: Message[]) => Promise<void>;
  exportChat: () => void;
  description?: string;
}

export const ChatImpl = memo(
  ({ projects, hasMore, totalProjects, description, initialMessages, storeMessageHistory, importChat, exportChat }: ChatProps) => {
    useShortcuts();
    const { guardedSendMessage } = useMessageGuard();
    const { hasExceededLimit, formatUsage, checkCanSendMessage } = useUsageGuard();
    const [showPricingModal, setShowPricingModal] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Only start chat if we're not on the root landing page or workspace page, even with persisted messages
    const isOnLandingPage = typeof window !== 'undefined' && window.location.pathname === '/';
    const isOnWorkspacePage = typeof window !== 'undefined' && window.location.pathname === '/workspace';
    const shouldShowWorkspace = isOnLandingPage || isOnWorkspacePage;
    const [chatStarted, setChatStarted] = useState(!shouldShowWorkspace && initialMessages.length > 0);

    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.debug('Chat State:', {
        isOnLandingPage,
        initialMessagesLength: initialMessages.length,
        chatStarted,
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
      });
    }

    // Update chatStarted when initialMessages changes (for loaded chats) - but not on landing/workspace page
    useEffect(() => {
      if (!shouldShowWorkspace && !chatStarted && initialMessages.length > 0) {
        setChatStarted(true);
      }
    }, [initialMessages.length, chatStarted, shouldShowWorkspace]);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [imageDataList, setImageDataList] = useState<string[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [fakeLoading, setFakeLoading] = useState(false);
    const files = useStore(workbenchStore.files);
    const [designScheme, setDesignScheme] = useState<DesignScheme>(defaultDesignScheme);
    const actionAlert = useStore(workbenchStore.alert);
    const deployAlert = useStore(workbenchStore.deployAlert);
    const supabaseConn = useStore(supabaseConnection); // Add this line to get Supabase connection
    const selectedProject = supabaseConn.stats?.projects?.find(
      (project) => project.id === supabaseConn.selectedProjectId,
    );
    const supabaseAlert = useStore(workbenchStore.supabaseAlert);
    const { activeProviders, promptId, autoSelectTemplate, contextOptimizationEnabled } = useSettings();
    const [model, setModel] = useState(() => {
      const savedModel = Cookies.get('selectedModel');
      return savedModel || DEFAULT_MODEL;
    });
    const [provider, setProvider] = useState(() => {
      const savedProvider = Cookies.get('selectedProvider');
      if (savedProvider) {
        const savedProviderObj = PROVIDER_LIST.find((p) => p.name === savedProvider);
        if (savedProviderObj) {
          return savedProviderObj as ProviderInfo;
        }
      }
      // If no saved provider or saved provider not found, use Anthropic as default
      const anthropicProvider = PROVIDER_LIST.find(p => p.name === 'Anthropic');
      const googleProvider = PROVIDER_LIST.find(p => p.name === 'Google');
      return (anthropicProvider || googleProvider || DEFAULT_PROVIDER) as ProviderInfo;
    });
    const { showChat } = useStore(chatStore);
    const [animationScope, animate] = useAnimate();
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [chatMode, setChatMode] = useState<'discuss' | 'build'>('build');
    const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
    const mcpSettings = useMCPStore((state) => state.settings);

    const {
      messages,
      isLoading,
      input,
      handleInputChange,
      setInput,
      stop,
      append,
      setMessages,
      reload,
      error,
      data: chatData,
      setData,
      addToolResult,
    } = useChat({
      api: '/api/chat',
      body: {
        apiKeys,
        files,
        promptId,
        contextOptimization: contextOptimizationEnabled,
        chatMode,
        designScheme,
        supabase: {
          isConnected: supabaseConn.isConnected,
          hasSelectedProject: !!selectedProject,
          credentials: {
            supabaseUrl: supabaseConn?.credentials?.supabaseUrl,
            anonKey: supabaseConn?.credentials?.anonKey,
          },
        },
        maxLLMSteps: mcpSettings.maxLLMSteps,
      },
      sendExtraMessageFields: true,
      onError: (e) => {
        logger.error('Request failed\n\n', e, error);
        logStore.logError('Chat request failed', e, {
          component: 'Chat',
          action: 'request',
          error: e.message,
        });

        // Silence specific validation errors that are not user-facing issues
        const isValidationError = e.message?.includes('Type validation failed') &&
          e.message?.includes('candidates') &&
          e.message?.includes('content') &&
          e.message?.includes('parts');

        if (!isValidationError) {
          toast.error(
            'There was an error processing your request: ' + (e.message ? e.message : 'No details were returned'),
          );
        }
      },
      onFinish: (message, response) => {
        const usage = response.usage;
        setData(undefined);

        if (usage) {
          console.log('Token usage:', usage);
          logStore.logProvider('Chat response completed', {
            component: 'Chat',
            action: 'response',
            model,
            provider: provider.name,
            usage,
            messageLength: message.content.length,
          });
        }

        logger.debug('Finished streaming');
      },
      initialMessages,
      initialInput: Cookies.get(PROMPT_COOKIE_KEY) || '',
    });
    useEffect(() => {
      const prompt = searchParams.get('prompt');

      // console.log(prompt, searchParams, model, provider);

      if (prompt) {
        setSearchParams({});
        runAnimation();
        append({
          role: 'user',
          content: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${prompt}`,
        });
      }
    }, [model, provider, searchParams]);

    const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();
    const { parsedMessages, parseMessages, reprocessMessages } = useMessageParser();

    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 120;

    useEffect(() => {
      const wasStarted = chatStore.get().started;
      const isStarted = !isOnLandingPage || (initialMessages.length > 0 && !isOnLandingPage);
      chatStore.setKey('started', isStarted);

      // If chat just started, ensure we scroll to bottom after a brief delay
      if (!wasStarted && isStarted) {
        setTimeout(() => {
          // Trigger a scroll to bottom when chat starts
          const scrollContainer = document.querySelector('[data-stick-to-bottom-scroll]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }, 100);
      }

      // No need to reprocess messages - they're already correctly formatted with restore artifacts
      // The useChatHistory hook now creates inline restore messages like bolt.diy-main
    }, [initialMessages, isOnLandingPage]);

    // This effect is intentionally removed to preserve user's selected model and provider
    // The initial state already handles loading from cookies properly

    const wasLoading = useRef(false);

    // Debounced version of parseMessages to avoid performance issues during streaming
    const debouncedParseMessages = useCallback(
      debounce((msgs: Message[], loading: boolean) => {
        parseMessages(msgs, loading);
      }, 50), // Match bolt.diy-main debounce timing
      [parseMessages],
    );

    useEffect(() => {
      debouncedParseMessages(messages, isLoading);

      // Auto-scroll during streaming if user hasn't manually scrolled up
      if (isLoading && chatStarted) {
        const scrollContainer = document.querySelector('[data-stick-to-bottom-scroll]');
        if (scrollContainer) {
          const isNearBottom = scrollContainer.scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight - 100;
          if (isNearBottom) {
            setTimeout(() => {
              scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }, 50);
          }
        }
      }
    }, [messages, isLoading, debouncedParseMessages, chatStarted]);

    useEffect(() => {
      // Store history only when loading has just finished to prevent double-counting
      if (wasLoading.current && !isLoading) {
        if (messages.length > initialMessages.length) {
          console.log('Storing message history:', messages.length, 'messages');
          storeMessageHistory(messages).catch((error) => {
            console.error('Failed to store message history:', error);
            toast.error(error.message);
          });
        }
      }
      wasLoading.current = isLoading;
    }, [isLoading, messages, initialMessages, storeMessageHistory]);

    const scrollTextArea = () => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    };

    const abort = () => {
      stop();
      chatStore.setKey('aborted', true);
      workbenchStore.abortAllActions();

      logStore.logProvider('Chat response aborted', {
        component: 'Chat',
        action: 'abort',
        model,
        provider: provider.name,
      });
    };

    useEffect(() => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.style.height = 'auto';

        const scrollHeight = textarea.scrollHeight;

        textarea.style.height = `${Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
        textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
      }
    }, [input, textareaRef]);

    const runAnimation = async () => {
      if (chatStarted) {
        return;
      }

      // Smoother transition with better timing and easing
      await Promise.all([
        animate('#examples', { opacity: 0, y: -20 }, { duration: 0.3, ease: 'easeInOut' }),
        animate('#intro', { opacity: 0, y: -30, scale: 0.95 }, { duration: 0.4, ease: 'easeInOut' }),
      ]);

      // Small delay before switching to chat mode for smoother perception
      await new Promise(resolve => setTimeout(resolve, 100));

      chatStore.setKey('started', true);
      setChatStarted(true);
    };

    // Helper function to create message parts array from text and images
    const createMessageParts = (text: string, images: string[] = []): Array<TextUIPart | FileUIPart> => {
      // Create an array of properly typed message parts
      const parts: Array<TextUIPart | FileUIPart> = [
        {
          type: 'text',
          text,
        },
      ];

      // Add image parts if any
      images.forEach((imageData) => {
        // Extract correct MIME type from the data URL
        const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';

        // Create file part according to AI SDK format
        parts.push({
          type: 'file',
          mimeType,
          data: imageData.replace(/^data:image\/[^;]+;base64,/, ''),
        });
      });

      return parts;
    };

    // Helper function to convert File[] to Attachment[] for AI SDK
    const filesToAttachments = async (files: File[]): Promise<Attachment[] | undefined> => {
      if (files.length === 0) {
        return undefined;
      }

      const attachments = await Promise.all(
        files.map(
          (file) =>
            new Promise<Attachment>((resolve) => {
              const reader = new FileReader();

              reader.onloadend = () => {
                resolve({
                  name: file.name,
                  contentType: file.type,
                  url: reader.result as string,
                });
              };
              reader.readAsDataURL(file);
            }),
        ),
      );

      return attachments;
    };

    const sendMessage = async (_event: React.UIEvent, messageInput?: string) => {
      await guardedSendMessage(async () => {
        const messageContent = messageInput || input;

        if (!messageContent?.trim()) {
          return;
        }

        if (isLoading) {
          abort();
          return;
        }

        let finalMessageContent = messageContent;

        if (selectedElement) {
          console.log('Selected Element:', selectedElement);

          const elementInfo = `<div class=\"__boltSelectedElement__\" data-element='${JSON.stringify(selectedElement)}'>${JSON.stringify(`${selectedElement.displayText}`)}</div>`;
          finalMessageContent = finalMessageContent + elementInfo;
        }

        runAnimation();

        if (!chatStarted) {
          setFakeLoading(true);

          if (autoSelectTemplate) {
            const { template, title } = await selectStarterTemplate({
              message: finalMessageContent,
              model,
              provider,
            });

            if (template !== 'blank') {
              const temResp = await getTemplates(template, title).catch((e) => {
                if (e.message.includes('rate limit')) {
                  toast.warning('Rate limit exceeded. Skipping starter template\n Continuing with blank template');
                } else {
                  toast.warning('Failed to import starter template\n Continuing with blank template');
                }

                return null;
              });

              if (temResp) {
                const { assistantMessage, userMessage } = temResp;
                const userMessageText = `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${finalMessageContent}`;
                const attachments = uploadedFiles.length > 0 ? await filesToAttachments(uploadedFiles) : undefined;

                setMessages([
                  {
                    id: `1-${new Date().getTime()}`,
                    role: 'user',
                    content: userMessageText,
                    parts: createMessageParts(userMessageText, imageDataList),
                    experimental_attachments: attachments,
                  },
                  {
                    id: `2-${new Date().getTime()}`,
                    role: 'assistant',
                    content: assistantMessage,
                  },
                  {
                    id: `3-${new Date().getTime()}`,
                    role: 'user',
                    content: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${userMessage}`,
                    annotations: ['hidden'],
                  },
                ]);

                const reloadOptions = attachments ? { experimental_attachments: attachments } : undefined;

                reload(reloadOptions);
                setInput('');
                Cookies.remove(PROMPT_COOKIE_KEY);

                setUploadedFiles([]);
                setImageDataList([]);

                resetEnhancer();

                textareaRef.current?.blur();
                setFakeLoading(false);

                return;
              }
            }
          }

          // If autoSelectTemplate is disabled or template selection failed, proceed with normal message
          const userMessageText = `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${finalMessageContent}`;
          const attachments = uploadedFiles.length > 0 ? await filesToAttachments(uploadedFiles) : undefined;

          setMessages([
            {
              id: `${new Date().getTime()}`,
              role: 'user',
              content: userMessageText,
              parts: createMessageParts(userMessageText, imageDataList),
              experimental_attachments: attachments,
            },
          ]);
          reload(attachments ? { experimental_attachments: attachments } : undefined);
          setFakeLoading(false);
          setInput('');
          Cookies.remove(PROMPT_COOKIE_KEY);

          setUploadedFiles([]);
          setImageDataList([]);

          resetEnhancer();

          textareaRef.current?.blur();

          return;
        }

        if (error != null) {
          setMessages(messages.slice(0, -1));
        }

        const modifiedFiles = workbenchStore.getModifiedFiles();

        chatStore.setKey('aborted', false);

        if (modifiedFiles !== undefined) {
          const userUpdateArtifact = filesToArtifacts(modifiedFiles, `${Date.now()}`);
          const messageText = `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${userUpdateArtifact}${finalMessageContent}`;

          const attachmentOptions =
            uploadedFiles.length > 0 ? { experimental_attachments: await filesToAttachments(uploadedFiles) } : undefined;

          append(
            {
              role: 'user',
              content: messageText,
              parts: createMessageParts(messageText, imageDataList),
            },
            attachmentOptions,
          );

          workbenchStore.resetAllFileModifications();
        } else {
          const messageText = `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${finalMessageContent}`;

          const attachmentOptions =
            uploadedFiles.length > 0 ? { experimental_attachments: await filesToAttachments(uploadedFiles) } : undefined;

          append(
            {
              role: 'user',
              content: messageText,
              parts: createMessageParts(messageText, imageDataList),
            },
            attachmentOptions,
          );
        }

        setInput('');
        Cookies.remove(PROMPT_COOKIE_KEY);

        setUploadedFiles([]);
        setImageDataList([]);

        resetEnhancer();

        textareaRef.current?.blur();
      });
    };

    /**
     * Handles the change event for the textarea and updates the input state.
     * @param event - The change event from the textarea.
     */
    const onTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleInputChange(event);
    };

    /**
     * Debounced function to cache the prompt in cookies.
     * Caches the trimmed value of the textarea input after a delay to optimize performance.
     */
    const debouncedCachePrompt = useCallback(
      debounce((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const trimmedValue = event.target.value.trim();
        Cookies.set(PROMPT_COOKIE_KEY, trimmedValue, { expires: 30 });
      }, 2000), // Increased debounce to reduce memory operations
      [],
    );

    useEffect(() => {
      // Load from localStorage instead of cookies to avoid 431 errors
      const storedApiKeys = localStorage.getItem('apiKeys');

      if (storedApiKeys) {
        setApiKeys(JSON.parse(storedApiKeys));
      }
    }, []);

    const handleModelChange = (newModel: string) => {
      setModel(newModel);
      Cookies.set('selectedModel', newModel, { expires: 30 });
    };

    const handleProviderChange = (newProvider: ProviderInfo) => {
      setProvider(newProvider);
      Cookies.set('selectedProvider', newProvider.name, { expires: 30 });
    };

    return (
      <>
        <BaseChat
          projects={projects}
          hasMore={hasMore}
          totalProjects={totalProjects}
          ref={animationScope}
          textareaRef={textareaRef}
          input={input}
          showChat={showChat}
          chatStarted={chatStarted}
          isStreaming={isLoading || fakeLoading}
          onStreamingChange={(streaming) => {
            streamingState.set(streaming);
          }}
          enhancingPrompt={enhancingPrompt}
          promptEnhanced={promptEnhanced}
          sendMessage={sendMessage}
          addToolResult={addToolResult}
          model={model}
          setModel={handleModelChange}
          provider={provider}
          setProvider={handleProviderChange}
          providerList={activeProviders}
          handleInputChange={(e) => {
            onTextareaChange(e);
            debouncedCachePrompt(e);
          }}
          handleStop={abort}
          description={description}
          importChat={importChat}
          exportChat={exportChat}
          messages={messages.map((message, i) => {
            if (message.role === 'user') {
              return message;
            }

            return {
              ...message,
              content: parsedMessages[i] || '',
            };
          })}
          enhancePrompt={() => {
            enhancePrompt(
              input,
              (input) => {
                setInput(input);
                scrollTextArea();
              },
              model,
              provider,
              apiKeys,
            );
          }}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          imageDataList={imageDataList}
          setImageDataList={setImageDataList}
          actionAlert={actionAlert}
          clearAlert={() => workbenchStore.clearAlert()}
          supabaseAlert={supabaseAlert}
          clearSupabaseAlert={() => workbenchStore.clearSupabaseAlert()}
          deployAlert={deployAlert}
          clearDeployAlert={() => workbenchStore.clearDeployAlert()}
          data={chatData}
          chatMode={chatMode}
          setChatMode={setChatMode}
          append={append}
          designScheme={designScheme}
          setDesignScheme={setDesignScheme}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
        />
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          currentUsage={formatUsage() || undefined}
        />
      </>
    );
  },
);
