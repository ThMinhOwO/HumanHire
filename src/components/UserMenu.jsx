import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { getHirePage } from '../lib/hirePages'

const itemClass =
  'block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-100'

function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  // undefined = still loading, null = no Hire page yet.
  const [hirePage, setHirePage] = useState(undefined)
  const menuRef = useRef(null)

  const displayName = user.user_metadata?.full_name || user.email

  useEffect(() => {
    if (!open) return

    function handlePointerDown(e) {
      if (!menuRef.current?.contains(e.target)) setOpen(false)
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      // Re-check each time so it's current after setting up a page.
      setHirePage(undefined)
      const { data } = await getHirePage(user.id)
      setHirePage(data ?? null)
    }
  }

  const close = () => setOpen(false)

  return (
    <div ref={menuRef} className="relative ml-1">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-800">
          {displayName[0].toUpperCase()}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{displayName}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className={`size-4 transition ${open ? 'rotate-180' : ''}`}>
          <path
            fillRule="evenodd"
            d="M5.2 7.2a.75.75 0 0 1 1.06.04L10 11.17l3.74-3.93a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .04-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
          <div className="border-b border-stone-100 px-3 pb-2 pt-1">
            <p className="truncate text-sm font-semibold text-stone-900">{displayName}</p>
            <p className="truncate text-xs text-stone-500">{user.email}</p>
          </div>

          <div className="py-2">
            {hirePage === undefined ? (
              <p className="px-3 py-2 text-sm text-stone-400">Loading…</p>
            ) : hirePage ? (
              <Link to={`/hire/${user.id}`} onClick={close} className={itemClass}>
                Visit your Hire page
                <span className="block truncate text-xs font-normal text-stone-500">{hirePage.hire_name}</span>
              </Link>
            ) : (
              <Link to="/hire/setup" onClick={close} className={`${itemClass} text-orange-700`}>
                Setup your Hire page
              </Link>
            )}
          </div>

          <div className="border-t border-stone-100 pt-2">
            <button onClick={signOut} className={itemClass}>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu
