// Vercel Serverless Function (Node.js runtime) — wraps Remix for SSR
// Uses Node.js runtime to support node:crypto, node:http, stream, etc.
// that @remix-run/cloudflare server build requires

import { createRequestHandler } from '@remix-run/cloudflare';

let handler;

async function getHandler() {
  if (!handler) {
    const build = await import('../build/server/index.js');
    handler = createRequestHandler(build, process.env.NODE_ENV || 'production');
  }
  return handler;
}

// Map process.env → Cloudflare-style env bindings
function getEnv() {
  return {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '',
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ?? '',
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ?? '',
    XAI_API_KEY: process.env.XAI_API_KEY ?? '',
    GROQ_API_KEY: process.env.GROQ_API_KEY ?? '',
    OPEN_ROUTER_API_KEY: process.env.OPEN_ROUTER_API_KEY ?? '',
    HYPERBOLIC_API_KEY: process.env.HYPERBOLIC_API_KEY ?? '',
    COHERE_API_KEY: process.env.COHERE_API_KEY ?? '',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? '',
    GITHUB_TOKEN_TYPE: process.env.GITHUB_TOKEN_TYPE ?? 'classic',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? '',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    VITE_LOG_LEVEL: process.env.VITE_LOG_LEVEL ?? 'debug',
    VITE_TURNSTILE_SITE_KEY: process.env.VITE_TURNSTILE_SITE_KEY ?? '',
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  };
}

export default async function handler(req, res) {
  try {
    const remixHandler = await getHandler();
    const env = getEnv();

    // Convert Node.js request to Web API Request
    const url = new URL(req.url, `https://${req.headers.host}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const { Readable } = require('stream');
      body = Readable.toWeb(req);
    }

    const webRequest = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
      duplex: 'half',
    });

    const webResponse = await remixHandler(webRequest, { env, cloudflare: { env } });

    // Convert Web API Response → Node.js response
    res.statusCode = webResponse.status;
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    // Add required COOP/COEP headers for WebContainer
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    if (webResponse.body) {
      const reader = webResponse.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) { res.end(); return; }
        res.write(value);
        return pump();
      };
      await pump();
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Remix handler error:', error);
    res.statusCode = 500;
    res.end(`Internal Server Error: ${error.message}`);
  }
}
