import { memo, Fragment, useState } from 'react';
import { Markdown } from './Markdown';
import type { JSONValue } from 'ai';
import type { ToolInvocationUIPart } from '@ai-sdk/ui-utils';
import { ToolInvocations } from './ToolInvocations';
import Popover from '~/components/ui/Popover';
import { workbenchStore } from '~/lib/stores/workbench';
import { WORK_DIR } from '~/utils/constants';
import WithTooltip from '~/components/ui/Tooltip';
import type { Message } from 'ai';
import type { ProviderInfo } from '~/types/model';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { classNames } from '~/utils/classNames';
import type { ToolCallAnnotation } from '~/types/context';

const SupportMenu = () => {
  const handleEmailClick = () => {
    const subject = encodeURIComponent('Starsky Support Request');
    const body = encodeURIComponent('Hi Starsky Team,\n\nI need help with:\n\n[Please describe your issue here]\n\nBest regards');
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=hello@sharelock.cc&su=${subject}&body=${body}`, '_blank');
  };

  const handleDiscordClick = () => {
    window.open('https://discord.gg/qqHmykZb75', '_blank');
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center text-gray-700 dark:text-gray-300 bg-transparent enabled:hover:text-monzed-elements-item-contentActive rounded-md p-1 enabled:hover:bg-gray-200/50 dark:enabled:hover:bg-gray-700/50 disabled:cursor-not-allowed focus:outline-none">
        <div className="i-ph:dots-three text-lg" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={classNames(
          'z-[250]',
          'bg-monzed-elements-background-depth-2',
          'border border-monzed-elements-borderColor',
          'rounded-lg',
          'shadow-lg',
          'min-w-[200px]',
          'p-1'
        )}
        sideOffset={5}
        align="end"
      >
        <DropdownMenu.Item
          className={classNames(
            'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-item-backgroundActive gap-2 rounded-md group relative',
          )}
          onClick={handleEmailClick}
        >
          <div className="i-ph:envelope size-4.5"></div>
          <span>Email Support</span>
          <div className="i-ph:arrow-square-out size-3.5 ml-auto opacity-60"></div>
        </DropdownMenu.Item>
        
        <DropdownMenu.Item
          className={classNames(
            'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-monzed-elements-textPrimary hover:bg-monzed-elements-item-backgroundActive gap-2 rounded-md group relative',
          )}
          onClick={handleDiscordClick}
        >
          <div className="i-ph:chat-circle-text size-4.5 text-[#5865F2]"></div>
          <span>Discord Community</span>
          <div className="i-ph:arrow-square-out size-3.5 ml-auto opacity-60"></div>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

interface AssistantMessageProps {
  content: string;
  annotations?: JSONValue[];
  messageId?: string;
  onFork?: (messageId: string) => void;
  append?: (message: Message) => void;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  model?: string;
  provider?: ProviderInfo;
  parts?: ToolInvocationUIPart[];
  addToolResult?: ({ toolCallId, result }: { toolCallId: string; result: any }) => void;
}

function openArtifactInWorkbench(filePath: string) {
  filePath = normalizedFilePath(filePath);

  if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${filePath}`);
}

function normalizedFilePath(path: string) {
  let normalizedPath = path;

  if (normalizedPath.startsWith(WORK_DIR)) {
    normalizedPath = path.replace(WORK_DIR, '');
  }

  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.slice(1);
  }

  return normalizedPath;
}

export const AssistantMessage = memo(
  ({
    content,
    annotations,
    messageId,
    onFork,
    append,
    chatMode,
    setChatMode,
    model,
    provider,
    parts,
    addToolResult,
  }: AssistantMessageProps) => {
    const filteredAnnotations = (annotations?.filter(
      (annotation: JSONValue) =>
        annotation && typeof annotation === 'object' && Object.keys(annotation).includes('type'),
    ) || []) as { type: string; value: any } & { [key: string]: any }[];

    let chatSummary: string | undefined = undefined;

    if (filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')) {
      chatSummary = filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')?.summary;
    }

    let codeContext: string[] | undefined = undefined;

    if (filteredAnnotations.find((annotation) => annotation.type === 'codeContext')) {
      codeContext = filteredAnnotations.find((annotation) => annotation.type === 'codeContext')?.files;
    }

    const usage: {
      completionTokens: number;
      promptTokens: number;
      totalTokens: number;
    } = filteredAnnotations.find((annotation) => annotation.type === 'usage')?.value;

    const toolInvocations = parts?.filter((part) => part.type === 'tool-invocation');
    const toolCallAnnotations = filteredAnnotations.filter(
      (annotation) => annotation.type === 'toolCall',
    ) as ToolCallAnnotation[];

    return (
      <div className="overflow-hidden w-full relative">
        <>
          {/* Only show the entire info section when usage data is available */}
          {usage && (
            <div className="flex gap-2 items-center text-sm text-monzed-elements-textSecondary mb-2">
              {(codeContext || chatSummary) && (
                <Popover side="right" align="start" trigger={<div className="i-ph:info" />}>
                  {chatSummary && (
                    <div className="max-w-chat">
                      <div className="summary max-h-96 flex flex-col">
                        <h2 className="border border-monzed-elements-borderColor rounded-md p4">Summary</h2>
                        <div style={{ zoom: 0.7 }} className="overflow-y-auto m4">
                          <Markdown>{chatSummary}</Markdown>
                        </div>
                      </div>
                      {codeContext && (
                        <div className="code-context flex flex-col p4 border border-monzed-elements-borderColor rounded-md">
                          <h2>Context</h2>
                          <div className="flex gap-4 mt-4 monzed" style={{ zoom: 0.6 }}>
                            {codeContext.map((x) => {
                              const normalized = normalizedFilePath(x);
                              return (
                                <Fragment key={normalized}>
                                  <code
                                    className="bg-monzed-elements-artifacts-inlineCode-background text-monzed-elements-artifacts-inlineCode-text px-1.5 py-1 rounded-md text-monzed-elements-item-contentAccent hover:underline cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openArtifactInWorkbench(normalized);
                                    }}
                                  >
                                    {normalized}
                                  </code>
                                </Fragment>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="context"></div>
                </Popover>
              )}
              <div className="flex w-full items-center justify-between">
                <div>
                  Tokens: {usage.totalTokens} (prompt: {usage.promptTokens}, completion: {usage.completionTokens})
                </div>
                <SupportMenu />
              </div>
            </div>
          )}
        </>
        <Markdown append={append} chatMode={chatMode} setChatMode={setChatMode} model={model} provider={provider} html>
          {content}
        </Markdown>
        {toolInvocations && toolInvocations.length > 0 && addToolResult && (
          <ToolInvocations
            toolInvocations={toolInvocations}
            toolCallAnnotations={toolCallAnnotations}
            addToolResult={addToolResult}
          />
        )}
      </div>
    );
  },
);
