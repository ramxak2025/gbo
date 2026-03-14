import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Plus, MapPin, Users, TrendingUp, Crown, Check, Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'
import { SPORT_TYPES, getSportLabel } from '../utils/sports'
import { api } from '../utils/api'

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

export default function Clubs() {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, addClub } = useData()
  const { dark } = useTheme()

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', sportTypes: [], phone: '', vk: '', address: '', logo: null })

  const clubs = data.clubs || []

  const toggleSport = (id) => {
    setForm(f => ({
      ...f,
      sportTypes: f.sportTypes.includes(id)
        ? f.sportTypes.filter(s => s !== id)
        : [...f.sportTypes, id]
    }))
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const id = await addClub({
      name: form.name.trim(),
      city: form.city.trim(),
      sportTypes: form.sportTypes,
      phone: form.phone.trim(),
      vk: form.vk.trim(),
      address: form.address.trim(),
      logo: form.logo,
    })
    setForm({ name: '', city: '', sportTypes: [], phone: '', vk: '', address: '', logo: null })
    setShowAdd(false)
    if (id) navigate(`/club/${id}`)
  }

  const getClubStats = (club) => {
    const clubTrainers = data.users.filter(u => u.role === 'trainer' && u.clubId === club.id)
    const trainerIds = new Set(clubTrainers.map(t => t.id))
    const students = data.students.filter(s => trainerIds.has(s.trainerId))
    const active = students.filter(s => !isExpired(s.subscriptionExpiresAt)).length
    return { trainers: clubTrainers.length, students: students.length, active }
  }

  const cities = [...new Set(data.users.filter(u => u.city).map(u => u.city))].sort()

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none
    ${dark
      ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.1]'
      : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] shadow-sm'
    }
  `

  return (
    <Layout>
      <PageHeader title="Клубы">
        {auth.role === 'superadmin' && (
          <button onClick={() => setShowAdd(true)} className="press-scale p-2">
            <Plus size={20} />
          </button>
        )}
      </PageHeader>

      <div className="px-4 space-y-3 slide-in">
        {clubs.map(club => {
          const stats = getClubStats(club)
          const headTrainer = data.users.find(u => u.role === 'trainer' && u.clubId === club.id && u.isHeadTrainer)
          return (
            <GlassCard key={club.id} onClick={() => navigate(`/club/${club.id}`)} className="cursor-pointer">
              <div className="flex items-center gap-3">
                {club.logo ? (
                  <img src={club.logo} alt={club.name} className="w-12 h-12 rounded-[16px] object-cover shrink-0" />
                ) : (
                  <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 ${
                    dark ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' : 'bg-gradient-to-br from-blue-100 to-purple-100'
                  }`}>
                    <Shield size={22} className={dark ? 'text-blue-400' : 'text-blue-600'} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{club.name}</div>
                  <div className={`text-xs flex items-center gap-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                    {club.city && (
                      <span className="flex items-center gap-0.5"><MapPin size={10} />{club.city}</span>
                    )}
                    {headTrainer && (
                      <span className="flex items-center gap-0.5"><Crown size={10} className="text-yellow-400" />{headTrainer.name.split(' ')[0]}</span>
                    )}
                  </div>
                  {club.sportTypes?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {club.sportTypes.map(st => (
                        <span key={st} className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          dark ? 'bg-accent/15 text-accent-light' : 'bg-red-50 text-red-600'
                        }`}>{getSportLabel(st)}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0 text-right">
                  <div className={`flex items-center gap-1 text-xs ${dark ? 'text-white/50' : 'text-gray-600'}`}>
                    <Users size={12} /> {stats.trainers}
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${dark ? 'text-white/50' : 'text-gray-600'}`}>
                    <TrendingUp size={12} className="text-green-500" /> {stats.active}/{stats.students}
                  </div>
                </div>
              </div>
            </GlassCard>
          )
        })}
        {clubs.length === 0 && (
          <p className={`text-center py-12 text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>
            Нет клубов. Нажмите + чтобы создать.
          </p>
        )}
      </div>

      {/* Add Club Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Новый клуб">
        <form onSubmit={handleAdd} className="space-y-3">
          {/* Logo upload */}
          <div className="flex justify-center">
            <label className="cursor-pointer press-scale">
              {form.logo ? (
                <img src={form.logo} alt="Логотип" className="w-20 h-20 rounded-[20px] object-cover" />
              ) : (
                <div className={`w-20 h-20 rounded-[20px] flex flex-col items-center justify-center gap-1 ${dark ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-gray-50 border border-gray-200'}`}>
                  <Camera size={20} className={dark ? 'text-white/25' : 'text-gray-400'} />
                  <span className={`text-[9px] font-semibold ${dark ? 'text-white/25' : 'text-gray-400'}`}>Логотип</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try { const url = await api.uploadFile(file); setForm(f => ({ ...f, logo: url })) } catch { alert('Ошибка загрузки') }
              }} />
            </label>
          </div>
          <input
            type="text"
            placeholder="Название клуба *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={inputCls}
            required
          />
          <div className="relative">
            <input
              type="text"
              placeholder="Город"
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              className={inputCls}
              list="club-city-list"
            />
            <datalist id="club-city-list">
              {cities.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
              Виды спорта
            </div>
            <div className="flex flex-wrap gap-2">
              {SPORT_TYPES.map(s => {
                const selected = form.sportTypes.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSport(s.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold press-scale transition-all ${
                      selected
                        ? 'bg-accent text-white'
                        : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'
                    }`}
                  >
                    {selected && <Check size={12} />}
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>
          <input
            type="text"
            placeholder="Адрес клуба"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            className={inputCls}
          />
          <input
            type="tel"
            placeholder="Телефон клуба"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className={inputCls}
          />
          <input
            type="url"
            placeholder="Страница ВКонтакте (ссылка)"
            value={form.vk}
            onChange={e => setForm(f => ({ ...f, vk: e.target.value }))}
            className={inputCls}
          />
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">
            Создать клуб
          </button>
        </form>
      </Modal>
    </Layout>
  )
}
