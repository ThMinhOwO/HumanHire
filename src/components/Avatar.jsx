const colors = ['bg-amber-200', 'bg-rose-200', 'bg-pink-200', 'bg-emerald-200', 'bg-sky-200', 'bg-violet-200']

// Same name always gets the same color.
function colorFor(name) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return colors[Math.abs(hash) % colors.length]
}

function Avatar({ name }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <div
      className={`flex size-12 shrink-0 items-center justify-center rounded-full font-semibold text-stone-800 ${colorFor(name)}`}
    >
      {initials}
    </div>
  )
}

export default Avatar
