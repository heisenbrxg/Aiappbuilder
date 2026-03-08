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
   * @returns boolean - always true since we removed login requirement
   */
  const requireAuth = (): boolean => {
    return true
  }

  /**
   * Wrapper function that always executes the callback.
   */
  const withAuth = (callback: () => void | Promise<void>) => {
    return () => {
      callback()
    }
  }

  return {
    isAuthenticated: true,
    requireAuth,
    withAuth
  }
}
