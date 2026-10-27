import { useEffect, useState } from 'react'
import { authErrorMessage } from '../lib/authErrors'
import { supabase } from '../lib/supabase'

// Supabase's "Email OTP Length" (Authentication → Providers → Email) can be
// 6-10 digits, so accept any of those rather than assuming one.
const MIN_CODE_LENGTH = 6
const MAX_CODE_LENGTH = 10
const RESEND_COOLDOWN_SECONDS = 60

// Second step of signup: enter the code from the confirmation email.
function VerifyEmailForm({ email, initialNotice, onBack, onSuccess }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(initialNotice ?? '')
  const [verifying, setVerifying] = useState(false)
  // A code was just sent, so start with the cooldown running.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function verify(token) {
    if (verifying) return
    setError('')
    setVerifying(true)
    // Logs the user in on success; the auth listener picks up the session.
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) {
      setError(authErrorMessage(error))
      setVerifying(false)
    } else {
      onSuccess?.()
    }
  }

  function handleChange(e) {
    // Accept pasted codes like "123 456" or "Mã: 123456".
    const digits = e.target.value.replace(/\D/g, '').slice(0, MAX_CODE_LENGTH)
    // A paste or autofill adds the whole code at once, so submit it right
    // away. Typed codes wait for the button, since we can't tell when the
    // user has finished typing.
    const filledAtOnce = digits.length - code.length > 1
    setCode(digits)
    if (filledAtOnce && digits.length >= MIN_CODE_LENGTH) verify(digits)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (code.length >= MIN_CODE_LENGTH) verify(code)
  }

  async function resend() {
    setError('')
    setNotice('')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setError(authErrorMessage(error))
    } else {
      setNotice('Đã gửi mã mới.')
      setCode('')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold text-stone-900">Nhập mã xác nhận</h2>
        <p className="mt-1 text-sm text-stone-500">
          Chúng tôi đã gửi mã xác nhận đến <span className="font-medium text-stone-800">{email}</span>.
          Hãy kiểm tra cả thư mục Spam.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            aria-label="Mã xác nhận"
            placeholder="••••••"
            value={code}
            onChange={handleChange}
            disabled={verifying}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-4 text-center font-mono text-2xl tracking-[0.3em] text-stone-900 outline-none transition placeholder:text-stone-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-60"
          />

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

          <button
            type="submit"
            disabled={verifying || code.length < MIN_CODE_LENGTH}
            className="rounded-lg bg-orange-600 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
          >
            {verifying ? 'Đang xác nhận…' : 'Xác nhận'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button onClick={onBack} className="font-medium text-stone-500 hover:underline">
            ← Đổi email
          </button>
          <button
            onClick={resend}
            disabled={cooldown > 0}
            className="font-semibold text-orange-600 hover:underline disabled:text-stone-400 disabled:no-underline"
          >
            {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : 'Gửi lại mã'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default VerifyEmailForm
