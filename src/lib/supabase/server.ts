import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createClient = () => {
  try {
    return createServerComponentClient({
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })
  } catch (error) {
    console.error('Failed to create Supabase server client:', error)
    throw new Error('Authentication service unavailable')
  }
}