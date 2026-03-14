import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Plus, X, ChevronRight, ChevronLeft, Check, Scale, ScrollText, Users, Printer, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../utils/api'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import DateButton from '../components/DateButton'
import { SPORT_TYPES, getSportLabel, WEIGHT_CLASSES } from '../utils/sports'

const SKILL_LEVELS = [
  { id: 'beginner', label: 'Новички' },
  { id: 'intermediate', label: 'Опытные' },
  { id: 'professional', label: 'Профессионалы' },
]

const STEPS = [
  { id: 'info', label: 'Основное' },
  { id: 'rules', label: 'Положение' },
  { id: 'groups', label: 'Группы' },
  { id: 'review', label: 'Обзор' },
]

export default function AddTournament() {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { addTournament } = useData()
  const { dark } = useTheme()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    title: '',
    date: '',
    city: '',
    location: '',
    description: '',
    coverImage: null,
    regulations: '',
    prizes: '',
    rules: '',
    sportType: '',
    matsCount: 1,
    ageGroups: [],
  })

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await api.uploadFile(file)
      setForm(f => ({ ...f, coverImage: url }))
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  /* ── Age Group Management ── */
  const addAgeGroup = useCallback(() => {
    setForm(f => ({
      ...f,
      ageGroups: [...f.ageGroups, {
        id: Date.now().toString(),
        name: '',
        yearFrom: '',
        yearTo: '',
        skillLevel: '',
        weightCategories: [],
      }]
    }))
  }, [])

  const updateAgeGroup = useCallback((id, changes) => {
    setForm(f => ({
      ...f,
      ageGroups: f.ageGroups.map(g => g.id === id ? { ...g, ...changes } : g)
    }))
  }, [])

  const removeAgeGroup = useCallback((id) => {
    setForm(f => ({ ...f, ageGroups: f.ageGroups.filter(g => g.id !== id) }))
  }, [])

  const addWeightToGroup = useCallback((groupId, weight) => {
    setForm(f => ({
      ...f,
      ageGroups: f.ageGroups.map(g =>
        g.id === groupId && !g.weightCategories.includes(weight)
          ? { ...g, weightCategories: [...g.weightCategories, weight] }
          : g
      )
    }))
  }, [])

  const removeWeightFromGroup = useCallback((groupId, weight) => {
    setForm(f => ({
      ...f,
      ageGroups: f.ageGroups.map(g =>
        g.id === groupId ? { ...g, weightCategories: g.weightCategories.filter(w => w !== weight) } : g
      )
    }))
  }, [])

  const handleSubmit = () => {
    if (!form.title.trim() || !form.date) return
    // Build weightCategories from ageGroups for backward compat
    const allWeights = [...new Set(form.ageGroups.flatMap(g => g.weightCategories))]
    addTournament({
      title: form.title.trim(),
      date: form.date,
      city: form.city.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      coverImage: form.coverImage,
      regulations: form.regulations.trim(),
      weightCategories: allWeights,
      prizes: form.prizes.trim(),
      rules: form.rules.trim(),
      sportType: form.sportType || null,
      matsCount: form.matsCount,
      ageGroups: form.ageGroups.map(g => ({
        name: g.name,
        yearFrom: g.yearFrom,
        yearTo: g.yearTo,
        skillLevel: g.skillLevel,
        weightCategories: g.weightCategories,
      })),
      createdBy: auth.userId,
    })
    navigate(-1)
  }

  const canNext = step === 0 ? form.title.trim() && form.date : true
  const isLast = step === STEPS.length - 1

  const inputCls = `w-full px-4 py-3 rounded-2xl text-base outline-none transition-all ${
    dark
      ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.1]'
      : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] shadow-sm'
  }`

  return (
    <Layout>
      <PageHeader title="Новый турнир" back />
      <div className="px-4 slide-in">
        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-5">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-1.5 text-[11px] font-bold transition-all ${
                  i === step
                    ? 'text-accent'
                    : i < step
                      ? dark ? 'text-green-400' : 'text-green-600'
                      : dark ? 'text-white/20' : 'text-gray-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                  i === step
                    ? 'bg-accent text-white'
                    : i < step
                      ? 'bg-green-500 text-white'
                      : dark ? 'bg-white/[0.06] text-white/20' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded ${
                  i < step ? 'bg-green-500' : dark ? 'bg-white/[0.06]' : 'bg-gray-100'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* ═══ STEP 1: Basic Info ═══ */}
        {step === 0 && (
          <div className="space-y-3 animate-in">
            {/* Cover image */}
            <label className={`block w-full h-40 rounded-3xl cursor-pointer press-scale flex items-center justify-center overflow-hidden ${
              dark ? 'bg-white/[0.05] border border-dashed border-white/[0.15]' : 'bg-white/50 border border-dashed border-black/[0.1]'
            }`}>
              {form.coverImage ? (
                <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera size={28} className={dark ? 'text-white/30' : 'text-gray-500'} />
                  <span className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>Загрузить обложку</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>

            <input type="text" placeholder="Название турнира *" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
            <DateButton label="Дата турнира *" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            <input type="text" placeholder="Город *" value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
            <input type="text" placeholder="Адрес (улица, зал)" value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls} />

            {/* Sport type */}
            <div>
              <div className={`text-[10px] uppercase font-bold tracking-wide mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Вид спорта</div>
              <div className="flex flex-wrap gap-2">
                {SPORT_TYPES.map(s => (
                  <button key={s.id} type="button" onClick={() => setForm(f => ({ ...f, sportType: f.sportType === s.id ? '' : s.id }))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold press-scale transition-all ${
                      form.sportType === s.id ? 'bg-accent text-white' : dark ? 'bg-white/[0.06] text-white/50' : 'bg-white/70 text-gray-500 border border-gray-200/60'
                    }`}
                  >{s.label}</button>
                ))}
              </div>
            </div>

            <textarea placeholder="Описание турнира" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={`${inputCls} min-h-[80px] resize-none`} rows={3} />

            <div>
              <div className={`text-[10px] uppercase font-bold tracking-wide mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Количество ковров</div>
              <input type="number" min="1" max="20" value={form.matsCount}
                onChange={e => setForm(f => ({ ...f, matsCount: parseInt(e.target.value) || 1 }))} className={inputCls} />
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Regulations & Rules ═══ */}
        {step === 1 && (
          <div className="space-y-3 animate-in">
            <div className={`rounded-2xl p-4 ${dark ? 'bg-blue-500/5 border border-blue-500/15' : 'bg-blue-50/50 border border-blue-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                <ScrollText size={14} className="text-blue-500" />
                <span className={`text-[11px] font-bold ${dark ? 'text-blue-300' : 'text-blue-600'}`}>Положение и правила</span>
              </div>
              <p className={`text-[11px] ${dark ? 'text-white/35' : 'text-gray-500'}`}>
                Заполните положение турнира, правила и информацию о призах
              </p>
            </div>

            <div>
              <div className={`text-[10px] uppercase font-bold tracking-wide mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Положение турнира</div>
              <textarea value={form.regulations} onChange={e => setForm(f => ({ ...f, regulations: e.target.value }))}
                placeholder="Опишите положение турнира..."
                className={`${inputCls} min-h-[120px] resize-none`} rows={5} />
            </div>

            <div>
              <div className={`text-[10px] uppercase font-bold tracking-wide mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Правила</div>
              <textarea value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))}
                placeholder="Правила проведения..."
                className={`${inputCls} min-h-[100px] resize-none`} rows={4} />
            </div>

            <div>
              <div className={`text-[10px] uppercase font-bold tracking-wide mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Призы</div>
              <textarea value={form.prizes} onChange={e => setForm(f => ({ ...f, prizes: e.target.value }))}
                placeholder="Информация о призах..."
                className={`${inputCls} min-h-[80px] resize-none`} rows={3} />
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Age Groups & Weight Categories ═══ */}
        {step === 2 && (
          <div className="space-y-4 animate-in">
            <div className={`rounded-2xl p-4 ${dark ? 'bg-purple-500/5 border border-purple-500/15' : 'bg-purple-50/50 border border-purple-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Users size={14} className="text-purple-500" />
                <span className={`text-[11px] font-bold ${dark ? 'text-purple-300' : 'text-purple-600'}`}>Возрастные группы</span>
              </div>
              <p className={`text-[11px] ${dark ? 'text-white/35' : 'text-gray-500'}`}>
                Создайте возрастные группы по годам рождения и добавьте весовые категории в каждую
              </p>
            </div>

            {form.ageGroups.map((group, idx) => (
              <AgeGroupCard
                key={group.id}
                group={group}
                idx={idx}
                dark={dark}
                inputCls={inputCls}
                onUpdate={updateAgeGroup}
                onRemove={removeAgeGroup}
                onAddWeight={addWeightToGroup}
                onRemoveWeight={removeWeightFromGroup}
              />
            ))}

            <button onClick={addAgeGroup}
              className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed press-scale transition-all ${
                dark ? 'border-white/[0.08] text-white/40 hover:border-purple-500/30 hover:text-purple-400'
                  : 'border-gray-200 text-gray-400 hover:border-purple-400/40 hover:text-purple-600'
              }`}>
              <Plus size={18} />
              <span className="font-bold text-[13px]">Добавить возрастную группу</span>
            </button>
          </div>
        )}

        {/* ═══ STEP 4: Review ═══ */}
        {step === 3 && (
          <div className="space-y-4 animate-in">
            <div className={`rounded-2xl p-4 ${dark ? 'bg-green-500/5 border border-green-500/15' : 'bg-green-50/50 border border-green-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Check size={14} className="text-green-500" />
                <span className={`text-[11px] font-bold ${dark ? 'text-green-300' : 'text-green-600'}`}>Проверьте данные</span>
              </div>
            </div>

            {/* Summary */}
            <div className={`rounded-2xl overflow-hidden ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-gray-100 shadow-sm'}`}>
              {form.coverImage && <img src={form.coverImage} alt="" className="w-full h-32 object-cover" />}
              <div className="p-4 space-y-3">
                <h3 className="font-black text-[16px]">{form.title || 'Без названия'}</h3>
                <div className="space-y-1.5">
                  <InfoRow dark={dark} label="Дата" value={form.date ? new Date(form.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                  <InfoRow dark={dark} label="Город" value={form.city || '—'} />
                  <InfoRow dark={dark} label="Адрес" value={form.location || '—'} />
                  <InfoRow dark={dark} label="Вид спорта" value={form.sportType ? getSportLabel(form.sportType) : '—'} />
                  <InfoRow dark={dark} label="Ковров" value={form.matsCount} />
                </div>
              </div>
            </div>

            {form.regulations && (
              <div className={`rounded-2xl p-4 ${dark ? 'bg-white/[0.03]' : 'bg-white/40'}`}>
                <div className={`text-[10px] uppercase font-bold tracking-wide mb-2 ${dark ? 'text-white/30' : 'text-gray-400'}`}>Положение</div>
                <p className={`text-[12px] whitespace-pre-line ${dark ? 'text-white/50' : 'text-gray-600'}`}>{form.regulations}</p>
              </div>
            )}

            {form.ageGroups.length > 0 && (
              <div>
                <div className={`text-[10px] uppercase font-bold tracking-wide mb-2 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                  Возрастные группы ({form.ageGroups.length})
                </div>
                <div className="space-y-2">
                  {form.ageGroups.map((g, i) => (
                    <div key={g.id} className={`rounded-xl p-3 ${dark ? 'bg-white/[0.04]' : 'bg-white/50'}`}>
                      <div className="font-bold text-[13px]">
                        {g.name || `Группа ${i + 1}`}
                        {g.skillLevel && (
                          <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${
                            dark ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-50 text-purple-600'
                          }`}>{SKILL_LEVELS.find(s => s.id === g.skillLevel)?.label}</span>
                        )}
                      </div>
                      <div className={`text-[11px] mt-0.5 ${dark ? 'text-white/35' : 'text-gray-500'}`}>
                        {g.yearFrom && g.yearTo ? `${g.yearFrom}–${g.yearTo} г.р.` : g.yearFrom ? `с ${g.yearFrom} г.р.` : g.yearTo ? `по ${g.yearTo} г.р.` : ''}
                      </div>
                      {g.weightCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {g.weightCategories.map(w => (
                            <span key={w} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${dark ? 'bg-accent/10 text-accent-light' : 'bg-red-50 text-red-600'}`}>{w}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6 mb-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className={`flex-1 py-3.5 rounded-2xl font-bold press-scale flex items-center justify-center gap-1 ${
                dark ? 'bg-white/[0.06] text-white/60' : 'bg-gray-100 text-gray-600'
              }`}>
              <ChevronLeft size={16} /> Назад
            </button>
          )}
          <button
            onClick={isLast ? handleSubmit : () => setStep(s => s + 1)}
            disabled={!canNext}
            className={`flex-1 py-3.5 rounded-2xl font-bold press-scale flex items-center justify-center gap-1 transition-all ${
              canNext
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : dark ? 'bg-white/[0.06] text-white/20' : 'bg-gray-100 text-gray-300'
            }`}
          >
            {isLast ? 'Создать турнир' : 'Далее'} {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </Layout>
  )
}

/* ═══ Age Group Card ═══ */
function AgeGroupCard({ group, idx, dark, inputCls, onUpdate, onRemove, onAddWeight, onRemoveWeight }) {
  const [wcInput, setWcInput] = useState('')
  const [showPresets, setShowPresets] = useState(false)

  const addCustomWeight = () => {
    const val = wcInput.trim()
    if (!val) return
    onAddWeight(group.id, val)
    setWcInput('')
  }

  return (
    <div className={`rounded-2xl overflow-hidden ${
      dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-gray-100 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${dark ? 'bg-white/[0.02]' : 'bg-gray-50/50'}`}>
        <span className={`text-[11px] font-bold uppercase tracking-wide ${dark ? 'text-white/40' : 'text-gray-500'}`}>
          Группа {idx + 1}
        </span>
        <button onClick={() => onRemove(group.id)} className="press-scale p-1">
          <X size={14} className="text-red-400" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Name */}
        <input type="text" placeholder="Название группы (напр. Юноши 12-14 лет)"
          value={group.name} onChange={e => onUpdate(group.id, { name: e.target.value })}
          className={inputCls} />

        {/* Years */}
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Год от" min="1980" max="2025"
            value={group.yearFrom} onChange={e => onUpdate(group.id, { yearFrom: e.target.value })}
            className={inputCls} />
          <input type="number" placeholder="Год до" min="1980" max="2025"
            value={group.yearTo} onChange={e => onUpdate(group.id, { yearTo: e.target.value })}
            className={inputCls} />
        </div>

        {/* Skill level */}
        <div>
          <div className={`text-[10px] uppercase font-bold tracking-wide mb-2 ${dark ? 'text-white/30' : 'text-gray-400'}`}>Уровень</div>
          <div className="flex gap-2">
            {SKILL_LEVELS.map(s => (
              <button key={s.id} type="button"
                onClick={() => onUpdate(group.id, { skillLevel: group.skillLevel === s.id ? '' : s.id })}
                className={`flex-1 py-2 rounded-xl text-[11px] font-bold press-scale transition-all ${
                  group.skillLevel === s.id
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                    : dark ? 'bg-white/[0.05] text-white/35' : 'bg-gray-50 text-gray-400 border border-gray-200/60'
                }`}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {/* Weight categories */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-[10px] uppercase font-bold tracking-wide ${dark ? 'text-white/30' : 'text-gray-400'}`}>
              Весовые категории {group.weightCategories.length > 0 && `(${group.weightCategories.length})`}
            </div>
            <button onClick={() => setShowPresets(!showPresets)}
              className={`text-[10px] font-bold press-scale flex items-center gap-0.5 ${dark ? 'text-accent-light' : 'text-accent'}`}>
              Из списка <ChevronDown size={10} className={`transition-transform ${showPresets ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Selected weights */}
          {group.weightCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {group.weightCategories.map(w => (
                <span key={w} className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                  dark ? 'bg-purple-500/12 text-purple-300' : 'bg-purple-50 text-purple-600'
                }`}>
                  {w}
                  <button type="button" onClick={() => onRemoveWeight(group.id, w)} className="press-scale"><X size={10} /></button>
                </span>
              ))}
            </div>
          )}

          {/* Preset weights */}
          {showPresets && (
            <div className="flex flex-wrap gap-1.5 mb-2 animate-in">
              {WEIGHT_CLASSES.filter(w => !group.weightCategories.includes(w)).map(w => (
                <button key={w} type="button" onClick={() => onAddWeight(group.id, w)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold press-scale ${
                    dark ? 'bg-white/[0.05] text-white/40 hover:bg-accent/15 hover:text-accent-light' : 'bg-gray-50 text-gray-500 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >{w}</button>
              ))}
            </div>
          )}

          {/* Custom weight input */}
          <div className="flex gap-2">
            <input type="text" placeholder="Своя категория (напр. до 55 кг)" value={wcInput}
              onChange={e => setWcInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomWeight() } }}
              className={`flex-1 ${inputCls}`} />
            {wcInput.trim() && (
              <button type="button" onClick={addCustomWeight}
                className="px-3 rounded-2xl bg-accent text-white font-bold press-scale shrink-0">
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ dark, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[11px] ${dark ? 'text-white/30' : 'text-gray-400'}`}>{label}</span>
      <span className={`text-[12px] font-semibold ${dark ? 'text-white/70' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}
