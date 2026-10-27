import { useState } from 'react'
import { supabase } from '../lib/supabase'

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'

const termsError = 'Please agree to the Terms of Service and Privacy Policy.'

// Hidden until the Google Cloud OAuth app is fully set up.
const SHOW_GOOGLE_LOGIN = false

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function AuthForm({ message, onSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isSignup = mode === 'signup'

  function switchMode() {
    setMode(isSignup ? 'login' : 'signup')
    setError('')
    setNotice('')
  }

  async function handleGoogle() {
    setError('')
    if (isSignup && !agreed) {
      setError(termsError)
      return
    }

    setSubmitting(true)
    // Redirects the whole page to Google; the session is picked up on return.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setSubmitting(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (isSignup && !agreed) {
      setError(termsError)
      return
    }

    setSubmitting(true)

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, terms_accepted_at: new Date().toISOString() },
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) {
        setError(error.message)
      } else if (data.session) {
        onSuccess?.()
      } else {
        // Email confirmation is on: no session until the link is clicked.
        setNotice(`Check ${email} for a confirmation link to finish signing up.`)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        onSuccess?.()
      }
    }

    setSubmitting(false)
  }

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold text-stone-900">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {message ?? (isSignup ? 'Join HumanHire to hire or get hired.' : 'Log in to continue.')}
        </p>

        {SHOW_GOOGLE_LOGIN && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-stone-300 bg-white py-2.5 font-medium text-stone-800 transition hover:bg-stone-50 disabled:opacity-60"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="mt-5 flex items-center gap-3 text-xs uppercase tracking-wide text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />
              or
              <span className="h-px flex-1 bg-stone-200" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {isSignup && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
              Name
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
            Password
            <input
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>

          {isSignup && (
            <label className="flex items-start gap-2.5 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-orange-600"
              />
              <span>
                I agree to the{' '}
                <a href="/terms.html" target="_blank" className="font-medium text-orange-600 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy.html" target="_blank" className="font-medium text-orange-600 hover:underline">
                  Privacy Policy
                </a>
              </span>
            </label>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-orange-600 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={switchMode} className="font-semibold text-orange-600 hover:underline">
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </section>
  )
}

export default AuthForm
