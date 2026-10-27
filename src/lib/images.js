import { supabase } from './supabase'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const PUBLIC_BUCKET = 'public-images'
const ENCODE_QUALITY = 0.85

// Longest side, in pixels, for each kind of image.
export const IMAGE_SIZES = { chat: 1600, poster: 1600, avatar: 512 }

// Some phones hand over photos with an empty MIME type, so check the name too.
function looksLikeImage(file) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp)$/i.test(file.name)
}

// Decodes the file, applying the photo's EXIF rotation so phone pictures
// aren't sideways.
async function decodeImage(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // Older Safari: fall back to an <img>, which also applies EXIF rotation.
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return img
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

function canvasToBlob(canvas, type) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, ENCODE_QUALITY))
}

// Turns any photo the browser can read (including large phone photos and HEIC
// on iPhone) into a resized WebP or JPEG under the size limit. Re-encoding also
// strips metadata such as the GPS location phones embed in photos. GIFs are
// kept as-is so they stay animated. Resolves to { file } or { error }.
export async function prepareImage(file, maxDimension) {
  if (!looksLikeImage(file)) return { error: 'Tệp này không phải là ảnh.' }

  if (file.type === 'image/gif') {
    return file.size <= MAX_IMAGE_BYTES ? { file } : { error: 'Ảnh GIF phải nhỏ hơn 5 MB.' }
  }

  let image
  try {
    image = await decodeImage(file)
  } catch {
    return { error: 'Không đọc được ảnh này. Hãy thử ảnh JPG hoặc PNG.' }
  }

  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close?.()

  let blob = await canvasToBlob(canvas, 'image/webp')
  if (blob?.type !== 'image/webp') {
    // Safari can't encode WebP. JPEG has no transparency, so paint white
    // behind the image first (otherwise transparent areas turn black).
    context.globalCompositeOperation = 'destination-over'
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    blob = await canvasToBlob(canvas, 'image/jpeg')
  }

  if (!blob) return { error: 'Không xử lý được ảnh này.' }
  if (blob.size > MAX_IMAGE_BYTES) return { error: 'Ảnh quá lớn, hãy chọn ảnh khác.' }

  const extension = blob.type.split('/')[1]
  return { file: new File([blob], `image.${extension}`, { type: blob.type }) }
}

// The first image in a paste, whether the browser exposes it as a file or
// only as a clipboard item (screenshots, "Copy image" in a browser).
export function imageFromClipboard(clipboardData) {
  const fromFiles = [...clipboardData.files].find(looksLikeImage)
  if (fromFiles) return fromFiles
  const item = [...clipboardData.items].find((i) => i.kind === 'file' && i.type.startsWith('image/'))
  return item?.getAsFile() ?? null
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
