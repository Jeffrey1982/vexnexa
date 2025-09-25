"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client-new'
import { User } from '@supabase/supabase-js'

interface AuthButtonProps {
  user: User | null
}

export default function AuthButton({ user }: AuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    setLoading(true)
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      // Redirect to home page
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      // Force redirect even if signout fails
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {user.email}
        </span>
        <Button
          onClick={() => router.push('/dashboard')}
          variant="default"
          size="sm"
        >
          Dashboard
        </Button>
        <Button
          onClick={handleSignOut}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? 'Signing out...' : 'Sign out'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => router.push('/auth/login')}
        variant="ghost"
        size="sm"
      >
        Login
      </Button>
      <Button
        onClick={() => router.push('/auth/register')}
        size="sm"
      >
        Sign up
      </Button>
    </div>
  )
}