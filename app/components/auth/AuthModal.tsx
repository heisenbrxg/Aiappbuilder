import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { cubicEasingFn } from '~/utils/easings'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

const transition = {
  duration: 0.15,
  ease: cubicEasingFn,
}

const backdropVariants = {
  closed: {
    opacity: 0,
    transition,
  },
  open: {
    opacity: 1,
    transition,
  },
}

const modalVariants = {
  closed: {
    x: '-50%',
    y: '-40%',
    scale: 0.96,
    opacity: 0,
    transition,
  },
  open: {
    x: '-50%',
    y: '-50%',
    scale: 1,
    opacity: 1,
    transition,
  },
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { signIn, signUp, signInWithGoogle, resetPassword, isSignUpMode, isResetMode, showSignIn, showSignUp, showResetPassword } = useAuth()

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setIsLoading(false)
      setIsGoogleLoading(false)
    }
  }, [isOpen, isSignUpMode, isResetMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isResetMode) {
        await resetPassword(email)
        toast.success('Password reset email sent! Please check your email inbox.')
        onClose()
      } else if (isSignUpMode) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
        await signUp(email, password)
        toast.success('Account created! Please check your email to verify your account.')
        onClose()
      } else {
        await signIn(email, password)
        onClose()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
      // Note: User will be redirected to Google, so we don't close modal here
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google sign-in failed')
      setIsGoogleLoading(false)
    }
  }

  const toggleMode = () => {
    if (isSignUpMode) {
      showSignIn()
    } else {
      showSignUp()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm"
            initial="closed"
            animate="open"
            exit="closed"
            variants={backdropVariants}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 w-full max-w-md mx-3 sm:mx-4 bg-monzed-elements-background-depth-2 rounded-xl border border-monzed-elements-borderColor shadow-2xl focus:outline-none max-h-[90vh] overflow-y-auto"
            initial="closed"
            animate="open"
            exit="closed"
            variants={modalVariants}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-monzed-elements-borderColor">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-xl flex items-center justify-center">
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 text-white ${
                    isResetMode ? 'i-ph:key' : isSignUpMode ? 'i-ph:user-plus' : 'i-ph:sign-in'
                  }`} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-monzed-elements-textPrimary">
                    {isResetMode ? 'Reset Password' : isSignUpMode ? 'Create Account' : 'Welcome Back'}
                  </h2>
                  <p className="text-xs sm:text-sm text-monzed-elements-textSecondary mt-1">
                    {isResetMode
                  ? 'Enter your email to receive a password reset link'
                  : isSignUpMode
                    ? 'Join sharelock.cc to start building amazing projects'
                    : 'Sign in to continue to sharelock.cc'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-monzed-elements-textSecondary hover:text-monzed-elements-textPrimary transition-colors p-1 rounded-lg hover:bg-monzed-elements-background-depth-3"
              >
                <div className="i-ph:x w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Google Sign In Button - Hide in reset mode */}
              {!isResetMode && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-monzed-elements-background-depth-2 flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl border border-gray-200 text-sm sm:text-base"
                >
                  {isGoogleLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                      <span>Connecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              )}

              {/* Divider - Hide in reset mode */}
              {!isResetMode && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-monzed-elements-borderColor"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-monzed-elements-background-depth-2 text-monzed-elements-textSecondary">
                      or continue with email
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-monzed-elements-textPrimary mb-2 flex items-center gap-2">
                    <div className="i-ph:envelope w-4 h-4 text-monzed-elements-textSecondary" />
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-monzed-elements-prompt-background border border-monzed-elements-borderColor rounded-lg text-monzed-elements-textPrimary placeholder-monzed-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm sm:text-base"
                    placeholder="Enter your email address"
                  />
                </div>

                {/* Password field - Hide in reset mode */}
                {!isResetMode && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-monzed-elements-textPrimary mb-2 flex items-center gap-2">
                      <div className="i-ph:lock w-4 h-4 text-monzed-elements-textSecondary" />
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-monzed-elements-prompt-background border border-monzed-elements-borderColor rounded-lg text-monzed-elements-textPrimary placeholder-monzed-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm sm:text-base"
                      placeholder={isSignUpMode ? "Create a password (min 6 characters)" : "Enter your password"}
                    />
                  </div>
                )}

                {/* Confirm Password field - Only show in sign up mode */}
                <AnimatePresence>
                  {isSignUpMode && !isResetMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-monzed-elements-textPrimary mb-2 flex items-center gap-2">
                        <div className="i-ph:lock w-4 h-4 text-monzed-elements-textSecondary" />
                        Confirm Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-monzed-elements-prompt-background border border-monzed-elements-borderColor rounded-lg text-monzed-elements-textPrimary placeholder-monzed-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm sm:text-base"
                        placeholder="Confirm your password"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-monzed-elements-background-depth-2 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isResetMode ? 'Sending Reset Email...' : isSignUpMode ? 'Creating Account...' : 'Signing In...'}
                    </>
                  ) : (
                    <>
                      <div className={`w-4 h-4 ${
                        isResetMode ? 'i-ph:paper-plane' : isSignUpMode ? 'i-ph:user-plus' : 'i-ph:sign-in'
                      }`} />
                      {isResetMode ? 'Send Reset Email' : isSignUpMode ? 'Create Account' : 'Sign In'}
                    </>
                  )}
                </button>

                {/* Forgot Password Link - Only show in sign in mode */}
                {!isSignUpMode && !isResetMode && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={showResetPassword}
                      className="text-sm text-monzed-elements-textSecondary hover:text-red-500 transition-colors underline decoration-monzed-elements-textSecondary/30 hover:decoration-red-500"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-center border-t border-monzed-elements-borderColor pt-4 sm:pt-6">
              <p className="text-sm text-monzed-elements-textSecondary">
                {isResetMode 
                  ? 'Remember your password?' 
                  : isSignUpMode 
                    ? 'Already have an account?' 
                    : "Don't have an account?"
                }{' '}
                <button
                  onClick={isResetMode ? showSignIn : toggleMode}
                  className="text-red-500 hover:text-red-600 font-semibold transition-colors underline decoration-red-500/30 hover:decoration-red-500"
                >
                  {isResetMode ? 'Back to Sign In' : isSignUpMode ? 'Sign In' : 'Sign Up'}
                </button>
              </p>

              {/* Starsky Branding */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-monzed-elements-textTertiary">
                <div className="w-4 h-4 bg-gradient-to-r from-monzed-accent to-mint-cyber rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-black rounded-sm"></div>
                </div>
                <span>Powered by <a href="https://sharelock.cc" target="_blank" rel="noopener noreferrer" className="text-monzed-elements-textSecondary hover:text-monzed-accent transition-colors">Network Coin AI</a></span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
