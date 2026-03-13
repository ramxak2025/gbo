import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import PhoneInput, { cleanPhone } from '../components/PhoneInput'
import DateButton from '../components/DateButton'
import { getRankOptions, getRankLabel } from '../utils/sports'

function getAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate + 'T00:00:00')
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function AddStudent() {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, addStudent, addParent } = useData()
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
    groupIds: myGroups[0]?.id ? [myGroups[0].id] : [],
    password: 'student123',
    trainingStartDate: new Date().toISOString().split('T')[0],
    subscriptionExpiresAt: '',
  })

  const [parentForm, setParentForm] = useState({
    name: '',
    phone: '',
    relation: 'mother',
    password: 'parent123',
  })

  const age = useMemo(() => getAge(form.birthDate), [form.birthDate])
  const isMinor = age !== null && age < 18
  const isUnder14 = age !== null && age < 14
  const showParent = isMinor

  const handleSubmit = async (e) => {
    e.preventDefault()
    const phoneDigits = cleanPhone(form.phone)
    if (!form.name.trim() || phoneDigits.length < 11) return

    // Validate parent for under 14
    if (isUnder14) {
      const parentPhoneDigits = cleanPhone(parentForm.phone)
      if (!parentForm.name.trim() || parentPhoneDigits.length < 11) {
        alert('Для детей до 14 лет обязательно указать данные родителя/законного представителя (ФЗ-152)')
        return
      }
    }

    let subExpires = form.subscriptionExpiresAt
    if (!subExpires) {
      const d = new Date()
      d.setMonth(d.getMonth() + 1)
      subExpires = d.toISOString()
    }

    const studentId = await addStudent({
      trainerId: auth.userId,
      groupIds: form.groupIds,
      name: form.name.trim(),
      phone: phoneDigits,
      weight: parseFloat(form.weight) || 0,
      belt: form.belt,
      birthDate: form.birthDate,
      avatar: null,
      subscriptionExpiresAt: subExpires,
      trainingStartDate: form.trainingStartDate || null,
      password: form.password,
    })

    // Add parent if minor and parent data provided
    if (showParent && parentForm.name.trim()) {
      const parentPhoneDigits = cleanPhone(parentForm.phone)
      if (parentPhoneDigits.length >= 11) {
        await addParent({
          studentId,
          name: parentForm.name.trim(),
          phone: parentPhoneDigits,
          relation: parentForm.relation,
          password: parentForm.password,
        })
      }
    }

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
          {/* Multi-group selection */}
          <div>
            <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Группы</div>
            <div className="flex flex-wrap gap-2">
              {myGroups.map(g => {
                const active = form.groupIds.includes(g.id)
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      groupIds: active
                        ? f.groupIds.filter(id => id !== g.id)
                        : [...f.groupIds, g.id]
                    }))}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold press-scale transition-all ${
                      active
                        ? 'bg-accent text-white'
                        : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'
                    }`}
                  >
                    {g.name}
                    {g.schedule && <span className="ml-1 opacity-60">({g.schedule})</span>}
                  </button>
                )
              })}
              {myGroups.length === 0 && (
                <span className={`text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>Сначала создайте группу</span>
              )}
            </div>
          </div>
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

          {/* Dates section */}
          <div className={`flex flex-wrap gap-3 pt-3 ${dark ? 'border-t border-white/10' : 'border-t border-black/[0.08]'}`}>
            <DateButton label="Дата рождения" value={form.birthDate} onChange={v => setForm(f => ({ ...f, birthDate: v }))} />
            <DateButton label="Тренируется с" value={form.trainingStartDate} onChange={v => setForm(f => ({ ...f, trainingStartDate: v }))} />
            <DateButton label="Абонемент до" value={form.subscriptionExpiresAt} onChange={v => setForm(f => ({ ...f, subscriptionExpiresAt: v }))} />
          </div>

          {/* Age indicator */}
          {age !== null && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-[12px] text-xs ${
              isUnder14
                ? dark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'
                : isMinor
                  ? dark ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' : 'bg-yellow-50 border border-yellow-200 text-yellow-600'
                  : dark ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-green-50 border border-green-200 text-green-600'
            }`}>
              {isUnder14 ? <AlertTriangle size={14} /> : isMinor ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
              <span className="font-semibold">
                {age} {age === 1 ? 'год' : age < 5 ? 'года' : 'лет'}
                {isUnder14 && ' — данные родителя обязательны (ФЗ-152)'}
                {isMinor && !isUnder14 && ' — рекомендуется указать родителя'}
              </span>
            </div>
          )}

          {/* Parent/Guardian section */}
          {showParent && (
            <div className={`space-y-3 pt-3 ${dark ? 'border-t border-white/10' : 'border-t border-black/[0.08]'}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-400" />
                <p className={`text-sm font-bold ${dark ? 'text-white/80' : 'text-gray-800'}`}>
                  Родитель / законный представитель
                  {isUnder14 && <span className="text-red-400 ml-1">*</span>}
                </p>
              </div>
              <input
                type="text"
                placeholder={`ФИО родителя${isUnder14 ? ' *' : ''}`}
                value={parentForm.name}
                onChange={e => setParentForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls}
                required={isUnder14}
              />
              <PhoneInput
                value={parentForm.phone}
                onChange={v => setParentForm(f => ({ ...f, phone: v }))}
                className={inputCls}
                placeholder={`Телефон родителя${isUnder14 ? ' *' : ''}`}
                required={isUnder14}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={parentForm.relation}
                  onChange={e => setParentForm(f => ({ ...f, relation: e.target.value }))}
                  className={inputCls}
                >
                  <option value="mother">Мать</option>
                  <option value="father">Отец</option>
                  <option value="guardian">Опекун</option>
                  <option value="other">Другое</option>
                </select>
                <input
                  type="text"
                  placeholder="Пароль родителя"
                  value={parentForm.password}
                  onChange={e => setParentForm(f => ({ ...f, password: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <p className={`text-[10px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                Родитель сможет войти по своему номеру и видеть кабинет ребёнка
              </p>
            </div>
          )}

          <div className={`pt-2 ${dark ? 'border-t border-white/10' : 'border-t border-black/[0.08]'}`}>
            <p className={`text-xs mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Пароль для входа ученика</p>
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
