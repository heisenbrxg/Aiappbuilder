'use client'
import { useAuth } from './AuthProvider'

export function AuthStatus() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="text-sm text-monzed-elements-textSecondary">
        Loading auth...
      </div>
    )
  }

  return (
    <div className="text-sm">
      {user ? (
        <span className="text-green-500">
          ✓ Signed in as {user.email}
        </span>
      ) : (
        <span className="text-monzed-elements-textSecondary">
          Not signed in
        </span>
      )}
    </div>
  )
}
