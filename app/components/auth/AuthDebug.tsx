'use client'
import { useAuth } from './AuthProvider'

export function AuthDebug() {
  // Always return null to disable the debug panel
  return null;
  
  // Original code is commented out below
  /*
  const { user, loading, setShowAuthModal } = useAuth()

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-monzed-elements-background-depth-2 border border-monzed-elements-borderColor rounded-lg p-4 text-xs max-w-xs">
      <div className="font-bold text-monzed-elements-textPrimary mb-2">Auth Debug</div>
      
      <div className="space-y-1 text-monzed-elements-textSecondary">
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>User: {user ? user.email : 'None'}</div>
        <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}</div>
        <div>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</div>
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={() => setShowAuthModal(true)}
          className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded"
        >
          Test Auth Modal
        </button>
        
        {user && (
          <div className="text-green-500 text-xs">✓ Authentication Working</div>
        )}
      </div>
    </div>
  )
  */
}
