import { useEffect, useState } from 'react'
import { isUsernameAvailable, validateUsername } from './profiles'

// Checks a username as the user types, waiting for a pause before asking the
// server. Returns { status, message } where status is one of:
// 'empty', 'current' (unchanged from currentUsername), 'invalid', 'checking',
// 'available', 'taken' or 'unknown' (the check itself failed).
export function useUsernameCheck(username, currentUsername) {
  // The latest server answer, tagged with the name it was for.
  const [result, setResult] = useState({ username: '', available: null, failed: false })

  const skip = !username || username === currentUsername || validateUsername(username) !== null

  useEffect(() => {
    if (skip) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const { data, error } = await isUsernameAvailable(username)
      if (!cancelled) setResult({ username, available: data, failed: Boolean(error) })
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [username, skip])

  if (!username) return { status: 'empty' }
  if (username === currentUsername) return { status: 'current' }
  const problem = validateUsername(username)
  if (problem) return { status: 'invalid', message: problem }
  if (result.username !== username) return { status: 'checking' }
  if (result.failed) return { status: 'unknown' }
  return result.available
    ? { status: 'available', message: 'Bạn có thể dùng tên này.' }
    : { status: 'taken', message: 'Tên này đã có người dùng hoặc không được phép.' }
}

// Whether a form may be submitted with this status. 'unknown' is allowed:
// the database still rejects duplicates.
export function usernameIsUsable(status) {
  return ['current', 'available', 'unknown'].includes(status)
}
