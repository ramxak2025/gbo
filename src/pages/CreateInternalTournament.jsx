import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, ChevronRight, Users, Weight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import { WEIGHT_CLASSES, generateBracket } from '../utils/sports'

export default function CreateInternalTournament() {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, addInternalTournament } = useData()
  const { dark } = useTheme()

  const myStudents = data.students.filter(s => s.trainerId === auth.userId)

  const [step, setStep] = useState(1) // 1=info, 2=add categories, 3=select participants
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
  })
  // Each category: { weightClass, participants: Set }
  const [categories, setCategories] = useState([])
  const [editingCatIdx, setEditingCatIdx] = useState(null)
  const [selectedForCat, setSelectedForCat] = useState(new Set())
  const [newWeightClass, setNewWeightClass] = useState('')

  // Available weight classes (not yet added)
  const usedWeightClasses = new Set(categories.map(c => c.weightClass))

  // Filter students by weight class for participant selection
  const getFilteredStudents = (weightClass) => {
    if (weightClass === 'Абсолютка') return myStudents
    return myStudents.filter(s => {
      if (!s.weight) return false
      const max = parseInt(weightClass.match(/\d+/)?.[0] || 999)
      if (weightClass.startsWith('Свыше')) return s.weight > max
      return s.weight <= max
    })
  }

  const addCategory = () => {
    if (!newWeightClass) return
    setCategories(prev => [...prev, { weightClass: newWeightClass, participants: [] }])
    setNewWeightClass('')
  }

  const removeCategory = (idx) => {
    setCategories(prev => prev.filter((_, i) => i !== idx))
  }

  const openParticipantPicker = (idx) => {
    setEditingCatIdx(idx)
    setSelectedForCat(new Set(categories[idx].participants))
    setStep(3)
  }

  const saveParticipants = () => {
    setCategories(prev => prev.map((c, i) =>
      i === editingCatIdx ? { ...c, participants: [...selectedForCat] } : c
    ))
    setEditingCatIdx(null)
    setStep(2)
  }

  const toggleStudent = (id) => {
    setSelectedForCat(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreate = async () => {
    const validCategories = categories.filter(c => c.participants.length >= 2)
    if (validCategories.length === 0) return

    const cats = validCategories.map(c => {
      const bracket = generateBracket(c.participants)
      return { weightClass: c.weightClass, ...bracket }
    })

    await addInternalTournament({
      title: form.title || 'Клубный турнир',
      date: form.date,
      brackets: { categories: cats },
    })
    navigate('/tournaments')
  }

  const totalParticipants = categories.reduce((s, c) => s + c.participants.length, 0)
  const validCategories = categories.filter(c => c.participants.length >= 2)

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none
    ${dark
      ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent'
      : 'bg-black/[0.03] border border-black/[0.08] text-gray-900 placeholder-gray-400 focus:border-accent'
    }
  `

  const dateInputCls = `
    w-full px-2 py-1.5 rounded-lg text-xs outline-none
    ${dark
      ? 'bg-white/5 border border-white/10 text-white focus:border-accent'
      : 'bg-black/[0.03] border border-black/[0.08] text-gray-900 focus:border-accent'
    }
  `

  return (
    <Layout>
      <PageHeader title="Свой турнир" back />
      <div className="px-4 slide-in">

        {/* Step 1: Title + Date */}
        {step === 1 && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Название турнира"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inputCls}
            />
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className={dateInputCls}
            />
            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale mt-2"
            >
              Далее — весовые категории
            </button>
          </div>
        )}

        {/* Step 2: Weight categories management */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold">{form.title || 'Клубный турнир'}</h2>
              <p className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                Добавьте весовые категории и выберите участников
              </p>
            </div>

            {/* Add category */}
            <div className="flex gap-2">
              <select
                value={newWeightClass}
                onChange={e => setNewWeightClass(e.target.value)}
                className={`${inputCls} flex-1`}
              >
                <option value="">+ Весовая категория</option>
                {WEIGHT_CLASSES.filter(w => !usedWeightClasses.has(w)).map(w =>
                  <option key={w} value={w}>{w}</option>
                )}
              </select>
              <button
                onClick={addCategory}
                disabled={!newWeightClass}
                className={`px-4 py-3 rounded-[16px] font-bold press-scale ${
                  newWeightClass ? 'bg-accent text-white' : dark ? 'bg-white/5 text-white/20' : 'bg-black/5 text-gray-300'
                }`}
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Categories list */}
            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <GlassCard key={idx} className="relative">
                  <button
                    onClick={() => removeCategory(idx)}
                    className="absolute top-3 right-3 text-red-400 press-scale"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex items-center gap-3" onClick={() => openParticipantPicker(idx)}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dark ? 'bg-accent/20' : 'bg-accent/10'}`}>
                      <Weight size={18} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">{cat.weightClass}</div>
                      <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                        {cat.participants.length > 0
                          ? `${cat.participants.length} участников`
                          : 'Нажмите чтобы выбрать участников'
                        }
                        {cat.participants.length === 1 && ' (мин. 2)'}
                      </div>
                    </div>
                    <ChevronRight size={18} className={dark ? 'text-white/20' : 'text-gray-300'} />
                  </div>
                  {cat.participants.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {cat.participants.map(pid => {
                        const s = myStudents.find(st => st.id === pid)
                        if (!s) return null
                        return (
                          <div key={pid} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] ${
                            dark ? 'bg-white/5' : 'bg-black/5'
                          }`}>
                            <Avatar name={s.name} size={16} src={s.avatar} />
                            <span className="font-medium">{s.name.split(' ')[0]}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>

            {categories.length === 0 && (
              <p className={`text-center py-8 text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                Добавьте хотя бы одну весовую категорию
              </p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(1)}
                className={`flex-1 py-3 rounded-[16px] font-bold press-scale ${dark ? 'bg-white/5 text-white' : 'bg-black/5 text-gray-800'}`}
              >
                Назад
              </button>
              <button
                onClick={handleCreate}
                disabled={validCategories.length === 0}
                className={`flex-1 py-3 rounded-[16px] font-bold press-scale ${
                  validCategories.length > 0
                    ? 'bg-accent text-white'
                    : 'bg-accent/30 text-white/50 cursor-not-allowed'
                }`}
              >
                Создать ({totalParticipants} чел.)
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select participants for a category */}
        {step === 3 && editingCatIdx !== null && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className={`text-sm font-bold ${dark ? 'text-white/60' : 'text-gray-500'}`}>
                {categories[editingCatIdx].weightClass} — выбрано {selectedForCat.size}
              </h2>
              <button
                onClick={() => {
                  const filtered = getFilteredStudents(categories[editingCatIdx].weightClass)
                  if (selectedForCat.size === filtered.length) setSelectedForCat(new Set())
                  else setSelectedForCat(new Set(filtered.map(s => s.id)))
                }}
                className="text-accent text-xs font-semibold press-scale"
              >
                {selectedForCat.size === getFilteredStudents(categories[editingCatIdx].weightClass).length
                  ? 'Снять все' : 'Выбрать всех'}
              </button>
            </div>

            {getFilteredStudents(categories[editingCatIdx].weightClass).length === 0 && (
              <p className={`text-center py-8 text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                Нет учеников в этой весовой
              </p>
            )}

            <div className="space-y-2">
              {getFilteredStudents(categories[editingCatIdx].weightClass).map(s => (
                <GlassCard
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`flex items-center gap-3 cursor-pointer transition-all ${
                    selectedForCat.has(s.id) ? 'border-accent border' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selectedForCat.has(s.id) ? 'bg-accent border-accent' : dark ? 'border-white/20' : 'border-black/20'
                  }`}>
                    {selectedForCat.has(s.id) && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <Avatar name={s.name} src={s.avatar} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{s.name}</div>
                    <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                      {s.weight ? s.weight + ' кг' : '—'} • {s.belt || '—'}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setEditingCatIdx(null); setStep(2) }}
                className={`flex-1 py-3 rounded-[16px] font-bold press-scale ${dark ? 'bg-white/5 text-white' : 'bg-black/5 text-gray-800'}`}
              >
                Отмена
              </button>
              <button
                onClick={saveParticipants}
                className="flex-1 py-3 rounded-[16px] bg-accent text-white font-bold press-scale"
              >
                Сохранить ({selectedForCat.size})
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
