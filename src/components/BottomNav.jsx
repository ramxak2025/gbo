import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Wallet, Users, Trophy, User } from 'lucide-react'
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
    { path: '/profile', icon: User, label: 'Профиль' },
  ],
  student: [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/team', icon: Users, label: 'Команда' },
    { path: '/tournaments', icon: Trophy, label: 'Турниры' },
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
        backdrop-blur-xl
        border-t
        ${dark
          ? 'bg-dark-900/80 border-white/10'
          : 'bg-white/80 border-black/[0.08]'
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
                flex flex-col items-center gap-0.5 px-2 py-1 press-scale
                transition-colors duration-200
                ${active
                  ? 'text-accent'
                  : dark ? 'text-white/50' : 'text-black/40'
                }
              `}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
