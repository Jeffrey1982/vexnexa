import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// For server-side operations that need service role (if available)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

// Database types for TypeScript
export type Database = {
  public: {
    Tables: {
      Lead: {
        Row: {
          id: string
          email: string
          source: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          email: string
          source?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          email?: string
          source?: string | null
          createdAt?: string
        }
      }
      ContactMessage: {
        Row: {
          id: string
          name: string
          email: string
          message: string
          createdAt: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          message: string
          createdAt?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          message?: string
          createdAt?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper functions for common operations
export async function createLead(email: string, source?: string) {
  const { data, error } = await supabase
    .from('Lead')
    .insert({ email, source })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation (duplicate email)
      throw new Error('Email already exists')
    }
    throw error
  }

  return data
}

export async function createContactMessage(name: string, email: string, message: string) {
  const { data, error } = await supabase
    .from('ContactMessage')
    .insert({ name, email, message })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getLeadCount() {
  const { count, error } = await supabase
    .from('Lead')
    .select('*', { count: 'exact', head: true })

  if (error) {
    throw error
  }

  return count || 0
}

export async function getContactMessageCount() {
  const { count, error } = await supabase
    .from('ContactMessage')
    .select('*', { count: 'exact', head: true })

  if (error) {
    throw error
  }

  return count || 0
}