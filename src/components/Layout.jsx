import { useTheme } from '../context/ThemeContext'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  const { dark } = useTheme()

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-dark-900 text-white' : 'bg-[#f5f5f7] text-gray-900'}`}>
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-28 pt-[env(safe-area-inset-top)]">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
