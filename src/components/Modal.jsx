import { useTheme } from '../context/ThemeContext'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  const { dark } = useTheme()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-overlay" />
      <div
        onClick={e => e.stopPropagation()}
        className={`
          relative w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-hide
          rounded-t-[32px] p-5 pt-3 modal-sheet
          ${dark ? 'bg-dark-800 text-white' : 'bg-white text-gray-900'}
        `}
      >
        <div className={`w-10 h-1 rounded-full mx-auto mb-3 ${dark ? 'bg-white/20' : 'bg-black/15'}`} />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold uppercase italic">{title}</h2>
          <button onClick={onClose} className="press-scale p-1">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
