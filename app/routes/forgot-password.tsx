import { useState } from 'react';
import { Link, useNavigate } from '@remix-run/react';
import { toast } from 'react-toastify';
import { useAuth } from '~/components/auth/AuthProvider';
import { motion } from 'framer-motion';
import type { MetaFunction } from '@remix-run/cloudflare';

export const meta: MetaFunction = () => {
  return [
    { title: 'Forgot Password - sharelock.cc' },
    { name: 'description', content: 'Reset your sharelock.cc account password' },
  ];
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resetPassword(email);
      setIsEmailSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="h-screen flex flex-col items-center justify-center monzed-bg-primary monzed-text-primary">
        {/* Scrollable content container */}
        <div className="w-full h-full flex flex-col items-center justify-center overflow-y-auto modern-scrollbar px-4">

          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
          {/* Logo and title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Check Your Email</h1>
            <p className="monzed-text-secondary">We've sent a password reset link to your email address</p>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 p-8 rounded-xl shadow-xl text-center">
            <div className="w-16 h-16 bg-monzed-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="i-ph:envelope w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-xl font-semibold mb-4">Email Sent Successfully!</h2>
            <p className="monzed-text-secondary mb-6">
              We've sent a password reset link to <strong className="monzed-text-primary">{email}</strong>. 
              Click the link in your email to reset your password.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-monzed-accent hover:bg-monzed-glow text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-monzed-accent focus:ring-offset-2 focus:ring-offset-monzed-bg-secondary shadow-lg hover:shadow-xl"
              >
                Back to Sign In
              </button>
              
              <button
                onClick={() => {
                  setIsEmailSent(false);
                  setEmail('');
                }}
                className="w-full monzed-text-secondary hover:monzed-text-primary font-medium py-2 px-4 rounded-lg transition-colors duration-200 hover:monzed-bg-tertiary focus:outline-none focus:ring-2 focus:ring-monzed-accent/50"
              >
                Send to a different email
              </button>
            </div>
          </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center monzed-bg-primary monzed-text-primary">
      {/* Scrollable content container */}
      <div className="w-full h-full flex flex-col items-center justify-center overflow-y-auto modern-scrollbar px-4">

        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        {/* Logo and title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
          <p className="monzed-text-secondary">No worries! Enter your email and we'll send you a reset link</p>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 p-8 rounded-xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium monzed-text-primary mb-2 flex items-center gap-2">
                <div className="i-ph:envelope w-4 h-4 monzed-text-secondary" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 monzed-bg-primary border monzed-border rounded-lg monzed-text-primary placeholder-monzed-text-tertiary focus:outline-none focus:ring-2 focus:ring-monzed-accent focus:border-monzed-accent transition-all duration-200"
                placeholder="Enter your email address"
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <div className="i-ph:paper-plane-tilt w-4 h-4" />
                  Send Reset Link
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to login link */}
        <p className="text-center mt-6 monzed-text-secondary">
          Remember your password?{' '}
          <Link 
            to="/login" 
            className="text-monzed-accent hover:text-monzed-glow font-medium transition-colors"
          >
            Back to Sign In
          </Link>
        </p>
        </motion.div>
      </div>
    </div>
  );
}
