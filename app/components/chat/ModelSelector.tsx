import type { ProviderInfo } from '~/types/model';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import type { ModelInfo } from '~/lib/modules/llm/types';
import { classNames } from '~/utils/classNames';

// Keywords to detect advanced reasoning models
const ADVANCED_KEYWORDS = ['advanced', 'reasoning', 'flagship', 'most capable', 'enhanced thinking'];
import { useAuthGuard } from '~/hooks/useAuthGuard';
import { useNavigate } from '@remix-run/react';
import { useSubscription } from '~/lib/hooks/useSubscription';
import { DISABLED_PROVIDERS } from '~/lib/stores/settings';

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
  apiKeys: Record<string, string>;
  modelLoading?: string;
}

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList,
  providerList,
  modelLoading,
}: ModelSelectorProps) => {
  // All hooks must be called at the top level, before any conditional logic
  const { requireAuth, isAuthenticated } = useAuthGuard();
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [focusedModelIndex, setFocusedModelIndex] = useState(-1);
  const [providerSearchQuery, setProviderSearchQuery] = useState('');
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [focusedProviderIndex, setFocusedProviderIndex] = useState(-1);
  
  const modelSearchInputRef = useRef<HTMLInputElement>(null);
  const modelOptionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const providerSearchInputRef = useRef<HTMLInputElement>(null);
  const providerOptionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const providerDropdownRef = useRef<HTMLDivElement>(null);
  
  // Derive values using useMemo to ensure consistent behavior
  const isPaidUser = useMemo(() => 
    subscription?.status === 'active' && ['pro', 'starter', 'enterprise', 'scale0', 'scale1', 'scale2', 'scale3', 'scale4', 'scale5', 'scale6', 'scale7'].includes(subscription?.plan || ''),
    [subscription]
  );
  
  const planId = subscription?.plan;

  const availableProviders = useMemo(() => {
    // Start with providers that are not globally disabled
    const enabledProviders = providerList.filter(p => !DISABLED_PROVIDERS.includes(p.name));

    if (!isPaidUser) {
      // Free plan: Show providers that have at least one free model (isPaid: false)
      return enabledProviders.filter(p => {
        // Check if this provider has any free models
        const hasFreeModels = modelList.some(m => 
          m.provider === p.name && m.isPaid === false
        );
        return hasFreeModels;
      });
    }

    // Starter tier – limited providers
    if ((planId as string) === 'starter') {
      const allowed = ['Google', 'Anthropic', 'OpenAI', 'xAI', 'Deepseek', 'Mistral', 'Perplexity'];
      return enabledProviders.filter(p => allowed.includes(p.name));
    }

    // Pro tier – limited providers (same as starter + more models within providers)
    if ((planId as string) === 'pro') {
      const allowed = ['Google', 'Anthropic', 'OpenAI', 'xAI', 'Deepseek', 'Mistral', 'Perplexity'];
      return enabledProviders.filter(p => allowed.includes(p.name));
    }

    // Scale plans – all enabled providers
    return enabledProviders;
  }, [providerList, isPaidUser, planId, modelList]);

  // Function to check if a model is available for the current plan
  const isModelAvailableForPlan = useCallback((model: any) => {
    if (!isPaidUser) {
      // Free plan: Allow all models with isPaid: false
      return model.isPaid === false;
    }

    if ((planId as string) === 'starter') {
      // Starter plan access rules
      switch (model.provider) {
        case 'Google':
          // All Google models except Pro variants
          return !model.label.toLowerCase().includes('pro');
        case 'OpenAI':
          // Only GPT-4.1 and o4-mini
          return ['gpt-4.1', 'o4-mini'].includes(model.name);
        case 'Anthropic':
          // Only Claude Haiku 3.5
          return model.name === 'claude-3-5-haiku-20241022';
        case 'Deepseek':
        case 'Mistral':
        case 'xAI':
          // Mark as premium (will show crown icon)
          return false;
        default:
          return false;
      }
    }

    if ((planId as string) === 'pro') {
      // Pro plan access rules
      switch (model.provider) {
        case 'Google':
          // All Google models
          return true;
        case 'Anthropic':
          // All except Claude Sonnet 4 and 3.7
          return !['claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219'].includes(model.name);
        case 'OpenAI':
          // All except o3
          return model.name !== 'o3';
        case 'Deepseek':
        case 'Mistral':
        case 'xAI':
          // Mark as premium (will show crown icon)
          return false;
        default:
          return false;
      }
    }

    // Scale plans: Access to all models
    return true;
  }, [isPaidUser, planId]);

  const filteredModels = useMemo(() =>
    [...modelList]
      // Filter by provider and ensure model name exists
      .filter((e) => e.provider === provider?.name && e.name)
      // Filter by search query
      .filter((model) =>
          model.label.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        model.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
      )
      // Remove duplicate models (keep newest versions)
      .sort((a, b) => {
        // Sort by model family, then by version (newest first)
        const aName = a.label.toLowerCase();
        const bName = b.label.toLowerCase();
        
        // Extract model family name (e.g., "gemini" from "gemini 2.5 flash")
        const aFamily = aName.split(' ')[0];
        const bFamily = bName.split(' ')[0];
        
        if (aFamily !== bFamily) {
          return aFamily.localeCompare(bFamily);
        }
        
        // If same family, prioritize newer versions
        // Higher version numbers first
        const aVersion = parseFloat(aName.match(/\d+\.\d+/)?.[0] || '0');
        const bVersion = parseFloat(bName.match(/\d+\.\d+/)?.[0] || '0');
        
        if (aVersion !== bVersion) {
          return bVersion - aVersion;
        }
        
        // For models with same version, prioritize ones with "latest" in the name
        const aHasLatest = aName.includes('latest');
        const bHasLatest = bName.includes('latest');
        
        if (aHasLatest && !bHasLatest) return -1;
        if (!aHasLatest && bHasLatest) return 1;
        
        return aName.localeCompare(bName);
      })
      // Filter out preview/experimental models if there are newer versions available
      .filter((model, index, self) => {
        // If model has "preview" or "experimental" in name
        if (model.label.toLowerCase().includes('preview') || 
            model.label.toLowerCase().includes('experimental')) {
          
          // Extract model family name (e.g., "gemini" from "gemini 2.5 flash")
          const modelFamily = model.label.toLowerCase().split(' ')[0];
          const modelVersion = parseFloat(model.label.toLowerCase().match(/\d+\.\d+/)?.[0] || '0');
          
          // Check if there's a non-preview/experimental version of the same model family and version
          const hasStableVersion = self.some(m => 
            m.label.toLowerCase().split(' ')[0] === modelFamily &&
            parseFloat(m.label.toLowerCase().match(/\d+\.\d+/)?.[0] || '0') === modelVersion &&
            !m.label.toLowerCase().includes('preview') && 
            !m.label.toLowerCase().includes('experimental')
          );
          
          return !hasStableVersion;
        }
        
        return true;
      }),
    [modelList, provider, modelSearchQuery]
  );

  const currentModelInfo = modelList.find((m) => m.name === model);
  const isAdvancedModelSelected = ADVANCED_KEYWORDS.some((kw) => (currentModelInfo?.description || '').toLowerCase().includes(kw));
  const modelIconClass = isAdvancedModelSelected ? 'i-ph:brain text-pink-500' : 'i-ph:lightning text-accent-500';

  const filteredProviders = useMemo(() => 
    availableProviders.filter((p) =>
      p.name.toLowerCase().includes(providerSearchQuery.toLowerCase()),
    ),
    [availableProviders, providerSearchQuery]
  );

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
        setModelSearchQuery('');
      }

      if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
        setIsProviderDropdownOpen(false);
        setProviderSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset focused indices when search queries or dropdown states change
  useEffect(() => {
    setFocusedModelIndex(-1);
  }, [modelSearchQuery, isModelDropdownOpen]);

  useEffect(() => {
    setFocusedProviderIndex(-1);
  }, [providerSearchQuery, isProviderDropdownOpen]);

  // Focus search inputs when dropdowns open
  useEffect(() => {
    if (isModelDropdownOpen && modelSearchInputRef.current) {
      modelSearchInputRef.current.focus();
    }
  }, [isModelDropdownOpen]);

  useEffect(() => {
    if (isProviderDropdownOpen && providerSearchInputRef.current) {
      providerSearchInputRef.current.focus();
    }
  }, [isProviderDropdownOpen]);

  // Only set default model when switching to Google provider (not when user manually selects models)
  useEffect(() => {
    if (provider?.name === 'Google' && (!model || !modelList.find(m => m.name === model && m.provider === 'Google'))) {
      // Only set default if no model is selected or current model is not a Google model
      const defaultModel = modelList.find(m => m.name === 'gemini-2.5-flash');
      if (defaultModel && setModel) {
        setModel(defaultModel.name);
      }
    }
  }, [provider, model, modelList, setModel]);

  // Scroll to focused items
  useEffect(() => {
    if (focusedModelIndex >= 0 && modelOptionsRef.current[focusedModelIndex]) {
      modelOptionsRef.current[focusedModelIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedModelIndex]);

  useEffect(() => {
    if (focusedProviderIndex >= 0 && providerOptionsRef.current[focusedProviderIndex]) {
      providerOptionsRef.current[focusedProviderIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedProviderIndex]);

  // Handle provider initialization - only set defaults if no provider is set
  useEffect(() => {
    if (providerList.length === 0 || !setProvider || !setModel) {
      return;
    }

    // Only set default provider if current provider is invalid or not set
    if (!provider || !providerList.some((p) => p.name === provider.name)) {
      // Prioritize Google provider (Gemini 2.5 Flash is default) if available
      const googleProvider = providerList.find(p => p.name === 'Google');
      const anthropicProvider = providerList.find(p => p.name === 'Anthropic');

      // Set Google as default provider if available, otherwise Anthropic, otherwise first provider
      const defaultProvider = googleProvider || anthropicProvider || providerList[0];
      setProvider(defaultProvider);

      // For Anthropic provider, set Claude Haiku 4.5 model
      if (defaultProvider.name === 'Anthropic') {
        const claudeHaikuModel = modelList.find(
          m => m.provider === 'Anthropic' && (m.name === 'claude-haiku-4-5' || m.name.startsWith('claude-haiku-4-5'))
        );
        if (claudeHaikuModel) {
          setModel(claudeHaikuModel.name);
          return;
        }
      }
      
      // For Google, try to set gemini-2.5-flash as default for all users
      if (defaultProvider.name === 'Google') {
        const preferredModel = 'gemini-2.5-flash';
        const geminiModel = modelList.find(m => m.name === preferredModel);
        if (geminiModel) {
          setModel(geminiModel.name);
          return;
        }
      }

      // Find appropriate model based on subscription and availability
      const firstModel = modelList.find((m) =>
        m.provider === defaultProvider.name && isModelAvailableForPlan(m)
      );

      if (firstModel) {
        setModel(firstModel.name);
      }
    } else {
      // Provider is valid, check if current model is still valid for this provider
      if (model && !modelList.find(m => m.name === model && m.provider === provider.name)) {
        // Current model is not valid for this provider, set a default
        if (provider.name === 'Anthropic') {
          const claudeHaikuModel = modelList.find(
            m => m.provider === 'Anthropic' && (m.name === 'claude-haiku-4-5' || m.name.startsWith('claude-haiku-4-5'))
          );
          if (claudeHaikuModel) {
            setModel(claudeHaikuModel.name);
          }
        } else {
          // Find first available model for this provider
          const firstModel = modelList.find((m) =>
            m.provider === provider.name && isModelAvailableForPlan(m)
          );
          if (firstModel) {
            setModel(firstModel.name);
          }
        }
      }
    }
  }, [providerList, provider, setProvider, modelList, setModel, model, isPaidUser, isModelAvailableForPlan]);

  const handleModelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isModelDropdownOpen) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedModelIndex((prev) => (prev + 1 >= filteredModels.length ? 0 : prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedModelIndex((prev) => (prev - 1 < 0 ? filteredModels.length - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();

        if (focusedModelIndex >= 0 && focusedModelIndex < filteredModels.length) {
          const selectedModel = filteredModels[focusedModelIndex];
          
          // Check if this is a paid model and user doesn't have a paid subscription
          if (selectedModel.isPaid && !isPaidUser) {
            navigate('/pricing');
            return;
          }
          
          setModel?.(selectedModel.name);
          setIsModelDropdownOpen(false);
          setModelSearchQuery('');
        }

        break;
      case 'Escape':
        e.preventDefault();
        setIsModelDropdownOpen(false);
        setModelSearchQuery('');
        break;
      case 'Tab':
        if (!e.shiftKey && focusedModelIndex === filteredModels.length - 1) {
          setIsModelDropdownOpen(false);
        }

        break;
    }
  };

  const handleProviderKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isProviderDropdownOpen) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedProviderIndex((prev) => (prev + 1 >= filteredProviders.length ? 0 : prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedProviderIndex((prev) => (prev - 1 < 0 ? filteredProviders.length - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();

        if (focusedProviderIndex >= 0 && focusedProviderIndex < filteredProviders.length) {
          const selectedProvider = filteredProviders[focusedProviderIndex];

          if (setProvider) {
            setProvider(selectedProvider);

            // Find appropriate model for the selected provider
            let firstModel;
            if (selectedProvider.name === 'Anthropic') {
              // Default to Claude Haiku 4.5 for Anthropic provider
              firstModel = modelList.find(
                (m) => m.provider === 'Anthropic' && (m.name === 'claude-haiku-4-5' || m.name.startsWith('claude-haiku-4-5'))
              );
            } else if (selectedProvider.name === 'Google') {
              // Default to gemini-2.5-flash for Google (all users)
              const preferredModel = 'gemini-2.5-flash';
              firstModel = modelList.find((m) => m.name === preferredModel);
            }

            // Fallback to first available model if preferred not found
            if (!firstModel) {
              firstModel = modelList.find((m) => m.provider === selectedProvider.name);
            }

            if (firstModel && setModel) {
              setModel(firstModel.name);
            }
          }

          setIsProviderDropdownOpen(false);
          setProviderSearchQuery('');
        }

        break;
      case 'Escape':
        e.preventDefault();
        setIsProviderDropdownOpen(false);
        setProviderSearchQuery('');
        break;
      case 'Tab':
        if (!e.shiftKey && focusedProviderIndex === filteredProviders.length - 1) {
          setIsProviderDropdownOpen(false);
        }

        break;
    }
  };

  // Render nothing if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Render message if no providers
  if (providerList.length === 0) {
    return (
      <div className="mb-2 p-4 rounded-lg border border-monzed-elements-borderColor bg-monzed-elements-prompt-background text-monzed-elements-textPrimary">
        <p className="text-center">
          No providers are currently enabled. Please enable at least one provider in the settings to start using the
          chat.
        </p>
      </div>
    );
  }

  // Main component render
  return (
    <div className="flex gap-2 flex-col sm:flex-row">
      {/* Provider Combobox */}
      <div className="relative flex w-full" onKeyDown={handleProviderKeyDown} ref={providerDropdownRef}>
        <div
          className={classNames(
            'w-full p-1.5 rounded-lg bg-monzed-elements-background-depth-2 hover:bg-monzed-elements-background-depth-3',
            'bg-monzed-elements-prompt-background text-monzed-elements-textPrimary',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-monzed-elements-focus',
            'transition-all cursor-pointer',
            isProviderDropdownOpen ? 'ring-2 ring-monzed-elements-focus' : undefined,
          )}
          onClick={() => {
            if (!requireAuth()) return;
            setIsProviderDropdownOpen(!isProviderDropdownOpen);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!requireAuth()) return;
              setIsProviderDropdownOpen(!isProviderDropdownOpen);
            }
          }}
          role="combobox"
          aria-expanded={isProviderDropdownOpen}
          aria-controls="provider-listbox"
          aria-haspopup="listbox"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate text-base font-medium">
              <span>{provider?.name || 'Select provider'}</span>
            </div>
            <div
              className={classNames(
                'i-ph:caret-down w-4 h-4 text-monzed-elements-textSecondary opacity-75',
                isProviderDropdownOpen ? 'rotate-180' : undefined,
              )}
            />
          </div>
        </div>

        {isProviderDropdownOpen && (
          <div
            className="absolute z-20 w-full mt-1 py-1 rounded-lg border border-monzed-elements-borderColor bg-monzed-elements-background-depth-2 shadow-lg"
            role="listbox"
            id="provider-listbox"
          >
            <div className="px-2 pb-2">
              <div className="relative">
                <input
                  ref={providerSearchInputRef}
                  type="text"
                  value={providerSearchQuery}
                  onChange={(e) => setProviderSearchQuery(e.target.value)}
                  placeholder="Search providers..."
                  className={classNames(
                    'w-full pl-2 py-1.5 rounded-md text-xs',
                    'bg-monzed-elements-background-depth-2 border border-monzed-elements-borderColor',
                    'text-monzed-elements-textPrimary placeholder:text-monzed-elements-textTertiary',
                    'focus:outline-none focus:ring-2 focus:ring-monzed-elements-focus',
                    'transition-all',
                  )}
                  onClick={(e) => e.stopPropagation()}
                  role="searchbox"
                  aria-label="Search providers"
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                  <span className="i-ph:magnifying-glass text-monzed-elements-textTertiary" />
                </div>
              </div>
            </div>

            <div
              className={classNames(
                'max-h-60 overflow-y-auto modern-scrollbar-compact',
                'sm:scrollbar-none',
              )}
            >
              {filteredProviders.length === 0 ? (
                <div className="px-3 py-2 text-sm text-monzed-elements-textTertiary">No providers found</div>
              ) : (
                filteredProviders.map((providerOption, index) => (
                  <div
                    ref={(el) => (providerOptionsRef.current[index] = el)}
                    key={providerOption.name}
                    role="option"
                    aria-selected={provider?.name === providerOption.name}
                    className={classNames(
                      'px-3 py-1.5 text-xs cursor-pointer',
                      'hover:bg-monzed-elements-background-depth-3',
                      'text-monzed-elements-textPrimary',
                      'outline-none',
                      provider?.name === providerOption.name || focusedProviderIndex === index
                        ? 'bg-monzed-elements-background-depth-2'
                        : undefined,
                      focusedProviderIndex === index ? 'ring-1 ring-inset ring-monzed-elements-focus' : undefined,
                    )}
                    onClick={(e) => {
                      e.stopPropagation();

                      if (!requireAuth()) return;

                      if (setProvider) {
                        setProvider(providerOption);

                        // Find appropriate model for the selected provider
                        let firstModel;
                        if (providerOption.name === 'Anthropic') {
                          // Default to Claude Haiku 4.5 for Anthropic provider
                          firstModel = modelList.find(
                            (m) => m.provider === 'Anthropic' && (m.name === 'claude-haiku-4-5' || m.name.startsWith('claude-haiku-4-5'))
                          );
                        } else if (providerOption.name === 'Google') {
                          // Default to gemini-2.5-flash for Google (all users)
                          const preferredModel = 'gemini-2.5-flash';
                          firstModel = modelList.find((m) => m.name === preferredModel);
                        }

                        // Fallback to first available model if preferred not found
                        if (!firstModel) {
                          firstModel = modelList.find((m) => m.provider === providerOption.name);
                        }

                        if (firstModel && setModel) {
                          setModel(firstModel.name);
                        }
                      }

                      setIsProviderDropdownOpen(false);
                      setProviderSearchQuery('');
                    }}
                    tabIndex={focusedProviderIndex === index ? 0 : -1}
                  >
                    <span>{providerOption.name}</span>
                  </div>
                ))
              )}
            </div>
            
            {!isPaidUser && (
              <div className="border-t border-monzed-elements-borderColor mt-1 pt-2 px-3 py-1">
                <button 
                  onClick={() => navigate('/pricing')}
                  className="w-full text-center text-sm text-accent-500 hover:text-accent-600 font-medium"
                >
                  Upgrade to access all providers
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Combobox */}
      <div className="relative flex w-full min-w-[70%]" onKeyDown={handleModelKeyDown} ref={modelDropdownRef}>
        <div
          className={classNames(
            'w-full p-1.5 rounded-lg bg-monzed-elements-background-depth-2 hover:bg-monzed-elements-background-depth-3',
            'bg-monzed-elements-prompt-background text-monzed-elements-textPrimary',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-monzed-elements-focus',
            'transition-all cursor-pointer',
            isModelDropdownOpen ? 'ring-2 ring-monzed-elements-focus' : undefined,
          )}
          onClick={() => {
            if (!requireAuth()) return;
            setIsModelDropdownOpen(!isModelDropdownOpen);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!requireAuth()) return;
              setIsModelDropdownOpen(!isModelDropdownOpen);
            }
          }}
          role="combobox"
          aria-expanded={isModelDropdownOpen}
          aria-controls="model-listbox"
          aria-haspopup="listbox"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className={classNames(modelIconClass, 'w-4 h-4 shrink-0')} />
              <span>{modelList.find((m) => m.name === model)?.label || 'Select model'}</span>
            </div>
            <div
              className={classNames(
                'i-ph:caret-down w-4 h-4 text-monzed-elements-textSecondary opacity-75',
                isModelDropdownOpen ? 'rotate-180' : undefined,
              )}
            />
          </div>
        </div>

        {isModelDropdownOpen && (
          <div
            className="absolute z-10 w-full mt-1 py-1 rounded-lg border border-monzed-elements-borderColor bg-monzed-elements-background-depth-2 shadow-lg"
            role="listbox"
            id="model-listbox"
          >
            <div className="px-2 pb-2">
              <div className="relative">
                <input
                  ref={modelSearchInputRef}
                  type="text"
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  placeholder="Search models..."
                  className={classNames(
                    'w-full pl-2 py-1.5 rounded-md text-xs',
                    'bg-monzed-elements-background-depth-2 border border-monzed-elements-borderColor',
                    'text-monzed-elements-textPrimary placeholder:text-monzed-elements-textTertiary',
                    'focus:outline-none focus:ring-2 focus:ring-monzed-elements-focus',
                    'transition-all',
                  )}
                  onClick={(e) => e.stopPropagation()}
                  role="searchbox"
                  aria-label="Search models"
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                  <span className="i-ph:magnifying-glass text-monzed-elements-textTertiary" />
                </div>
              </div>
            </div>

            <div
              className={classNames(
                'max-h-60 overflow-y-auto modern-scrollbar-compact',
                'sm:scrollbar-none',
              )}
            >
              {modelLoading === 'all' || modelLoading === provider?.name ? (
                <div className="px-3 py-2 text-sm text-monzed-elements-textTertiary">Loading...</div>
              ) : filteredModels.length === 0 ? (
                <div className="px-3 py-2 text-sm text-monzed-elements-textTertiary">No models found</div>
              ) : (
                filteredModels.map((modelOption, index) => {
                  const descLower = modelOption.description?.toLowerCase() || '';
                  const isAdvancedReasoning = ADVANCED_KEYWORDS.some((kw) => descLower.includes(kw));
                  const isModelAvailable = isModelAvailableForPlan(modelOption);
                  const isLocked = !isModelAvailable;

                  return (
                    <div
                      ref={(el) => (modelOptionsRef.current[index] = el)}
                      key={index}
                      role="option"
                      aria-selected={model === modelOption.name}
                      className={classNames(
                        'px-3 py-1.5 text-xs cursor-pointer',
                        'hover:bg-monzed-elements-background-depth-3',
                        'text-monzed-elements-textPrimary',
                        'outline-none flex justify-between items-center',
                        model === modelOption.name || focusedModelIndex === index
                          ? 'bg-monzed-elements-background-depth-2'
                          : undefined,
                        focusedModelIndex === index ? 'ring-1 ring-inset ring-monzed-elements-focus' : undefined,
                        isLocked ? 'opacity-75' : undefined,
                      )}
                      onClick={(e) => {
                        e.stopPropagation();

                        // If this model is locked for current plan, redirect to pricing
                        if (isLocked) {
                          navigate('/pricing');
                          return;
                        }

                        setModel?.(modelOption.name);
                        setIsModelDropdownOpen(false);
                        setModelSearchQuery('');
                      }}
                      tabIndex={focusedModelIndex === index ? 0 : -1}
                    >
                      <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={classNames(
                                isAdvancedReasoning ? 'i-ph:brain' : 'i-ph:lightning',
                                'shrink-0',
                                isAdvancedReasoning ? 'text-pink-500' : 'text-accent-500',
                              )}
                              title={isAdvancedReasoning ? 'Advanced reasoning' : 'Standard'}
                            />
                            <span>{modelOption.label}</span>
                          </div>
                        
                        {modelOption.description && (
                          <span className="text-xs text-monzed-elements-textTertiary mt-0.5">{modelOption.description}</span>
                        )}
                      </div>
                      {isLocked && (
                        <span className="text-yellow-500 inline-flex items-center">
                          <div className="i-ph:crown-simple-fill text-lg" title="Premium model – upgrade required" />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {filteredModels.some(m => !isModelAvailableForPlan(m)) && (
              <div className="border-t border-monzed-elements-borderColor mt-1 pt-2 px-3 py-1">
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full text-center text-sm text-accent-500 hover:text-accent-600 font-medium"
                >
                  Upgrade to access premium models
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
