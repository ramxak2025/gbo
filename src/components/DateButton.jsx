import { Calendar } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function formatDateShort(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DateButton({ label, value, onChange, className = '' }) {
  const { dark } = useTheme()
  const display = formatDateShort(value)

  return (
    <div className={className}>
      {label && (
        <div className={`text-[10px] uppercase font-semibold mb-1 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
          {label}
        </div>
      )}
      <label
        className={`
          relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium press-scale transition-all cursor-pointer
          ${display
            ? dark ? 'bg-accent/15 text-accent border border-accent/30' : 'bg-accent/10 text-accent border border-accent/20'
            : dark ? 'bg-white/5 text-white/40 border border-white/10' : 'bg-white text-gray-400 border border-black/[0.06] shadow-sm'
          }
        `}
      >
        <Calendar size={12} className="pointer-events-none" />
        <span className="pointer-events-none">{display || 'Выбрать'}</span>
        <input
          type="date"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          style={{ WebkitAppearance: 'none' }}
        />
      </label>
    </div>
  )
}
