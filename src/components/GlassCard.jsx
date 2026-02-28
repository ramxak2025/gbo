import { useTheme } from '../context/ThemeContext'

export default function GlassCard({ children, className = '', onClick }) {
  const { dark } = useTheme()
  return (
    <div
      onClick={onClick}
      className={`
        rounded-[24px] p-4
        backdrop-blur-xl glass-hover
        transition-all duration-200
        ${dark
          ? 'bg-white/5 border border-white/10'
          : 'bg-white border border-black/[0.05] shadow-sm shadow-black/[0.04]'
        }
        ${onClick ? 'press-scale cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
