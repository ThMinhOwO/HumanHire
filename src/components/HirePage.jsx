import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { getOrCreateConversation } from '../lib/chats'
import { getHirePage } from '../lib/hirePages'
import { publicImageUrl } from '../lib/images'
import { getBlockStatus } from '../lib/safety'
import Avatar from './Avatar'
import SafetyMenu from './SafetyMenu'

function HirePage() {
  const { userId } = useParams()
  const { user } = useAuth()
  // undefined = still loading, null = not found.
  const [page, setPage] = useState(undefined)
  const [error, setError] = useState('')
  const [startingChat, setStartingChat] = useState(false)
  const [blockStatus, setBlockStatus] = useState('none')
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
    if (!isOwner) {
      getBlockStatus(userId).then(({ data }) => data && setBlockStatus(data))
    }
  }, [userId, isOwner])

  if (page === undefined) return null

  if (!page) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-stone-900">
          {isOwner ? 'Bạn chưa tạo trang Hire' : 'Không tìm thấy trang Hire'}
        </h2>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {isOwner && (
          <Link
            to="/hire/setup"
            className="mt-6 inline-block rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700"
          >
            Tạo trang Hire
          </Link>
        )}
      </section>
    )
  }

  const posterUrl = publicImageUrl(page.poster_path)

  return (
    <section className="mx-auto max-w-2xl pb-10 sm:px-4 sm:pt-8">
      {posterUrl ? (
        <img src={posterUrl} alt={page.hire_name} className="aspect-[4/3] w-full object-cover sm:rounded-3xl" />
      ) : (
        <div className="h-40 w-full bg-gradient-to-br from-orange-100 via-rose-100 to-amber-100 sm:rounded-3xl" />
      )}

      <div className="px-4 sm:px-2">
        <div className="-mt-12 flex items-end justify-between gap-3">
          <Avatar
            name={page.hire_name}
            src={publicImageUrl(page.avatar_path)}
            size="lg"
            className="ring-4 ring-stone-50"
          />
          {isOwner ? (
            <Link
              to="/hire/setup"
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
            >
              Chỉnh sửa trang
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={startChat}
                disabled={startingChat || blockStatus !== 'none'}
                className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
              >
                {startingChat ? 'Đang mở…' : 'Nhắn tin'}
              </button>
              <SafetyMenu
                otherId={userId}
                otherName={page.hire_name}
                blockStatus={blockStatus}
                onBlockStatusChange={setBlockStatus}
              />
            </div>
          )}
        </div>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900">{page.hire_name}</h1>
        {page.owner?.username && <p className="text-sm text-stone-500">@{page.owner.username}</p>}
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-stone-600">
          <span>📍 {page.location}</span>
          {page.tagline && (
            <>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="text-stone-800">{page.tagline}</span>
            </>
          )}
        </p>

        {blockStatus === 'you_blocked' && (
          <p className="mt-4 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
            Bạn đã chặn {page.hire_name}. Bỏ chặn trong menu ⋯ để nhắn tin.
          </p>
        )}
        {blockStatus === 'blocked_you' && (
          <p className="mt-4 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
            Bạn không thể nhắn tin cho {page.hire_name}.
          </p>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-900">Điều khoản khi thuê {page.hire_name}</h2>
          <p className="mt-1 text-sm text-stone-500">Hãy đọc kỹ trước khi đặt lịch.</p>
          <p className="mt-4 whitespace-pre-wrap text-stone-700">{page.tos}</p>
        </div>
      </div>
    </section>
  )
}

export default HirePage
