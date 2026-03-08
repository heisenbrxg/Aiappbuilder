import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { isInChatSelector, showWorkbenchSelector } from '~/lib/stores/uiState';
import { useState } from 'react';
import { streamingState } from '~/lib/stores/streaming';
import { ExportChatButton } from '~/components/chat/chatExportAndImport/ExportChatButton';
import { useChatHistory } from '~/lib/persistence';
import { DeployButton } from '~/components/deploy/DeployButton';
import { SupportButton } from '~/components/support/SupportButton';
import { SupabaseButton } from '~/components/supabase/SupabaseButton';

interface HeaderActionButtonsProps {
  chatStarted: boolean;
  showSupport?: boolean;
}

export function HeaderActionButtons({ chatStarted, showSupport = false }: HeaderActionButtonsProps) {
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];
  const isStreaming = useStore(streamingState);
  const isInChat = useStore(isInChatSelector);
  const showWorkbench = useStore(showWorkbenchSelector);
  const { exportChat } = useChatHistory();

  const shouldShowButtons = !isStreaming && activePreview;

  // Only show any buttons if there are actually previews or if in chat mode
  if (!shouldShowButtons && !isInChat) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isInChat && showSupport && <SupportButton />}
      {isInChat && shouldShowButtons && <ExportChatButton exportChat={exportChat} />}
      {shouldShowButtons && <DeployButton />}
      {shouldShowButtons && <SupabaseButton />}
    </div>
  );
}
