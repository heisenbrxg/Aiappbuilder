import { createServerClient, parse, serialize } from '@supabase/ssr';

// Client-side Supabase client (uses anon key)
export const createSupabaseServerClient = (request: Request, env?: any) => {
  const cookies = parse(request.headers.get('Cookie') ?? '');
  const headers = new Headers();

  // Try to get from Cloudflare Workers env first, fallback to process.env
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(key) {
          return cookies[key];
        },
        set(key, value, options) {
          headers.append('Set-Cookie', serialize(key, value, options));
        },
        remove(key, options) {
          headers.append('Set-Cookie', serialize(key, '', options));
        },
      },
    }
  );

  return { supabase, headers };
};

// Server-side Supabase client (uses service role key for admin operations)
export const createSupabaseServiceClient = (env?: any) => {
  // Try to get from Cloudflare Workers env first, fallback to process.env
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      cookies: {
        get() { return ''; },
        set() {},
        remove() {},
      },
    }
  );

  return { supabase, headers: new Headers() };
};
