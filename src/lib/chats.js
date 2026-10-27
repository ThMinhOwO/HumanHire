import { imageExtension } from './images'
import { supabase } from './supabase'

export const MESSAGE_PAGE_SIZE = 50
const IMAGE_BUCKET = 'chat-images'

const conversationFields =
  'id, client_id, hire_id, last_message_at, hire:hire_pages(hire_name, avatar_path), client:profiles(display_name, avatar_path, username)'

// Finds the client's conversation with a Hire, creating it on first contact.
export async function getOrCreateConversation(clientId, hireId) {
  const existing = await supabase
    .from('conversations')
    .select('id')
    .eq('client_id', clientId)
    .eq('hire_id', hireId)
    .maybeSingle()
  if (existing.error || existing.data) return existing

  const created = await supabase
    .from('conversations')
    .insert({ client_id: clientId, hire_id: hireId })
    .select('id')
    .single()
  // Another tab created it first; fetch that one instead.
  if (created.error?.code === '23505') return getOrCreateConversation(clientId, hireId)
  return created
}

// The user's conversations, most recently active first, each with its latest message.
export function listConversations() {
  return supabase
    .from('conversations')
    .select(`${conversationFields}, messages(body, image_path, sender_id, created_at)`)
    .order('last_message_at', { ascending: false })
    .order('id', { referencedTable: 'messages', ascending: false })
    .limit(1, { referencedTable: 'messages' })
}

export function getConversation(conversationId) {
  return supabase.from('conversations').select(conversationFields).eq('id', conversationId).maybeSingle()
}

// One page of messages, oldest first: the latest page, or the page before beforeId.
export async function listMessages(conversationId, beforeId) {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('id', { ascending: false })
    .limit(MESSAGE_PAGE_SIZE)
  if (beforeId) query = query.lt('id', beforeId)

  const { data, error } = await query
  return { data: data?.reverse() ?? null, error }
}

export function sendMessage(conversationId, senderId, { body, imagePath }) {
  return supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body, image_path: imagePath })
    .select()
    .single()
}

export function uploadChatImage(conversationId, file) {
  const path = `${conversationId}/${crypto.randomUUID()}.${imageExtension(file)}`
  return supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type })
}

// Signed URLs (valid for an hour) for private chat images, keyed by path.
export async function getImageUrls(paths) {
  const { data } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(paths, 60 * 60)
  return Object.fromEntries((data ?? []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]))
}

// Calls back with each new message the user can see, optionally limited to one
// conversation. Returns an unsubscribe function.
export function onNewMessage(conversationId, callback) {
  const channel = supabase
    .channel(`messages:${conversationId ?? 'all'}:${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        ...(conversationId && { filter: `conversation_id=eq.${conversationId}` }),
      },
      (payload) => callback(payload.new),
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export function otherPartyId(conversation, userId) {
  return conversation.client_id === userId ? conversation.hire_id : conversation.client_id
}

// Name of the other person: the Hire name if you're the client, else the client's name.
export function otherPartyName(conversation, userId) {
  return conversation.client_id === userId
    ? conversation.hire?.hire_name
    : conversation.client?.display_name
}

// Avatar path of the other person: the Hire page's avatar if you're the client,
// else the client's profile avatar.
export function otherPartyAvatarPath(conversation, userId) {
  return conversation.client_id === userId
    ? conversation.hire?.avatar_path
    : conversation.client?.avatar_path
}

export function messagePreview(message) {
  return message.body ?? '📷 Ảnh'
}

// "14:05" for today, "27/10" otherwise.
export function formatMessageTime(timestamp) {
  const date = new Date(timestamp)
  const isToday = date.toDateString() === new Date().toDateString()
  return isToday
    ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}
