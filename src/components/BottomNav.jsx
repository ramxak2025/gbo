import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Wallet, Users, Trophy, User, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const navConfigs = {
  superadmin: [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/team', icon: Users, label: 'Люди' },
    { path: '/tournaments', icon: Trophy, label: 'Турниры' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ],
  trainer: [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/cash', icon: Wallet, label: 'Касса' },
    { path: '/team', icon: Users, label: 'Команда' },
    { path: '/tournaments', icon: Trophy, label: 'Турниры' },
    { path: '/author', icon: Sparkles, label: 'Автор' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ],
  student: [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/team', icon: Users, label: 'Команда' },
    { path: '/tournaments', icon: Trophy, label: 'Турниры' },
    { path: '/author', icon: Sparkles, label: 'Автор' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ],
}

export default function BottomNav() {
  const { auth } = useAuth()
  const { dark } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  if (!auth) return null

  const items = navConfigs[auth.role] || navConfigs.student

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-50
        backdrop-blur-2xl border-t
        ${dark
          ? 'bg-dark-900/70 border-white/[0.06]'
          : 'bg-white/60 border-white/40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]'
        }
        pb-[env(safe-area-inset-bottom)]
      `}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {items.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path))
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`
                flex flex-col items-center gap-0.5 px-2 py-1 press-scale relative
                transition-all duration-200
                ${active
                  ? 'text-purple-500'
                  : dark ? 'text-white/30' : 'text-black/30'
                }
              `}
            >
              {active && (
                <div className={`absolute -top-1 w-6 h-0.5 rounded-full ${
                  dark ? 'bg-purple-400' : 'bg-purple-500'
                }`} />
              )}
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] leading-tight ${active ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
