import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Award, Trophy } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import PhoneInput, { cleanPhone } from '../components/PhoneInput'
import { SPORT_TYPES } from '../utils/sports'

const USER_ROLES = [
  { id: 'trainer', label: 'Тренер' },
  { id: 'club_owner', label: 'Владелец клуба' },
  { id: 'club_admin', label: 'Администратор' },
  { id: 'organizer', label: 'Организатор' },
]

export default function AddTrainer() {
  const navigate = useNavigate()
  const { data, addTrainer, assignTrainerToClub } = useData()
  const { dark } = useTheme()

  const clubs = data.clubs || []

  const [form, setForm] = useState({
    name: '',
    password: 'trainer123',
    phone: '',
    clubId: '',
    city: '',
    sportTypes: [],
    userRole: 'trainer',
    rank: '',
    achievements: '',
  })

  const toggleSport = (id) => {
    setForm(f => ({
      ...f,
      sportTypes: f.sportTypes.includes(id)
        ? f.sportTypes.filter(s => s !== id)
        : [...f.sportTypes, id]
    }))
  }

  const needsSports = form.userRole === 'trainer'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const phoneDigits = cleanPhone(form.phone)
    if (!form.name.trim() || phoneDigits.length < 11) return
    if (needsSports && form.sportTypes.length === 0) return

    const selectedClub = clubs.find(c => c.id === form.clubId)

    const trainerId = await addTrainer({
      name: form.name.trim(),
      password: form.password,
      phone: phoneDigits,
      clubName: selectedClub?.name || '',
      city: form.city.trim(),
      sportType: form.sportTypes[0] || null,
      sportTypes: form.sportTypes,
      avatar: null,
      userRole: form.userRole,
      rank: form.rank.trim(),
      achievements: form.achievements.trim(),
    })

    // Auto-assign to selected club
    if (form.clubId && trainerId) {
      await assignTrainerToClub(form.clubId, trainerId)
    }

    navigate(-1)
  }

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none
    ${dark
      ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.1]'
      : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] shadow-sm'
    }
  `

  return (
    <Layout>
      <PageHeader title="Новый сотрудник" back />
      <div className="px-4 slide-in">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Role selection */}
          <div>
            <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
              Роль *
            </div>
            <div className="flex flex-wrap gap-2">
              {USER_ROLES.map(r => {
                const active = form.userRole === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, userRole: r.id }))}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold press-scale transition-all ${
                      active
                        ? r.id === 'club_owner' ? 'bg-yellow-500 text-white' : r.id === 'club_admin' ? 'bg-blue-500 text-white' : r.id === 'organizer' ? 'bg-green-500 text-white' : 'bg-accent text-white'
                        : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'
                    }`}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          <input
            type="text"
            placeholder="ФИО *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={inputCls}
            required
          />
          <select
            value={form.clubId}
            onChange={e => setForm(f => ({ ...f, clubId: e.target.value }))}
            className={inputCls}
          >
            <option value="">— Клуб —</option>
            {clubs.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="relative">
            <input
              type="text"
              placeholder="Город"
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              className={inputCls}
              list="city-list"
            />
            <datalist id="city-list">
              {[...new Set(data.users.filter(u => u.city).map(u => u.city))].map(c =>
                <option key={c} value={c} />
              )}
            </datalist>
          </div>

          {/* Multiple sports selection - only for trainers */}
          {needsSports && (
            <div>
              <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                Виды спорта *
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
              {form.sportTypes.length === 0 && (
                <p className="text-[10px] mt-1.5 text-red-400">Выберите хотя бы один вид спорта</p>
              )}
            </div>
          )}

          {/* Rank and achievements - for trainers */}
          {needsSports && (
            <>
              <div className="relative">
                <Award size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Звание / разряд (напр. КМС, МС)"
                  value={form.rank}
                  onChange={e => setForm(f => ({ ...f, rank: e.target.value }))}
                  className={`${inputCls} pl-10`}
                />
              </div>
              <div className="relative">
                <Trophy size={16} className={`absolute left-3.5 top-3.5 ${dark ? 'text-white/20' : 'text-gray-400'}`} />
                <textarea
                  placeholder="Регалии и достижения (напр. Чемпион мира по грэпплингу)"
                  value={form.achievements}
                  onChange={e => setForm(f => ({ ...f, achievements: e.target.value }))}
                  className={`${inputCls} pl-10 min-h-[80px] resize-none`}
                  rows={2}
                />
              </div>
            </>
          )}

          <PhoneInput
            value={form.phone}
            onChange={v => setForm(f => ({ ...f, phone: v }))}
            className={inputCls}
            required
          />
          <input
            type="text"
            placeholder="Пароль"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className={inputCls}
          />
          <button
            type="submit"
            disabled={needsSports && form.sportTypes.length === 0}
            className={`w-full py-3.5 rounded-[16px] font-bold press-scale mt-4 ${
              (!needsSports || form.sportTypes.length > 0) ? 'bg-accent text-white' : 'bg-accent/30 text-white/50 cursor-not-allowed'
            }`}
          >
            {form.userRole === 'club_owner' ? 'Добавить владельца' : form.userRole === 'club_admin' ? 'Добавить администратора' : form.userRole === 'organizer' ? 'Добавить организатора' : 'Добавить тренера'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
