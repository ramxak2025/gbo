import { useRef } from 'react'
import { Calendar } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function formatDateShort(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DateButton({ label, value, onChange, className = '' }) {
  const { dark } = useTheme()
  const inputRef = useRef(null)

  return (
    <div className={className}>
      {label && (
        <div className={`text-[10px] uppercase font-semibold mb-1 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
          {label}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.showPicker?.() || inputRef.current?.click()}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium press-scale transition-all
          ${value
            ? dark ? 'bg-accent/15 text-accent border border-accent/30' : 'bg-accent/10 text-accent border border-accent/20'
            : dark ? 'bg-white/5 text-white/40 border border-white/10' : 'bg-black/5 text-gray-400 border border-black/10'
          }
        `}
      >
        <Calendar size={12} />
        <span>{value ? formatDateShort(value) : 'Выбрать'}</span>
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  )
}
