import { supabase } from './supabase'

// Resolves to { data, error }; data is null when the user has no Hire page.
export function getHirePage(userId) {
  return supabase
    .from('hire_pages')
    .select('*, owner:profiles!hire_pages_user_id_profiles_fkey(username)')
    .eq('user_id', userId)
    .maybeSingle()
}

// Every Hire page, newest first. Will become a distance-sorted query later.
export function listHirePages() {
  return supabase.from('hire_pages').select('*').order('created_at', { ascending: false })
}

// Creates or updates the Hire page for page.user_id.
export function saveHirePage(page) {
  return supabase.from('hire_pages').upsert(page).select().single()
}
