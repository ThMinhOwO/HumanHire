import { useEffect, useRef, useState } from 'react'
import { validateImage } from '../lib/images'

// Picks one image with a live preview. shape is 'avatar' (circle) or 'poster'
// (wide banner). currentUrl is the saved image; onChange gets the new File or
// null when the image is removed.
function ImagePicker({ label, hint, shape, currentUrl, onChange }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [removed, setRemoved] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  // Free the preview's object URL when it's replaced or the picker unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function handleChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const problem = validateImage(file)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setRemoved(false)
    setPreviewUrl(URL.createObjectURL(file))
    onChange(file)
  }

  function handleRemove() {
    setPreviewUrl(null)
    setRemoved(true)
    onChange(null)
  }

  const shown = previewUrl ?? (removed ? null : currentUrl)
  const isAvatar = shape === 'avatar'

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-stone-700">{label}</span>

      <div className={isAvatar ? 'flex items-center gap-4' : 'flex flex-col gap-3'}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`group relative overflow-hidden border-2 border-dashed border-stone-300 bg-stone-100 transition hover:border-orange-400 ${
            isAvatar ? 'size-24 shrink-0 rounded-full' : 'aspect-[4/3] w-full rounded-2xl'
          }`}
        >
          {shown ? (
            <img src={shown} alt={label} className="size-full object-cover" />
          ) : (
            <span className="flex size-full flex-col items-center justify-center gap-1 text-stone-400 group-hover:text-orange-500">
              <span className="text-2xl">+</span>
              {!isAvatar && <span className="font-medium">Chọn ảnh</span>}
            </span>
          )}
        </button>

        <div className="flex flex-col items-start gap-1">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-semibold text-orange-600 hover:underline"
            >
              {shown ? 'Đổi ảnh' : 'Tải ảnh lên'}
            </button>
            {shown && (
              <button type="button" onClick={handleRemove} className="font-semibold text-stone-500 hover:underline">
                Xoá
              </button>
            )}
          </div>
          {hint && <span className="text-stone-500">{hint}</span>}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}

export default ImagePicker
