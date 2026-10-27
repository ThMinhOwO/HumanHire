import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'

// Logged-out welcome screen. Logged-in users go straight to Nearby.
function Landing() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/nearby" replace />

  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-extrabold tracking-tight text-stone-900 sm:text-7xl">
        Human<span className="text-orange-600">Hire</span>
      </p>

      <p className="mt-6 max-w-xl text-lg text-stone-600">
        Thuê người thật quanh bạn cho mọi việc: gia sư, bạn tập gym, người đi
        đám cưới cùng, người yêu giả để ra mắt gia đình. Gặp nhau ngoài đời thật.
      </p>

      <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <Link
          to="/signup"
          className="flex-1 rounded-xl bg-orange-600 px-6 py-4 font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
        >
          Đăng ký
        </Link>
        <Link
          to="/login"
          className="flex-1 rounded-xl border border-stone-300 bg-white px-6 py-4 font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-100"
        >
          Đăng nhập
        </Link>
      </div>
    </section>
  )
}

export default Landing
