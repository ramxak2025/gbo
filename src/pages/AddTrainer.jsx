import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import PhoneInput, { cleanPhone } from '../components/PhoneInput'
import { SPORT_TYPES } from '../utils/sports'

export default function AddTrainer() {
  const navigate = useNavigate()
  const { addTrainer } = useData()
  const { dark } = useTheme()

  const [form, setForm] = useState({
    name: '',
    password: 'trainer123',
    phone: '',
    clubName: '',
    sportType: 'bjj',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const phoneDigits = cleanPhone(form.phone)
    if (!form.name.trim() || phoneDigits.length < 11) return
    addTrainer({
      name: form.name.trim(),
      password: form.password,
      phone: phoneDigits,
      clubName: form.clubName.trim(),
      sportType: form.sportType,
      avatar: null,
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
      <PageHeader title="Новый тренер" back />
      <div className="px-4 slide-in">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="ФИО *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={inputCls}
            required
          />
          <input
            type="text"
            placeholder="Название клуба"
            value={form.clubName}
            onChange={e => setForm(f => ({ ...f, clubName: e.target.value }))}
            className={inputCls}
          />
          <select
            value={form.sportType}
            onChange={e => setForm(f => ({ ...f, sportType: e.target.value }))}
            className={inputCls}
          >
            {SPORT_TYPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
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
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale mt-4">
            Добавить тренера
          </button>
        </form>
      </div>
    </Layout>
  )
}
