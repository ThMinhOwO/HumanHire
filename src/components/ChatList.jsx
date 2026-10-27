import { chats } from '../data/mock'
import Avatar from './Avatar'

function ChatList() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h2 className="text-2xl font-bold text-stone-900">My chats</h2>

      <ul className="mt-6 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {chats.map((chat) => (
          <li key={chat.id}>
            <button className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-stone-50">
              <Avatar name={chat.name} color={chat.color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-stone-900">{chat.name}</p>
                  <span className="shrink-0 text-xs text-stone-400">{chat.time}</span>
                </div>
                <p
                  className={`truncate text-sm ${chat.unread ? 'font-medium text-stone-800' : 'text-stone-500'}`}
                >
                  {chat.lastMessage}
                </p>
              </div>
              {chat.unread > 0 && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-semibold text-white">
                  {chat.unread}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ChatList
