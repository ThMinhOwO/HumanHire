import { useState } from 'react'
import ChatList from './components/ChatList'
import Landing from './components/Landing'
import NearbyList from './components/NearbyList'

const navLinks = [
  { view: 'nearby', label: 'Nearby' },
  { view: 'chats', label: 'Chats' },
]

function App() {
  const [view, setView] = useState('home')

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <button onClick={() => setView('home')} className="text-xl font-extrabold text-stone-900">
            Human<span className="text-orange-600">Hire</span>
          </button>
          <div className="flex gap-1">
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
          </div>
        </nav>
      </header>

      <main>
        {view === 'home' && <Landing onNavigate={setView} />}
        {view === 'nearby' && <NearbyList />}
        {view === 'chats' && <ChatList />}
      </main>
    </div>
  )
}

export default App
