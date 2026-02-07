import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, Calendar, Scale, Award, Trash2, Edit3, Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

const BELTS = ['Белый', 'Синий', 'Фиолетовый', 'Коричневый', 'Черный']

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, updateStudent, deleteStudent } = useData()
  const { dark } = useTheme()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  const student = data.students.find(s => s.id === id)
  if (!student) {
    return (
      <Layout>
        <PageHeader title="Ученик" back />
        <div className="px-4 py-12 text-center">
          <p className={dark ? 'text-white/40' : 'text-gray-400'}>Ученик не найден</p>
        </div>
      </Layout>
    )
  }

  const group = data.groups.find(g => g.id === student.groupId)
  const trainer = data.users.find(u => u.id === student.trainerId)
  const expired = isExpired(student.subscriptionExpiresAt)
  const canEdit = auth.role === 'trainer' && auth.userId === student.trainerId
  const canEditAdmin = auth.role === 'superadmin'

  const startEdit = () => {
    setForm({ ...student })
    setEditing(true)
  }

  const saveEdit = (e) => {
    e.preventDefault()
    updateStudent(student.id, {
      name: form.name,
      phone: form.phone,
      weight: parseFloat(form.weight) || 0,
      belt: form.belt,
      birthDate: form.birthDate,
    })
    setEditing(false)
  }

  const handleDelete = () => {
    if (confirm('Удалить ученика? Это действие необратимо.')) {
      deleteStudent(student.id)
      navigate(-1)
    }
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      updateStudent(student.id, { avatar: ev.target.result })
    }
    reader.readAsDataURL(file)
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
      <PageHeader title="Досье" back>
        {(canEdit || canEditAdmin) && (
          <>
            <button onClick={startEdit} className="press-scale p-2">
              <Edit3 size={18} />
            </button>
            {canEdit && (
              <button onClick={handleDelete} className="press-scale p-2 text-red-400">
                <Trash2 size={18} />
              </button>
            )}
          </>
        )}
      </PageHeader>

      <div className="px-4 space-y-4 slide-in">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar name={student.name} src={student.avatar} size={80} />
            {canEdit && (
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center cursor-pointer press-scale">
                <Camera size={14} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            )}
          </div>
          <h2 className="text-xl font-bold mt-3">{student.name}</h2>
          <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>
            {trainer?.clubName} — {group?.name || 'Без группы'}
          </p>
        </div>

        {/* Status */}
        <GlassCard className="flex items-center justify-between">
          <span className={`text-sm font-semibold ${dark ? 'text-white/50' : 'text-gray-500'}`}>Статус</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            expired ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {expired ? 'Долг' : 'Активен'}
          </span>
        </GlassCard>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-2">
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <Award size={14} className="text-accent" />
              <span className={`text-xs uppercase ${dark ? 'text-white/40' : 'text-gray-400'}`}>Пояс</span>
            </div>
            <div className="font-bold">{student.belt || '—'}</div>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <Scale size={14} className="text-accent" />
              <span className={`text-xs uppercase ${dark ? 'text-white/40' : 'text-gray-400'}`}>Вес</span>
            </div>
            <div className="font-bold">{student.weight ? `${student.weight} кг` : '—'}</div>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-accent" />
              <span className={`text-xs uppercase ${dark ? 'text-white/40' : 'text-gray-400'}`}>Рождение</span>
            </div>
            <div className="font-bold text-sm">{formatDate(student.birthDate)}</div>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <Phone size={14} className="text-accent" />
              <span className={`text-xs uppercase ${dark ? 'text-white/40' : 'text-gray-400'}`}>Телефон</span>
            </div>
            <div className="font-bold text-sm">{student.phone || '—'}</div>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>Абонемент до</span>
            <span className="font-bold">{formatDate(student.subscriptionExpiresAt)}</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>В клубе с</span>
            <span className="font-bold">{formatDate(student.createdAt)}</span>
          </div>
        </GlassCard>
      </div>

      {/* Edit Modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Редактировать">
        {form && (
          <form onSubmit={saveEdit} className="space-y-3">
            <input
              type="text"
              placeholder="ФИО"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls}
            />
            <input
              type="tel"
              placeholder="Телефон"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className={inputCls}
            />
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
              <option value="">— Пояс —</option>
              {BELTS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <input
              type="date"
              placeholder="Дата рождения"
              value={form.birthDate}
              onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
              className={inputCls}
            />
            <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">
              Сохранить
            </button>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
