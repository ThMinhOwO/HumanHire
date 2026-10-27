import { useCallback, useEffect, useState } from 'react'
import { getProfile } from '../lib/profiles'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContext'

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  // The user's public profile (display name, avatar), null until loaded.
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Fires on login, logout, token refresh and email-confirmation redirects.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))

    return () => subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id

  const refreshProfile = useCallback(async () => {
    if (!userId) return
    const { data } = await getProfile(userId)
    setProfile(data)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    getProfile(userId).then(({ data }) => {
      if (!cancelled) setProfile(data)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const value = {
    session,
    user: session?.user ?? null,
    // Ignore a profile left over from a previous login.
    profile: profile?.id === userId ? profile : null,
    refreshProfile,
    loading,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
