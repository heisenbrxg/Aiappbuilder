interface Env {
  // Application Configuration
  VITE_LOG_LEVEL: string;

  // AI API Keys
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  DEEPSEEK_API_KEY: string;
  MISTRAL_API_KEY: string;
  XAI_API_KEY: string;
  PERPLEXITY_API_KEY: string;

  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // Supabase Configuration
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // GitHub Configuration (Server-side only for templates)
  GITHUB_TOKEN: string;
  GITHUB_TOKEN_TYPE: string;
}
