import { supabase } from './supabase'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const PUBLIC_BUCKET = 'public-images'

// Returns an error message, or null if the file is an acceptable image.
export function validateImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) return 'Chỉ hỗ trợ ảnh JPG, PNG, WebP hoặc GIF.'
  if (file.size > MAX_IMAGE_BYTES) return 'Ảnh phải nhỏ hơn 5 MB.'
  return null
}

export function imageExtension(file) {
  return file.type.split('/')[1]
}

export function publicImageUrl(path) {
  return path ? supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path).data.publicUrl : null
}

// Uploads to "<userId>/<kind>-<random>.<ext>". A fresh name each time means
// browsers never show a cached old image. Resolves to { path, error }.
export async function uploadPublicImage(userId, kind, file) {
  const path = `${userId}/${kind}-${crypto.randomUUID()}.${imageExtension(file)}`
  const { error } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .upload(path, file, { contentType: file.type })
  return { path: error ? null : path, error }
}

// Best effort: a leftover file is harmless, so failures are ignored.
export function deletePublicImage(path) {
  if (path) supabase.storage.from(PUBLIC_BUCKET).remove([path])
}
