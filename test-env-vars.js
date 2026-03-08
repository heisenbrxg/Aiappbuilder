#!/usr/bin/env node

/**
 * Test Environment Variables
 * 
 * This script helps you verify that your environment variables are properly configured
 * for both development and production environments.
 */

const fs = require('fs');
const path = require('path');

console.log(`
★═══════════════════════════════════════★
    ENVIRONMENT VARIABLES TEST
★═══════════════════════════════════════★
`);

// Check if wrangler.toml exists and has the required variables
const wranglerPath = path.join(__dirname, 'wrangler.toml');
if (fs.existsSync(wranglerPath)) {
  console.log('✅ wrangler.toml found');
  
  const content = fs.readFileSync(wranglerPath, 'utf8');
  
  // Check for critical environment variables
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];
  
  console.log('\n📋 Checking required environment variables in wrangler.toml:');
  
  for (const varName of requiredVars) {
    const regex = new RegExp(`^${varName}\\s*=\\s*"(.+)"`, 'm');
    const match = content.match(regex);
    
    if (match && match[1] && match[1].trim() !== '') {
      console.log(`✅ ${varName}: [SET]`);
    } else {
      console.log(`❌ ${varName}: [NOT SET]`);
    }
  }
  
  // Check for optional AI API keys
  const optionalVars = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GROQ_API_KEY',
    'OPEN_ROUTER_API_KEY'
  ];
  
  console.log('\n📋 Checking optional AI API keys in wrangler.toml:');
  
  for (const varName of optionalVars) {
    const regex = new RegExp(`^${varName}\\s*=\\s*"(.+)"`, 'm');
    const match = content.match(regex);
    
    if (match && match[1] && match[1].trim() !== '') {
      console.log(`✅ ${varName}: [SET]`);
    } else {
      console.log(`⏭️  ${varName}: [NOT SET]`);
    }
  }
  
} else {
  console.log('❌ wrangler.toml not found');
}

// Check if .env files exist for development
const envFiles = ['.env', '.env.local', 'env copy.local'];
console.log('\n📋 Checking development environment files:');

for (const envFile of envFiles) {
  if (fs.existsSync(path.join(__dirname, envFile))) {
    console.log(`✅ ${envFile} found`);
  } else {
    console.log(`⏭️  ${envFile} not found`);
  }
}

console.log(`
★═══════════════════════════════════════★
    NEXT STEPS
★═══════════════════════════════════════★

1. If any required variables show [NOT SET]:
   - Run: node setup-production-env.js
   - Or manually edit wrangler.toml

2. To test your setup:
   - Build: npm run build
   - Deploy: npm run deploy

3. If you get "Supabase service role not configured":
   - Check that SUPABASE_SERVICE_ROLE_KEY is set in wrangler.toml
   - Verify the key is valid and not expired

4. For local development:
   - Make sure you have .env or .env.local with your keys
   - Run: npm run dev

★═══════════════════════════════════════★
`);
