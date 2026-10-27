import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import {
  formatMessageTime,
  getConversation,
  listMessages,
  onNewMessage,
  otherPartyName,
  sendMessage,
} from '../lib/chats'
import Avatar from './Avatar'

// Adds messages to the list, skipping ones already there (our own sends also
// arrive over Realtime) and keeping them in send order.
function mergeMessages(current, incoming) {
  const byId = new Map(current.map((m) => [m.id, m]))
  for (const message of incoming) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => a.id - b.id)
}

function ChatThread() {
  const { conversationId } = useParams()
  const { user } = useAuth()
  // undefined = still loading, null = not found or not yours.
  const [conversation, setConversation] = useState(undefined)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([getConversation(conversationId), listMessages(conversationId)]).then(
      ([conversationResult, messagesResult]) => {
        if (cancelled) return
        const loadError = conversationResult.error || messagesResult.error
        if (loadError) setError(loadError.message)
        setConversation(conversationResult.data ?? null)
        setMessages((current) => mergeMessages(current, messagesResult.data ?? []))
      },
    )

    const unsubscribe = onNewMessage(conversationId, (message) =>
      setMessages((current) => mergeMessages(current, [message])),
    )

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function handleSend(e) {
    e?.preventDefault()
    const body = draft.trim()
    if (!body || sending) return

    setSending(true)
    setError('')
    const { data, error } = await sendMessage(conversationId, user.id, body)
    if (error) {
      setError(error.message)
    } else {
      setDraft('')
      setMessages((current) => mergeMessages(current, [data]))
    }
    setSending(false)
  }

  function handleKeyDown(e) {
    // Enter sends, Shift+Enter adds a new line. Ignore Enter while an IME
    // (e.g. Vietnamese Telex) is still composing a character.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  if (conversation === undefined) return null

  if (!conversation) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Chat not found</h2>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Link to="/chats" className="mt-6 inline-block font-semibold text-orange-600 hover:underline">
          Back to my chats
        </Link>
      </section>
    )
  }

  const isClient = conversation.client_id === user.id
  const name = otherPartyName(conversation, user.id) ?? 'Unknown'

  return (
    <section className="mx-auto flex h-[calc(100dvh-4rem)] max-w-2xl flex-col">
      <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3">
        <Link
          to="/chats"
          aria-label="Back to chats"
          className="rounded-lg px-2 py-1 text-xl text-stone-500 transition hover:bg-stone-200"
        >
          ←
        </Link>
        <Avatar name={name} />
        <div className="min-w-0">
          {isClient ? (
            <Link to={`/hire/${conversation.hire_id}`} className="block truncate font-semibold text-stone-900 hover:underline">
              {name}
            </Link>
          ) : (
            <p className="truncate font-semibold text-stone-900">{name}</p>
          )}
          <p className="text-xs text-stone-500">{isClient ? 'Hire' : 'Client'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-stone-400">
            {isClient ? `Say hi to ${name} and ask about their terms.` : 'No messages yet.'}
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {messages.map((message) => {
            const mine = message.sender_id === user.id
            return (
              <li key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    mine
                      ? 'rounded-br-md bg-orange-600 text-white'
                      : 'rounded-bl-md border border-stone-200 bg-white text-stone-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p className={`mt-1 text-right text-[11px] ${mine ? 'text-orange-100' : 'text-stone-400'}`}>
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
        <div ref={bottomRef} />
      </div>

      {error && <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-stone-200 p-3">
        <textarea
          rows={1}
          maxLength={2000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="h-11 rounded-xl bg-orange-600 px-5 font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  )
}

export default ChatThread
