import React from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';

// Keywords to detect advanced reasoning models
const ADVANCED_KEYWORDS = ['advanced', 'reasoning', 'flagship', 'most capable', 'enhanced thinking'];
import { PROVIDER_LIST } from '~/utils/constants';
import { APIKeyManager } from './APIKeyManager';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';

import { toast } from 'react-toastify';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { SupabaseConnection } from './SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/types/model';
import { ColorSchemeDialog } from '~/components/ui/ColorSchemeDialog';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import { useAuthGuard } from '~/hooks/useAuthGuard';
import { FigmaUrlInput } from './FigmaUrlInput';
import { ImportFolderButton } from './ImportFolderButton';
import GitCloneButton from './GitCloneButton';
import { useSubscription } from '~/lib/hooks/useSubscription';
import { DISABLED_PROVIDERS } from '~/lib/stores/settings';

interface ChatBoxProps {
  // isModelSettingsCollapsed removed - using better dialog-based selector
  provider: any;
  providerList: any[];
  modelList: any[];
  apiKeys: Record<string, string>;
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  setProvider?: ((provider: ProviderInfo) => void) | undefined;
  model?: string | undefined;
  setModel?: ((model: string) => void) | undefined;
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
  onFigmaDataExtracted?: (figmaData: any, enhancedPrompt: string) => void;
  placeholder?: string;
  importChat?: (description: string, messages: any[]) => Promise<void>;
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const { requireAuth, isAuthenticated } = useAuthGuard();
  const { subscription } = useSubscription();
  const [isFigmaInputVisible, setIsFigmaInputVisible] = React.useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = React.useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = React.useState(false);
  const [modelSearchQuery, setModelSearchQuery] = React.useState('');
  const addMenuRef = React.useRef<HTMLDivElement>(null);
  const modelMenuRef = React.useRef<HTMLDivElement>(null);
  const importFolderButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const gitCloneButtonRef = React.useRef<HTMLButtonElement | null>(null);
  
  // Check if user is paid
  const isPaidUser = React.useMemo(() => 
    subscription?.status === 'active' && ['pro', 'starter', 'enterprise', 'scale0', 'scale1', 'scale2', 'scale3', 'scale4', 'scale5', 'scale6', 'scale7'].includes(subscription?.plan || ''),
    [subscription]
  );
  
  const planId = subscription?.plan;
  
  // Group models by provider
  const modelsByProvider = React.useMemo(() => {
    const grouped: Record<string, any[]> = {};
    props.modelList.forEach((model: any) => {
      if (!grouped[model.provider]) {
        grouped[model.provider] = [];
      }
      grouped[model.provider].push(model);
    });
    return grouped;
  }, [props.modelList]);
  
  // Check if model is available for current plan
  const isModelAvailable = React.useCallback((model: any) => {
    if (!isPaidUser) {
      // Free plan: Allow all models with isPaid: false
      return model.isPaid === false;
    }
    if ((planId as string) === 'starter') {
      switch (model.provider) {
        case 'Google':
          return !model.label.toLowerCase().includes('pro');
        case 'OpenAI':
          return ['gpt-4.1', 'o4-mini'].includes(model.name);
        case 'Anthropic':
          return model.name === 'claude-3-5-haiku-20241022';
        default:
          return false;
      }
    }
    if (planId === 'pro') {
      switch (model.provider) {
        case 'Google':
          return true;
        case 'Anthropic':
          return !['claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219'].includes(model.name);
        case 'OpenAI':
          return model.name !== 'o3';
        default:
          return false;
      }
    }
    return true;
  }, [isPaidUser, planId]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Identify current model information and icon
  const modelInfo = props.modelList?.find((m: any) => m.name === props.model);
  const descLower = modelInfo?.description?.toLowerCase() || '';
  const isAdvancedModel = ADVANCED_KEYWORDS.some((kw) => descLower.includes(kw));
  const modelIconClass = isAdvancedModel ? 'i-ph:brain text-pink-500' : 'i-ph:lightning text-accent-500';
  const modelLabel = modelInfo?.label || props.model;
  return (
    <div className="relative">
      <div
        className={classNames(
          'relative rounded-2xl border monzed-border backdrop-blur-sm w-full max-w-5xl mx-auto z-prompt monzed-bg-primary',
        )}
        style={{ 
          padding: '5px', 
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5px)'
        }}
      >
        {/* Gradient effects disabled for cleaner editor experience */}
        <svg className={classNames(styles.PromptEffectContainer)} style={{ display: 'none' }}>
          <defs>
            <linearGradient
              id="line-gradient"
              x1="20%"
              y1="0%"
              x2="-14%"
              y2="10%"
              gradientUnits="userSpaceOnUse"
              gradientTransform="rotate(-45)"
            >
              <stop offset="0%" stopColor="transparent" stopOpacity="0%"></stop>
              <stop offset="40%" stopColor="transparent" stopOpacity="0%"></stop>
              <stop offset="50%" stopColor="transparent" stopOpacity="0%"></stop>
              <stop offset="100%" stopColor="transparent" stopOpacity="0%"></stop>
            </linearGradient>
            <linearGradient id="shine-gradient">
              <stop offset="0%" stopColor="transparent" stopOpacity="0%"></stop>
              <stop offset="40%" stopColor="transparent" stopOpacity="0%"></stop>
              <stop offset="50%" stopColor="transparent" stopOpacity="0%"></stop>
              <stop offset="100%" stopColor="transparent" stopOpacity="0%"></stop>
            </linearGradient>
          </defs>
          <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
          <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
        </svg>
        {/* Old model selector removed - using better dialog-based selector */}
        <FilePreview
          files={props.uploadedFiles}
          imageDataList={props.imageDataList}
          onRemove={(index) => {
            props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
            props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
          }}
        />
        <ClientOnly>
          {() => (
            <ScreenshotStateManager
              setUploadedFiles={props.setUploadedFiles}
              setImageDataList={props.setImageDataList}
              uploadedFiles={props.uploadedFiles}
              imageDataList={props.imageDataList}
            />
          )}
        </ClientOnly>
        {props.selectedElement && (
          <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none monzed-border monzed-text-primary flex py-1 px-2.5 font-medium text-xs monzed-bg-tertiary/50">
            <div className="flex gap-2 items-center lowercase">
              <code className="bg-monzed-accent rounded-4px px-1.5 py-1 mr-0.5 text-white">
                {props?.selectedElement?.tagName}
              </code>
              selected for inspection
            </div>
            <button
              className="bg-transparent text-monzed-accent pointer-auto hover:text-monzed-glow transition-colors"
              onClick={() => props.setSelectedElement?.(null)}
            >
              Clear
            </button>
          </div>
        )}
        <div
          className={classNames(
            'relative rounded-2xl border monzed-border monzed-bg-secondary'
          )}
          style={{ overflow: 'visible' }}
        >
          <div className="flex flex-col">
            <textarea
              ref={props.textareaRef}
              className={classNames(
                'w-full pl-4 pt-4 pr-16 outline-none resize-none bg-transparent text-sm border-0',
                'monzed-text-primary placeholder-monzed-text-tertiary',
                'transition-all duration-200',
                'focus:ring-0 focus:outline-none'
              )}
              maxLength={10000}
              onDragEnter={(e) => {
                e.preventDefault();
                e.currentTarget.style.border = '2px solid #1488fc';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.border = '2px solid #1488fc';
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.style.border = '0';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.border = '0';

                const files = Array.from(e.dataTransfer.files);
                files.forEach((file) => {
                  if (file.type.startsWith('image/')) {
                    const reader = new FileReader();

                    reader.onload = (e) => {
                      const base64Image = e.target?.result as string;
                      props.setUploadedFiles?.([...props.uploadedFiles, file]);
                      props.setImageDataList?.([...props.imageDataList, base64Image]);
                    };
                    reader.readAsDataURL(file);
                  }
                });
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  if (event.shiftKey) {
                    return;
                  }

                  event.preventDefault();

                  if (props.isStreaming) {
                    props.handleStop?.();
                    return;
                  }

                  // ignore if using input method engine
                  if (event.nativeEvent.isComposing) {
                    return;
                  }

                  props.handleSendMessage?.(event);
                }
              }}
              value={props.input}
              onChange={(event) => {
                props.handleInputChange?.(event);
              }}
              onPaste={props.handlePaste}
              style={{
                minHeight: props.TEXTAREA_MIN_HEIGHT,
                maxHeight: props.TEXTAREA_MAX_HEIGHT,
                background: 'transparent',
              }}
              placeholder={props.placeholder || (props.chatMode === 'build' ? 'What do you want to build today?' : 'What would you like to discuss?')}
              translate="no"
            />
            <ClientOnly>
              {() => (
                <SendButton
                  show={props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0}
                  isStreaming={props.isStreaming}
                  disabled={props.input.length === 0 || props.isStreaming}
                  onClick={(event) => {
                    if (props.isStreaming) {
                      props.handleStop?.();
                      return;
                    }

                    props.handleSendMessage?.(event);
                  }}
                />
              )}
            </ClientOnly>
            
            <div className="flex justify-between items-center text-sm p-4 pt-2">
              <div className="flex gap-1 items-center">
                {/* Combined Add Menu */}
                <div className="relative" ref={addMenuRef}>
                  <IconButton
                    title="Add content"
                    onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                  >
                    <div className={`i-ph:plus text-lg sm:text-xl transition-transform duration-300 ${isAddMenuOpen ? 'rotate-45' : 'rotate-0'}`}></div>
                  </IconButton>
                  
                  {/* Dropdown Menu */}
                  {isAddMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border monzed-border monzed-bg-secondary shadow-xl backdrop-blur-sm z-50">
                      <div className="p-1.5">
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-t-lg rounded-b-none hover:monzed-bg-tertiary transition-colors monzed-text-primary"
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            if (!requireAuth()) return;
                            // Trigger design palette
                            document.querySelector<HTMLButtonElement>('[title="Design Palette"]')?.click();
                          }}
                        >
                          <div className="i-ph:paint-brush text-lg text-monzed-accent"></div>
                          <span className="text-sm font-medium">Design Palette</span>
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-none hover:monzed-bg-tertiary transition-colors monzed-text-primary"
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            if (!requireAuth()) return;
                            props.handleFileUpload();
                          }}
                        >
                          <div className="i-ph:image text-lg text-monzed-accent"></div>
                          <span className="text-sm font-medium">Upload Image</span>
                        </button>
                        <button
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:monzed-bg-tertiary transition-colors monzed-text-primary ${
                            props.chatStarted ? 'rounded-t-none rounded-b-lg' : 'rounded-none'
                          }`}
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            if (!requireAuth()) return;
                            setIsFigmaInputVisible(true);
                          }}
                        >
                          <div className="i-ph:figma-logo text-lg text-monzed-accent"></div>
                          <span className="text-sm font-medium">Import from Figma</span>
                        </button>
                        {/* Hide Import Folder and Clone from Git when in workbench */}
                        {!props.chatStarted && (
                          <>
                            <button
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-none hover:monzed-bg-tertiary transition-colors monzed-text-primary"
                              onClick={() => {
                                setIsAddMenuOpen(false);
                                if (!requireAuth()) return;
                                setTimeout(() => importFolderButtonRef.current?.click(), 100);
                              }}
                            >
                              <div className="i-ph:folder-open text-lg text-monzed-accent"></div>
                              <span className="text-sm font-medium">Import Folder</span>
                            </button>
                            <button
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-t-none rounded-b-lg hover:monzed-bg-tertiary transition-colors monzed-text-primary"
                              onClick={() => {
                                setIsAddMenuOpen(false);
                                if (!requireAuth()) return;
                                setTimeout(() => gitCloneButtonRef.current?.click(), 100);
                              }}
                            >
                              <div className="i-ph:git-branch text-lg text-monzed-accent"></div>
                              <span className="text-sm font-medium">Clone from Git</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Hidden ColorSchemeDialog - triggered by dropdown */}
                <div className="hidden">
                  <ColorSchemeDialog 
                    designScheme={props.designScheme} 
                    setDesignScheme={props.setDesignScheme} 
                    onOpenRequest={requireAuth}
                  />
                </div>
                <IconButton
                  title={props.enhancingPrompt ? 'Enhancing…' : 'Enhance Prompt'}
                  className="relative"
                  onClick={() => {
                    if (!requireAuth() || props.enhancingPrompt) return;
                    props.enhancePrompt?.();
                  }}
                  disabled={props.input.length === 0 || props.enhancingPrompt}
                >
                  {props.enhancingPrompt ? (
                    <div className="i-ph:spinner text-lg sm:text-xl animate-spin" />
                  ) : (
                    <div className="i-ph:sparkle text-lg sm:text-xl" />
                  )}
                </IconButton>
                
                {/* Figma Import - controlled by dropdown */}
                <FigmaUrlInput
                  onFigmaDataExtracted={(figmaData, enhancedPrompt) => {
                    props.onFigmaDataExtracted?.(figmaData, enhancedPrompt);
                  }}
                  originalPrompt={props.input}
                  isVisible={isFigmaInputVisible}
                  onToggle={() => setIsFigmaInputVisible(!isFigmaInputVisible)}
                />


                <SpeechRecognitionButton
                  isListening={props.isListening}
                  onStart={() => {
                    if (!requireAuth()) return;
                    props.startListening();
                  }}
                  onStop={props.stopListening}
                  disabled={props.isStreaming}
                />
                {props.chatStarted && (
                  <IconButton
                    title="Discuss"
                    className={classNames(
                      'flex items-center gap-1 px-1.5',
                      props.chatMode === 'discuss'
                        ? '!bg-monzed-elements-item-backgroundAccent !text-monzed-elements-item-contentAccent'
                        : 'bg-monzed-elements-item-backgroundDefault text-monzed-elements-item-contentDefault',
                    )}
                    onClick={() => {
                      if (!requireAuth()) return;
                      props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss');
                    }}
                  >
                    <div className={`i-ph:chats text-lg sm:text-xl`} />
                    {props.chatMode === 'discuss' ? <span className="text-xs sm:text-sm">Discuss</span> : <span />}
                  </IconButton>
                )}
                {/* Model selector dropdown */}
                {isAuthenticated && (
                  <div className="relative" ref={modelMenuRef}>
                    <IconButton
                      title="Model Settings"
                      className={classNames(
                        'flex items-center gap-1'
                      )}
                      onClick={() => {
                        if (!requireAuth()) return;
                        setIsModelMenuOpen(!isModelMenuOpen);
                      }}
                      disabled={!props.providerList || props.providerList.length === 0}
                    >
                      <span className="flex items-center gap-1 text-[10px] sm:text-xs">
                        <span className={classNames(modelIconClass, 'text-xs sm:text-sm shrink-0')} />
                        {modelLabel}
                      </span>
                      <div className="i-ph:caret-up-down text-sm sm:text-base" />
                    </IconButton>
                    
                    {/* Model Dropdown Menu */}
                    {isModelMenuOpen && (
                      <div className="absolute bottom-full right-0 mb-2 w-72 max-h-80 rounded-xl border monzed-border monzed-bg-secondary shadow-xl backdrop-blur-sm z-50 overflow-hidden flex flex-col">
                        {/* Search Input */}
                        <div className="p-2 border-b monzed-border">
                          <input
                            type="text"
                            placeholder="Search models..."
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg monzed-bg-tertiary monzed-text-primary placeholder-monzed-text-tertiary border monzed-border focus:outline-none focus:ring-1 focus:ring-monzed-accent"
                          />
                        </div>
                        
                        {/* Models List */}
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                          {Object.keys(modelsByProvider).map((providerName, providerIdx) => {
                            const providerModels = modelsByProvider[providerName].filter((model: any) =>
                              model.label.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                              model.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
                            );
                            const providerInfo = props.providerList.find((p: any) => p.name === providerName);
                            if (!providerInfo || DISABLED_PROVIDERS.includes(providerName) || providerModels.length === 0) return null;
                            
                            return (
                              <div key={providerName}>
                                {/* Provider Header */}
                                <div className="sticky top-0 px-4 py-2 monzed-bg-tertiary border-b monzed-border z-10">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold monzed-text-primary">{providerName}</span>
                                  </div>
                                </div>
                                
                                {/* Models */}
                                <div className="p-1.5">
                                  {providerModels.map((model: any) => {
                                    const isAvailable = isModelAvailable(model);
                                    const isSelected = model.name === props.model;
                                    
                                    return (
                                      <button
                                        key={model.name}
                                        className={classNames(
                                          'w-full flex items-center justify-between gap-2 px-3 py-2 text-left rounded-none transition-colors',
                                          isSelected ? 'monzed-bg-tertiary monzed-text-primary' : 'hover:monzed-bg-tertiary monzed-text-primary',
                                          { 'opacity-50 cursor-not-allowed': !isAvailable }
                                        )}
                                        onClick={() => {
                                          if (isAvailable) {
                                            props.setModel?.(model.name);
                                            props.setProvider?.(providerInfo);
                                            setIsModelMenuOpen(false);
                                          }
                                        }}
                                        disabled={!isAvailable}
                                        title={model.description || model.label}
                                      >
                                        <span className="text-xs font-medium truncate">{model.label}</span>
                                        {!isAvailable && <span className="i-ph:lock-simple text-sm text-monzed-accent shrink-0" />}
                                        {isSelected && <span className="i-ph:check text-sm text-monzed-accent shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Character Counter */}
              {props.input.length > 0 && (
                <div className={classNames(
                  "text-xs px-2 py-1 rounded transition-colors",
                  props.input.length >= 10000 
                    ? "text-red-500 dark:text-red-400 font-semibold" 
                    : props.input.length >= 9000
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-monzed-elements-textTertiary"
                )}>
                  {props.input.length}/10k
                </div>
              )}
              
              <SupabaseConnection />
              <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
              
              {/* Hidden components triggered by dropdown */}
              <div style={{ position: 'absolute', left: '-9999px', pointerEvents: 'none' }}>
                <div ref={(el) => {
                  if (el) {
                    const button = el.querySelector('button');
                    if (button) importFolderButtonRef.current = button;
                  }
                }}>
                  <ImportFolderButton importChat={props.importChat} />
                </div>
                <div ref={(el) => {
                  if (el) {
                    const button = el.querySelector('button');
                    if (button) gitCloneButtonRef.current = button;
                  }
                }}>
                  <GitCloneButton importChat={props.importChat} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
