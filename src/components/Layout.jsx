import { useTheme } from '../context/ThemeContext'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  const { dark } = useTheme()

  return (
    <div className={`h-full flex flex-col relative overflow-hidden ${dark ? 'bg-dark-900 text-white' : 'bg-[#f5f5f7] text-gray-900'}`}>
      {/* Atmospheric gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-[30%] -left-[20%] w-[60%] h-[60%] rounded-full blur-[120px] ${
          dark ? 'bg-purple-900/20' : 'bg-purple-200/30'
        }`} />
        <div className={`absolute -bottom-[20%] -right-[15%] w-[50%] h-[50%] rounded-full blur-[100px] ${
          dark ? 'bg-red-900/15' : 'bg-red-100/20'
        }`} />
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide pb-24 pt-[env(safe-area-inset-top)]">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
