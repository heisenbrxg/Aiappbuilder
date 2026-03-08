import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@remix-run/react';
import { toast } from 'react-toastify';
import { useAuth } from '~/components/auth/AuthProvider';
import { motion } from 'framer-motion';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import { UnifiedHeader } from '~/components/header/UnifiedHeader';
import { Footer } from '~/components/footer/Footer';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      await signUp(email, password);
      
      // Show success message and redirect to login page instead of workspace
      // since user needs to confirm email first
      toast.success(
        'Account created successfully! 🎉\n\nPlease check your email and click the verification link to complete your registration.',
        {
          autoClose: 8000 // Keep toast visible longer
        }
      );
      
      // Wait a moment to let user see the success message, then redirect to login
      setTimeout(() => {
        navigate('/login?message=please_verify_email');
      }, 2000);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // User will be redirected to Google, then back via OAuth callback
      setIsRedirecting(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google sign-in failed');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="h-screen monzed-bg-primary monzed-text-primary overflow-x-hidden overflow-y-auto modern-scrollbar">
      <UnifiedHeader variant="landing" />
      
      {/* Main content area with proper header spacing */}
      <main className="pt-20 pb-8 px-4 min-h-screen flex flex-col relative">
        {/* Simple background */}
        <div className="absolute inset-0 monzed-bg-secondary/30 pointer-events-none"></div>

        {/* Centered form container */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="w-full max-w-md mx-auto">

        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        {/* Logo and title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Account</h1>
          <p className="monzed-text-secondary">Join sharelock.cc to start building amazing projects</p>
        </div>

        <div className="monzed-bg-secondary border monzed-border p-8 rounded-xl shadow-xl">
          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full monzed-bg-primary hover:monzed-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed monzed-text-primary font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-monzed-accent focus:ring-offset-2 flex items-center justify-center gap-3 border monzed-border"
          >
            {isGoogleLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 monzed-text-primary"></div>
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t monzed-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 monzed-bg-secondary monzed-text-secondary">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium monzed-text-primary mb-2 flex items-center gap-2">
                <div className="i-ph:envelope w-4 h-4 monzed-text-secondary"></div>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 monzed-bg-primary border monzed-border rounded-lg monzed-text-primary placeholder:monzed-text-tertiary focus:outline-none focus:ring-2 focus:ring-monzed-accent focus:border-monzed-accent transition-all duration-200"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium monzed-text-primary mb-2 flex items-center gap-2">
                <div className="i-ph:lock w-4 h-4 monzed-text-secondary"></div>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 monzed-bg-primary border monzed-border rounded-lg monzed-text-primary placeholder:monzed-text-tertiary focus:outline-none focus:ring-2 focus:ring-monzed-accent focus:border-monzed-accent transition-all duration-200"
                placeholder="Create a password (min 6 characters)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium monzed-text-primary mb-2 flex items-center gap-2">
                <div className="i-ph:lock w-4 h-4 monzed-text-secondary"></div>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 monzed-bg-primary border monzed-border rounded-lg monzed-text-primary placeholder:monzed-text-tertiary focus:outline-none focus:ring-2 focus:ring-monzed-accent focus:border-monzed-accent transition-all duration-200"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full bg-monzed-accent hover:bg-monzed-glow disabled:bg-monzed-accent/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-monzed-accent focus:ring-offset-2 focus:ring-offset-monzed-bg-secondary flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <div className="i-ph:user-plus w-4 h-4"></div>
                  Sign Up
                </>
              )}
            </button>
          </form>
        </div>

        {/* Loading overlay during redirect */}
        {isRedirecting && <LoadingOverlay message="Redirecting to landing page..." />}

        {/* Sign in link */}
        <p className="text-center mt-6 monzed-text-secondary">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-monzed-accent hover:text-monzed-glow font-medium transition-colors"
          >
            Login
          </Link>
        </p>
          </motion.div>
        </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
