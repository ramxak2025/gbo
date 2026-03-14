import { ShoppingBag, Package, Shirt } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'

export default function Catalog() {
  const { dark } = useTheme()

  return (
    <Layout>
      <PageHeader title="Каталог" logo />
      <div className="px-4 slide-in">
        <div className="text-center py-16">
          <div className={`w-24 h-24 mx-auto mb-6 rounded-[28px] flex items-center justify-center ${
            dark ? 'bg-gradient-to-br from-purple-500/15 to-pink-500/15' : 'bg-gradient-to-br from-purple-50 to-pink-50'
          }`}>
            <ShoppingBag size={40} className={dark ? 'text-purple-400/50' : 'text-purple-400'} />
          </div>
          <h2 className={`text-xl font-black mb-2 ${dark ? 'text-white/80' : 'text-gray-800'}`}>Магазин</h2>
          <p className={`text-sm mb-8 max-w-[280px] mx-auto leading-relaxed ${dark ? 'text-white/35' : 'text-gray-500'}`}>
            Здесь скоро можно будет приобрести клубный мерч, экипировку и многое другое
          </p>
          <div className="space-y-3 max-w-[260px] mx-auto">
            {[
              { icon: Shirt, label: 'Клубная форма и мерч' },
              { icon: Package, label: 'Экипировка для тренировок' },
              { icon: ShoppingBag, label: 'Аксессуары и инвентарь' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${dark ? 'bg-white/[0.03]' : 'bg-white/50'}`}>
                <Icon size={18} className={dark ? 'text-purple-400/40' : 'text-purple-400'} />
                <span className={`text-sm ${dark ? 'text-white/40' : 'text-gray-500'}`}>{label}</span>
              </div>
            ))}
          </div>
          <div className={`mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold ${
            dark ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-600 border border-purple-100'
          }`}>
            В разработке
          </div>
        </div>
      </div>
    </Layout>
  )
}
