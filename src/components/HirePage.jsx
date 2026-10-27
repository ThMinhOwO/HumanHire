import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { getOrCreateConversation } from '../lib/chats'
import { getHirePage } from '../lib/hirePages'

function HirePage() {
  const { userId } = useParams()
  const { user } = useAuth()
  // undefined = still loading, null = not found.
  const [page, setPage] = useState(undefined)
  const [error, setError] = useState('')
  const [startingChat, setStartingChat] = useState(false)
  const navigate = useNavigate()

  const isOwner = user.id === userId

  async function startChat() {
    setError('')
    setStartingChat(true)
    const { data, error } = await getOrCreateConversation(user.id, userId)
    if (error) {
      setError(error.message)
      setStartingChat(false)
    } else {
      navigate(`/chats/${data.id}`)
    }
  }

  useEffect(() => {
    getHirePage(userId).then(({ data, error }) => {
      if (error) setError(error.message)
      setPage(data ?? null)
    })
  }, [userId])

  if (page === undefined) return null

  if (!page) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-stone-900">
          {isOwner ? "You haven't set up your Hire page yet" : 'Hire page not found'}
        </h2>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {isOwner && (
          <Link
            to="/hire/setup"
            className="mt-6 inline-block rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700"
          >
            Setup your Hire page
          </Link>
        )}
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">{page.hire_name}</h1>
          <p className="mt-2 text-stone-600">📍 {page.location}</p>
        </div>
        {isOwner ? (
          <Link
            to="/hire/setup"
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          >
            Edit page
          </Link>
        ) : (
          <button
            onClick={startChat}
            disabled={startingChat}
            className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
          >
            {startingChat ? 'Opening chat…' : 'Chat'}
          </button>
        )}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold text-stone-900">Terms for hiring {page.hire_name}</h2>
        <p className="mt-1 text-sm text-stone-500">Read these before you book.</p>
        <p className="mt-4 whitespace-pre-wrap text-stone-700">{page.tos}</p>
      </div>
    </section>
  )
}

export default HirePage
