import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => {
  // EMERGENCY: Disable client-side auth to stop refresh loops
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: new Error('Auth disabled') }),
      signOut: () => Promise.resolve({ error: null })
    }
  } as any
}