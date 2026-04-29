import { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  const { dark } = useTheme()
  const closeBtnRef = useRef(null)

  useEffect(() => {
    if (open && closeBtnRef.current) {
      closeBtnRef.current.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-overlay" />
      <div
        onClick={e => e.stopPropagation()}
        className={`
          relative w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-hide
          rounded-t-[32px] p-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+100px)] modal-sheet backdrop-blur-2xl
          ${dark ? 'bg-dark-800/95 text-white' : 'bg-[#f5f5f7]/95 text-gray-900'}
        `}
      >
        <div className={`w-10 h-1 rounded-full mx-auto mb-3 ${dark ? 'bg-white/20' : 'bg-black/15'}`} />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold uppercase italic">{title}</h2>
          <button ref={closeBtnRef} onClick={onClose} aria-label="Закрыть" className={`press-scale p-2 rounded-xl ${dark ? 'bg-white/[0.05]' : 'bg-black/[0.04]'}`}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
