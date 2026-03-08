import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { ImportFolderButton } from '~/components/chat/ImportFolderButton';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { useAuthGuard } from '~/hooks/useAuthGuard';
import { useSubscription } from '~/lib/hooks/useSubscription';

type ChatData = {
  messages?: Message[]; // Standard monzed format
  description?: string; // Optional description
};

export function ImportButtons({ importChat }: { importChat?: (description: string, messages: Message[]) => Promise<void> }) {
  const { requireAuth } = useAuthGuard();
  const { subscription } = useSubscription();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!requireAuth()) return;
    
    if (subscription?.plan === 'free') {
      toast.error('Import features are only available for paid plans. Please upgrade to continue.');
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];

    if (file && importChat) {
      try {
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            const data = JSON.parse(content) as ChatData;

            // Standard format
            if (Array.isArray(data.messages)) {
              await importChat(data.description || 'Imported Chat', data.messages);
              toast.success('Chat imported successfully');
              return;
            }

            toast.error('Invalid chat file format');
          } catch (error: unknown) {
            if (error instanceof Error) {
              toast.error('Failed to parse chat file: ' + error.message);
            } else {
              toast.error('Failed to parse chat file');
            }
          }
        };

        reader.onerror = () => toast.error('Failed to read chat file');
        reader.readAsText(file);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to import chat');
      }
      e.target.value = ''; // Reset file input
    } else {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-auto">
      <input
        type="file"
        id="chat-import"
        className="hidden"
        accept=".json"
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center gap-4 max-w-2xl text-center">
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (!requireAuth()) return;
              if (subscription?.plan === 'free') {
                toast.error('Import features are only available for paid plans. Please upgrade to continue.');
                return;
              }
              const input = document.getElementById('chat-import');
              input?.click();
            }}
            variant="default"
            size="lg"
            title="Import a previously exported chat file"
            className={classNames(
              'gap-2 monzed-glass border monzed-border-bright',
              'monzed-text-primary',
              'hover:border-monzed-accent/50 hover:shadow-[0_0_20px_rgba(0,17,255,0.2)]',
              'h-10 px-4 py-2 sm:min-w-[120px] justify-center rounded-xl',
              'transition-all duration-200 ease-in-out monzed-font-dm-sans',
              subscription?.plan === 'free' ? 'opacity-50 cursor-not-allowed' : ''
            )}
            disabled={subscription?.plan === 'free'}
          >
            <span className="i-ph:chat-circle-dots w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
            {subscription?.plan === 'free' && <span className="i-ph:lock-simple ml-1" />}
          </Button>
          <ImportFolderButton
            importChat={importChat}
            className={classNames(
              'gap-2 monzed-glass border monzed-border-bright',
              'monzed-text-primary',
              'hover:border-monzed-accent/50 hover:shadow-[0_0_20px_rgba(0,17,255,0.2)]',
              'h-10 px-4 py-2 sm:min-w-[120px] justify-center rounded-xl',
              'transition-all duration-200 ease-in-out monzed-font-dm-sans'
            )}
            isFreePlan={subscription?.plan === 'free'}
          />
        </div>
      </div>
    </div>
  );
}
