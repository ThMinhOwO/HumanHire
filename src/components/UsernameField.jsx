import { normalizeUsername } from '../lib/profiles'

const statusColors = {
  invalid: 'text-red-600',
  taken: 'text-red-600',
  available: 'text-emerald-600',
}

// "@username" input that shows the result of useUsernameCheck under it.
function UsernameField({ value, onChange, check }) {
  const message = check.status === 'checking' ? 'Đang kiểm tra…' : check.message

  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
      Tên người dùng
      <div className="flex items-center rounded-lg border border-stone-300 bg-white transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
        <span className="pl-3 text-stone-400">@</span>
        <input
          type="text"
          required
          maxLength={20}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(normalizeUsername(e.target.value))}
          className="w-full rounded-lg bg-transparent py-2.5 pl-1 pr-3 text-base font-normal text-stone-900 outline-none"
        />
      </div>
      <span className={`font-normal ${statusColors[check.status] ?? 'text-stone-500'}`}>
        {message ?? 'Chữ thường không dấu, số, dấu _ và dấu chấm. Duy nhất trên HumanHire.'}
      </span>
    </label>
  )
}

export default UsernameField
