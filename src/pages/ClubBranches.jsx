import { useState } from 'react'
import { Building2, Plus, MapPin, Trash2, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'

export default function ClubBranches() {
  const { auth } = useAuth()
  const { data, addBranch, deleteBranch } = useData()
  const { dark } = useTheme()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', address: '' })

  const user = data.users.find(u => u.id === auth.userId) || auth.user
  const club = user?.clubId ? (data.clubs || []).find(c => c.id === user.clubId) : null
  const branches = club ? (data.branches || []).filter(b => b.clubId === club.id) : []

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !club) return
    addBranch({ clubId: club.id, name: form.name.trim(), city: form.city.trim(), address: form.address.trim() })
    setForm({ name: '', city: '', address: '' })
    setShowAdd(false)
  }

  const handleDelete = (id) => {
    if (confirm('Удалить филиал?')) deleteBranch(id)
  }

  const inputCls = `w-full px-4 py-3 rounded-[16px] text-base outline-none ${dark
    ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50'
    : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 shadow-sm'
  }`

  return (
    <Layout>
      <PageHeader title="Филиалы">
        <button onClick={() => setShowAdd(true)} className="press-scale p-2">
          <Plus size={20} />
        </button>
      </PageHeader>

      <div className="px-4 space-y-3 slide-in">
        {!club && (
          <GlassCard className="text-center py-6">
            <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-500'}`}>Вы не привязаны к клубу</p>
          </GlassCard>
        )}

        {branches.length === 0 && club && (
          <div className="text-center py-8">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center ${dark ? 'bg-cyan-500/10' : 'bg-cyan-50'}`}>
              <Building2 size={28} className={dark ? 'text-cyan-400/40' : 'text-cyan-400'} />
            </div>
            <p className={`text-sm font-semibold mb-1 ${dark ? 'text-white/60' : 'text-gray-700'}`}>Нет филиалов</p>
            <p className={`text-xs ${dark ? 'text-white/25' : 'text-gray-400'}`}>Добавьте первый филиал клуба</p>
          </div>
        )}

        {branches.map(b => (
          <GlassCard key={b.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${dark ? 'bg-cyan-500/15' : 'bg-cyan-50'}`}>
                  <Building2 size={18} className="text-cyan-500" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{b.name}</div>
                  <div className={`text-xs flex items-center gap-1 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                    {b.city && <><MapPin size={10} /> {b.city}</>}
                    {b.city && b.address && <span>·</span>}
                    {b.address && <span className="truncate">{b.address}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(b.id)} className="press-scale p-1.5 shrink-0">
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Новый филиал">
        <form onSubmit={handleAdd} className="space-y-3">
          <input type="text" placeholder="Название филиала *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} required />
          <input type="text" placeholder="Город" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
          <input type="text" placeholder="Адрес" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale flex items-center justify-center gap-2">
            <Send size={16} /> Отправить на проверку
          </button>
        </form>
      </Modal>
    </Layout>
  )
}
