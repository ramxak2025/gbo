import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Plus, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../utils/api'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import DateButton from '../components/DateButton'
import { SPORT_TYPES, getSportLabel } from '../utils/sports'

export default function AddTournament() {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { addTournament } = useData()
  const { dark } = useTheme()

  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    coverImage: null,
    regulations: '',
    weightCategories: [],
    prizes: '',
    rules: '',
    sportType: '',
    matsCount: 1,
  })
  const [wcInput, setWcInput] = useState('')

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

  const addWeightCategory = () => {
    const val = wcInput.trim()
    if (!val || form.weightCategories.includes(val)) return
    setForm(f => ({ ...f, weightCategories: [...f.weightCategories, val] }))
    setWcInput('')
  }

  const removeWeightCategory = (cat) => {
    setForm(f => ({ ...f, weightCategories: f.weightCategories.filter(c => c !== cat) }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    addTournament({
      title: form.title.trim(),
      date: form.date,
      location: form.location.trim(),
      description: form.description.trim(),
      coverImage: form.coverImage,
      regulations: form.regulations.trim(),
      weightCategories: form.weightCategories,
      prizes: form.prizes.trim(),
      rules: form.rules.trim(),
      sportType: form.sportType || null,
      matsCount: form.matsCount,
      createdBy: auth.userId,
    })
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
      <PageHeader title="Новый турнир" back />
      <div className="px-4 slide-in">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Cover image */}
          <label className={`
            block w-full h-40 rounded-[24px] cursor-pointer press-scale
            flex items-center justify-center overflow-hidden
            ${dark ? 'bg-white/[0.05] border border-dashed border-white/[0.15]' : 'bg-white/50 border border-dashed border-black/[0.1]'}
          `}>
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

          <input type="text" placeholder="Название турнира *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} required />
          <DateButton label="Дата турнира" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
          <input type="text" placeholder="Место проведения" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls} />

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

          <textarea placeholder="Описание турнира" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} min-h-[80px] resize-none`} rows={3} />

          {/* Weight categories */}
          <div>
            <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Весовые категории</div>
            {form.weightCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.weightCategories.map(wc => (
                  <span key={wc} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${dark ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                    {wc}
                    <button type="button" onClick={() => removeWeightCategory(wc)} className="press-scale"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" placeholder="напр. до 60 кг" value={wcInput} onChange={e => setWcInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addWeightCategory() } }}
                className={`flex-1 ${inputCls}`} />
              {wcInput.trim() && (
                <button type="button" onClick={addWeightCategory} className="px-3 rounded-[16px] bg-accent text-white font-bold press-scale shrink-0"><Plus size={16} /></button>
              )}
            </div>
          </div>

          <textarea placeholder="Положение турнира" value={form.regulations} onChange={e => setForm(f => ({ ...f, regulations: e.target.value }))} className={`${inputCls} min-h-[80px] resize-none`} rows={3} />
          <textarea placeholder="Правила" value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} className={`${inputCls} min-h-[80px] resize-none`} rows={3} />
          <textarea placeholder="Призы" value={form.prizes} onChange={e => setForm(f => ({ ...f, prizes: e.target.value }))} className={`${inputCls} min-h-[60px] resize-none`} rows={2} />

          <div>
            <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Количество ковров</div>
            <input type="number" min="1" max="20" value={form.matsCount} onChange={e => setForm(f => ({ ...f, matsCount: parseInt(e.target.value) || 1 }))} className={inputCls} />
          </div>

          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale mt-4">
            Создать турнир
          </button>
        </form>
        <div className="h-8" />
      </div>
    </Layout>
  )
}
