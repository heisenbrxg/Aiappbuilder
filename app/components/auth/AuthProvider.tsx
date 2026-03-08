import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useNavigate } from '@remix-run/react'
import { createClient } from '~/lib/supabase/client'
import { profileStore } from '~/lib/stores/profile'
import { supabaseConnection } from '~/lib/stores/supabase'
import { netlifyConnection } from '~/lib/stores/netlify'
import { vercelConnection } from '~/lib/stores/vercel'
import { workbenchStore } from '~/lib/stores/workbench'
import { chatStore } from '~/lib/stores/chat'

interface AuthContextType {
  user: User | null
  loading: boolean
  isLoggingOut: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  showAuthModal: boolean
  setShowAuthModal: (show: boolean) => void
  isSignUpMode: boolean
  isResetMode: boolean
  showSignIn: () => void
  showSignUp: () => void
  showResetPassword: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const navigate = useNavigate()
  
  // Only create client on the client side to avoid SSR issues
  const [supabase] = useState(() => {
    if (typeof window !== 'undefined') {
      return createClient()
    }
    // Return a mock client for SSR
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.reject(new Error('SSR mode')),
        signUp: () => Promise.reject(new Error('SSR mode')),
        signInWithOAuth: () => Promise.reject(new Error('SSR mode')),
        signOut: () => Promise.resolve({ error: null }),
        resetPasswordForEmail: () => Promise.reject(new Error('SSR mode')),
      },
    } as any
  })

  // Helper functions to show specific auth forms
  const showSignIn = () => {
    setIsSignUpMode(false)
    setIsResetMode(false)
    setShowAuthModal(true)
  }

  const showSignUp = () => {
    setIsSignUpMode(true)
    setIsResetMode(false)
    setShowAuthModal(true)
  }

  const showResetPassword = () => {
    setIsSignUpMode(false)
    setIsResetMode(true)
    setShowAuthModal(true)
  }

  // Clear user-specific state on logout
  const clearUserState = () => {
    console.log('🧹 Clearing user state...')

    // Clear profile data
    profileStore.set({ username: '', bio: '', avatar: '' })

    // Clear connection stores
    supabaseConnection.set({ user: null, token: '', isConnected: false })
    netlifyConnection.set({ user: null, token: '' })
    vercelConnection.set({ user: null, token: '' })

    // Clear workbench and chat stores
    workbenchStore.showWorkbench.set(false)
    workbenchStore.currentView.set('code')
    workbenchStore.unsavedFiles.set(new Set())
    workbenchStore.actionAlert.set(undefined)
    workbenchStore.supabaseAlert.set(undefined)
    workbenchStore.deployAlert.set(undefined)

    // Clear chat store
    chatStore.setKey('started', false)
    chatStore.setKey('aborted', false)
    chatStore.setKey('showChat', true)

    // Clear user-specific localStorage items
    if (typeof window !== 'undefined') {
      console.log('🗑️ Clearing localStorage items...')

      // User profile and auth data
      localStorage.removeItem('bolt_profile')
      localStorage.removeItem('bolt_user_profile')
      localStorage.removeItem('bolt_settings')

      // Connection data
      localStorage.removeItem('github_connection')
      localStorage.removeItem('netlify_connection')
      localStorage.removeItem('supabase_connection')
      localStorage.removeItem('supabaseCredentials')
      localStorage.removeItem('vercel_connection')

      // Chat and file data
      localStorage.removeItem('bolt_chat_history')
      localStorage.removeItem('bolt_read_logs')

      // Provider settings
      localStorage.removeItem('provider_settings')

      // Deployment data
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('netlify-site-') || key.startsWith('chat-')) {
          localStorage.removeItem(key)
        }
      })

      console.log('🍪 Clearing cookies...')
      // Clear cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
        // Clear auth and connection related cookies
        if (name.includes('github') || name.includes('netlify') || name.includes('supabase') ||
            name === 'eventLogs' || name.startsWith('sb-')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        }
      })

      console.log('✅ User state cleared successfully')

      // Note: We don't clear all localStorage as some settings (theme, etc.)
      // should persist across login sessions
    }
  }

  useEffect(() => {
    // Only run auth check on client side
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        setUser(session?.user ?? null)
        setLoading(false)

        // Close auth modal on successful sign in
        if (event === 'SIGNED_IN') {
          setShowAuthModal(false)
          setIsLoggingOut(false) // Reset logout state on sign in
        }

        // Handle sign out event (state clearing and redirect already done in signOut function)
        if (event === 'SIGNED_OUT') {
          console.log('🔄 Auth state change: SIGNED_OUT detected')
          // Don't redirect here - it's already handled immediately in signOut()
          // This prevents any backwards transitions or delays
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  }

  const signOut = async () => {
    console.log('🔓 Starting logout process...')

    // Set logging out state immediately to hide page content
    setIsLoggingOut(true)

    // Clear state immediately to provide instant feedback
    setUser(null)
    clearUserState()

    // Redirect immediately using window.location for fastest possible redirect
    window.location.href = '/'

    // Then handle the actual Supabase signout in the background
    // This happens after redirect so user doesn't wait for it
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase signout error:', error)
      }
    } catch (error) {
      console.error('Background signout error:', error)
    }

    console.log('✅ Logout completed successfully')
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isLoggingOut,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      resetPassword,
      showAuthModal,
      setShowAuthModal,
      isSignUpMode,
      isResetMode,
      showSignIn,
      showSignUp,
      showResetPassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
