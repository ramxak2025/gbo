import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Trash2, Edit3, Flame, X, Users, Camera, Scale, ScrollText, Medal, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../utils/api'
import { getSportLabel, SPORT_TYPES } from '../utils/sports'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'
import Avatar from '../components/Avatar'
import DateButton from '../components/DateButton'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function CollapsibleSection({ title, icon: Icon, dark, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-[20px] overflow-hidden ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/60 shadow-sm'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 press-scale"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-accent" />
          <span className="text-sm font-bold">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className={dark ? 'text-white/30' : 'text-gray-400'} /> : <ChevronDown size={16} className={dark ? 'text-white/30' : 'text-gray-400'} />}
      </button>
      {open && (
        <div className={`px-4 pb-4 ${dark ? 'border-t border-white/[0.06]' : 'border-t border-black/[0.04]'}`}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function TournamentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, deleteTournament, updateTournament, update } = useData()
  const { dark } = useTheme()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [wcInput, setWcInput] = useState('')

  const tournament = data.tournaments.find(t => t.id === id)
  if (!tournament) {
    return (
      <Layout>
        <PageHeader title="Турнир" back />
        <div className="px-4 py-12 text-center">
          <p className={dark ? 'text-white/40' : 'text-gray-500'}>Турнир не найден</p>
        </div>
      </Layout>
    )
  }

  const regs = (data.tournamentRegistrations || []).filter(r => r.tournamentId === id)
  const isRegistered = auth.role === 'student' && regs.some(r => r.studentId === auth.studentId)
  const isPast = new Date(tournament.date) < new Date()
  const canEdit = auth.role === 'superadmin' || (auth.role === 'organizer' && tournament.createdBy === auth.userId)
  const sportLabel = tournament.sportType ? getSportLabel(tournament.sportType) : null
  const wc = tournament.weightCategories || []

  const trainerStudentIds = auth.role === 'trainer'
    ? data.students.filter(s => s.trainerId === auth.userId).map(s => s.id)
    : []
  const trainerRegs = auth.role === 'trainer'
    ? regs.filter(r => trainerStudentIds.includes(r.studentId))
    : []

  const handleDelete = () => {
    if (confirm('Удалить турнир?')) {
      deleteTournament(tournament.id)
      navigate(-1)
    }
  }

  const startEdit = () => {
    setForm({
      ...tournament,
      weightCategories: tournament.weightCategories || [],
    })
    setWcInput('')
    setEditing(true)
  }

  const addEditWeightCategory = () => {
    const val = wcInput.trim()
    if (!val || form.weightCategories.includes(val)) return
    setForm(f => ({ ...f, weightCategories: [...f.weightCategories, val] }))
    setWcInput('')
  }

  const removeEditWeightCategory = (cat) => {
    setForm(f => ({ ...f, weightCategories: f.weightCategories.filter(c => c !== cat) }))
  }

  const saveEdit = (e) => {
    e.preventDefault()
    updateTournament(tournament.id, {
      title: form.title,
      date: form.date,
      location: form.location,
      description: form.description,
      coverImage: form.coverImage,
      regulations: form.regulations || '',
      weightCategories: form.weightCategories || [],
      prizes: form.prizes || '',
      rules: form.rules || '',
      sportType: form.sportType || null,
      matsCount: form.matsCount || 1,
    })
    setEditing(false)
  }

  const handleEditImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await api.uploadFile(file)
      setForm(f => ({ ...f, coverImage: url }))
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  const toggleRegistration = () => {
    update(d => {
      const regs = d.tournamentRegistrations || []
      const exists = regs.find(r => r.tournamentId === id && r.studentId === auth.studentId)
      return {
        ...d,
        tournamentRegistrations: exists
          ? regs.filter(r => !(r.tournamentId === id && r.studentId === auth.studentId))
          : [...regs, { tournamentId: id, studentId: auth.studentId }],
      }
    })
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
      <PageHeader title="Турнир" back>
        {canEdit && (
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
        {/* Cover */}
        {tournament.coverImage ? (
          <img src={tournament.coverImage} alt={tournament.title} className="w-full h-52 object-cover rounded-[24px]" />
        ) : (
          <div className={`w-full h-44 rounded-[24px] flex items-center justify-center ${dark ? 'bg-white/[0.05]' : 'bg-white/50'}`}>
            <span className="text-5xl font-black italic text-accent opacity-20">FIGHT</span>
          </div>
        )}

        {/* Title + sport badge */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {sportLabel && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                dark ? 'bg-accent/20 text-accent-light' : 'bg-red-50 text-red-600'
              }`}>{sportLabel}</span>
            )}
            {isPast && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                dark ? 'bg-white/[0.08] text-white/40' : 'bg-gray-100 text-gray-400'
              }`}>Прошёл</span>
            )}
          </div>
          <h1 className="text-2xl font-black italic">{tournament.title}</h1>
        </div>

        {/* Date + Location */}
        <div className="flex flex-col gap-2">
          <GlassCard className="flex items-center gap-3">
            <Calendar size={18} className="text-accent shrink-0" />
            <span className="text-sm">{formatDate(tournament.date)}</span>
          </GlassCard>
          {tournament.location && (
            <GlassCard className="flex items-center gap-3">
              <MapPin size={18} className="text-accent shrink-0" />
              <span className="text-sm">{tournament.location}</span>
            </GlassCard>
          )}
        </div>

        {/* Mats count */}
        {tournament.matsCount > 1 && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-[16px] ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/60'}`}>
            <span className={`text-xs font-bold ${dark ? 'text-white/50' : 'text-gray-600'}`}>Ковров: {tournament.matsCount}</span>
          </div>
        )}

        {/* Student registration button */}
        {auth.role === 'student' && !isPast && (
          <button
            onClick={toggleRegistration}
            className={`w-full py-4 rounded-[20px] font-bold text-base press-scale flex items-center justify-center gap-2 transition-all ${
              isRegistered
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/25'
            }`}
          >
            {isRegistered ? <><X size={20} /> Отменить участие</> : <><Flame size={20} /> Хочу зажать!</>}
          </button>
        )}

        {/* Trainer sees registered students */}
        {auth.role === 'trainer' && trainerRegs.length > 0 && (
          <div>
            <h3 className={`text-xs uppercase font-bold mb-2 flex items-center gap-1 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
              <Flame size={14} className="text-orange-400" />
              Хотят участвовать ({trainerRegs.length})
            </h3>
            <div className="space-y-2">
              {trainerRegs.map(r => {
                const s = data.students.find(st => st.id === r.studentId)
                if (!s) return null
                return (
                  <GlassCard key={r.studentId} className="flex items-center gap-3">
                    <Avatar name={s.name} src={s.avatar} size={36} />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{s.name}</div>
                      <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>{s.belt || '—'} — {s.weight ? s.weight + ' кг' : ''}</div>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        )}

        {/* Total registrations count */}
        {regs.length > 0 && (
          <GlassCard className="flex items-center gap-2">
            <Users size={16} className="text-orange-400" />
            <span className="text-sm font-semibold">{regs.length} чел. хотят участвовать</span>
          </GlassCard>
        )}

        {/* Description */}
        {tournament.description && (
          <GlassCard>
            <h3 className={`text-xs uppercase font-bold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Описание</h3>
            <p className={`text-sm leading-relaxed whitespace-pre-line ${dark ? 'text-white/70' : 'text-gray-600'}`}>
              {tournament.description}
            </p>
          </GlassCard>
        )}

        {/* Weight categories */}
        {wc.length > 0 && (
          <CollapsibleSection title={`Весовые категории (${wc.length})`} icon={Scale} dark={dark}>
            <div className="flex flex-wrap gap-1.5 pt-3">
              {wc.map((w, i) => (
                <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  dark ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-100 text-purple-600'
                }`}>{w}</span>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Regulations */}
        {tournament.regulations && (
          <CollapsibleSection title="Положение" icon={ScrollText} dark={dark}>
            <p className={`text-sm leading-relaxed whitespace-pre-line pt-3 ${dark ? 'text-white/60' : 'text-gray-600'}`}>
              {tournament.regulations}
            </p>
          </CollapsibleSection>
        )}

        {/* Rules */}
        {tournament.rules && (
          <CollapsibleSection title="Правила" icon={ScrollText} dark={dark}>
            <p className={`text-sm leading-relaxed whitespace-pre-line pt-3 ${dark ? 'text-white/60' : 'text-gray-600'}`}>
              {tournament.rules}
            </p>
          </CollapsibleSection>
        )}

        {/* Prizes */}
        {tournament.prizes && (
          <CollapsibleSection title="Призы" icon={Medal} dark={dark}>
            <p className={`text-sm leading-relaxed whitespace-pre-line pt-3 ${dark ? 'text-white/60' : 'text-gray-600'}`}>
              {tournament.prizes}
            </p>
          </CollapsibleSection>
        )}

        <div className="h-4" />
      </div>

      {/* Edit modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Редактировать турнир">
        {form && (
          <form onSubmit={saveEdit} className="space-y-3">
            <label className={`block w-full h-32 rounded-[16px] cursor-pointer press-scale flex items-center justify-center overflow-hidden ${dark ? 'bg-white/[0.05] border border-dashed border-white/[0.15]' : 'bg-white/50 border border-dashed border-black/[0.1]'}`}>
              {form.coverImage
                ? <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                : <div className="flex flex-col items-center gap-1"><Camera size={24} className={dark ? 'text-white/30' : 'text-gray-500'} /><span className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>Обложка</span></div>
              }
              <input type="file" accept="image/*" className="hidden" onChange={handleEditImage} />
            </label>
            <input type="text" placeholder="Название" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
            <DateButton label="Дата" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            <input type="text" placeholder="Место" value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls} />

            {/* Sport type */}
            <div>
              <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Вид спорта</div>
              <div className="flex flex-wrap gap-2">
                {SPORT_TYPES.map(s => (
                  <button key={s.id} type="button" onClick={() => setForm(f => ({ ...f, sportType: f.sportType === s.id ? '' : s.id }))}
                    className={`px-3 py-2 rounded-2xl text-xs font-bold press-scale ${
                      form.sportType === s.id ? 'bg-accent text-white' : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'
                    }`}
                  >{s.label}</button>
                ))}
              </div>
            </div>

            <textarea placeholder="Описание" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} min-h-[80px] resize-none`} rows={3} />

            {/* Weight categories */}
            <div>
              <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Весовые категории</div>
              {form.weightCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.weightCategories.map(wc => (
                    <span key={wc} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${dark ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                      {wc}
                      <button type="button" onClick={() => removeEditWeightCategory(wc)} className="press-scale"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" placeholder="напр. до 60 кг" value={wcInput} onChange={e => setWcInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEditWeightCategory() } }}
                  className={`flex-1 ${inputCls}`} />
                {wcInput.trim() && (
                  <button type="button" onClick={addEditWeightCategory} className="px-3 rounded-[16px] bg-accent text-white font-bold press-scale shrink-0"><Plus size={16} /></button>
                )}
              </div>
            </div>

            <textarea placeholder="Положение турнира" value={form.regulations || ''} onChange={e => setForm(f => ({ ...f, regulations: e.target.value }))} className={`${inputCls} min-h-[80px] resize-none`} rows={3} />
            <textarea placeholder="Правила" value={form.rules || ''} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} className={`${inputCls} min-h-[80px] resize-none`} rows={3} />
            <textarea placeholder="Призы" value={form.prizes || ''} onChange={e => setForm(f => ({ ...f, prizes: e.target.value }))} className={`${inputCls} min-h-[60px] resize-none`} rows={2} />

            <div>
              <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Количество ковров</div>
              <input type="number" min="1" max="20" value={form.matsCount || 1} onChange={e => setForm(f => ({ ...f, matsCount: parseInt(e.target.value) || 1 }))} className={inputCls} />
            </div>

            <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">Сохранить</button>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
