import { createClient } from '@supabase/supabase-js'

// Use Vite env vars. Set these in .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export type GuestIdRow = {
  id: string
  disabled: boolean
  created_at: string
}

export type YouTubeLinkRow = {
  id: string
  video_id: string
  title?: string | null
  created_at: string
}

export type ExpenseRow = {
  id: string
  amount: number
  name: string
  created_at: string
}

export type ExtraBudgetRow = {
  id: string
  amount: number
  note: string | null
  created_at: string
}


