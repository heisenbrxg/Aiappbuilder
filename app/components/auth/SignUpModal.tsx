import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { toast } from 'react-toastify';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageType?: 'builder' | 'wallet';
  onSuccess?: () => void;
}

export default function SignUpModal({ isOpen, onClose, imageType = 'builder', onSuccess }: SignUpModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignInMode, setIsSignInMode] = useState(false);
  const { signUp, signInWithGoogle, signIn } = useAuth();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignInMode) {
        // Sign in logic
        await signIn(email, password);
        toast.success('Welcome back!');
        onClose();
        onSuccess?.(); // Call success callback for redirect
      } else {
        // Sign up logic
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        await signUp(email, password);
        toast.success('Account created! Please check your email to verify your account.');
        onClose();
        onSuccess?.(); // Call success callback for redirect
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${isSignInMode ? 'Sign in' : 'Sign up'} failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // User will be redirected to Google, modal closes automatically
      // onSuccess will be called when auth state changes
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google sign-up failed');
      setIsGoogleLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowEmailForm(false);
    setIsSignInMode(false);
    setIsLoading(false);
    setIsGoogleLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors z-10"
              >
                <div className="w-3 h-3 i-ph:x text-gray-600 dark:text-gray-400" />
              </button>

              {/* Header Image */}
              <div className="relative h-32 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FC7C11, #47B560)' }}>
                <img
                  src="/images/sign_up_holder.png"
                  alt="Starsky Business Builder"
                  className="h-28 w-auto object-contain"
                />
                <div className="absolute inset-0 bg-black/10"></div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {isSignInMode
                      ? 'Welcome Back'
                      : imageType === 'wallet'
                        ? 'Get Your AI Currency Wallet'
                        : 'Start Building with AI'
                    }
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {isSignInMode
                      ? imageType === 'wallet'
                        ? 'Sign in to access your AI Currency wallet'
                        : 'Sign in to continue building with Starsky'
                      : imageType === 'wallet'
                        ? 'Create your account to access AI Currency and start using smart money that works instantly worldwide'
                        : 'Join Starsky and build your business with the power of artificial intelligence'
                    }
                  </p>
                </div>

                {/* Sign Up Options */}
                <div className="space-y-3">
                  {!showEmailForm ? (
                    <>
                      {/* Google Sign Up Button */}
                      <button
                        onClick={handleGoogleSignUp}
                        disabled={isGoogleLoading || isLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGoogleLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              Connecting to Google...
                            </span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              Continue with Google
                            </span>
                          </>
                        )}
                      </button>

                      {/* Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">or</span>
                        </div>
                      </div>

                      {/* Email Sign Up Button */}
                      <button
                        onClick={() => setShowEmailForm(true)}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 text-white rounded-lg transition-colors font-medium" style={{ backgroundColor: '#FC7C11' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A8BC7'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FC7C11'}
                      >
                        <div className="w-5 h-5 i-ph:envelope text-white" />
                        <span>{isSignInMode ? 'Continue with Email' : 'Continue with Email'}</span>
                      </button>
                    </>
                  ) : (
                    /* Email Sign Up Form */
                    <form onSubmit={handleEmailSignUp} className="space-y-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 dark:bg-gray-800 dark:text-white text-sm"
                          style={{ '--tw-ring-color': '#FC7C11' } as React.CSSProperties}
                          onFocus={(e) => e.target.style.borderColor = '#FC7C11'}
                          onBlur={(e) => e.target.style.borderColor = ''}
                          placeholder="Enter your email address"
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Password
                        </label>
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 dark:bg-gray-800 dark:text-white text-sm"
                          style={{ '--tw-ring-color': '#FC7C11' } as React.CSSProperties}
                          onFocus={(e) => e.target.style.borderColor = '#FC7C11'}
                          onBlur={(e) => e.target.style.borderColor = ''}
                          placeholder={isSignInMode ? "Enter your password" : "Create a password (min 6 characters)"}
                        />
                      </div>

                      {!isSignInMode && (
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirm Password
                          </label>
                          <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 dark:bg-gray-800 dark:text-white text-sm"
                            style={{ '--tw-ring-color': '#FC7C11' } as React.CSSProperties}
                            onFocus={(e) => e.target.style.borderColor = '#FC7C11'}
                            onBlur={(e) => e.target.style.borderColor = ''}
                            placeholder="Confirm your password"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading || !email.trim() || !password.trim() || (!isSignInMode && !confirmPassword.trim())}
                        className="w-full disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2" style={{ backgroundColor: '#FC7C11' }} onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#2A8BC7')} onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#FC7C11')}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>{isSignInMode ? 'Signing In...' : 'Creating Account...'}</span>
                          </>
                        ) : (
                          <>
                            <div className={`w-5 h-5 text-white ${isSignInMode ? 'i-ph:sign-in' : 'i-ph:user-plus'}`} />
                            <span>{isSignInMode ? 'Sign In' : 'Create Account'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowEmailForm(false)}
                        className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        ← Back to sign up options
                      </button>
                    </form>
                  )}
                </div>

                {/* Already have an account / Don't have an account */}
                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isSignInMode ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                      onClick={() => {
                        setIsSignInMode(!isSignInMode);
                        setShowEmailForm(true); // Auto-show email form when switching modes
                        setEmail('');
                        setPassword('');
                        setConfirmPassword('');
                      }}
                      className="font-semibold transition-colors underline" style={{ color: '#FC7C11', textDecorationColor: '#FC7C1150' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#2A8BC7'; e.currentTarget.style.textDecorationColor = '#2A8BC7'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#FC7C11'; e.currentTarget.style.textDecorationColor = '#FC7C1150'; }}
                    >
                      {isSignInMode ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </div>

                {/* Terms */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                  By continuing, you agree to our{' '}
                  <a href="/terms" className="hover:underline" style={{ color: '#FC7C11' }}>
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="hover:underline" style={{ color: '#FC7C11' }}>
                    Privacy Policy
                  </a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
