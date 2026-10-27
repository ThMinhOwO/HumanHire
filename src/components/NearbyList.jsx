import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { listHirePages } from '../lib/hirePages'
import Avatar from './Avatar'

function NearbyList() {
  const { user } = useAuth()
  // undefined = still loading.
  const [hires, setHires] = useState(undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    listHirePages().then(({ data, error }) => {
      if (error) setError(error.message)
      setHires(data ?? [])
    })
  }, [])

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="text-2xl font-bold text-stone-900">Nearby hires</h2>
      {hires && (
        <p className="mt-1 text-stone-500">
          {hires.length} {hires.length === 1 ? 'person' : 'people'} available
        </p>
      )}

      {error && <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {hires?.length === 0 && !error && (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-300 p-10 text-center">
          <p className="font-semibold text-stone-900">No one's offering anything yet</p>
          <p className="mt-1 text-sm text-stone-500">Be the first: set up your Hire page.</p>
          <Link
            to="/hire/setup"
            className="mt-5 inline-block rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Setup your Hire page
          </Link>
        </div>
      )}

      {hires?.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {hires.map((hire) => (
            <li key={hire.user_id}>
              <Link
                to={`/hire/${hire.user_id}`}
                className="flex h-full items-center gap-3 rounded-2xl border border-stone-200 bg-white p-5 transition hover:shadow-md"
              >
                <Avatar name={hire.hire_name} />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-stone-900">
                    <span className="truncate">{hire.hire_name}</span>
                    {hire.user_id === user.id && (
                      <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                        You
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-stone-500">📍 {hire.location}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default NearbyList
