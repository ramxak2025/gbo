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
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(env(safe-area-inset-bottom),8px)]">
      <nav
        className={`
          rounded-[22px] mx-auto max-w-lg
          backdrop-blur-3xl backdrop-saturate-[1.8]
          ${dark
            ? 'bg-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.1)]'
            : 'bg-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04),inset_0_0.5px_0_rgba(255,255,255,0.8)]'
          }
        `}
      >
        <div className="flex items-center justify-around h-[60px]">
          {items.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path ||
              (path !== '/' && location.pathname.startsWith(path))
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`
                  flex flex-col items-center gap-0.5 px-3 py-1.5 press-scale relative
                  transition-all duration-300 rounded-2xl
                  ${active
                    ? dark
                      ? 'text-white bg-white/[0.12]'
                      : 'text-gray-900 bg-black/[0.06]'
                    : dark ? 'text-white/35' : 'text-gray-500'
                  }
                `}
              >
                <Icon size={21} strokeWidth={active ? 2.4 : 1.7} />
                <span className={`text-[9px] leading-tight tracking-wide ${active ? 'font-bold' : 'font-medium'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
