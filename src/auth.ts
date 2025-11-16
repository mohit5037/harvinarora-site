import { supabase, type GuestIdRow } from './supabaseClient'

export type AuthState = {
  currentUserId: string | null
  isAdmin: boolean
}

export async function getAuthState(): Promise<AuthState> {
  const { data: session } = await supabase.auth.getSession()
  return {
    currentUserId: localStorage.getItem('harvin-current-guest') || null,
    isAdmin: !!session.session,
  }
}

export async function loginUser(userId: string): Promise<string | null> {
  const trimmed = userId.trim()
  if (!trimmed) return 'ID cannot be empty'
  const { data, error } = await supabase
    .from('guest_ids')
    .select('*')
    .eq('id', trimmed)
    .maybeSingle<GuestIdRow>()
  if (error) return 'Failed to verify ID'
  if (!data) return 'User ID not found'
  if (data.disabled) return 'This ID has been disabled'
  localStorage.setItem('harvin-current-guest', trimmed)
  return null
}

export async function loginAdminWithEmail(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return error.message
  localStorage.removeItem('harvin-current-guest')
  return null
}

export async function logout(): Promise<void> {
  localStorage.removeItem('harvin-current-guest')
  await supabase.auth.signOut()
}

export async function getAllowedIds(): Promise<GuestIdRow[]> {
  const { data } = await supabase.from('guest_ids').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function addAllowedId(id: string): Promise<string | null> {
  const trimmed = id.trim()
  if (!trimmed) return 'ID cannot be empty'
  const { error } = await supabase.from('guest_ids').insert({ id: trimmed, disabled: false })
  if (error) return error.message
  return null
}

export async function removeAllowedId(id: string): Promise<string | null> {
  const { error } = await supabase.from('guest_ids').delete().eq('id', id)
  if (error) return error.message
  return null
}

export async function setDisabled(id: string, disabled: boolean): Promise<string | null> {
  const { error } = await supabase.from('guest_ids').update({ disabled }).eq('id', id)
  if (error) return error.message
  return null
}


