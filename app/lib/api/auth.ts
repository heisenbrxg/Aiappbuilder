import type { User } from '@supabase/supabase-js';
import { createServerClient } from '~/lib/supabase/server';

/**
 * Require authentication for API routes
 * Returns the authenticated user or throws a Response with 401 status
 */
export async function requireAuth(request: Request, env?: any): Promise<User> {
  // Create Supabase client using the existing server utility with environment variables
  const supabase = createServerClient(request, env);

  // Get session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Response('Unauthorized', {
      status: 401,
      statusText: 'Unauthorized',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  return session.user;
}