import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { getHirePage, saveHirePage } from '../lib/hirePages'
import { deletePublicImage, publicImageUrl, uploadPublicImage } from '../lib/images'
import ImagePicker from './ImagePicker'

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'

const tosPlaceholder = `Ví dụ:
• Chỉ gặp ở nơi công cộng.
• Thanh toán trước khi bắt đầu.
• Huỷ trước ít nhất 24 giờ, nếu không sẽ không hoàn tiền.
• Không tiếp xúc cơ thể ngoài bắt tay.`

// Uploads a newly picked image. file is undefined (unchanged), a File (new)
// or null (removed). Resolves to { path, error } with the path to save.
async function resolveImage(userId, kind, file, currentPath) {
  if (file === undefined) return { path: currentPath, error: null }
  if (file === null) return { path: null, error: null }
  return uploadPublicImage(userId, kind, file)
}

function HireSetup() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [existing, setExisting] = useState(null)
  const [hireName, setHireName] = useState('')
  const [location, setLocation] = useState('')
  const [tos, setTos] = useState('')
  const [avatarFile, setAvatarFile] = useState(undefined)
  const [posterFile, setPosterFile] = useState(undefined)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Prefill the form when editing an existing Hire page.
  useEffect(() => {
    getHirePage(user.id).then(({ data, error }) => {
      if (error) setError(error.message)
      if (data) {
        setExisting(data)
        setHireName(data.hire_name)
        setLocation(data.location)
        setTos(data.tos)
      }
      setLoading(false)
    })
  }, [user.id])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const [avatar, poster] = await Promise.all([
      resolveImage(user.id, 'hire-avatar', avatarFile, existing?.avatar_path ?? null),
      resolveImage(user.id, 'poster', posterFile, existing?.poster_path ?? null),
    ])
    const uploadError = avatar.error || poster.error
    if (uploadError) {
      setError(`Không tải được ảnh lên: ${uploadError.message}`)
      setSaving(false)
      return
    }

    const { error } = await saveHirePage({
      user_id: user.id,
      hire_name: hireName.trim(),
      location: location.trim(),
      tos: tos.trim(),
      avatar_path: avatar.path,
      poster_path: poster.path,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    // Clean up images that were replaced or removed.
    if (existing?.avatar_path !== avatar.path) deletePublicImage(existing?.avatar_path)
    if (existing?.poster_path !== poster.path) deletePublicImage(existing?.poster_path)
    navigate(`/hire/${user.id}`)
  }

  if (loading) return null

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h2 className="text-2xl font-bold text-stone-900">
        {existing ? 'Chỉnh sửa trang Hire' : 'Tạo trang Hire của bạn'}
      </h2>
      <p className="mt-1 text-stone-500">Đây là trang mọi người xem khi muốn thuê bạn.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8">
        <ImagePicker
          label="Ảnh poster"
          hint="Ảnh lớn hiển thị trên bảng tin. Nên dùng ảnh ngang."
          shape="poster"
          currentUrl={publicImageUrl(existing?.poster_path)}
          onChange={setPosterFile}
        />

        <ImagePicker
          label="Ảnh đại diện trang"
          hint="Có thể khác ảnh đại diện tài khoản của bạn."
          shape="avatar"
          currentUrl={publicImageUrl(existing?.avatar_path)}
          onChange={setAvatarFile}
        />

        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
          Tên Hire
          <input
            type="text"
            required
            minLength={2}
            maxLength={50}
            value={hireName}
            onChange={(e) => setHireName(e.target.value)}
            placeholder="VD: Gia sư Toán cô Linh"
            className={inputClass}
          />
          <span className="font-normal text-stone-500">
            Tên bạn dùng để nhận việc, có thể khác tên tài khoản.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
          Khu vực
          <input
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="VD: Quận 1, TP. Hồ Chí Minh"
            className={inputClass}
          />
          <span className="font-normal text-stone-500">
            Khu vực bạn nhận việc. Đừng ghi địa chỉ nhà.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
          Điều khoản khi thuê bạn
          <textarea
            required
            minLength={20}
            maxLength={5000}
            rows={8}
            value={tos}
            onChange={(e) => setTos(e.target.value)}
            placeholder={tosPlaceholder}
            className={`${inputClass} resize-y`}
          />
          <span className="flex justify-between gap-4 font-normal text-stone-500">
            <span>Quy tắc của bạn: làm gì và không làm gì, thanh toán, huỷ lịch, giới hạn.</span>
            <span className="shrink-0">{tos.length}/5000</span>
          </span>
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
          >
            {saving ? 'Đang lưu…' : existing ? 'Lưu thay đổi' : 'Tạo trang Hire'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-6 py-3 font-semibold text-stone-600 transition hover:bg-stone-200"
          >
            Huỷ
          </button>
        </div>
      </form>
    </section>
  )
}

export default HireSetup
