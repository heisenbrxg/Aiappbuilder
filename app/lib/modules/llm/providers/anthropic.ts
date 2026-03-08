import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { createAnthropic } from '@ai-sdk/anthropic';

export default class AnthropicProvider extends BaseProvider {
  name = 'Anthropic';
  getApiKeyLink = 'https://console.anthropic.com/settings/keys';

  config = {
    apiTokenKey: 'ANTHROPIC_API_KEY',
  };

  staticModels: ModelInfo[] = [
    /*
     * Claude 4 Models - Latest generation
     */
    {
      name: 'claude-opus-4',
      label: 'Claude Opus 4',
      provider: 'Anthropic',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 32000,
      isPaid: true,
      description: 'Most powerful model, best coding model in the world (72.5% SWE-bench), can work for hours continuously'
    },
    {
      name: 'claude-sonnet-4-5',
      label: 'Claude Sonnet 4.5',
      provider: 'Anthropic',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 64000,
      isPaid: true,
      description: 'State-of-the-art coding model, best at computer use (61.4% OSWorld), most aligned model yet (Oct 2025)'
    },
    {
      name: 'claude-sonnet-4-20250514',
      label: 'Claude Sonnet 4',
      provider: 'Anthropic',
      maxTokenAllowed: 64000,
      maxCompletionTokens: 64000,
      isPaid: false, // Free for all users - flagship model
      description: 'Flagship model with advanced reasoning and extended thinking capabilities (72.7% SWE-bench)'
    },
    {
      name: 'claude-haiku-4-5',
      label: 'Claude Haiku 4.5',
      provider: 'Anthropic',
      maxTokenAllowed: 64000,
      maxCompletionTokens: 64000,
      isPaid: false, // Free for all users - our main model
      description: 'Free flagship model - Fast, cost-efficient. Near Sonnet 4 performance at 1/3 cost, 2x speed (73.3% SWE-bench)',
    },

    /*
     * Claude 3.5 - Stable fallback models
     */
    {
      name: 'claude-3-5-sonnet-20241022',
      label: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 128000,
      isPaid: true,
      description: 'Stable, reliable model - excellent for complex reasoning and coding'
    },
    {
      name: 'claude-3-haiku-20240307',
      label: 'Claude 3 Haiku',
      provider: 'Anthropic',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 128000,
      isPaid: true,
      description: 'Fastest and most cost-effective Claude model',
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'ANTHROPIC_API_KEY',
    });

    if (!apiKey) {
      throw `Missing Api Key configuration for ${this.name} provider`;
    }

    // Validate API key format for Anthropic
    if (!apiKey.startsWith('sk-ant-') || apiKey.length < 20) {
      console.warn(`Invalid Anthropic API key format. Expected format: sk-ant-...`);
      throw `Invalid Api Key format for ${this.name} provider`;
    }

    try {
      const response = await fetch(`https://api.anthropic.com/v1/models`, {
        headers: {
          'x-api-key': `${apiKey}`,
          'anthropic-version': '2023-06-01',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const res = (await response.json()) as any;
      
      if (!res.data || !Array.isArray(res.data)) {
        console.error('Unexpected API response format from Anthropic:', res);
        return [];
      }
      
      const staticModelIds = this.staticModels.map((m) => m.name);
      
      const data = res.data.filter((model: any) => 
        model && model.type === 'model' && model.id && !staticModelIds.includes(model.id)
      );
      
      return data.map((m: any) => {
        // Get accurate context window from Anthropic API
        let contextWindow = 32000; // default fallback

        // Anthropic provides max_tokens in their API response
        if (m.max_tokens) {
          contextWindow = m.max_tokens;
        } else if (m.id?.includes('claude-3-5-sonnet')) {
          contextWindow = 200000; // Claude 3.5 Sonnet has 200k context
        } else if (m.id?.includes('claude-3-haiku')) {
          contextWindow = 200000; // Claude 3 Haiku has 200k context
        } else if (m.id?.includes('claude-3-opus')) {
          contextWindow = 200000; // Claude 3 Opus has 200k context
        } else if (m.id?.includes('claude-3-sonnet')) {
          contextWindow = 200000; // Claude 3 Sonnet has 200k context
        }

        // Determine completion token limits based on specific model
        let maxCompletionTokens = 128000; // default for older Claude 3 models

        if (m.id?.includes('claude-opus-4')) {
          maxCompletionTokens = 32000; // Claude 4 Opus: 32K output limit
        } else if (m.id?.includes('claude-sonnet-4')) {
          maxCompletionTokens = 64000; // Claude 4 Sonnet: 64K output limit
        } else if (m.id?.includes('claude-4')) {
          maxCompletionTokens = 32000; // Other Claude 4 models: conservative 32K limit
        }

        return {
          name: m.id,
          label: `${m.display_name || m.id} (${Math.floor(contextWindow / 1000)}k context)`,
          provider: this.name,
          maxTokenAllowed: contextWindow,
          maxCompletionTokens,
          isPaid: true,
        };
      });
    } catch (error) {
      console.error(`Error fetching Anthropic models:`, error);
      return [];
    }
  }

  getModelInstance: (options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }) => LanguageModelV1 = (options) => {
    const { apiKeys, providerSettings, serverEnv, model } = options;
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'ANTHROPIC_API_KEY',
    });

    // Validate API key format for Anthropic
    if (apiKey && (!apiKey.startsWith('sk-ant-') || apiKey.length < 20)) {
      console.warn(`Invalid Anthropic API key format. Expected format: sk-ant-...`);
      throw new Error(`Invalid Api Key format for ${this.name} provider`);
    }

    const anthropic = createAnthropic({
      apiKey,
      headers: { 'anthropic-beta': 'output-128k-2025-02-19' },
    });

    return anthropic(model);
  };
}
