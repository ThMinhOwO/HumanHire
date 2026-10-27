import { supabase } from './supabase'

const conversationFields =
  'id, client_id, hire_id, last_message_at, hire:hire_pages(hire_name), client:profiles(display_name)'

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
    .select(`${conversationFields}, messages(body, sender_id, created_at)`)
    .order('last_message_at', { ascending: false })
    .order('id', { referencedTable: 'messages', ascending: false })
    .limit(1, { referencedTable: 'messages' })
}

export function getConversation(conversationId) {
  return supabase.from('conversations').select(conversationFields).eq('id', conversationId).maybeSingle()
}

export function listMessages(conversationId) {
  return supabase.from('messages').select('*').eq('conversation_id', conversationId).order('id')
}

export function sendMessage(conversationId, senderId, body) {
  return supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select()
    .single()
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

// Name of the other person: the Hire name if you're the client, else the client's name.
export function otherPartyName(conversation, userId) {
  return conversation.client_id === userId
    ? conversation.hire?.hire_name
    : conversation.client?.display_name
}

// "14:05" for today, "Oct 27" otherwise.
export function formatMessageTime(timestamp) {
  const date = new Date(timestamp)
  const isToday = date.toDateString() === new Date().toDateString()
  return isToday
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
