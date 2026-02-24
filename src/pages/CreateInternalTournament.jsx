import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    weightClass: 'Абсолютка',
  })
  const [selected, setSelected] = useState(new Set())

  // Filter students by weight class
  const filteredStudents = form.weightClass === 'Абсолютка'
    ? myStudents
    : myStudents.filter(s => {
        if (!s.weight) return false
        const max = parseInt(form.weightClass.match(/\d+/)?.[0] || 999)
        // "До X кг" means weight <= X, "Свыше X кг" means weight > X
        if (form.weightClass.startsWith('Свыше')) return s.weight > max
        return s.weight <= max
      })

  const toggleStudent = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filteredStudents.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredStudents.map(s => s.id)))
    }
  }

  const handleCreate = () => {
    if (selected.size < 2) return
    const participants = [...selected]
    const brackets = generateBracket(participants)
    addInternalTournament({
      title: form.title || `Турнир ${form.weightClass}`,
      date: form.date,
      brackets: { ...brackets, weightClass: form.weightClass },
    })
    navigate('/tournaments')
  }

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none
    ${dark
      ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent'
      : 'bg-black/[0.03] border border-black/[0.08] text-gray-900 placeholder-gray-400 focus:border-accent'
    }
  `

  return (
    <Layout>
      <PageHeader title="Свой турнир" back />
      <div className="px-4 slide-in">
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
              className={inputCls}
            />
            <select
              value={form.weightClass}
              onChange={e => setForm(f => ({ ...f, weightClass: e.target.value }))}
              className={inputCls}
            >
              {WEIGHT_CLASSES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale mt-2"
            >
              Выбрать участников
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className={`text-sm font-bold ${dark ? 'text-white/60' : 'text-gray-500'}`}>
                {form.weightClass} — выбрано {selected.size}
              </h2>
              <button onClick={selectAll} className="text-accent text-xs font-semibold press-scale">
                {selected.size === filteredStudents.length ? 'Снять все' : 'Выбрать всех'}
              </button>
            </div>

            {filteredStudents.length === 0 && (
              <p className={`text-center py-8 text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                Нет учеников в этой весовой
              </p>
            )}

            <div className="space-y-2">
              {filteredStudents.map(s => (
                <GlassCard
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`flex items-center gap-3 cursor-pointer transition-all ${
                    selected.has(s.id) ? 'border-accent border' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selected.has(s.id) ? 'bg-accent border-accent' : dark ? 'border-white/20' : 'border-black/20'
                  }`}>
                    {selected.has(s.id) && <span className="text-white text-xs font-bold">✓</span>}
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
                onClick={() => setStep(1)}
                className={`flex-1 py-3 rounded-[16px] font-bold press-scale ${dark ? 'bg-white/5 text-white' : 'bg-black/5 text-gray-800'}`}
              >
                Назад
              </button>
              <button
                onClick={handleCreate}
                disabled={selected.size < 2}
                className={`flex-1 py-3 rounded-[16px] font-bold press-scale ${
                  selected.size >= 2
                    ? 'bg-accent text-white'
                    : 'bg-accent/30 text-white/50 cursor-not-allowed'
                }`}
              >
                Создать ({selected.size})
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
