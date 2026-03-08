import { ExamplePrompts } from '~/components/chat/ExamplePrompts';
import { ChatBox } from '~/components/chat/ChatBox';
import { useRef, useState, useEffect } from 'react';
import { PROVIDER_LIST } from '~/utils/constants';
import type { ProviderInfo } from '~/types/model';
import { useTypewriter } from '~/hooks/useTypewriter';

// Exact constants from BaseChat
const TEXTAREA_MIN_HEIGHT = 76;

// Simple model type for teaser
interface SimpleModel {
  name: string;
  label: string;
  provider: string;
  maxTokenAllowed: number;
  description: string;
}

export default function Hero() {
  // Exact state matching workspace
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  // Model settings collapsed state removed - using better dialog-based selector
  const [modelList, setModelList] = useState<SimpleModel[]>([]);
  
  // Provider and model state for selection
  const [provider, setProvider] = useState(PROVIDER_LIST.find(p => p.name === 'Anthropic') || PROVIDER_LIST[0]);
  const [model, setModel] = useState('claude-3-5-sonnet-20241022');
  
  // Load REAL model list exactly like workspace does
  useEffect(() => {
    fetch('/api/models')
      .then((response) => response.json())
      .then((data) => {
        const typedData = data as { modelList: SimpleModel[] };
        setModelList(typedData.modelList);
      })
      .catch((error) => {
        console.error('Error fetching model list:', error);
        // Fallback to basic models if API fails
        const basicModels: SimpleModel[] = [
          {
            name: 'claude-3-5-sonnet-20241022',
            label: 'Claude 3.5 Sonnet',
            provider: 'Anthropic',
            maxTokenAllowed: 8192,
            description: 'Most capable model for complex tasks'
          }
        ];
        setModelList(basicModels);
      });
  }, []);
  
  // Exact textarea height calculation from workspace
  const TEXTAREA_MAX_HEIGHT = 120; // Not chatStarted, so use 120
  
  // Typewriter animation for placeholder
  const animatedPlaceholder = useTypewriter({
    phrases: [
      'an enterprise solution that scales...',
      'an MVP for my startup...',
      'a client portal with authentication...',
      'a mobile app with offline sync...',
      'a dashboard with real-time data...',
      'an e-commerce platform...',
    ],
    constantPrefix: "Let's build ",
    typingSpeed: 80,
    deletingSpeed: 40,
    pauseDuration: 2500,
  });
  
  // Teaser handlers (auth-guarded)
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };
  
  const handleSendMessage = () => {
    // Auth guard - redirect to login
    window.location.href = '/login';
  };

  return (
    <div className="relative flex h-full w-full monzed-bg-primary">
      <div className="flex flex-col flex-grow lg:min-w-[var(--chat-min-width)] monzed-bg-primary h-full overflow-y-auto modern-scrollbar">
        <div className="relative pb-12 pt-20">
          {/* EXACT workspace hero section */}
          <div className="relative overflow-hidden">
            <div 
              id="intro" 
              className="relative flex-shrink-0 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-0 pt-16 sm:pt-20 lg:pt-24 pb-4 z-10"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-monzed-elements-textPrimary mb-4 sm:mb-6 leading-tight tracking-tight">
                <span className="monzed-text-primary">AI Builder{' '}</span>
                <span className="italic text-transparent bg-gradient-to-r from-monzed-accent to-mint-cyber bg-clip-text relative inline-block px-1 sm:px-2">
                  for Everyone<span className="absolute -top-1 -right-2 sm:-right-4 i-ph:sparkle text-monzed-accent text-sm sm:text-base"></span>
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-monzed-elements-textSecondary mb-0 leading-relaxed max-w-3xl mx-auto px-2 sm:px-0">
                Turn your ideas into reality with AI
              </p>
            </div>
          </div>
          
          {/* EXACT chatbox container from workspace */}
          <div className="px-4 sm:pl-[10px] sm:pr-6 relative flex-shrink-0">
            <div className="flex flex-col gap-2 w-full max-w-chat mx-auto z-prompt relative py-4 sm:py-6 z-20">
              <ChatBox
                provider={provider}
                setProvider={setProvider as any} // Enable provider selection
                providerList={PROVIDER_LIST as ProviderInfo[]}
                model={model}
                setModel={setModel} // Enable model selection
                modelList={modelList}
                apiKeys={{}}
                isModelLoading={undefined}
                onApiKeysChange={() => {}} // Disabled in teaser
                uploadedFiles={[]}
                setUploadedFiles={() => {}} // Disabled in teaser
                imageDataList={[]}
                setImageDataList={() => {}} // Disabled in teaser
                textareaRef={textareaRef}
                input={input}
                handleInputChange={handleInputChange}
                handlePaste={() => {}} // Disabled in teaser
                TEXTAREA_MIN_HEIGHT={TEXTAREA_MIN_HEIGHT}
                TEXTAREA_MAX_HEIGHT={TEXTAREA_MAX_HEIGHT}
                isStreaming={false}
                handleStop={() => {}} // Disabled in teaser
                handleSendMessage={handleSendMessage} // Auth-guarded
                enhancingPrompt={false}
                enhancePrompt={() => {}} // Disabled in teaser
                isListening={false}
                startListening={() => {}} // Disabled in teaser
                stopListening={() => {}} // Disabled in teaser
                chatStarted={false}
                exportChat={() => {}} // Disabled in teaser
                qrModalOpen={false}
                setQrModalOpen={() => {}} // Disabled in teaser
                handleFileUpload={() => {}} // Disabled in teaser
                chatMode="build"
                setChatMode={() => {}} // Disabled in teaser
                designScheme={undefined}
                setDesignScheme={() => {}} // Disabled in teaser
                selectedElement={null}
                setSelectedElement={() => {}} // Disabled in teaser
                onFigmaDataExtracted={() => {}} // Disabled in teaser
                placeholder={animatedPlaceholder} // Animated typewriter placeholder
              />
              
              {/* Example Prompts below chatbox - EXACT workspace positioning */}
              <ExamplePrompts />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
