import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { getHirePage, saveHirePage } from '../lib/hirePages'

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'

const tosPlaceholder = `For example:
• We only meet in public places.
• Payment is due before the session starts.
• Cancel at least 24 hours ahead or the booking is non-refundable.
• No physical contact beyond a handshake.`

function HireSetup() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [hireName, setHireName] = useState('')
  const [location, setLocation] = useState('')
  const [tos, setTos] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Prefill the form when editing an existing Hire page.
  useEffect(() => {
    getHirePage(user.id).then(({ data, error }) => {
      if (error) setError(error.message)
      if (data) {
        setIsEditing(true)
        setHireName(data.hire_name)
        setLocation(data.location)
        setTos(data.tos)
      }
      setLoading(false)
    })
  }, [user.id])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { error } = await saveHirePage({
      user_id: user.id,
      hire_name: hireName.trim(),
      location: location.trim(),
      tos: tos.trim(),
    })

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      navigate(`/hire/${user.id}`)
    }
  }

  if (loading) return null

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h2 className="text-2xl font-bold text-stone-900">
        {isEditing ? 'Edit your Hire page' : 'Setup your Hire page'}
      </h2>
      <p className="mt-1 text-stone-500">
        This is the page people see when they want to hire you.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
          Hire name
          <input
            type="text"
            required
            minLength={2}
            maxLength={50}
            value={hireName}
            onChange={(e) => setHireName(e.target.value)}
            placeholder="e.g. Linh's Math Lab"
            className={inputClass}
          />
          <span className="font-normal text-stone-500">
            The name you're hired under. It can be different from your account name.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
          Location
          <input
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. District 1, Ho Chi Minh City"
            className={inputClass}
          />
          <span className="font-normal text-stone-500">
            The area you work in. Don't put your home address.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
          Terms for hiring you
          <textarea
            required
            minLength={20}
            maxLength={5000}
            rows={8}
            value={tos}
            onChange={(e) => setTos(e.target.value)}
            placeholder={tosPlaceholder}
            className={`${inputClass} resize-y`}
          />
          <span className="flex justify-between gap-4 font-normal text-stone-500">
            <span>Your rules: what you will and won't do, payment, cancellations, boundaries.</span>
            <span className="shrink-0">{tos.length}/5000</span>
          </span>
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create Hire page'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-6 py-3 font-semibold text-stone-600 transition hover:bg-stone-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default HireSetup
