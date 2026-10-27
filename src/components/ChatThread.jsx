import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import {
  getConversation,
  getImageUrls,
  listMessages,
  MESSAGE_PAGE_SIZE,
  onNewMessage,
  otherPartyAvatarPath,
  otherPartyId,
  otherPartyName,
} from '../lib/chats'
import { publicImageUrl } from '../lib/images'
import { getBlockStatus, unblockUser } from '../lib/safety'
import Avatar from './Avatar'
import ChatComposer from './ChatComposer'
import MessageBubble from './MessageBubble'
import SafetyMenu from './SafetyMenu'

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
  const [hasOlder, setHasOlder] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [imageUrls, setImageUrls] = useState({})
  const [blockStatus, setBlockStatus] = useState('none')
  const [error, setError] = useState('')

  const scrollRef = useRef(null)
  // Whether the view should follow new messages (true unless the user scrolled up).
  const stickToBottom = useRef(true)
  // Scroll position saved before prepending older messages, to restore after.
  const prependAnchor = useRef(null)
  const requestedImages = useRef(new Set())

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [conversationResult, messagesResult] = await Promise.all([
        getConversation(conversationId),
        listMessages(conversationId),
      ])
      if (cancelled) return

      const loadError = conversationResult.error || messagesResult.error
      if (loadError) setError(loadError.message)
      const loaded = messagesResult.data ?? []
      setConversation(conversationResult.data ?? null)
      setMessages((current) => mergeMessages(current, loaded))
      setHasOlder(loaded.length === MESSAGE_PAGE_SIZE)

      if (conversationResult.data) {
        const { data } = await getBlockStatus(otherPartyId(conversationResult.data, user.id))
        if (!cancelled && data) setBlockStatus(data)
      }
    }

    load()
    const unsubscribe = onNewMessage(conversationId, (message) =>
      setMessages((current) => mergeMessages(current, [message])),
    )

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [conversationId, user.id])

  // Keep the scroll position sensible whenever messages change.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (prependAnchor.current) {
      const { height, top } = prependAnchor.current
      el.scrollTop = el.scrollHeight - height + top
      prependAnchor.current = null
    } else if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  // Fetch signed URLs for any images we haven't asked for yet.
  useEffect(() => {
    const missing = messages
      .map((m) => m.image_path)
      .filter((path) => path && !requestedImages.current.has(path))
    if (missing.length === 0) return
    missing.forEach((path) => requestedImages.current.add(path))
    getImageUrls(missing).then((urls) => setImageUrls((current) => ({ ...current, ...urls })))
  }, [messages])

  function handleScroll() {
    const el = scrollRef.current
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  function scrollToBottomIfFollowing() {
    const el = scrollRef.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }

  async function loadOlder() {
    const el = scrollRef.current
    setLoadingOlder(true)
    const { data, error } = await listMessages(conversationId, messages[0].id)
    if (error) {
      setError(error.message)
    } else {
      prependAnchor.current = { height: el.scrollHeight, top: el.scrollTop }
      setHasOlder(data.length === MESSAGE_PAGE_SIZE)
      setMessages((current) => mergeMessages(current, data))
    }
    setLoadingOlder(false)
  }

  function handleSent(message) {
    stickToBottom.current = true
    setMessages((current) => mergeMessages(current, [message]))
  }

  async function handleUnblock() {
    const { error } = await unblockUser(user.id, otherPartyId(conversation, user.id))
    if (error) setError(error.message)
    else setBlockStatus('none')
  }

  if (conversation === undefined) return null

  if (!conversation) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Không tìm thấy cuộc trò chuyện</h2>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Link to="/chats" className="mt-6 inline-block font-semibold text-orange-600 hover:underline">
          Quay lại tin nhắn
        </Link>
      </section>
    )
  }

  const isClient = conversation.client_id === user.id
  const name = otherPartyName(conversation, user.id) ?? 'Không rõ'

  return (
    <section className="mx-auto flex h-[calc(100dvh-4rem)] max-w-2xl flex-col">
      <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3">
        <Link
          to="/chats"
          aria-label="Quay lại tin nhắn"
          className="rounded-lg px-2 py-1 text-xl text-stone-500 transition hover:bg-stone-200"
        >
          ←
        </Link>
        <Avatar name={name} src={publicImageUrl(otherPartyAvatarPath(conversation, user.id))} />
        <div className="min-w-0 flex-1">
          {isClient ? (
            <Link
              to={`/hire/${conversation.hire_id}`}
              className="block truncate font-semibold text-stone-900 hover:underline"
            >
              {name}
            </Link>
          ) : (
            <p className="truncate font-semibold text-stone-900">{name}</p>
          )}
          <p className="text-xs text-stone-500">{isClient ? 'Hire' : 'Khách'}</p>
        </div>
        <SafetyMenu
          otherId={otherPartyId(conversation, user.id)}
          otherName={name}
          conversationId={conversation.id}
          blockStatus={blockStatus}
          onBlockStatusChange={setBlockStatus}
        />
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4">
        {hasOlder && (
          <div className="mb-4 text-center">
            <button
              onClick={loadOlder}
              disabled={loadingOlder}
              className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-100 disabled:opacity-60"
            >
              {loadingOlder ? 'Đang tải…' : 'Xem tin nhắn cũ hơn'}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-stone-400">
            {isClient ? `Chào ${name} và hỏi về điều khoản của họ nhé.` : 'Chưa có tin nhắn.'}
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              mine={message.sender_id === user.id}
              imageUrl={message.image_path && imageUrls[message.image_path]}
              onImageLoad={scrollToBottomIfFollowing}
            />
          ))}
        </ul>
      </div>

      {error && <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {blockStatus === 'you_blocked' ? (
        <div className="flex items-center justify-between gap-3 border-t border-stone-200 p-4 text-sm text-stone-600">
          <span>Bạn đã chặn {name}.</span>
          <button onClick={handleUnblock} className="font-semibold text-orange-600 hover:underline">
            Bỏ chặn
          </button>
        </div>
      ) : blockStatus === 'blocked_you' ? (
        <p className="border-t border-stone-200 p-4 text-center text-sm text-stone-500">
          Bạn không thể trả lời cuộc trò chuyện này.
        </p>
      ) : (
        <ChatComposer conversationId={conversation.id} onSent={handleSent} />
      )}
    </section>
  )
}

export default ChatThread
