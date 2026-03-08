import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// For admin operations that need to bypass RLS
export function createServiceRoleClient(env?: any) {
  // In Cloudflare Workers, use env object; in Node.js, use process.env
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase service role configuration');
    console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.error('Current values:', {
      url: supabaseUrl ? '[SET]' : 'undefined',
      key: serviceRoleKey ? '[SET]' : 'undefined',
      envType: env ? 'Cloudflare Workers' : 'Node.js'
    });
    throw new Error('Supabase service role not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// For Remix server-side operations
export function createServerClient(request: Request, env?: any) {
  const url = new URL(request.url)
  const cookies = request.headers.get('cookie') || ''

  // In Cloudflare Workers, use env object; in Node.js, use process.env
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  // Check if Supabase is configured
  if (!supabaseUrl || !supabaseAnonKey ||
      supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
    console.warn('Supabase environment variables not configured')
    console.warn('Current values:', {
      url: supabaseUrl ? '[SET]' : 'undefined',
      key: supabaseAnonKey ? '[SET]' : 'undefined',
      envType: env ? 'Cloudflare Workers' : 'Node.js'
    });
    // Return a mock client that won't crash but won't work either
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
        getSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: null, error: new Error('Supabase not configured') })
              })
            })
          })
        })
      })
    } as any;
  }

  // Parse cookies from header
  const cookieMap = new Map<string, string>()
  cookies.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookieMap.set(name, decodeURIComponent(value))
    }
  })

  return createSupabaseServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieMap.get(name)
        },
        set(name: string, value: string, options: any) {
          // In Remix, cookie setting is handled in loaders/actions
          console.log('Cookie set request:', name, value, options)
        },
        remove(name: string, options: any) {
          // In Remix, cookie removal is handled in loaders/actions
          console.log('Cookie remove request:', name, options)
        },
      },
    }
  )
}
