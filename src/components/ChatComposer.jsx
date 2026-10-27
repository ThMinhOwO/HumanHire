import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { sendMessage, uploadChatImage } from '../lib/chats'
import { IMAGE_SIZES, imageFromClipboard, prepareImage } from '../lib/images'

// Phones and tablets: Enter should add a new line, and the Send button sends.
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches

function ChatComposer({ conversationId, onSent }) {
  const { user } = useAuth()
  const [draft, setDraft] = useState('')
  // { file, previewUrl } for an image waiting to be sent.
  const [image, setImage] = useState(null)
  const [preparing, setPreparing] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  // Free the preview's object URL when it's replaced or the composer unmounts.
  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image.previewUrl)
    }
  }, [image])

  // Grow the text box with its content, up to its max height.
  useLayoutEffect(() => {
    const el = textareaRef.current
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  async function attach(file) {
    setError('')
    setPreparing(true)
    const result = await prepareImage(file, IMAGE_SIZES.chat)
    setPreparing(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setImage({ file: result.file, previewUrl: URL.createObjectURL(result.file) })
  }

  // Paste an image anywhere on the chat screen, not just in the text box.
  // Pastes into other fields (e.g. the report dialog) are left alone.
  const attachPasted = useEffectEvent(attach)
  useEffect(() => {
    function handlePaste(e) {
      const target = e.target
      const inOtherField =
        target !== textareaRef.current && (target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(target.tagName))
      if (inOtherField || !e.clipboardData) return

      const file = imageFromClipboard(e.clipboardData)
      if (!file) return
      // Keep any text that came with the image (e.g. copied from a web page).
      if (!e.clipboardData.getData('text/plain')) e.preventDefault()
      attachPasted(file)
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) attach(file)
  }

  async function handleSend(e) {
    e?.preventDefault()
    const body = draft.trim()
    if ((!body && !image) || sending || preparing) return

    setSending(true)
    setError('')

    let imagePath = null
    if (image) {
      const upload = await uploadChatImage(conversationId, image.file)
      if (upload.error) {
        setError(`Không gửi được ảnh: ${upload.error.message}`)
        setSending(false)
        return
      }
      imagePath = upload.data.path
    }

    const { data, error } = await sendMessage(conversationId, user.id, { body: body || null, imagePath })
    if (error) {
      // 42501 = blocked by a row-level security policy, i.e. one of you blocked the other.
      setError(error.code === '42501' ? 'Bạn không thể gửi tin nhắn trong cuộc trò chuyện này.' : error.message)
    } else {
      setDraft('')
      setImage(null)
      onSent(data)
    }
    setSending(false)
  }

  function handleKeyDown(e) {
    // On a keyboard, Enter sends and Shift+Enter adds a new line. Ignore Enter
    // while an IME (e.g. Vietnamese Telex) is still composing a character.
    if (isTouchDevice) return
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const busy = sending || preparing

  return (
    <div className="border-t border-stone-200 p-3">
      {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {preparing && <p className="mb-2 text-sm text-stone-500">Đang xử lý ảnh…</p>}

      {image && (
        <div className="relative mb-2 inline-block">
          <img src={image.previewUrl} alt="Ảnh sẽ gửi" className="h-24 rounded-lg object-cover" />
          <button
            onClick={() => setImage(null)}
            disabled={sending}
            aria-label="Bỏ ảnh"
            className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-stone-900 text-sm text-white"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-end gap-2">
        {/* image/* lets phones offer the camera and the whole photo library. */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          aria-label="Đính kèm ảnh"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-200 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.5" />
            <path d="m21 16-5-5-9 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          maxLength={2000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isTouchDevice ? 'Nhập tin nhắn…' : 'Nhập tin nhắn hoặc dán ảnh…'}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        />
        <button
          type="submit"
          disabled={busy || (!draft.trim() && !image)}
          className="h-11 shrink-0 rounded-xl bg-orange-600 px-5 font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
        >
          {sending ? '…' : 'Gửi'}
        </button>
      </form>
    </div>
  )
}

export default ChatComposer
