import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { deletePublicImage, publicImageUrl, uploadPublicImage } from '../lib/images'
import { updateProfile } from '../lib/profiles'
import ImagePicker from './ImagePicker'

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'

function AccountForm({ profile }) {
  const { user, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile.display_name)
  // undefined = unchanged, File = new, null = removed.
  const [avatarFile, setAvatarFile] = useState(undefined)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)

    let avatarPath = profile.avatar_path
    if (avatarFile === null) {
      avatarPath = null
    } else if (avatarFile) {
      const upload = await uploadPublicImage(user.id, 'avatar', avatarFile)
      if (upload.error) {
        setError(`Không tải được ảnh lên: ${upload.error.message}`)
        setSaving(false)
        return
      }
      avatarPath = upload.path
    }

    const { error } = await updateProfile(user.id, {
      display_name: displayName.trim(),
      avatar_path: avatarPath,
    })
    if (error) {
      setError(error.message)
    } else {
      if (profile.avatar_path !== avatarPath) deletePublicImage(profile.avatar_path)
      setAvatarFile(undefined)
      setSaved(true)
      await refreshProfile()
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8">
      <ImagePicker
        label="Ảnh đại diện"
        hint="Hiển thị trong tin nhắn khi bạn là khách."
        shape="avatar"
        currentUrl={publicImageUrl(profile.avatar_path)}
        onChange={setAvatarFile}
      />

      <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
        Tên hiển thị
        <input
          type="text"
          required
          maxLength={100}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
        Email
        <input type="email" disabled value={user.email} className={`${inputClass} bg-stone-100 text-stone-500`} />
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Đã lưu.</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
      >
        {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
    </form>
  )
}

function AccountPage() {
  const { profile } = useAuth()

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h2 className="text-2xl font-bold text-stone-900">Tài khoản của bạn</h2>
      <p className="mt-1 text-stone-500">Đây là cách người khác thấy bạn khi bạn đi thuê.</p>
      {/* Wait for the profile so the form starts with the saved values. */}
      {profile ? (
        <AccountForm profile={profile} />
      ) : (
        <p className="mt-8 text-sm text-stone-400">Đang tải…</p>
      )}
    </section>
  )
}

export default AccountPage
