import { createContext, useContext, useEffect, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { agentIngest } from '@/lib/agentDebug'
import { supabase } from '@/lib/supabase'

export type UserRole = 'gebruiker' | 'admin'

const VIEW_AS_STORAGE_KEY = 'roadmap-aaai-view-as'

interface AuthContextType {
  user: SupabaseUser | null
  role: UserRole | null
  displayName: string | null
  /** Voor layout/nav: admin kan tijdelijk als gebruiker kijken */
  effectiveRole: UserRole | null
  setViewAsRole: (viewAs: UserRole) => void
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [viewAsRole, setViewAsRoleState] = useState<UserRole>(() => {
    if (typeof window === 'undefined') return 'admin'
    const stored = localStorage.getItem(VIEW_AS_STORAGE_KEY)
    return stored === 'gebruiker' ? 'gebruiker' : 'admin'
  })
  const [loading, setLoading] = useState(true)

  const effectiveRole: UserRole | null =
    role === 'admin' && viewAsRole === 'gebruiker' ? 'gebruiker' : role

  function setViewAsRole(viewAs: UserRole) {
    setViewAsRoleState(viewAs)
    localStorage.setItem(VIEW_AS_STORAGE_KEY, viewAs)
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      // #region agent log
      agentIngest('AuthContext.tsx:getSession', 'initial auth session', {
        hypothesisId: 'D',
        hasSession: Boolean(session?.user),
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'no-window',
      })
      // #endregion
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setRole(null)
      setDisplayName(null)
      return
    }
    supabase
      .from('user_profiles')
      .select('role, display_name')
      .eq('id', user.id)
      .single()
      .then(
        ({ data }) => {
          setRole((data?.role as UserRole) ?? null)
          setDisplayName(data?.display_name ?? null)
        },
        () => {
          setRole(null)
          setDisplayName(null)
        }
      )
  }, [user?.id])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setRole(null)
    setDisplayName(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, displayName, effectiveRole, setViewAsRole, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
