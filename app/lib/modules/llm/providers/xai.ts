import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createXai } from '@ai-sdk/xai';

export default class XAIProvider extends BaseProvider {
  name = 'xAI';
  getApiKeyLink = 'https://docs.x.ai/docs/quickstart#creating-an-api-key';

  config = {
    apiTokenKey: 'XAI_API_KEY',
  };

  staticModels: ModelInfo[] = [
    /*
     * Grok 4 - Latest generation (from bolt.diy-main)
     */
    {
      name: 'grok-4',
      label: 'xAI Grok 4',
      provider: 'xAI',
      maxTokenAllowed: 256000,
      maxCompletionTokens: 8192,
      isPaid: true,
      description: 'Latest flagship Grok model with 256k context',
    },
    {
      name: 'grok-4-fast-reasoning',
      label: 'xAI Grok 4 Fast (Reasoning)',
      provider: 'xAI',
      maxTokenAllowed: 256000,
      maxCompletionTokens: 8192,
      isPaid: true,
      description: 'Reasoning-optimized Grok 4 variant with faster responses',
    },

    /*
     * Grok 3 - Current generation
     */
    {
      name: 'grok-3',
      label: 'Grok 3',
      provider: 'xAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
      isPaid: true,
      description: 'Latest flagship model with advanced reasoning, real-time information access (Feb 2025)'
    },
    {
      name: 'grok-3-fast',
      label: 'Grok 3 Fast',
      provider: 'xAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
      isPaid: true,
      description: 'Speed-optimized Grok 3 variant',
    },
    {
      name: 'grok-3-mini',
      label: 'Grok 3 Mini',
      provider: 'xAI',
      maxTokenAllowed: 131000,
      maxCompletionTokens: 8192,
      isPaid: true,
      description: 'Efficient version of Grok 3 optimized for speed and cost-effectiveness while maintaining strong performance'
    },
    {
      name: 'grok-3-mini-fast',
      label: 'xAI Grok 3 Mini Fast',
      provider: 'xAI',
      maxTokenAllowed: 131000,
      maxCompletionTokens: 8192,
      isPaid: true,
      description: 'Fastest Grok 3 Mini variant',
    },
    {
      name: 'grok-code-fast-1',
      label: 'xAI Grok Code Fast 1',
      provider: 'xAI',
      maxTokenAllowed: 131000,
      maxCompletionTokens: 8192,
      isPaid: true,
      description: 'Specialized coding model optimized for speed',
    },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'XAI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const xaiProvider = createXai({
      baseURL: 'https://api.x.ai/v1',
      apiKey,
    });

    // Cast to align differing @ai-sdk/provider versions and silence TS type mismatch errors
    return xaiProvider(model) as unknown as LanguageModelV1;
  }
}
