import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { listHirePages } from '../lib/hirePages'
import { publicImageUrl } from '../lib/images'
import { listBlockedIds } from '../lib/safety'
import Avatar from './Avatar'

function HireCard({ hire, isYou }) {
  const posterUrl = publicImageUrl(hire.poster_path)

  return (
    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:shadow-lg">
      <Link to={`/hire/${hire.user_id}`} className="block">
        {posterUrl ? (
          <img src={posterUrl} alt={hire.hire_name} className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-orange-100 via-rose-100 to-amber-100 p-8">
            <p className="line-clamp-3 text-center text-3xl font-extrabold tracking-tight text-stone-800/70 sm:text-4xl">
              {hire.hire_name}
            </p>
          </div>
        )}
      </Link>

      <div className="px-5 pb-6 sm:px-6">
        <div className="-mt-12 flex items-end justify-between gap-3">
          <Avatar
            name={hire.hire_name}
            src={publicImageUrl(hire.avatar_path)}
            size="lg"
            className="ring-4 ring-white"
          />
          {isYou && (
            <span className="mb-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              Trang của bạn
            </span>
          )}
        </div>

        <h3 className="mt-3 text-2xl font-bold text-stone-900">{hire.hire_name}</h3>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-stone-600">
          <span>📍 {hire.location}</span>
          {hire.tagline && (
            <>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="text-stone-800">{hire.tagline}</span>
            </>
          )}
        </p>

        <div className="mt-4 rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Điều khoản</p>
          <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-stone-700">{hire.tos}</p>
        </div>

        <Link
          to={`/hire/${hire.user_id}`}
          className="mt-5 block rounded-xl bg-stone-900 py-3 text-center font-semibold text-white transition hover:bg-stone-700"
        >
          {isYou ? 'Xem trang của bạn' : 'Xem trang & nhắn tin'}
        </Link>
      </div>
    </article>
  )
}

function NearbyList() {
  const { user } = useAuth()
  // undefined = still loading.
  const [hires, setHires] = useState(undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listHirePages(), listBlockedIds()]).then(([pages, blocked]) => {
      const loadError = pages.error || blocked.error
      if (loadError) setError(loadError.message)
      // Hide anyone you've blocked.
      const blockedIds = new Set(blocked.data ?? [])
      setHires((pages.data ?? []).filter((hire) => !blockedIds.has(hire.user_id)))
    })
  }, [])

  return (
    <section className="mx-auto max-w-xl px-4 py-8">
      <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">Bảng tin quanh bạn</h2>
      {hires && <p className="mt-1 text-stone-500">{hires.length} người đang nhận việc</p>}

      {error && <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {hires?.length === 0 && !error && (
        <div className="mt-6 rounded-3xl border border-dashed border-stone-300 p-10 text-center">
          <p className="font-semibold text-stone-900">Chưa có ai đăng tin</p>
          <p className="mt-1 text-sm text-stone-500">Hãy là người đầu tiên: tạo trang Hire của bạn.</p>
          <Link
            to="/hire/setup"
            className="mt-5 inline-block rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Tạo trang Hire
          </Link>
        </div>
      )}

      {hires?.length > 0 && (
        <ul className="mt-8 flex flex-col gap-10">
          {hires.map((hire) => (
            <li key={hire.user_id}>
              <HireCard hire={hire} isYou={hire.user_id === user.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default NearbyList
