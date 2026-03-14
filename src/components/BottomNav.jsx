import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Wallet, Users, Trophy, User, Sparkles, Film, Shield, Building2, ShoppingBag } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const navConfigs = {
  superadmin: [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/clubs', icon: Shield, label: 'Клубы' },
    { path: '/team', icon: Users, label: 'Люди' },
    { path: '/tournaments', icon: Trophy, label: 'Турниры' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ],
  trainer: [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/cash', icon: Wallet, label: 'Касса' },
    { path: '/team', icon: Users, label: 'Команда' },
    { path: '/tournaments', icon: Trophy, label: 'Турниры' },
    { path: '/materials', icon: Film, label: 'Материалы' },
  ],
  club_owner: [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/branches', icon: Building2, label: 'Филиалы' },
    { path: '/club-trainers', icon: Users, label: 'Тренеры' },
    { path: '/author', icon: Sparkles, label: 'Автор' },
    { path: '/catalog', icon: ShoppingBag, label: 'Каталог' },
  ],
  club_admin: [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/branches', icon: Building2, label: 'Филиалы' },
    { path: '/club-trainers', icon: Users, label: 'Тренеры' },
    { path: '/author', icon: Sparkles, label: 'Автор' },
    { path: '/catalog', icon: ShoppingBag, label: 'Каталог' },
  ],
  organizer: [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/tournaments', icon: Trophy, label: 'Турниры' },
    { path: '/author', icon: Sparkles, label: 'Автор' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ],
  student: [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/team', icon: Users, label: 'Команда' },
    { path: '/tournaments', icon: Trophy, label: 'Турниры' },
    { path: '/author', icon: Sparkles, label: 'Автор' },
    { path: '/materials', icon: Film, label: 'Материалы' },
  ],
  parent: [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/my-club', icon: Shield, label: 'Клуб' },
    { path: '/tournaments', icon: Trophy, label: 'Турниры' },
    { path: '/author', icon: Sparkles, label: 'Автор' },
    { path: '/materials', icon: Film, label: 'Материалы' },
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
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2">
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
        <div className="flex items-center justify-around h-[60px] px-2">
          {items.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path ||
              (path !== '/' && location.pathname.startsWith(path))
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`
                  flex-1 flex flex-col items-center gap-0.5 py-1.5 press-scale relative
                  transition-all duration-300 rounded-2xl
                  ${active
                    ? dark
                      ? 'text-white bg-white/[0.12]'
                      : 'text-gray-900 bg-black/[0.06]'
                    : dark ? 'text-gray-500' : 'text-gray-400'
                  }
                `}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
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
