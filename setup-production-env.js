#!/usr/bin/env node

/**
 * Setup Production Environment Variables for Cloudflare Workers
 * 
 * This script helps you set environment variables for production deployment
 * without using PowerShell scripts.
 * 
 * Usage:
 * 1. Make sure you have your API keys ready
 * 2. Run: node setup-production-env.js
 * 3. Follow the prompts to set your environment variables
 * 4. Deploy with: npm run deploy
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Environment variables that need to be set
const envVars = [
  {
    key: 'OPENAI_API_KEY',
    description: 'OpenAI API Key (for GPT models)',
    required: false,
    sensitive: true
  },
  {
    key: 'ANTHROPIC_API_KEY',
    description: 'Anthropic API Key (for Claude models)',
    required: false,
    sensitive: true
  },
  {
    key: 'GROQ_API_KEY',
    description: 'Groq API Key',
    required: false,
    sensitive: true
  },
  {
    key: 'OPEN_ROUTER_API_KEY',
    description: 'OpenRouter API Key',
    required: false,
    sensitive: true
  },
  {
    key: 'MISTRAL_API_KEY',
    description: 'Mistral API Key',
    required: false,
    sensitive: true
  },
  {
    key: 'DEEPSEEK_API_KEY',
    description: 'DeepSeek API Key',
    required: false,
    sensitive: true
  },
  {
    key: 'XAI_API_KEY',
    description: 'xAI API Key',
    required: false,
    sensitive: true
  },
  {
    key: 'PERPLEXITY_API_KEY',
    description: 'Perplexity API Key',
    required: false,
    sensitive: true
  },
  {
    key: 'GITHUB_TOKEN',
    description: 'GitHub Personal Access Token (Server-side only for templates)',
    required: false,
    sensitive: true
  }
];

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateWranglerToml(updates) {
  const wranglerPath = path.join(__dirname, 'wrangler.toml');
  let content = fs.readFileSync(wranglerPath, 'utf8');
  
  for (const [key, value] of Object.entries(updates)) {
    if (value && value.trim() !== '') {
      // Update the value in wrangler.toml
      const regex = new RegExp(`^${key}\\s*=\\s*".*"`, 'm');
      if (content.match(regex)) {
        content = content.replace(regex, `${key} = "${value}"`);
      }
    }
  }
  
  fs.writeFileSync(wranglerPath, content);
  console.log('✅ Updated wrangler.toml with your environment variables');
}

async function main() {
  console.log(`
★═══════════════════════════════════════★
    Starsky PRODUCTION ENVIRONMENT SETUP
★═══════════════════════════════════════★

This script will help you set up environment variables
for production deployment to Cloudflare Workers.

Press Enter to skip any API key you don't want to set.
`);

  const updates = {};
  
  for (const envVar of envVars) {
    const prompt = `${envVar.description} (${envVar.key}): `;
    const value = await question(prompt);
    
    if (value && value.trim() !== '') {
      updates[envVar.key] = value.trim();
      console.log(`✅ Set ${envVar.key}`);
    } else {
      console.log(`⏭️  Skipped ${envVar.key}`);
    }
  }
  
  if (Object.keys(updates).length > 0) {
    await updateWranglerToml(updates);
    
    console.log(`
★═══════════════════════════════════════★
    SETUP COMPLETE!
★═══════════════════════════════════════★

Your environment variables have been configured.

Next steps:
1. Build your application: npm run build
2. Deploy to Cloudflare: npm run deploy

Note: Your Stripe and Supabase keys are already configured
from your env copy.local file.
`);
  } else {
    console.log('No environment variables were updated.');
  }
  
  rl.close();
}

main().catch(console.error);
