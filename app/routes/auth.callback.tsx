import { useEffect } from 'react'
import { useNavigate } from '@remix-run/react'
import { createClient } from '~/lib/supabase/client'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()

      try {
        // Check if this is a password reset callback
        const urlParams = new URLSearchParams(window.location.search)
        const type = urlParams.get('type')
        
        if (type === 'recovery') {
          // This is a password reset callback, redirect to reset password page
          navigate('/auth/reset-password' + window.location.search)
          return
        }

        // Handle OAuth callback by exchanging the code for a session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          navigate('/login?error=auth_callback_failed')
          return
        }

        if (data.session) {
          // Successfully authenticated, redirect to workspace
          navigate('/workspace')
        } else {
          // Try to get session from URL hash (for OAuth flows)
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')

          if (accessToken) {
            // Wait a moment for the session to be established
            setTimeout(() => {
              navigate('/workspace')
            }, 1000)
          } else {
            // No session found, redirect to login with error
            navigate('/login?error=no_session')
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        navigate('/login?error=auth_callback_failed')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen monzed-bg-primary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monzed-accent mx-auto mb-4"></div>
        <p className="monzed-text-secondary">Completing sign in...</p>
      </div>
    </div>
  )
}
