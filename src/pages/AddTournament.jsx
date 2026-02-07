import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'

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
  })

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, coverImage: ev.target.result }))
    reader.readAsDataURL(file)
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
      createdBy: auth.userId,
    })
    navigate(-1)
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
      <PageHeader title="Новый турнир" back />
      <div className="px-4 slide-in">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Cover image */}
          <label className={`
            block w-full h-40 rounded-[24px] cursor-pointer press-scale
            flex items-center justify-center overflow-hidden
            ${dark ? 'bg-white/5 border border-dashed border-white/20' : 'bg-black/[0.03] border border-dashed border-black/[0.15]'}
          `}>
            {form.coverImage ? (
              <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Camera size={28} className={dark ? 'text-white/30' : 'text-gray-400'} />
                <span className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>Загрузить обложку</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>

          <input
            type="text"
            placeholder="Название турнира *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className={inputCls}
            required
          />
          <input
            type="date"
            placeholder="Дата"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className={inputCls}
            required
          />
          <input
            type="text"
            placeholder="Место проведения"
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            className={inputCls}
          />
          <textarea
            placeholder="Описание"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className={`${inputCls} min-h-[120px] resize-none`}
            rows={4}
          />
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">
            Создать турнир
          </button>
        </form>
      </div>
    </Layout>
  )
}
