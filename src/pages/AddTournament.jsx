import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../utils/api'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import DateButton from '../components/DateButton'

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
          <DateButton label="Дата турнира" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
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
