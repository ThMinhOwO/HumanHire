import { supabase } from './supabase'

export function getProfile(userId) {
  return supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
}

export function updateProfile(userId, changes) {
  return supabase.from('profiles').update(changes).eq('id', userId).select().single()
}

// Usernames are stored lowercase; accept "@Name " and similar as input.
export function normalizeUsername(input) {
  return input.trim().replace(/^@/, '').toLowerCase()
}

// Returns a message for a malformed username, or null. Mirrors the database
// check so most problems show up before asking the server.
export function validateUsername(username) {
  if (username.length < 3) return 'Tên người dùng cần ít nhất 3 ký tự.'
  if (username.length > 20) return 'Tên người dùng tối đa 20 ký tự.'
  if (!/^[a-z0-9_.]+$/.test(username)) {
    return 'Chỉ dùng chữ thường không dấu, số, dấu gạch dưới (_) và dấu chấm (.).'
  }
  if (username.startsWith('.') || username.endsWith('.') || username.includes('..')) {
    return 'Dấu chấm không được ở đầu, ở cuối hoặc đứng liền nhau.'
  }
  return null
}

// Resolves to { data: boolean, error }. Reserved names count as unavailable.
export function isUsernameAvailable(username) {
  return supabase.rpc('username_available', { candidate: username })
}
