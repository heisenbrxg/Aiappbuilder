import { createBrowserClient } from '@supabase/ssr'

// Single instance
let client: ReturnType<typeof createBrowserClient> | null = null

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// For client-side operations
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
    console.warn('Supabase not configured - running without authentication')
    console.warn('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
    console.warn('Current values:', { supabaseUrl, supabaseAnonKey })
    
    // Return a mock client that provides the expected interface
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
        signUp: () => Promise.reject(new Error('Supabase not configured')),
        signInWithOAuth: () => Promise.reject(new Error('Supabase not configured')),
        signOut: () => Promise.reject(new Error('Supabase not configured')),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') })
            })
          })
        }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
        })
      })
    } as any;
  }
  
  // Create client only once
  if (!client) {
    try {
      client = createBrowserClient(supabaseUrl, supabaseAnonKey);
      
      // Add global error handler for unhandled Supabase errors
      const originalFrom = client.from.bind(client);
      client.from = function wrappedFrom(table: any) {
        const result = originalFrom(table);
        
        // Wrap the select method
        const originalSelect = result.select.bind(result);
        result.select = function wrappedSelect(...args: any[]) {
          try {
            return originalSelect(...args);
          } catch (error) {
            console.error(`Supabase error in select operation on ${table}:`, error);
            throw error;
          }
        };
        
        // Wrap other methods as needed
        const originalInsert = result.insert.bind(result);
        result.insert = function wrappedInsert(...args: any[]) {
          try {
            return originalInsert(...args);
          } catch (error) {
            console.error(`Supabase error in insert operation on ${table}:`, error);
            throw error;
          }
        };
        
        return result;
      };
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      // Return a mock client on initialization error
      return {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: new Error('Supabase initialization failed') })
            })
          })
        })
      } as any;
    }
  }
  
  return client;
}
