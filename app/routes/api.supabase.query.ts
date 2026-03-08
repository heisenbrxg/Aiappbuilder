import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.supabase.query');

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return new Response('No authorization token provided', { status: 401 });
  }

  try {
    const { projectId, query } = (await request.json()) as any;
    logger.debug('Executing query:', { projectId, query });

    // Create abort controller with 60 second timeout (allows for project wake-up)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;

        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.log(e);
          errorData = { message: errorText };
        }

        logger.error(
          'Supabase API error:',
          JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          }),
        );

        return new Response(
          JSON.stringify({
            error: {
              status: response.status,
              statusText: response.statusText,
              message: errorData.message || errorData.error || errorText,
              details: errorData,
            },
          }),
          {
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      }

      const result = await response.json();

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout specifically
      if (fetchError.name === 'AbortError') {
        logger.error('Supabase query timeout (60s exceeded)');
        return new Response(
          JSON.stringify({
            error: {
              status: 408,
              statusText: 'Request Timeout',
              message: 'Supabase query timed out after 60 seconds. Your project may be paused (free tier) and needs time to wake up, or the query is too complex. Please try again in a moment.',
              details: { timeout: '60s', suggestion: 'Check if your Supabase project is active in the dashboard.' },
            },
          }),
          {
            status: 408,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      }
      
      // Re-throw other fetch errors to be caught by outer catch
      throw fetchError;
    }
  } catch (error) {
    logger.error('Query execution error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : 'Query execution failed',
          stack: error instanceof Error ? error.stack : undefined,
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
