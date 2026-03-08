import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from '@remix-run/react'
import { createClient } from '~/lib/supabase/client'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { UnifiedHeader } from '~/components/header/UnifiedHeader'
import type { MetaFunction } from '@remix-run/cloudflare'

export const meta: MetaFunction = () => {
  return [
    { title: 'Reset Password - sharelock.cc' },
    { name: 'description', content: 'Reset your sharelock.cc account password' },
  ]
}

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if we have a valid session from the reset link
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session check error:', error)
          setIsValidSession(false)
        } else if (session) {
          setIsValidSession(true)
        } else {
          // Try to get session from URL parameters (for password reset flow)
          const accessToken = searchParams.get('access_token')
          const refreshToken = searchParams.get('refresh_token')
          
          if (accessToken && refreshToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (setSessionError) {
              console.error('Set session error:', setSessionError)
              setIsValidSession(false)
            } else {
              setIsValidSession(true)
            }
          } else {
            setIsValidSession(false)
          }
        }
      } catch (error) {
        console.error('Session check failed:', error)
        setIsValidSession(false)
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [searchParams, supabase])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      toast.success('Password updated successfully! You can now sign in with your new password.')
      
      // Wait a moment for the toast to show, then redirect
      setTimeout(() => {
        navigate('/')
      }, 2000)
      
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="h-screen flex flex-col items-center justify-center monzed-bg-primary monzed-text-primary relative overflow-y-auto modern-scrollbar">
        <UnifiedHeader variant="landing" showNavigation={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monzed-accent mx-auto mb-4"></div>
            <p className="monzed-text-secondary">Verifying reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="h-screen flex flex-col items-center justify-center monzed-bg-primary monzed-text-primary relative overflow-y-auto modern-scrollbar">
        <UnifiedHeader variant="landing" showNavigation={false} />
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            className="max-w-md w-full monzed-bg-secondary rounded-xl border monzed-border p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="i-ph:warning w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold monzed-text-primary mb-2">
              Invalid Reset Link
            </h1>
            <p className="monzed-text-secondary mb-6">
              This password reset link is invalid or has expired. Please request a new password reset.
            </p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="w-full bg-monzed-accent hover:bg-monzed-glow text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-3"
            >
              Request New Reset Link
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full monzed-text-secondary hover:monzed-text-primary transition-colors"
            >
              Back to Home
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center monzed-bg-primary monzed-text-primary relative overflow-y-auto modern-scrollbar">
      <UnifiedHeader variant="landing" showNavigation={false} />
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          className="max-w-md w-full monzed-bg-secondary rounded-xl border monzed-border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-monzed-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="i-ph:key w-8 h-8 text-black" />
            </div>
            <h1 className="text-2xl font-bold monzed-text-primary mb-2">
              Set New Password
            </h1>
            <p className="monzed-text-secondary">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium monzed-text-primary mb-2 flex items-center gap-2">
                <div className="i-ph:lock w-4 h-4 monzed-text-secondary" />
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 monzed-bg-primary border monzed-border rounded-lg monzed-text-primary placeholder-monzed-text-tertiary focus:outline-none focus:ring-2 focus:ring-monzed-accent focus:border-monzed-accent transition-all duration-200"
                placeholder="Enter new password (min 6 characters)"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium monzed-text-primary mb-2 flex items-center gap-2">
                <div className="i-ph:lock w-4 h-4 monzed-text-secondary" />
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 monzed-bg-primary border monzed-border rounded-lg monzed-text-primary placeholder-monzed-text-tertiary focus:outline-none focus:ring-2 focus:ring-monzed-accent focus:border-monzed-accent transition-all duration-200"
                placeholder="Confirm new password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-monzed-accent hover:bg-monzed-glow disabled:bg-monzed-accent/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-monzed-accent focus:ring-offset-2 focus:ring-offset-monzed-bg-secondary flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Updating Password...
                </>
              ) : (
                <>
                  <div className="i-ph:check w-5 h-5" />
                  Update Password
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-monzed-accent hover:text-monzed-glow transition-colors font-medium"
            >
              Back to Sign In
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
