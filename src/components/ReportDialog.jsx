import { useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { blockUser, reportReasons, reportUser } from '../lib/safety'
import { useDismiss } from '../lib/useDismiss'

function ReportDialog({ reportedId, reportedName, conversationId, alreadyBlocked, onBlocked, onClose }) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [alsoBlock, setAlsoBlock] = useState(!alreadyBlocked)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // null until sent, then { blocked } recording whether blocking also succeeded.
  const [done, setDone] = useState(null)
  const panelRef = useRef(null)

  useDismiss(panelRef, true, onClose)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!reason) {
      setError('Hãy chọn một lý do.')
      return
    }

    setSubmitting(true)
    setError('')
    const report = await reportUser({
      reporterId: user.id,
      reportedId,
      conversationId,
      reason,
      details: details.trim(),
    })
    if (report.error) {
      setError(report.error.message)
      setSubmitting(false)
      return
    }

    let blocked = false
    if (alsoBlock && !alreadyBlocked) {
      const block = await blockUser(user.id, reportedId)
      blocked = !block.error
      if (blocked) onBlocked?.()
    }
    setDone({ blocked })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        {done ? (
          <div className="text-center">
            <h2 className="text-xl font-bold text-stone-900">Cảm ơn bạn đã báo cho chúng tôi</h2>
            <p className="mt-2 text-sm text-stone-600">
              Chúng tôi sẽ xem xét báo cáo về {reportedName}.
              {done.blocked && ` Bạn cũng đã chặn người này.`} Nếu bạn đang gặp nguy hiểm,
              hãy gọi ngay 113.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-stone-900 py-2.5 font-semibold text-white transition hover:bg-stone-700"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold text-stone-900">Báo cáo {reportedName}</h2>
            <p className="mt-1 text-sm text-stone-500">
              Người này sẽ không biết bạn đã báo cáo.
            </p>

            <fieldset className="mt-5 flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-stone-700">Có chuyện gì vậy?</legend>
              {reportReasons.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                    reason === option.value
                      ? 'border-orange-500 bg-orange-50 text-stone-900'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={() => setReason(option.value)}
                    className="accent-orange-600"
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>

            <label className="mt-5 flex flex-col gap-1.5 text-sm font-medium text-stone-700">
              Chi tiết (không bắt buộc)
              <textarea
                rows={3}
                maxLength={1000}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Đã xảy ra chuyện gì?"
                className="w-full resize-y rounded-lg border border-stone-300 px-3 py-2 font-normal text-stone-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </label>

            {!alreadyBlocked && (
              <label className="mt-4 flex items-center gap-2.5 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={alsoBlock}
                  onChange={(e) => setAlsoBlock(e.target.checked)}
                  className="size-4 accent-orange-600"
                />
                Chặn luôn {reportedName}
              </label>
            )}

            {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg py-2.5 font-semibold text-stone-600 transition hover:bg-stone-100"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {submitting ? 'Đang gửi…' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ReportDialog
