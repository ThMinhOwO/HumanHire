import { useState } from 'react'
import { useAuth } from './auth/AuthContext'
import AuthForm from './components/AuthForm'
import ChatList from './components/ChatList'
import Landing from './components/Landing'
import NearbyList from './components/NearbyList'

const navLinks = [
  { view: 'nearby', label: 'Nearby' },
  { view: 'chats', label: 'Chats' },
]

function App() {
  const [view, setView] = useState('home')
  const { user, loading, signOut } = useAuth()

  const displayName = user?.user_metadata?.full_name || user?.email

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
          <button onClick={() => setView('home')} className="text-xl font-extrabold text-stone-900">
            Human<span className="text-orange-600">Hire</span>
          </button>
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.view}
                onClick={() => setView(link.view)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  view === link.view ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                {link.label}
              </button>
            ))}

            {!loading &&
              (user ? (
                <>
                  <span className="ml-2 hidden max-w-40 truncate text-sm text-stone-500 sm:inline">
                    {displayName}
                  </span>
                  <button
                    onClick={signOut}
                    className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setView('auth')}
                  className="ml-1 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                >
                  Log in
                </button>
              ))}
          </div>
        </nav>
      </header>

      <main>
        {view === 'home' && <Landing onNavigate={setView} />}
        {view === 'nearby' && <NearbyList />}
        {view === 'chats' &&
          !loading &&
          (user ? <ChatList /> : <AuthForm message="Log in to see your chats." />)}
        {view === 'auth' && <AuthForm onSuccess={() => setView('home')} />}
      </main>
    </div>
  )
}

export default App
