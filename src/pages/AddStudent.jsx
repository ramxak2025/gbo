import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import PhoneInput, { cleanPhone } from '../components/PhoneInput'
import { getRankOptions, getRankLabel } from '../utils/sports'

export default function AddStudent() {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, addStudent } = useData()
  const { dark } = useTheme()

  const myGroups = data.groups.filter(g => g.trainerId === auth.userId)
  const trainer = data.users.find(u => u.id === auth.userId)
  const rankOptions = getRankOptions(trainer?.sportType)
  const rankLabel = getRankLabel(trainer?.sportType)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    weight: '',
    belt: rankOptions[0] || '',
    birthDate: '',
    groupId: myGroups[0]?.id || '',
    password: 'student123',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const phoneDigits = cleanPhone(form.phone)
    if (!form.name.trim() || phoneDigits.length < 11) return

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    addStudent({
      trainerId: auth.userId,
      groupId: form.groupId || null,
      name: form.name.trim(),
      phone: phoneDigits,
      weight: parseFloat(form.weight) || 0,
      belt: form.belt,
      birthDate: form.birthDate,
      avatar: null,
      subscriptionExpiresAt: expiresAt.toISOString(),
      password: form.password,
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
      <PageHeader title="Новый ученик" back />
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
          <PhoneInput
            value={form.phone}
            onChange={v => setForm(f => ({ ...f, phone: v }))}
            className={inputCls}
            required
          />
          <select
            value={form.groupId}
            onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}
            className={inputCls}
          >
            <option value="">— Группа —</option>
            {myGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Вес (кг)"
              value={form.weight}
              onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
              className={inputCls}
              inputMode="decimal"
            />
            <select
              value={form.belt}
              onChange={e => setForm(f => ({ ...f, belt: e.target.value }))}
              className={inputCls}
            >
              {rankOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <input
            type="date"
            placeholder="Дата рождения"
            value={form.birthDate}
            onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
            className={inputCls}
          />

          <div className={`pt-2 ${dark ? 'border-t border-white/10' : 'border-t border-black/[0.08]'}`}>
            <p className={`text-xs mb-2 ${dark ? 'text-white/40' : 'text-gray-400'}`}>Пароль для входа ученика</p>
            <input
              type="text"
              placeholder="Пароль"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={inputCls}
            />
          </div>

          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale mt-4">
            Добавить ученика
          </button>
        </form>
      </div>
    </Layout>
  )
}
