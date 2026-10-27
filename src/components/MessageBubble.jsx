import { formatMessageTime } from '../lib/chats'

function MessageBubble({ message, mine, imageUrl, onImageLoad }) {
  return (
    <li className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] overflow-hidden rounded-2xl ${
          mine
            ? 'rounded-br-md bg-orange-600 text-white'
            : 'rounded-bl-md border border-stone-200 bg-white text-stone-800'
        }`}
      >
        {message.image_path &&
          (imageUrl ? (
            <a href={imageUrl} target="_blank" rel="noreferrer">
              <img
                src={imageUrl}
                alt="Ảnh được gửi"
                onLoad={onImageLoad}
                className="block h-auto max-h-96 w-auto max-w-full"
              />
            </a>
          ) : (
            <div className="h-48 w-56 animate-pulse bg-stone-200" />
          ))}

        <div className="px-4 py-2">
          {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
          <p className={`mt-1 text-right text-[11px] ${mine ? 'text-orange-100' : 'text-stone-400'}`}>
            {formatMessageTime(message.created_at)}
          </p>
        </div>
      </div>
    </li>
  )
}

export default MessageBubble
