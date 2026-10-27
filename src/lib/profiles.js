import { supabase } from './supabase'

export function getProfile(userId) {
  return supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
}

export function updateProfile(userId, changes) {
  return supabase.from('profiles').update(changes).eq('id', userId).select().single()
}
