import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function PageHeader({ title, back, logo, children }) {
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  return (
    <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40 backdrop-blur-xl">
      <div className="flex items-center gap-2 min-w-0">
        {back && (
          <button
            onClick={() => navigate(back === true ? -1 : back)}
            className="press-scale p-1 -ml-1"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {logo && (
          <img src="/icon.svg" alt="iBorcuha" className="w-8 h-8 rounded-lg" />
        )}
        <h1 className="text-lg font-bold uppercase italic truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {children}
        <button onClick={toggle} className="press-scale p-2 rounded-full">
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}
