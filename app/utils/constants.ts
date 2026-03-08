import { LLMManager } from '~/lib/modules/llm/manager';
import type { Template } from '~/types/template';

export const WORK_DIR_NAME = 'project';
export const WORK_DIR = `/home/${WORK_DIR_NAME}`;
export const MODIFICATIONS_TAG_NAME = 'bolt_file_modifications';
export const MODEL_REGEX = /^\[Model: (.*?)\]\n\n/;
export const PROVIDER_REGEX = /\[Provider: (.*?)\]\n\n/;
export const DEFAULT_MODEL = 'gemini-2.5-flash';
export const PROMPT_COOKIE_KEY = 'cachedPrompt';

// MCP Tool Execution Constants (monzed.diy-main compatible)
export const TOOL_EXECUTION_APPROVAL = {
  APPROVE: 'Yes, approved.',
  REJECT: 'No, rejected.',
} as const;
export const TOOL_NO_EXECUTE_FUNCTION = 'Error: No execute function found on tool';
export const TOOL_EXECUTION_DENIED = 'Error: User denied access to tool execution';
export const TOOL_EXECUTION_ERROR = 'Error: An error occured while calling tool';

const llmManager = LLMManager.getInstance(import.meta.env);

export const PROVIDER_LIST = llmManager.getAllProviders();
export const DEFAULT_PROVIDER = PROVIDER_LIST.find(provider => provider.name === 'Google') || PROVIDER_LIST.find(provider => provider.name === 'Anthropic') || llmManager.getDefaultProvider();

export const providerBaseUrlEnvKeys: Record<string, { baseUrlKey?: string; apiTokenKey?: string }> = {};
PROVIDER_LIST.forEach((provider) => {
  providerBaseUrlEnvKeys[provider.name] = {
    baseUrlKey: provider.config.baseUrlKey,
    apiTokenKey: provider.config.apiTokenKey,
  };
});

// Starter Templates - Streamlined core collection covering all major use cases

export const STARTER_TEMPLATES: Template[] = [
  {
    name: 'Modern Web App',
    label: 'Modern Web App',
    description: 'Build beautiful, interactive web applications with premium UI components. Perfect for SaaS, dashboards, admin panels, full-stack apps, and most web projects.',
    githubRepo: 'Ayouba04/starsky-vite-shadcn',
    tags: ['webapp', 'dashboard', 'saas', 'interactive', 'default', 'enterprise', 'business', 'fullstack'],
    icon: 'i-monzed:shadcn',
  },
  {
    name: 'Mobile App',
    label: 'Mobile App',
    description: 'Build cross-platform mobile apps for iOS and Android with a single codebase using React Native and Expo',
    githubRepo: 'Ayouba04/starsky-expo-template',
    tags: ['mobile', 'ios', 'android', 'app-store', 'google-play', 'native'],
    icon: 'i-monzed:expo',
  },
  {
    name: 'Lightning Blog',
    label: 'Lightning-Fast Blog',
    description: 'Create ultra-fast blogs, documentation sites, and content websites that load instantly with superior SEO',
    githubRepo: 'Ayouba04/starsky-astro-basic-template',
    tags: ['blog', 'content', 'seo', 'fast-loading', 'documentation', 'static'],
    icon: 'i-monzed:astro',
  },
  {
    name: 'Crypto/Web3 App',
    label: 'Crypto & Web3 App',
    description: 'Build DeFi platforms, NFT marketplaces, and blockchain applications with wallet integration and Web3 libraries',
    githubRepo: 'Ayouba04/starsky-web3-wagmi-template',
    tags: ['crypto', 'web3', 'defi', 'nft', 'blockchain', 'wallet', 'ethereum'],
    icon: 'i-lm:blockchain',
  },
  {
    name: 'Interactive Presentations',
    label: 'Interactive Slides',
    description: 'Create stunning presentations with code, animations, and interactive elements for talks, pitch decks, and demos',
    githubRepo: 'Ayouba04/starsky-slidev-template',
    tags: ['presentation', 'slides', 'interactive', 'pitch-deck', 'demo', 'talk'],
    icon: 'i-monzed:slidev',
  },
];
