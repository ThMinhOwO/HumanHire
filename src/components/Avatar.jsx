function Avatar({ name, color }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')

  return (
    <div
      className={`flex size-12 shrink-0 items-center justify-center rounded-full font-semibold text-stone-800 ${color}`}
    >
      {initials}
    </div>
  )
}

export default Avatar
