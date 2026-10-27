import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { formatMessageTime, listConversations, onNewMessage, otherPartyName } from '../lib/chats'
import Avatar from './Avatar'

function ChatList() {
  const { user } = useAuth()
  // undefined = still loading.
  const [conversations, setConversations] = useState(undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    function load() {
      listConversations().then(({ data, error }) => {
        if (error) setError(error.message)
        setConversations(data ?? [])
      })
    }

    load()
    // Any new message in any of your conversations re-sorts the list.
    return onNewMessage(null, load)
  }, [])

  // A Hire only sees a conversation once the client has actually said something.
  const visible = conversations?.filter((c) => c.messages.length > 0 || c.client_id === user.id)

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h2 className="text-2xl font-bold text-stone-900">My chats</h2>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {visible?.length === 0 && !error && (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-300 p-10 text-center">
          <p className="font-semibold text-stone-900">No chats yet</p>
          <p className="mt-1 text-sm text-stone-500">Find someone on Nearby to start a conversation.</p>
          <Link
            to="/nearby"
            className="mt-5 inline-block rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Browse Nearby
          </Link>
        </div>
      )}

      {visible?.length > 0 && (
        <ul className="mt-6 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {visible.map((conversation) => {
            const name = otherPartyName(conversation, user.id) ?? 'Unknown'
            const last = conversation.messages[0]
            const isClient = conversation.client_id === user.id

            return (
              <li key={conversation.id}>
                <Link
                  to={`/chats/${conversation.id}`}
                  className="flex items-center gap-3 p-4 transition hover:bg-stone-50"
                >
                  <Avatar name={name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="flex min-w-0 items-center gap-2 font-semibold text-stone-900">
                        <span className="truncate">{name}</span>
                        <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
                          {isClient ? 'Hire' : 'Client'}
                        </span>
                      </p>
                      {last && (
                        <span className="shrink-0 text-xs text-stone-400">
                          {formatMessageTime(last.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-stone-500">
                      {last
                        ? `${last.sender_id === user.id ? 'You: ' : ''}${last.body}`
                        : 'No messages yet'}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ChatList
