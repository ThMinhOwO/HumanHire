import { useCallback, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { blockUser, unblockUser } from '../lib/safety'
import { useDismiss } from '../lib/useDismiss'
import ReportDialog from './ReportDialog'

const itemClass = 'block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-stone-100'

// "⋯" menu with Report and Block/Unblock for another user.
function SafetyMenu({ otherId, otherName, conversationId, blockStatus, onBlockStatusChange }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [reporting, setReporting] = useState(false)
  const menuRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])
  useDismiss(menuRef, open, close)

  const youBlocked = blockStatus === 'you_blocked'

  async function toggleBlock() {
    setOpen(false)
    if (youBlocked) {
      const { error } = await unblockUser(user.id, otherId)
      if (error) window.alert(error.message)
      else onBlockStatusChange('none')
      return
    }

    const confirmed = window.confirm(
      `Chặn ${otherName}? Hai bạn sẽ không thể nhắn tin cho nhau. Bạn có thể bỏ chặn sau.`,
    )
    if (!confirmed) return
    const { error } = await blockUser(user.id, otherId)
    if (error) window.alert(error.message)
    else onBlockStatusChange('you_blocked')
  }

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen(!open)}
          aria-label="Tuỳ chọn khác"
          aria-expanded={open}
          className="flex size-10 items-center justify-center rounded-lg text-xl text-stone-500 transition hover:bg-stone-200"
        >
          ⋯
        </button>

        {open && (
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
            <button
              onClick={() => {
                setOpen(false)
                setReporting(true)
              }}
              className={`${itemClass} text-stone-700`}
            >
              Báo cáo {otherName}
            </button>
            <button onClick={toggleBlock} className={`${itemClass} text-red-600`}>
              {youBlocked ? `Bỏ chặn ${otherName}` : `Chặn ${otherName}`}
            </button>
          </div>
        )}
      </div>

      {reporting && (
        <ReportDialog
          reportedId={otherId}
          reportedName={otherName}
          conversationId={conversationId}
          alreadyBlocked={youBlocked}
          onBlocked={() => onBlockStatusChange('you_blocked')}
          onClose={() => setReporting(false)}
        />
      )}
    </>
  )
}

export default SafetyMenu
