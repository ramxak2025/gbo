import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function PageHeader({ title, back, logo, gradient, children }) {
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [scrollProgress, setScrollProgress] = useState(0) // 0..1
  const headerRef = useRef(null)

  useEffect(() => {
    const scrollContainer = headerRef.current?.closest('.overflow-y-auto')
    if (!scrollContainer) return
    const handleScroll = () => {
      const progress = Math.min(scrollContainer.scrollTop / 30, 1)
      setScrollProgress(progress)
    }
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  const renderTitle = () => {
    if (gradient && title === 'iBorcuha') {
      return (
        <h1 className="text-lg font-bold uppercase tracking-tight truncate">
          <span className={dark ? 'text-white/60' : 'text-gray-500'}>i</span>
          <span className="bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
            Borcuha
          </span>
        </h1>
      )
    }
    return <h1 className="text-lg font-bold uppercase italic truncate">{title}</h1>
  }

  const bgColor = dark ? `rgba(5,5,5,${0.55 * scrollProgress})` : `rgba(245,245,247,${0.6 * scrollProgress})`
  const borderOpacity = scrollProgress * (dark ? 0.06 : 0.04)
  const blurVal = scrollProgress * 16

  return (
    <header
      ref={headerRef}
      className="flex items-center justify-between px-4 pb-3 mb-1 sticky top-0 z-40"
      style={{
        paddingTop: 'max(16px, var(--sat))',
        backgroundColor: bgColor,
        backdropFilter: `blur(${blurVal}px)`,
        WebkitBackdropFilter: `blur(${blurVal}px)`,
        borderBottom: `1px solid rgba(${dark ? '255,255,255' : '0,0,0'},${borderOpacity})`,
        boxShadow: scrollProgress > 0.5 && !dark ? `0 1px 3px rgba(0,0,0,${0.04 * scrollProgress})` : 'none',
      }}
    >
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
          <img src="/logo.png" alt="iBorcuha" className="w-8 h-8 rounded-lg" />
        )}
        {renderTitle()}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {children}
        <button onClick={toggle} className={`press-scale p-2.5 rounded-xl transition-colors ${dark ? 'bg-white/[0.05]' : 'bg-white/60 shadow-sm'}`}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
