import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

export default class DeepseekProvider extends BaseProvider {
  name = 'Deepseek';
  getApiKeyLink = 'https://platform.deepseek.com/apiKeys';

  config = {
    apiTokenKey: 'DEEPSEEK_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'deepseek-reasoner',
      label: 'DeepSeek Reasoner (R1)',
      provider: 'Deepseek',
      maxTokenAllowed: 64000,
      maxCompletionTokens: 8192,
      isPaid: false,
      description: 'Reasoning-focused model (R1). Step-by-step thinking; upgraded periodically by DeepSeek.'
    },
    {
      name: 'deepseek-chat',
      label: 'DeepSeek Chat',
      provider: 'Deepseek',
      maxTokenAllowed: 64000,
      maxCompletionTokens: 8192,
      isPaid: true,
      description: 'General-purpose conversational model optimized for natural dialogue and comprehensive assistance'
    },
    {
      name: 'deepseek-coder',
      label: 'DeepSeek Coder',
      provider: 'Deepseek',
      maxTokenAllowed: 64000,
      maxCompletionTokens: 8192,
      isPaid: true,
      description: 'Specialized coding model with advanced programming capabilities, code generation, and debugging assistance'
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
      defaultApiTokenKey: 'DEEPSEEK_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const deepseek = createDeepSeek({
      apiKey,
    });

    return deepseek(model, {
      // simulateStreaming: true,
    });
  }
}
