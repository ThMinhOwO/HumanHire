const colors = ['bg-amber-200', 'bg-rose-200', 'bg-pink-200', 'bg-emerald-200', 'bg-sky-200', 'bg-violet-200']

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-12 text-base',
  lg: 'size-24 text-3xl',
}

// Same name always gets the same color.
function colorFor(name) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return colors[Math.abs(hash) % colors.length]
}

// Shows the image at src, or colored initials when there isn't one.
function Avatar({ name, src, size = 'md', className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} shrink-0 rounded-full bg-stone-200 object-cover ${className}`}
      />
    )
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-stone-800 ${sizes[size]} ${colorFor(name)} ${className}`}
    >
      {initials}
    </div>
  )
}

export default Avatar
