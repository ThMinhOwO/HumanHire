import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import UserMenu from './UserMenu'

const navLinks = [
  { to: '/nearby', label: 'Quanh đây' },
  { to: '/chats', label: 'Tin nhắn' },
]

function Layout() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()

  // The logged-out landing page is a bare welcome screen with no header.
  const showHeader = !(pathname === '/' && (loading || !user))

  return (
    <div className="min-h-screen bg-stone-50">
      {showHeader && (
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/80 backdrop-blur">
          <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
            <Link to="/" className="text-xl font-extrabold text-stone-900">
              Human<span className="text-orange-600">Hire</span>
            </Link>
            <div className="flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {!loading &&
                (user ? (
                  <UserMenu />
                ) : (
                  <Link
                    to="/login"
                    className="ml-1 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                  >
                    Đăng nhập
                  </Link>
                ))}
            </div>
          </nav>
        </header>
      )}

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
