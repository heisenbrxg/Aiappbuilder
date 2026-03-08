import { useAuth } from '~/components/auth/AuthProvider'
import { useNavigate } from '@remix-run/react'

/**
 * Hook to guard actions that require authentication
 * and redirects to login page if not. Returns a function to check auth before actions.
 */
export function useAuthGuard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  /**
   * Check if user is authenticated before allowing an action.
   * @returns boolean - true if authenticated, false otherwise
   */
  const requireAuth = (): boolean => {
    if (!user) {
      navigate('/login')
      return false
    }
    return true
  }

  /**
   * Wrapper function that only executes the callback if user is authenticated.
   * If not authenticated, shows the auth modal instead.
   */
  const withAuth = (callback: () => void | Promise<void>) => {
    return () => {
      if (requireAuth()) {
        callback()
      }
    }
  }

  return {
    isAuthenticated: !!user,
    requireAuth,
    withAuth
  }
}
