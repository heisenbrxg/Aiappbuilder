import type { Message } from 'ai';
import { Fragment, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { AssistantMessage } from './AssistantMessage';
import { UserMessage } from './UserMessage';
import { useLocation } from '@remix-run/react';
import { db, chatId } from '~/lib/persistence/useChatHistory';
import { forkChat } from '~/lib/persistence/db';
import { SupabaseDB } from '~/lib/persistence/supabaseDb';
import { toast } from 'react-toastify';
import { forwardRef } from 'react';
import type { ForwardedRef } from 'react';
import { useStickToBottomContext } from '~/lib/hooks';
import type { ProviderInfo } from '~/types/model';
import { useAuth } from '~/components/auth/AuthProvider';
import { useStore } from '@nanostores/react';
import ChatLoadingAnimation from '~/components/ui/ChatLoadingAnimation';

interface MessagesProps {
  id?: string;
  className?: string;
  isStreaming?: boolean;
  messages?: Message[];
  append?: (message: Message) => void;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  model?: string;
  provider?: ProviderInfo;
  addToolResult: ({ toolCallId, result }: { toolCallId: string; result: any }) => void;
}

export const Messages = forwardRef<HTMLDivElement, MessagesProps>(
  (props: MessagesProps, ref: ForwardedRef<HTMLDivElement> | undefined) => {
    const { id, isStreaming = false, messages = [] } = props;
    const location = useLocation();
    const { user } = useAuth();
    const supabaseDB = new SupabaseDB();
    const currentChatId = useStore(chatId);

    // Get the URL ID from the current URL path for Supabase users
    const getUrlIdFromPath = () => {
      const pathParts = window.location.pathname.split('/');
      return pathParts[pathParts.length - 1];
    };

    // Get StickToBottom context to trigger scroll when messages change
    const { scrollToBottom, isAtBottom } = useStickToBottomContext();

    // Auto-scroll when new messages are added or during streaming
    useEffect(() => {
      if (messages.length > 0 && (isStreaming || isAtBottom)) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          scrollToBottom({ animation: 'smooth', preserveScrollPosition: false });
        }, 50);
      }
    }, [messages.length, isStreaming, scrollToBottom, isAtBottom]);

    const handleRewind = (messageId: string) => {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('rewindTo', messageId);
      window.location.search = searchParams.toString();
    };

    const handleFork = async (messageId: string) => {
      try {
        let urlId: string;

        console.log('🔍 Fork Debug Info:', {
          messageId,
          currentChatId,
          propId: id,
          user: user ? { id: user.id } : null,
          hasDb: !!db,
          currentUrl: window.location.href
        });

        if (user) {
          // For authenticated users, use URL ID from the current path
          const urlIdFromPath = getUrlIdFromPath();
          console.log('🔄 Attempting Supabase fork with:', { userId: user.id, urlIdFromPath, messageId });
          urlId = await supabaseDB.forkChat(user.id, urlIdFromPath, messageId);
        } else if (db && currentChatId) {
          // For non-authenticated users, use the internal chat ID from the store
          console.log('🔄 Attempting IndexedDB fork with:', { currentChatId, messageId });
          urlId = await forkChat(db, currentChatId, messageId);
        } else {
          console.error('❌ Fork failed - missing requirements:', {
            hasUser: !!user,
            hasCurrentChatId: !!currentChatId,
            hasDb: !!db
          });
          toast.error('Chat persistence is not available');
          return;
        }

        console.log('✅ Fork successful, new URL ID:', urlId);
        window.location.href = `/chat/${urlId}`;
      } catch (error) {
        console.error('❌ Fork error:', error);
        toast.error('Failed to fork chat: ' + (error as Error).message);
      }
    };

    return (
      <div id={id} className={props.className} ref={ref}>
        {messages.length > 0
          ? messages.map((message, index) => {
              const { role, content, id: messageId, annotations, parts } = message;
              const isUserMessage = role === 'user';
              const isFirst = index === 0;
              const isHidden = annotations?.includes('hidden');

              if (isHidden) {
                return <Fragment key={index} />;
              }

              return (
                <div
                  key={index}
                  className={classNames('flex gap-4 py-3 w-full rounded-lg', {
                    'mt-4': !isFirst,
                  })}
                >
                  <div className="grid grid-col-1 w-full">
                    {isUserMessage ? (
                      <UserMessage 
                        content={content} 
                        messageId={messageId}
                        onRewind={handleRewind}
                        parts={parts as any}
                      />
                    ) : (
                      <AssistantMessage
                        content={content}
                        annotations={message.annotations}
                        messageId={messageId}
                        onFork={handleFork}
                        append={props.append}
                        chatMode={props.chatMode}
                        setChatMode={props.setChatMode}
                        model={props.model}
                        provider={props.provider}
                        parts={parts as any}
                        addToolResult={props.addToolResult}
                      />
                    )}
                  </div>
                </div>
              );
            })
          : null}
        {isStreaming && (
          <ChatLoadingAnimation 
            isVisible={isStreaming} 
            className="w-full mt-4"
          />
        )}
      </div>
    );
  },
);
