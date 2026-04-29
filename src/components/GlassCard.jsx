import { useTheme } from '../context/ThemeContext'

export default function GlassCard({ children, className = '', onClick }) {
  const { dark } = useTheme()

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick(e)
    }
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        rounded-[20px] p-4
        backdrop-blur-xl glass-hover
        transition-all duration-200
        ${dark
          ? 'bg-white/[0.05] border border-white/[0.07]'
          : 'bg-white/70 border border-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
        }
        ${onClick ? 'press-scale cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
