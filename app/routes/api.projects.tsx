import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createSupabaseServerClient, createSupabaseServiceClient } from '~/supabase.server';
import type { Project } from '~/lib/types';

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  try {
    // Get environment variables from Cloudflare Workers context
    const env = context.cloudflare?.env;
    
    // Use regular client to get user authentication
    const { supabase: userSupabase, headers } = createSupabaseServerClient(request, env);
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    
    // Use service role client for database operations
    const { supabase } = createSupabaseServiceClient(env);
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const perPage = 12;
    const rangeStart = (page - 1) * perPage;
    const rangeEnd = page * perPage - 1;

    let query = supabase.from('user_chats').select('*, metadata', { count: 'exact' })
      .not('description', 'is', null);

    if (user) {
      // User is authenticated, fetch their projects
      query = query.eq('user_id', user.id);
    } else {
      // User is not authenticated; fetch recent projects from all users (no user_id filter)
      // Note: we previously attempted to filter by is_public, but the column does not exist.
      // Simply leave the query unfiltered so it returns latest projects.
    }

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(rangeStart, rangeEnd)
      .returns<Project[]>();

    if (error) {
      console.error('Error fetching projects:', error);
      return json({ error: 'Failed to fetch projects' }, { status: 500, headers });
    }

    const totalProjects = count ?? 0;
    const hasMore = rangeEnd < totalProjects - 1;

    return json(
      { projects: data ?? [], hasMore, totalProjects },
      { headers }
    );
    
  } catch (err) {
    console.error('Critical error in projects API:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
