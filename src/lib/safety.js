import { supabase } from './supabase'

export const reportReasons = [
  { value: 'harassment', label: 'Quấy rối hoặc đe doạ' },
  { value: 'scam', label: 'Lừa đảo hoặc đòi tiền' },
  { value: 'inappropriate', label: 'Nội dung tình dục hoặc không phù hợp' },
  { value: 'safety', label: 'Khiến tôi thấy không an toàn khi gặp mặt' },
  { value: 'fake', label: 'Hồ sơ giả hoặc mạo danh' },
  { value: 'other', label: 'Lý do khác' },
]

// Resolves to { data: 'none' | 'you_blocked' | 'blocked_you', error }.
export function getBlockStatus(otherId) {
  return supabase.rpc('block_status', { other: otherId })
}

export function blockUser(blockerId, blockedId) {
  return supabase
    .from('blocks')
    .upsert({ blocker_id: blockerId, blocked_id: blockedId }, { ignoreDuplicates: true })
}

export function unblockUser(blockerId, blockedId) {
  return supabase.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId)
}

// Ids of everyone the current user has blocked.
export async function listBlockedIds() {
  const { data, error } = await supabase.from('blocks').select('blocked_id')
  return { data: data?.map((row) => row.blocked_id) ?? null, error }
}

export function reportUser({ reporterId, reportedId, conversationId, reason, details }) {
  return supabase.from('reports').insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    conversation_id: conversationId ?? null,
    reason,
    details: details || null,
  })
}
