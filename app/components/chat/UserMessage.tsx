/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import { MODEL_REGEX, PROVIDER_REGEX } from '~/utils/constants';
import { Markdown } from './Markdown';
import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';
import { useAuth } from '~/components/auth/AuthProvider';
import WithTooltip from '~/components/ui/Tooltip';
import type {
  TextUIPart,
  ReasoningUIPart,
  ToolInvocationUIPart,
  SourceUIPart,
  FileUIPart,
  StepStartUIPart,
} from '@ai-sdk/ui-utils';

interface UserMessageProps {
  content: string | Array<{ type: string; text?: string; image?: string }>;
  messageId?: string;
  onRewind?: (messageId: string) => void;
  parts?:
    | (TextUIPart | ReasoningUIPart | ToolInvocationUIPart | SourceUIPart | FileUIPart | StepStartUIPart)[]
    | undefined;
}

export function UserMessage({ content, messageId, onRewind, parts }: UserMessageProps) {
  const profile = useStore(profileStore);
  const { user } = useAuth();
  
  // Get user initials for avatar fallback
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const displayName = profile?.username || (user?.email?.split('@')[0]) || 'User';
  const initials = getInitials(profile?.username, user?.email);

  // Extract images from parts - look for file parts with image mime types
  const images =
    parts?.filter(
      (part): part is FileUIPart => part.type === 'file' && 'mimeType' in part && part.mimeType.startsWith('image/'),
    ) || [];

  if (Array.isArray(content)) {
    const textItem = content.find((item) => item.type === 'text');
    const textContent = stripMetadata(textItem?.text || '');

    return (
      <div className="overflow-hidden flex flex-col gap-3 items-start">
        <div className="flex flex-row items-start overflow-hidden shrink-0 self-start">
          <div className="flex items-end gap-2">
            <div className="w-[25px] h-[25px] rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#FC7C11] to-[#FC7C11] flex items-center justify-center">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="sync"
                />
              ) : (
                <span className="text-white font-semibold text-xs">
                  {initials}
                </span>
              )}
            </div>
            <span className="text-monzed-elements-textPrimary text-sm">
              {displayName}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4 bg-accent-500/10 backdrop-blur-sm p-3 py-3 w-fit max-w-[85vw] sm:max-w-[720px] overflow-hidden rounded-lg mr-auto">
          {textContent && <Markdown html>{textContent}</Markdown>}
          {images.map((item, index) => (
            <img
              key={index}
              src={`data:${item.mimeType};base64,${item.data}`}
              alt={`Image ${index + 1}`}
              className="max-w-full h-auto rounded-lg"
              style={{ maxHeight: '512px', objectFit: 'contain' }}
            />
          ))}
        </div>
      </div>
    );
  }

  const textContent = stripMetadata(content);

  return (
    <div className="flex flex-col bg-accent-500/10 backdrop-blur-sm px-5 p-3.5 w-fit max-w-[85vw] sm:max-w-[720px] overflow-hidden rounded-lg ml-auto">
      {images.length > 0 && (
        <div className="flex gap-3.5 mb-4">
          {images.map((item, index) => (
            <img
              key={index}
              src={`data:${item.mimeType};base64,${item.data}`}
              alt={`Image ${index + 1}`}
              className="max-w-full h-auto rounded-lg"
              style={{ maxHeight: '512px', objectFit: 'contain' }}
            />
          ))}
        </div>
      )}
      <Markdown html>{textContent}</Markdown>
    </div>
  );
}

function stripMetadata(content: string) {
  const artifactRegex = /<boltArtifact\s+[^>]*>[\s\S]*?<\/boltArtifact>/gm;
  // Remove verbose Supabase context block if present
  const supabaseBlockRegex = /\[SUPABASE PROJECT CONNECTED\][\s\S]*?\n\s*\n/g;
  return content
    .replace(MODEL_REGEX, '')
    .replace(PROVIDER_REGEX, '')
    .replace(artifactRegex, '')
    .replace(supabaseBlockRegex, '');
}
