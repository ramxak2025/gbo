import { useParams, useNavigate } from 'react-router-dom'
import { Phone, Users, Trash2, Edit3, Dumbbell, MapPin, Key, Shield, Award, ChevronRight, Crown, Activity, Zap } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import PhoneInput, { formatPhone, cleanPhone } from '../components/PhoneInput'
import { SPORT_TYPES, getSportLabel, getRankLabel } from '../utils/sports'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

export default function TrainerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, updateTrainer, deleteTrainer, assignTrainerToClub, removeTrainerFromClub } = useData()
  const { dark } = useTheme()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  const trainer = data.users.find(u => u.id === id)
  if (!trainer) {
    return (
      <Layout>
        <PageHeader title="Тренер" back />
        <div className="px-4 py-12 text-center">
          <p className={dark ? 'text-white/40' : 'text-gray-500'}>Тренер не найден</p>
        </div>
      </Layout>
    )
  }

  const students = data.students.filter(s => s.trainerId === id)
  const groups = data.groups.filter(g => g.trainerId === id)
  const clubs = data.clubs || []
  const club = trainer.clubId ? clubs.find(c => c.id === trainer.clubId) : null

  const stats = useMemo(() => {
    const active = students.filter(s => !isExpired(s.subscriptionExpiresAt)).length
    return { total: students.length, active, groups: groups.length }
  }, [students, groups])

  const startEdit = () => {
    setForm({ ...trainer, phone: formatPhone(trainer.phone || ''), selectedClubId: trainer.clubId || '' })
    setEditing(true)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    const selectedClub = clubs.find(c => c.id === form.selectedClubId)
    const changes = {
      name: form.name,
      phone: cleanPhone(form.phone),
      clubName: selectedClub?.name || '',
      city: form.city,
      sportType: form.sportType,
    }
    if (form.newPassword) changes.password = form.newPassword
    await updateTrainer(id, changes)

    const oldClubId = trainer.clubId || null
    const newClubId = form.selectedClubId || null
    if (oldClubId !== newClubId) {
      if (oldClubId) await removeTrainerFromClub(oldClubId, id)
      if (newClubId) await assignTrainerToClub(newClubId, id)
    }

    setEditing(false)
  }

  const handleDelete = () => {
    if (confirm(`Удалить тренера ${trainer.name} и все данные его клуба?`)) {
      deleteTrainer(id)
      navigate(-1)
    }
  }

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none transition-all duration-200
    ${dark
      ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.1]'
      : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] shadow-sm'
    }
  `

  return (
    <Layout>
      <PageHeader title="Тренер" back>
        {auth.role === 'superadmin' && (
          <>
            <button onClick={startEdit} className="press-scale p-2">
              <Edit3 size={18} />
            </button>
            <button onClick={handleDelete} className="press-scale p-2 text-red-400">
              <Trash2 size={18} />
            </button>
          </>
        )}
      </PageHeader>

      <div className="px-4 space-y-4 slide-in">

        {/* === HERO CARD === */}
        <div className={`rounded-[28px] relative overflow-hidden ${
          dark
            ? 'bg-gradient-to-br from-blue-600/15 via-white/[0.03] to-purple-500/15 border border-white/[0.08]'
            : 'bg-gradient-to-br from-blue-50 via-white/90 to-purple-50 border border-white/70 shadow-[0_8px_40px_rgba(0,0,0,0.06)]'
        }`}>
          <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl ${dark ? 'bg-blue-500/10' : 'bg-blue-200/30'}`} />
          <div className={`absolute -bottom-10 -left-10 w-28 h-28 rounded-full blur-2xl ${dark ? 'bg-purple-500/8' : 'bg-purple-100/40'}`} />

          <div className="relative p-6 pb-5">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className={`p-[3px] rounded-full ${
                  trainer.isHeadTrainer
                    ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500'
                    : 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500'
                }`}>
                  <div className={`rounded-full p-[2px] ${dark ? 'bg-[#0a0a12]' : 'bg-white'}`}>
                    <Avatar name={trainer.name} src={trainer.avatar} size={76} />
                  </div>
                </div>
                {trainer.isHeadTrainer && (
                  <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 bounce-in">
                    <Crown size={12} className="text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-black truncate">{trainer.name}</h2>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    dark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'
                  }`}>
                    Тренер
                  </span>
                  {trainer.isHeadTrainer && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 ${
                      dark ? 'bg-yellow-500/15 text-yellow-300' : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                    }`}>
                      <Crown size={9} /> Главный
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-3 mt-2 ${dark ? 'text-white/35' : 'text-gray-400'}`}>
                  {(club?.name || trainer.clubName) && (
                    <span className="text-[11px] font-medium flex items-center gap-1">
                      <Shield size={10} />
                      {club?.name || trainer.clubName}
                    </span>
                  )}
                  {trainer.city && (
                    <span className="text-[11px] font-medium flex items-center gap-1">
                      <MapPin size={10} />
                      {trainer.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="px-6 pb-5 pt-1">
            <div className={`grid grid-cols-3 gap-2 rounded-[18px] p-3 ${
              dark ? 'bg-black/30 backdrop-blur-xl' : 'bg-white/50 backdrop-blur-xl'
            }`}>
              {[
                { icon: Users, value: stats.total, label: 'Учеников', color: 'text-blue-500', bg: dark ? 'bg-blue-500/15' : 'bg-blue-50' },
                { icon: Zap, value: stats.active, label: 'Активных', color: 'text-green-500', bg: dark ? 'bg-green-500/15' : 'bg-green-50' },
                { icon: Dumbbell, value: stats.groups, label: 'Групп', color: 'text-purple-500', bg: dark ? 'bg-purple-500/15' : 'bg-purple-50' },
              ].map(({ icon: Icon, value, label, color, bg }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                    <Icon size={15} className={color} />
                  </div>
                  <div className="text-lg font-black leading-none">{value}</div>
                  <div className={`text-[9px] uppercase font-semibold tracking-wide ${dark ? 'text-white/25' : 'text-gray-400'}`}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === INFO CARDS === */}
        <div className={`rounded-[20px] overflow-hidden backdrop-blur-xl ${
          dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/70 border border-white/60 shadow-sm'
        }`}>
          {[
            trainer.phone && { icon: Phone, label: 'Телефон', value: trainer.phone, color: 'text-accent' },
            trainer.sportType && { icon: Dumbbell, label: 'Вид спорта', value: getSportLabel(trainer.sportType), color: 'text-purple-500' },
            trainer.city && { icon: MapPin, label: 'Город', value: trainer.city, color: 'text-blue-500' },
          ].filter(Boolean).map(({ icon: Icon, label, value, color }, i) => (
            <div key={label} className={`flex items-center justify-between px-4 py-3.5 ${
              i > 0 ? dark ? 'border-t border-white/[0.05]' : 'border-t border-black/[0.04]' : ''
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  dark ? 'bg-white/[0.06]' : 'bg-black/[0.03]'
                }`}>
                  <Icon size={15} className={color} />
                </div>
                <span className={`text-sm ${dark ? 'text-white/50' : 'text-gray-500'}`}>{label}</span>
              </div>
              <span className="font-semibold text-sm">{value}</span>
            </div>
          ))}
        </div>

        {auth.role === 'superadmin' && trainer.plainPassword && (
          <div className={`rounded-[18px] p-4 flex items-center gap-3 ${
            dark ? 'bg-yellow-500/[0.06] border border-yellow-500/15' : 'bg-yellow-50/70 border border-yellow-200/50'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? 'bg-yellow-500/15' : 'bg-yellow-100'}`}>
              <Key size={15} className="text-yellow-500" />
            </div>
            <span className={`text-sm ${dark ? 'text-white/40' : 'text-gray-500'}`}>Пароль</span>
            <span className="font-mono font-bold text-sm ml-auto">{trainer.plainPassword}</span>
          </div>
        )}

        {/* === GROUPS === */}
        {groups.length > 0 && (
          <div>
            <h3 className={`text-[11px] uppercase font-bold tracking-wider mb-2.5 px-1 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
              Группы ({groups.length})
            </h3>
            <div className="space-y-2">
              {groups.map(g => {
                const gStudents = students.filter(s => s.groupId === g.id)
                return (
                  <div key={g.id} className={`rounded-[18px] p-3.5 ${
                    dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/70 border border-white/60 shadow-sm'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center bg-gradient-to-br ${
                        dark ? 'from-purple-500/20 to-indigo-500/20' : 'from-purple-100 to-indigo-100'
                      }`}>
                        <Dumbbell size={17} className={dark ? 'text-purple-400' : 'text-purple-600'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm truncate">{g.name}</div>
                        <div className={`flex items-center gap-2 text-[11px] mt-0.5 ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                          {g.schedule && <span>{g.schedule}</span>}
                          <span className="flex items-center gap-0.5">
                            <Users size={9} /> {gStudents.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* === STUDENTS === */}
        {students.length > 0 && (
          <div>
            <h3 className={`text-[11px] uppercase font-bold tracking-wider mb-2.5 px-1 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
              Спортсмены ({students.length})
            </h3>
            <div className="space-y-2">
              {students.map(s => {
                const expired = isExpired(s.subscriptionExpiresAt)
                return (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/student/${s.id}`)}
                    className={`rounded-[18px] p-3.5 press-scale cursor-pointer transition-all ${
                      dark ? 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07]' : 'bg-white/70 border border-white/60 shadow-sm hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar name={s.name} src={s.avatar} size={40} />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                          dark ? 'border-[#0a0a12]' : 'border-white'
                        } ${expired ? 'bg-red-400' : 'bg-green-400'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm truncate">{s.name}</div>
                        <div className={`text-[11px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>{s.belt || '—'}</div>
                      </div>
                      <ChevronRight size={14} className={dark ? 'text-white/15' : 'text-gray-300'} />
                    </div>
                    {auth.role === 'superadmin' && (
                      <div className={`mt-2 pt-2 text-[10px] flex items-center gap-2 ${dark ? 'border-t border-white/[0.05] text-white/20' : 'border-t border-black/[0.04] text-gray-400'}`}>
                        <span>Тел: {s.phone}</span>
                        <span>·</span>
                        <span>Пароль: {s.plainPassword || '—'}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Редактировать">
        {form && (
          <form onSubmit={saveEdit} className="space-y-3">
            <input type="text" placeholder="ФИО" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            <select value={form.selectedClubId} onChange={e => setForm(f => ({ ...f, selectedClubId: e.target.value }))} className={inputCls}>
              <option value="">— Клуб —</option>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="relative">
              <input type="text" placeholder="Город" value={form.city || ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} list="city-edit-list" />
              <datalist id="city-edit-list">
                {[...new Set(data.users.filter(u => u.city).map(u => u.city))].map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <select value={form.sportType || ''} onChange={e => setForm(f => ({ ...f, sportType: e.target.value }))} className={inputCls}>
              <option value="">— Вид спорта —</option>
              {SPORT_TYPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <PhoneInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} className={inputCls} />
            <input type="text" placeholder="Новый пароль (оставьте пустым)" value={form.newPassword || ''} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} className={inputCls} />
            <button type="submit" className="w-full py-3.5 rounded-[16px] bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold press-scale shadow-lg shadow-indigo-500/20">
              Сохранить
            </button>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
