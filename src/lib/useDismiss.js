import { useEffect } from 'react'

// While open, calls onDismiss on a click outside ref or on Escape.
export function useDismiss(ref, open, onDismiss) {
  useEffect(() => {
    if (!open) return

    function handlePointerDown(e) {
      if (!ref.current?.contains(e.target)) onDismiss()
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') onDismiss()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref, open, onDismiss])
}
