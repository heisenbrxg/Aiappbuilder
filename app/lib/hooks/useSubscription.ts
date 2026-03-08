import { useEffect, useState } from 'react';
import { useAuthGuard } from '~/hooks/useAuthGuard';

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  current_period_end?: number;
  cancel_at_period_end?: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { isAuthenticated } = useAuthGuard();

  useEffect(() => {
    async function fetchSubscription() {
      if (!isAuthenticated) {
        setSubscription({ id: 'free', status: 'active', plan: 'free' });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/stripe/subscription', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }
        
        const data = await response.json() as { subscription?: any };
        
        if (data.subscription) {
          setSubscription(data.subscription);
        } else {
          // Default to free plan if no subscription found
          setSubscription({ id: 'free', status: 'active', plan: 'free' });
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        // Default to free plan on error
        setSubscription({ id: 'free', status: 'active', plan: 'free' });
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [isAuthenticated]);

  return { subscription, loading, error };
} 