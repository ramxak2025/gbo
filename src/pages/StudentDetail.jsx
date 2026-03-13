import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, Calendar, Scale, Award, Trash2, Edit3, Camera, Dumbbell, CreditCard, ClipboardList, Key, ShieldCheck, UserPlus, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../utils/api'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import PhoneInput, { formatPhone, cleanPhone } from '../components/PhoneInput'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import DateButton from '../components/DateButton'
import { getRankOptions, getRankLabel } from '../utils/sports'

function AttendanceStats({ studentId, groupId, data, dark }) {
  const group = data.groups.find(g => g.id === groupId)
  if (!group?.attendanceEnabled) return null

  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const monthRecords = useMemo(() =>
    data.attendance.filter(a => a.studentId === studentId && a.groupId === groupId && a.date.startsWith(monthPrefix)),
    [data.attendance, studentId, groupId, monthPrefix]
  )

  const present = monthRecords.filter(a => a.present).length
  const total = monthRecords.length
  const pct = total > 0 ? Math.round((present / total) * 100) : 0
  const monthName = now.toLocaleDateString('ru-RU', { month: 'long' })

  if (total === 0) return null

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-2">
        <ClipboardList size={14} className="text-accent" />
        <span className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-500'}`}>
          Посещаемость за {monthName}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className={`h-2 rounded-full flex-1 ${dark ? 'bg-white/[0.08]' : 'bg-black/[0.06]'}`}>
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`font-black text-lg ${
          pct >= 80 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'
        }`}>{pct}%</span>
      </div>
      <div className={`text-xs mt-1 ${dark ? 'text-white/30' : 'text-gray-500'}`}>
        {present} из {total} тренировок
      </div>
    </GlassCard>
  )
}

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, updateStudent, deleteStudent, addParent, deleteParent, updateStudentGroups } = useData()
  const { dark } = useTheme()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [showAddParent, setShowAddParent] = useState(false)
  const [parentForm, setParentForm] = useState({ name: '', phone: '', relation: 'mother', password: 'parent123' })

  const student = data.students.find(s => s.id === id)
  if (!student) {
    return (
      <Layout>
        <PageHeader title="Ученик" back />
        <div className="px-4 py-12 text-center">
          <p className={dark ? 'text-white/40' : 'text-gray-500'}>Ученик не найден</p>
        </div>
      </Layout>
    )
  }

  const group = data.groups.find(g => g.id === student.groupId)
  const studentGroupIds = data.studentGroups
    .filter(sg => sg.studentId === student.id)
    .map(sg => sg.groupId)
  // Combine junction table + primary groupId for all groups
  const allGroupIds = [...new Set([...studentGroupIds, ...(student.groupId ? [student.groupId] : [])])]
  const studentAllGroups = data.groups.filter(g => allGroupIds.includes(g.id))
  const trainer = data.users.find(u => u.id === student.trainerId)
  const expired = isExpired(student.subscriptionExpiresAt)
  const canEdit = auth.role === 'trainer' && auth.userId === student.trainerId
  const canEditAdmin = auth.role === 'superadmin'
  const rankOptions = getRankOptions(trainer?.sportType)
  const rankLabel = getRankLabel(trainer?.sportType)

  const trainerGroups = data.groups.filter(g => g.trainerId === student.trainerId)

  const startEdit = () => {
    setForm({ ...student, phone: formatPhone(student.phone || ''), newPassword: '', editGroupIds: [...allGroupIds] })
    setEditing(true)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    const changes = {
      name: form.name,
      phone: cleanPhone(form.phone),
      weight: parseFloat(form.weight) || 0,
      belt: form.belt,
      birthDate: form.birthDate,
      trainingStartDate: form.trainingStartDate || null,
      subscriptionExpiresAt: form.subscriptionExpiresAt || null,
      groupIds: form.editGroupIds,
    }
    if (form.newPassword) {
      changes.password = form.newPassword
      changes.plainPassword = form.newPassword
    }
    await updateStudent(student.id, changes)
    setEditing(false)
  }

  const handleDelete = () => {
    if (confirm('Удалить ученика? Это действие необратимо.')) {
      deleteStudent(student.id)
      navigate(-1)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await api.uploadFile(file)
      updateStudent(student.id, { avatar: url })
    } catch (err) {
      console.error('Upload failed:', err)
    }
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
          <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-500'}`}>
            {trainer?.clubName} — {studentAllGroups.length > 0 ? studentAllGroups.map(g => g.name).join(', ') : 'Без группы'}
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
              <span className={`text-xs uppercase ${dark ? 'text-white/40' : 'text-gray-500'}`}>{rankLabel}</span>
            </div>
            <div className="font-bold">{student.belt || '—'}</div>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <Scale size={14} className="text-accent" />
              <span className={`text-xs uppercase ${dark ? 'text-white/40' : 'text-gray-500'}`}>Вес</span>
            </div>
            <div className="font-bold">{student.weight ? `${student.weight} кг` : '—'}</div>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-accent" />
              <span className={`text-xs uppercase ${dark ? 'text-white/40' : 'text-gray-500'}`}>Рождение</span>
            </div>
            <div className="font-bold text-sm">{formatDate(student.birthDate)}</div>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <Phone size={14} className="text-accent" />
              <span className={`text-xs uppercase ${dark ? 'text-white/40' : 'text-gray-500'}`}>Телефон</span>
            </div>
            <div className="font-bold text-sm">{student.phone || '—'}</div>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={14} className={expired ? 'text-red-400' : 'text-green-400'} />
              <span className={`text-sm ${dark ? 'text-white/40' : 'text-gray-500'}`}>Абонемент до</span>
            </div>
            <span className={`font-bold ${expired ? 'text-red-400' : ''}`}>{formatDate(student.subscriptionExpiresAt)}</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell size={14} className="text-accent" />
              <span className={`text-sm ${dark ? 'text-white/40' : 'text-gray-500'}`}>Тренируется с</span>
            </div>
            <span className="font-bold">{formatDate(student.trainingStartDate || student.createdAt)}</span>
          </div>
        </GlassCard>

        {auth.role === 'superadmin' && student.plainPassword && (
          <GlassCard className="flex items-center gap-3">
            <Key size={14} className="text-yellow-400" />
            <span className={`text-sm ${dark ? 'text-white/50' : 'text-gray-500'}`}>Пароль: <span className="font-mono font-bold">{student.plainPassword}</span></span>
          </GlassCard>
        )}

        {/* Attendance stats — show for all groups */}
        {studentAllGroups.map(g => (
          <AttendanceStats key={g.id} studentId={student.id} groupId={g.id} data={data} dark={dark} />
        ))}

        {/* Parents/Guardians section */}
        {(canEdit || canEditAdmin) && (() => {
          const parents = (data.parents || []).filter(p => p.studentId === student.id)
          const RELATION_LABELS = { mother: 'Мать', father: 'Отец', guardian: 'Опекун', other: 'Другое', parent: 'Родитель' }
          return (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-blue-400" />
                  <span className={`text-xs uppercase font-bold ${dark ? 'text-white/40' : 'text-gray-500'}`}>Родители</span>
                </div>
                <button onClick={() => setShowAddParent(true)} className="text-accent press-scale">
                  <UserPlus size={16} />
                </button>
              </div>
              {parents.length > 0 ? parents.map(p => (
                <GlassCard key={p.id} className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                      {RELATION_LABELS[p.relation] || p.relation} · {p.phone}
                    </div>
                  </div>
                  <button onClick={() => { if (confirm('Удалить родителя?')) deleteParent(p.id) }} className="text-red-400 press-scale p-1">
                    <X size={14} />
                  </button>
                </GlassCard>
              )) : (
                <GlassCard className="text-center">
                  <p className={`text-xs ${dark ? 'text-white/25' : 'text-gray-400'}`}>Нет привязанных родителей</p>
                </GlassCard>
              )}
            </div>
          )
        })()}
      </div>

      {/* Add Parent Modal */}
      <Modal open={showAddParent} onClose={() => setShowAddParent(false)} title="Добавить родителя">
        <form onSubmit={async (e) => {
          e.preventDefault()
          const ph = cleanPhone(parentForm.phone)
          if (!parentForm.name.trim() || ph.length < 11) return
          await addParent({ studentId: student.id, name: parentForm.name.trim(), phone: ph, relation: parentForm.relation, password: parentForm.password })
          setShowAddParent(false)
          setParentForm({ name: '', phone: '', relation: 'mother', password: 'parent123' })
        }} className="space-y-3">
          <input type="text" placeholder="ФИО родителя *" value={parentForm.name} onChange={e => setParentForm(f => ({ ...f, name: e.target.value }))} className={inputCls} required />
          <PhoneInput value={parentForm.phone} onChange={v => setParentForm(f => ({ ...f, phone: v }))} className={inputCls} required />
          <div className="grid grid-cols-2 gap-3">
            <select value={parentForm.relation} onChange={e => setParentForm(f => ({ ...f, relation: e.target.value }))} className={inputCls}>
              <option value="mother">Мать</option>
              <option value="father">Отец</option>
              <option value="guardian">Опекун</option>
              <option value="other">Другое</option>
            </select>
            <input type="text" placeholder="Пароль" value={parentForm.password} onChange={e => setParentForm(f => ({ ...f, password: e.target.value }))} className={inputCls} />
          </div>
          <p className={`text-[10px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>Родитель сможет войти и видеть кабинет ребёнка</p>
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">Добавить</button>
        </form>
      </Modal>

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
            <PhoneInput
              value={form.phone}
              onChange={v => setForm(f => ({ ...f, phone: v }))}
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
              <option value="">— {rankLabel} —</option>
              {rankOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            {/* Multi-group selection */}
            {trainerGroups.length > 0 && (
              <div>
                <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Группы</div>
                <div className="flex flex-wrap gap-2">
                  {trainerGroups.map(g => {
                    const active = form.editGroupIds?.includes(g.id)
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          editGroupIds: active
                            ? (f.editGroupIds || []).filter(id => id !== g.id)
                            : [...(f.editGroupIds || []), g.id]
                        }))}
                        className={`px-3 py-1.5 rounded-2xl text-xs font-bold press-scale transition-all ${
                          active
                            ? 'bg-accent text-white'
                            : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'
                        }`}
                      >
                        {g.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {canEditAdmin && (
              <input
                type="text"
                placeholder="Новый пароль (оставьте пустым)"
                value={form.newPassword || ''}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                className={inputCls}
              />
            )}
            <div className={`flex flex-wrap gap-3 pt-3 ${dark ? 'border-t border-white/[0.06]' : 'border-t border-black/[0.05]'}`}>
              <DateButton label="Рождение" value={form.birthDate || ''} onChange={v => setForm(f => ({ ...f, birthDate: v }))} />
              <DateButton label="Тренируется с" value={form.trainingStartDate || ''} onChange={v => setForm(f => ({ ...f, trainingStartDate: v }))} />
              <DateButton label="Абонемент до" value={form.subscriptionExpiresAt ? new Date(form.subscriptionExpiresAt).toISOString().split('T')[0] : ''} onChange={v => setForm(f => ({ ...f, subscriptionExpiresAt: v }))} />
            </div>
            <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">
              Сохранить
            </button>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
