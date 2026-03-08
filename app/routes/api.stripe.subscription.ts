import { json } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';
import { createServerClient } from '~/lib/supabase/server';

export const loader: LoaderFunction = async ({ request, context }: any) => {
  try {
    // Get environment variables from context (Cloudflare Workers) or process.env (Node.js)
    const env = context?.cloudflare?.env;
    const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('Supabase not configured, returning default free plan');
      return json({
        subscription: {
          id: 'free',
          status: 'active',
          plan: 'free'
        }
      });
    }

    // Initialize Supabase client
    const supabase = createServerClient(request, env);
    
    // Get the authenticated user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // Return free plan for unauthenticated users
      return json({ 
        subscription: { 
          id: 'free', 
          status: 'active', 
          plan: 'free' 
        } 
      });
    }

    // Query the subscriptions table to get the user's active subscription
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select('id, status, plan_id, current_period_end, cancel_at_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching subscription:', error);
      // Return free plan on database error
      return json({ 
        subscription: { 
          id: 'free', 
          status: 'active', 
          plan: 'free' 
        } 
      });
    }

    // If no subscription found, return null
    if (!subscriptions || subscriptions.length === 0) {
      // Return a free plan as default
      return json({ 
        subscription: { 
          id: 'free', 
          status: 'active', 
          plan: 'free' 
        } 
      });
    }

    // Map to expected shape (plan)
    const sub = subscriptions[0];
    return json({
      subscription: {
        id: sub.id,
        status: sub.status,
        plan: sub.plan_id,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
      },
    });
  } catch (error) {
    console.error('Error in subscription loader:', error);
    // Return free plan on any error
    return json({ 
      subscription: { 
        id: 'free', 
        status: 'active', 
        plan: 'free' 
      } 
    });
  }
}; 