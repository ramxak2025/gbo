import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shield, Users, Trash2, Plus, Crown, UserMinus, ChevronRight, ChevronDown, MapPin, Dumbbell, TrendingUp, Edit3, Building2, DollarSign, BarChart3, Camera, Phone, GraduationCap, Star, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'
import Avatar from '../components/Avatar'
import { getSportLabel } from '../utils/sports'
import { api } from '../utils/api'

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

function getRoleLabel(role) {
  if (role === 'club_owner') return 'Владелец'
  if (role === 'club_admin') return 'Администратор'
  return 'Тренер'
}

function getRoleBadgeCls(role, dark) {
  if (role === 'club_owner') return dark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
  if (role === 'club_admin') return dark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'
  return dark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'
}

/* ═══ Scrollable Tab Bar ═══ */
function TabBar({ tabs, active, onChange, dark }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 scrollbar-hide">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all press-scale whitespace-nowrap shrink-0 ${
            active === tab.id
              ? 'bg-accent text-white shadow-lg shadow-accent/20'
              : dark ? 'bg-white/[0.06] text-white/40' : 'bg-white/60 text-gray-500 border border-gray-200/40'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className={`min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[9px] font-black ${
              active === tab.id
                ? 'bg-white/25 text-white'
                : dark ? 'bg-white/[0.06] text-white/25' : 'bg-gray-200/60 text-gray-400'
            }`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ═══ Stat Mini ═══ */
function StatMini({ label, value, color, dark }) {
  const colors = {
    blue: { bg: '#3b82f6', text: 'text-blue-500' },
    green: { bg: '#22c55e', text: 'text-green-500' },
    purple: { bg: '#a855f7', text: 'text-purple-500' },
    amber: { bg: '#f59e0b', text: 'text-amber-500' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`rounded-2xl p-3 text-center ${dark ? 'bg-white/[0.04]' : 'bg-white/50'}`}>
      <div className={`text-xl font-black ${c.text}`}>{value}</div>
      <div className={`text-[9px] uppercase font-bold tracking-wide mt-0.5 ${dark ? 'text-white/30' : 'text-gray-400'}`}>{label}</div>
    </div>
  )
}

export default function ClubDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, updateClub, deleteClub, assignTrainerToClub, removeTrainerFromClub, addBranch, deleteBranch, updateTrainer } = useData()
  const { dark } = useTheme()

  const [activeTab, setActiveTab] = useState('overview')
  const [showAddTrainer, setShowAddTrainer] = useState(false)
  const [showHeadPicker, setShowHeadPicker] = useState(false)
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [branchForm, setBranchForm] = useState({ name: '', city: '', address: '' })
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [expandedTrainer, setExpandedTrainer] = useState(null)
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [expandedBranch, setExpandedBranch] = useState(null)
  const [showBranchAssign, setShowBranchAssign] = useState(null) // branchId to assign trainer to

  const club = (data.clubs || []).find(c => c.id === id)
  const isSuperadmin = auth.role === 'superadmin'
  const isOwner = auth.role === 'club_owner' && auth.user?.clubId === id
  const isAdmin = auth.role === 'club_admin' && auth.user?.clubId === id
  const isHead = auth.role === 'trainer' && auth.user?.isHeadTrainer && auth.user?.clubId === id
  const canManage = isSuperadmin || isOwner || isAdmin || isHead
  const canManageTrainers = isSuperadmin || isHead

  if (!club) {
    return (
      <Layout>
        <PageHeader title="Клуб" back />
        <div className="px-4 py-12 text-center">
          <p className={dark ? 'text-white/40' : 'text-gray-500'}>Клуб не найден</p>
        </div>
      </Layout>
    )
  }

  const clubMembers = data.users.filter(u => u.clubId === id)
  const clubTrainers = clubMembers.filter(u => u.role === 'trainer')
  const clubOwners = clubMembers.filter(u => u.role === 'club_owner')
  const clubAdmins = clubMembers.filter(u => u.role === 'club_admin')
  const headTrainer = clubTrainers.find(t => t.isHeadTrainer)
  const availableTrainers = data.users.filter(u => (u.role === 'trainer' || u.role === 'club_owner' || u.role === 'club_admin') && !u.clubId)
  const clubBranches = (data.branches || []).filter(b => b.clubId === id)

  // Stats
  const stats = useMemo(() => {
    const trainerIds = new Set(clubTrainers.map(t => t.id))
    const allStudents = data.students.filter(s => trainerIds.has(s.trainerId))
    const active = allStudents.filter(s => !isExpired(s.subscriptionExpiresAt)).length
    const allGroups = data.groups.filter(g => trainerIds.has(g.trainerId))
    const allTx = data.transactions.filter(t => trainerIds.has(t.trainerId))
    const totalIncome = allTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { trainers: clubTrainers.length, students: allStudents.length, active, groups: allGroups.length, totalIncome, totalExpense, allGroups, allStudents, allTx }
  }, [clubTrainers, data.students, data.groups, data.transactions])

  // Build hierarchy: branch -> trainers -> groups -> students
  const branchHierarchy = useMemo(() => {
    return clubBranches.map(branch => {
      const branchTrainers = clubTrainers.filter(t => t.branchId === branch.id)
      const trainersWithData = branchTrainers.map(trainer => {
        const groups = data.groups.filter(g => g.trainerId === trainer.id)
        const students = data.students.filter(s => s.trainerId === trainer.id)
        const activeStudents = students.filter(s => !isExpired(s.subscriptionExpiresAt)).length
        return { ...trainer, groups, students, activeStudents }
      })
      const totalStudents = trainersWithData.reduce((s, t) => s + t.students.length, 0)
      const totalActive = trainersWithData.reduce((s, t) => s + t.activeStudents, 0)
      return { ...branch, trainers: trainersWithData, totalStudents, totalActive }
    })
  }, [clubBranches, clubTrainers, data.groups, data.students])

  // Trainers without branch
  const unassignedTrainers = useMemo(() => {
    const branchTrainerIds = new Set(clubBranches.flatMap(b => clubTrainers.filter(t => t.branchId === b.id).map(t => t.id)))
    return clubTrainers.filter(t => !branchTrainerIds.has(t.id)).map(trainer => {
      const groups = data.groups.filter(g => g.trainerId === trainer.id)
      const students = data.students.filter(s => s.trainerId === trainer.id)
      const activeStudents = students.filter(s => !isExpired(s.subscriptionExpiresAt)).length
      return { ...trainer, groups, students, activeStudents }
    })
  }, [clubTrainers, clubBranches, data.groups, data.students])

  // Per-group finance stats
  const groupFinances = useMemo(() => {
    return stats.allGroups.map(g => {
      const sgStudentIds = new Set(data.studentGroups.filter(sg => sg.groupId === g.id).map(sg => sg.studentId))
      data.students.forEach(s => { if (s.groupId === g.id) sgStudentIds.add(s.id) })
      const students = data.students.filter(s => sgStudentIds.has(s.id))
      const activeCount = students.filter(s => !isExpired(s.subscriptionExpiresAt)).length
      const expectedIncome = activeCount * (g.subscriptionCost || 0)
      const trainer = clubTrainers.find(t => t.id === g.trainerId)
      return { ...g, studentCount: students.length, activeCount, expectedIncome, trainerName: trainer?.name || '—', students }
    })
  }, [stats.allGroups, data.studentGroups, data.students, clubTrainers])

  const handleDelete = () => { if (confirm('Удалить клуб?')) { deleteClub(id); navigate(-1) } }
  const handleSetHead = (trainerId) => { updateClub(id, { headTrainerId: trainerId }); setShowHeadPicker(false) }
  const handleRemoveHead = () => { updateClub(id, { headTrainerId: null }); setShowHeadPicker(false) }
  const handleAddTrainer = (trainerId) => { assignTrainerToClub(id, trainerId); setShowAddTrainer(false) }
  const handleRemoveTrainer = (trainerId) => { if (confirm('Убрать из клуба?')) removeTrainerFromClub(id, trainerId) }
  const handleAddBranch = (e) => {
    e.preventDefault()
    if (!branchForm.name.trim()) return
    addBranch({ clubId: id, name: branchForm.name.trim(), city: branchForm.city.trim(), address: branchForm.address.trim() })
    setBranchForm({ name: '', city: '', address: '' })
    setShowAddBranch(false)
  }
  const handleDeleteBranch = (branchId) => { if (confirm('Удалить филиал?')) deleteBranch(branchId) }
  const handleAssignToBranch = (trainerId, branchId) => { updateTrainer(trainerId, { branchId }); setShowBranchAssign(null) }
  const handleRemoveFromBranch = (trainerId) => { updateTrainer(trainerId, { branchId: null }) }

  const inputCls = `w-full px-4 py-3 rounded-2xl text-base outline-none transition-all ${
    dark
      ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50'
      : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 shadow-sm'
  }`

  /* ── Render trainer card (reusable) ── */
  const renderTrainerCard = (t) => {
    const expanded = expandedTrainer === t.id
    const tTx = canManage ? data.transactions.filter(tx => tx.trainerId === t.id) : []
    const tIncome = tTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
    const tExpense = tTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)

    return (
      <div key={t.id} className={`rounded-2xl overflow-hidden transition-all ${
        dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-sm'
      }`}>
        <div onClick={() => setExpandedTrainer(expanded ? null : t.id)} className="flex items-center gap-3 p-3.5 cursor-pointer">
          <div className="relative">
            <Avatar name={t.name} src={t.avatar} size={40} />
            {t.isHeadTrainer && (
              <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm" style={{ width: 18, height: 18 }}>
                <Crown size={9} className="text-yellow-900" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[13px] truncate">{t.name}</span>
              {t.rank && <span className={`px-1.5 py-px rounded-lg text-[8px] font-bold ${dark ? 'bg-purple-500/12 text-purple-300' : 'bg-purple-50 text-purple-600'}`}>{t.rank}</span>}
            </div>
            <div className={`flex items-center gap-2 mt-0.5 text-[11px] ${dark ? 'text-white/30' : 'text-gray-500'}`}>
              <span>{t.students?.length || 0} уч.</span>
              <span>·</span>
              <span>{t.groups?.length || 0} гр.</span>
              {(t.activeStudents || 0) > 0 && <><span>·</span><span className="text-green-500">{t.activeStudents} акт.</span></>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canManageTrainers && !t.isHeadTrainer && (
              <button onClick={(e) => { e.stopPropagation(); handleRemoveTrainer(t.id) }} className="press-scale p-1">
                <UserMinus size={13} className="text-red-400/60" />
              </button>
            )}
            <ChevronRight size={14} className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''} ${dark ? 'text-white/12' : 'text-gray-300'}`} />
          </div>
        </div>

        {expanded && (
          <div className={`px-3.5 pb-3.5 space-y-2.5 animate-in ${dark ? 'border-t border-white/[0.05]' : 'border-t border-black/[0.04]'}`}>
            <div className="pt-2.5 grid grid-cols-3 gap-2">
              <StatMini label="Всего" value={t.students?.length || 0} color="blue" dark={dark} />
              <StatMini label="Активных" value={t.activeStudents || 0} color="green" dark={dark} />
              <StatMini label="Групп" value={t.groups?.length || 0} color="purple" dark={dark} />
            </div>

            {canManage && (tIncome > 0 || tExpense > 0) && (
              <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-xl ${dark ? 'bg-white/[0.03]' : 'bg-gray-50/60'}`}>
                <div>
                  <div className={`text-[8px] uppercase font-bold ${dark ? 'text-white/20' : 'text-gray-400'}`}>Доходы</div>
                  <div className="text-sm font-bold text-green-500">{tIncome.toLocaleString('ru-RU')} ₽</div>
                </div>
                <div>
                  <div className={`text-[8px] uppercase font-bold ${dark ? 'text-white/20' : 'text-gray-400'}`}>Расходы</div>
                  <div className="text-sm font-bold text-red-400">{tExpense.toLocaleString('ru-RU')} ₽</div>
                </div>
              </div>
            )}

            {(t.groups || []).length > 0 && (
              <div>
                <div className={`text-[8px] uppercase font-bold mb-1.5 tracking-wide ${dark ? 'text-white/20' : 'text-gray-400'}`}>Группы</div>
                {t.groups.map(g => {
                  const sgIds = new Set(data.studentGroups.filter(sg => sg.groupId === g.id).map(sg => sg.studentId))
                  data.students.forEach(s => { if (s.groupId === g.id) sgIds.add(s.id) })
                  const gExpanded = expandedGroup === g.id
                  const gStudents = data.students.filter(s => sgIds.has(s.id))
                  const gActive = gStudents.filter(s => !isExpired(s.subscriptionExpiresAt)).length

                  return (
                    <div key={g.id} className={`rounded-xl overflow-hidden mb-1.5 ${dark ? 'bg-white/[0.03]' : 'bg-white/40'}`}>
                      <div onClick={() => setExpandedGroup(gExpanded ? null : g.id)}
                        className="flex items-center justify-between px-3 py-2 cursor-pointer">
                        <div className="flex items-center gap-2 min-w-0">
                          <Dumbbell size={12} className="text-purple-400 shrink-0" />
                          <span className={`text-[12px] font-semibold truncate ${dark ? 'text-white/60' : 'text-gray-700'}`}>{g.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                            <span className="text-green-500 font-bold">{gActive}</span>/{sgIds.size}
                          </span>
                          {(g.subscriptionCost || 0) > 0 && (
                            <span className={`text-[10px] font-semibold ${dark ? 'text-white/20' : 'text-gray-400'}`}>
                              {g.subscriptionCost.toLocaleString('ru-RU')} ₽
                            </span>
                          )}
                          <ChevronDown size={12} className={`transition-transform ${gExpanded ? 'rotate-180' : ''} ${dark ? 'text-white/15' : 'text-gray-300'}`} />
                        </div>
                      </div>

                      {gExpanded && gStudents.length > 0 && (
                        <div className={`px-3 pb-2.5 space-y-1 animate-in ${dark ? 'border-t border-white/[0.04]' : 'border-t border-black/[0.03]'}`}>
                          {gStudents.map(s => {
                            const sExpired = isExpired(s.subscriptionExpiresAt)
                            return (
                              <div key={s.id} className="flex items-center gap-2 py-1.5">
                                <Avatar name={s.name} src={s.avatar} size={28} />
                                <div className="min-w-0 flex-1">
                                  <span className={`text-[11px] font-medium truncate block ${dark ? 'text-white/50' : 'text-gray-600'}`}>{s.name}</span>
                                </div>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sExpired ? 'bg-red-400' : 'bg-green-400'}`} />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Layout>
      <PageHeader title="Клуб" back>
        {(isSuperadmin || isOwner) && (
          <div className="flex items-center gap-1">
            <button onClick={() => { setEditForm({ name: club.name, city: club.city || '', phone: club.phone || '', vk: club.vk || '', address: club.address || '', logo: club.logo || null }); setShowEdit(true) }} className="press-scale p-2">
              <Edit3 size={18} />
            </button>
            {isSuperadmin && (
              <button onClick={handleDelete} className="press-scale p-2 text-red-400">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
      </PageHeader>

      <div className="px-4 space-y-4 pb-4 slide-in">
        {/* ═══ Hero Card ═══ */}
        <div className={`rounded-[24px] overflow-hidden relative ${
          dark
            ? 'bg-gradient-to-br from-blue-500/12 via-white/[0.03] to-purple-500/12 border border-white/[0.07]'
            : 'bg-gradient-to-br from-blue-50/80 via-white/70 to-purple-50/80 border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.05)]'
        }`}>
          <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full ${dark ? 'bg-blue-500/5' : 'bg-blue-100/30'}`} />
          <div className="relative p-5">
            <div className="flex items-center gap-3.5">
              {club.logo ? (
                <img src={club.logo} alt={club.name} className="w-14 h-14 rounded-2xl object-cover shrink-0 ring-2 ring-white/10" />
              ) : (
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  dark ? 'bg-gradient-to-br from-blue-500/15 to-purple-500/15' : 'bg-gradient-to-br from-blue-100 to-purple-100'
                }`}>
                  <Shield size={24} className={dark ? 'text-blue-400' : 'text-blue-600'} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black truncate">{club.name}</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {club.city && (
                    <span className={`flex items-center gap-1 text-[11px] ${dark ? 'text-white/35' : 'text-gray-500'}`}>
                      <MapPin size={10} />{club.city}
                    </span>
                  )}
                  {club.phone && (
                    <span className={`flex items-center gap-1 text-[11px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                      <Phone size={10} />{club.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {club.sportTypes?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {club.sportTypes.map(st => (
                  <span key={st} className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                    dark ? 'bg-accent/12 text-accent-light' : 'bg-red-50 text-red-600'
                  }`}>{getSportLabel(st)}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Tabs ═══ */}
        <TabBar
          dark={dark}
          active={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'overview', label: 'Обзор' },
            { id: 'structure', label: 'Филиалы', count: clubBranches.length },
            { id: 'trainers', label: 'Тренеры', count: clubTrainers.length },
            { id: 'groups', label: 'Группы', count: stats.groups },
          ]}
        />

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              <StatMini label="Тренеры" value={stats.trainers} color="blue" dark={dark} />
              <StatMini label="Ученики" value={stats.students} color="purple" dark={dark} />
              <StatMini label="Активных" value={stats.active} color="green" dark={dark} />
              <StatMini label="Групп" value={stats.groups} color="amber" dark={dark} />
            </div>

            {/* Finance */}
            {canManage && (stats.totalIncome > 0 || stats.totalExpense > 0) && (
              <div className={`rounded-2xl p-4 ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign size={14} className="text-green-500" />
                  <span className={`text-[10px] uppercase font-bold tracking-wide ${dark ? 'text-white/35' : 'text-gray-500'}`}>Финансы</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className={`text-[9px] uppercase font-semibold mb-0.5 ${dark ? 'text-white/25' : 'text-gray-400'}`}>Доход</div>
                    <div className="text-base font-black text-green-500">{stats.totalIncome.toLocaleString('ru-RU')} <span className="text-[10px]">₽</span></div>
                  </div>
                  <div>
                    <div className={`text-[9px] uppercase font-semibold mb-0.5 ${dark ? 'text-white/25' : 'text-gray-400'}`}>Расход</div>
                    <div className="text-base font-black text-red-400">{stats.totalExpense.toLocaleString('ru-RU')} <span className="text-[10px]">₽</span></div>
                  </div>
                  <div>
                    <div className={`text-[9px] uppercase font-semibold mb-0.5 ${dark ? 'text-white/25' : 'text-gray-400'}`}>Баланс</div>
                    <div className={`text-base font-black ${(stats.totalIncome - stats.totalExpense) >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {(stats.totalIncome - stats.totalExpense).toLocaleString('ru-RU')} <span className="text-[10px]">₽</span>
                    </div>
                  </div>
                </div>
                {stats.totalIncome > 0 && (
                  <div className={`h-1.5 rounded-full overflow-hidden mt-3 ${dark ? 'bg-white/[0.05]' : 'bg-gray-100'}`}>
                    <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, ((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100))}%` }} />
                  </div>
                )}
              </div>
            )}

            {/* Leadership */}
            {(clubOwners.length > 0 || clubAdmins.length > 0 || headTrainer) && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-[10px] uppercase font-bold tracking-wide flex items-center gap-1.5 ${dark ? 'text-white/35' : 'text-gray-500'}`}>
                    <Crown size={12} className="text-yellow-400" /> Руководство
                  </span>
                  {canManage && clubTrainers.length > 0 && (
                    <button onClick={() => setShowHeadPicker(true)} className="press-scale p-1">
                      <Edit3 size={13} className="text-accent" />
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {[...clubOwners, ...clubAdmins].map(u => (
                    <div key={u.id} className={`flex items-center gap-3 p-3 rounded-2xl ${dark ? 'bg-white/[0.04]' : 'bg-white/50'}`}>
                      <Avatar name={u.name} src={u.avatar} size={36} />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-[13px] truncate block">{u.name}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-px rounded-lg ${getRoleBadgeCls(u.role, dark)}`}>{getRoleLabel(u.role)}</span>
                      </div>
                    </div>
                  ))}
                  {headTrainer && (
                    <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                      dark ? 'bg-yellow-500/5 border border-yellow-500/10' : 'bg-yellow-50/60 border border-yellow-200/40'
                    }`}>
                      <div className="relative">
                        <Avatar name={headTrainer.name} src={headTrainer.avatar} size={36} />
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                          <Crown size={8} className="text-yellow-900" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-[13px] truncate block">{headTrainer.name}</span>
                        <span className={`text-[9px] font-bold uppercase ${dark ? 'text-yellow-400' : 'text-yellow-600'}`}>Главный тренер</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ STRUCTURE TAB — Branches with nested hierarchy ═══ */}
        {activeTab === 'structure' && (
          <div className="space-y-3">
            {canManage && (
              <button onClick={() => setShowAddBranch(true)}
                className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed press-scale transition-all ${
                  dark ? 'border-white/[0.07] text-white/35 hover:border-accent/25 hover:text-accent'
                    : 'border-gray-200 text-gray-400 hover:border-accent/35 hover:text-accent'
                }`}>
                <Plus size={16} /><span className="font-bold text-[13px]">Добавить филиал</span>
              </button>
            )}

            {branchHierarchy.map(branch => {
              const bExpanded = expandedBranch === branch.id
              return (
                <div key={branch.id} className={`rounded-2xl overflow-hidden ${
                  dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-sm'
                }`}>
                  {/* Branch header */}
                  <div onClick={() => setExpandedBranch(bExpanded ? null : branch.id)} className="flex items-center gap-3 p-4 cursor-pointer">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-cyan-500/10' : 'bg-cyan-50'}`}>
                      <Building2 size={18} className="text-cyan-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[14px]">{branch.name}</div>
                      <div className={`flex items-center gap-2 mt-0.5 text-[11px] ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                        {branch.city && <span className="flex items-center gap-0.5"><MapPin size={9} />{branch.city}</span>}
                        <span>{branch.trainers.length} тренеров</span>
                        <span>·</span>
                        <span className="text-green-500">{branch.totalActive}/{branch.totalStudents}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canManage && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteBranch(branch.id) }} className="press-scale p-1">
                          <Trash2 size={13} className="text-red-400/50" />
                        </button>
                      )}
                      <ChevronRight size={14} className={`transition-transform duration-200 ${bExpanded ? 'rotate-90' : ''} ${dark ? 'text-white/12' : 'text-gray-300'}`} />
                    </div>
                  </div>

                  {/* Nested trainers */}
                  {bExpanded && (
                    <div className={`px-3 pb-3 space-y-2 animate-in ${dark ? 'border-t border-white/[0.05]' : 'border-t border-black/[0.04]'}`}>
                      {branch.trainers.length > 0 ? (
                        branch.trainers.map(t => (
                          <div key={t.id} className="pt-2 relative">
                            {renderTrainerCard(t)}
                            {canManage && (
                              <button
                                onClick={() => handleRemoveFromBranch(t.id)}
                                className={`absolute top-4 right-12 press-scale p-1 rounded-lg ${dark ? 'bg-red-500/10' : 'bg-red-50'}`}
                                title="Убрать из филиала"
                              >
                                <UserMinus size={12} className="text-red-400" />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className={`text-center py-3 text-[12px] ${dark ? 'text-white/20' : 'text-gray-400'}`}>Нет тренеров</p>
                      )}
                      {canManage && (
                        <button
                          onClick={() => setShowBranchAssign(branch.id)}
                          className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed press-scale text-[12px] font-semibold transition-all ${
                            dark ? 'border-white/[0.08] text-white/30 hover:border-accent/30 hover:text-accent' : 'border-gray-200 text-gray-400 hover:border-accent/40 hover:text-accent'
                          }`}
                        >
                          <Plus size={13} /> Добавить тренера в филиал
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Unassigned trainers */}
            {unassignedTrainers.length > 0 && clubBranches.length > 0 && (
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-wide mb-2 block ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                  Без филиала
                </span>
                <div className="space-y-2">
                  {unassignedTrainers.map(renderTrainerCard)}
                </div>
              </div>
            )}

            {clubBranches.length === 0 && (
              <div className="text-center py-10">
                <Building2 size={28} className={dark ? 'text-white/10 mx-auto mb-2' : 'text-gray-200 mx-auto mb-2'} />
                <p className={`text-[13px] font-medium ${dark ? 'text-white/30' : 'text-gray-400'}`}>Нет филиалов</p>
                <p className={`text-[11px] mt-0.5 ${dark ? 'text-white/15' : 'text-gray-300'}`}>Добавьте филиал клуба</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ TRAINERS TAB ═══ */}
        {activeTab === 'trainers' && (
          <div className="space-y-2.5">
            {canManageTrainers && (
              <button onClick={() => setShowAddTrainer(true)}
                className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed press-scale transition-all ${
                  dark ? 'border-white/[0.07] text-white/35 hover:border-accent/25 hover:text-accent'
                    : 'border-gray-200 text-gray-400 hover:border-accent/35 hover:text-accent'
                }`}>
                <Plus size={16} /><span className="font-bold text-[13px]">Добавить тренера</span>
              </button>
            )}

            {(clubBranches.length > 0 ? [...unassignedTrainers] : clubTrainers.map(t => {
              const groups = data.groups.filter(g => g.trainerId === t.id)
              const students = data.students.filter(s => s.trainerId === t.id)
              const activeStudents = students.filter(s => !isExpired(s.subscriptionExpiresAt)).length
              return { ...t, groups, students, activeStudents }
            })).length > 0 ? (
              (clubBranches.length > 0 ? [...unassignedTrainers] : clubTrainers.map(t => {
                const groups = data.groups.filter(g => g.trainerId === t.id)
                const students = data.students.filter(s => s.trainerId === t.id)
                const activeStudents = students.filter(s => !isExpired(s.subscriptionExpiresAt)).length
                return { ...t, groups, students, activeStudents }
              })).map(renderTrainerCard)
            ) : (
              <div className="text-center py-10">
                <GraduationCap size={28} className={dark ? 'text-white/10 mx-auto mb-2' : 'text-gray-200 mx-auto mb-2'} />
                <p className={`text-[13px] font-medium ${dark ? 'text-white/30' : 'text-gray-400'}`}>Нет тренеров</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ GROUPS TAB ═══ */}
        {activeTab === 'groups' && (
          <div className="space-y-2.5">
            {canManage && groupFinances.length > 0 && (
              <div className={`rounded-2xl p-3.5 flex items-center justify-between ${
                dark ? 'bg-green-500/5 border border-white/[0.06]' : 'bg-green-50/40 border border-white/50 shadow-sm'
              }`}>
                <span className={`text-[10px] uppercase font-bold tracking-wide ${dark ? 'text-white/35' : 'text-gray-500'}`}>Ожидаемый доход</span>
                <span className="text-base font-black text-green-500">
                  {groupFinances.reduce((s, g) => s + g.expectedIncome, 0).toLocaleString('ru-RU')} ₽
                </span>
              </div>
            )}

            {groupFinances.length > 0 ? (
              groupFinances.map(g => {
                const expanded = expandedGroup === g.id
                return (
                  <div key={g.id} className={`rounded-2xl overflow-hidden ${
                    dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50 shadow-sm'
                  }`}>
                    <div onClick={() => setExpandedGroup(expanded ? null : g.id)} className="flex items-center gap-3 p-3.5 cursor-pointer">
                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                        <Dumbbell size={16} className="text-purple-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[13px] truncate">{g.name}</div>
                        <div className={`flex items-center gap-2 mt-0.5 text-[11px] ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                          <span>{g.trainerName}</span>
                          <span>·</span>
                          <span className="text-green-500">{g.activeCount}/{g.studentCount}</span>
                        </div>
                      </div>
                      {canManage && (
                        <div className="text-right shrink-0">
                          <div className="text-[13px] font-black text-green-500">{g.expectedIncome.toLocaleString('ru-RU')} ₽</div>
                          <div className={`text-[8px] uppercase ${dark ? 'text-white/20' : 'text-gray-400'}`}>ожидаемый</div>
                        </div>
                      )}
                      <ChevronRight size={14} className={`transition-transform shrink-0 ${expanded ? 'rotate-90' : ''} ${dark ? 'text-white/12' : 'text-gray-300'}`} />
                    </div>

                    {expanded && (
                      <div className={`px-3.5 pb-3.5 animate-in ${dark ? 'border-t border-white/[0.05]' : 'border-t border-black/[0.04]'}`}>
                        <div className="pt-2.5 grid grid-cols-3 gap-2 mb-2.5">
                          <StatMini label="Всего" value={g.studentCount} color="blue" dark={dark} />
                          <StatMini label="Активных" value={g.activeCount} color="green" dark={dark} />
                          <StatMini label="₽/мес" value={(g.subscriptionCost || 0).toLocaleString('ru-RU')} color="purple" dark={dark} />
                        </div>

                        {/* Students list */}
                        {g.students.length > 0 && (
                          <div>
                            <div className={`text-[8px] uppercase font-bold mb-1.5 tracking-wide ${dark ? 'text-white/20' : 'text-gray-400'}`}>Ученики</div>
                            <div className="space-y-1">
                              {g.students.map(s => (
                                <div key={s.id} className="flex items-center gap-2 py-1">
                                  <Avatar name={s.name} src={s.avatar} size={26} />
                                  <span className={`text-[11px] font-medium truncate flex-1 ${dark ? 'text-white/50' : 'text-gray-600'}`}>{s.name}</span>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isExpired(s.subscriptionExpiresAt) ? 'bg-red-400' : 'bg-green-400'}`} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-10">
                <Dumbbell size={28} className={dark ? 'text-white/10 mx-auto mb-2' : 'text-gray-200 mx-auto mb-2'} />
                <p className={`text-[13px] font-medium ${dark ? 'text-white/30' : 'text-gray-400'}`}>Нет групп</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ MODALS ═══ */}
      <Modal open={showHeadPicker} onClose={() => setShowHeadPicker(false)} title="Главный тренер">
        <div className="space-y-2">
          {clubTrainers.map(t => (
            <button key={t.id} onClick={() => !t.isHeadTrainer && handleSetHead(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl press-scale text-left ${
                t.isHeadTrainer
                  ? dark ? 'bg-yellow-500/10 border-2 border-yellow-500/25' : 'bg-yellow-50 border-2 border-yellow-300/40'
                  : dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50'
              }`}>
              <Avatar name={t.name} src={t.avatar} size={36} />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[13px] truncate">{t.name}</div>
              </div>
              {t.isHeadTrainer ? <Crown size={16} className="text-yellow-400" /> : <Crown size={16} className={dark ? 'text-white/12' : 'text-gray-200'} />}
            </button>
          ))}
          {headTrainer && (
            <button onClick={handleRemoveHead}
              className={`w-full py-3 rounded-2xl text-sm font-medium press-scale mt-1 ${
                dark ? 'bg-red-500/8 text-red-400 border border-red-500/15' : 'bg-red-50 text-red-500 border border-red-200'
              }`}>Снять главного тренера</button>
          )}
        </div>
      </Modal>

      <Modal open={showAddTrainer} onClose={() => setShowAddTrainer(false)} title="Добавить в клуб">
        <div className="space-y-2">
          {availableTrainers.length === 0 ? (
            <p className={`text-center py-6 text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>Нет свободных сотрудников</p>
          ) : availableTrainers.map(t => (
            <button key={t.id} onClick={() => handleAddTrainer(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl press-scale text-left ${
                dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50'
              }`}>
              <Avatar name={t.name} src={t.avatar} size={34} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[13px] truncate">{t.name}</div>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-px rounded-lg ${getRoleBadgeCls(t.role, dark)}`}>{getRoleLabel(t.role)}</span>
              </div>
              <Plus size={14} className="text-accent shrink-0" />
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={showAddBranch} onClose={() => setShowAddBranch(false)} title="Новый филиал">
        <form onSubmit={handleAddBranch} className="space-y-3">
          <input type="text" placeholder="Название филиала *" value={branchForm.name} onChange={e => setBranchForm(f => ({ ...f, name: e.target.value }))} className={inputCls} required />
          <input type="text" placeholder="Город" value={branchForm.city} onChange={e => setBranchForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
          <input type="text" placeholder="Адрес" value={branchForm.address} onChange={e => setBranchForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
          <button type="submit" className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold press-scale">Добавить филиал</button>
        </form>
      </Modal>

      <Modal open={!!showBranchAssign} onClose={() => setShowBranchAssign(null)} title="Добавить тренера в филиал">
        <div className="space-y-2">
          {(() => {
            const branchTrainerIds = new Set(
              clubTrainers.filter(t => t.branchId === showBranchAssign).map(t => t.id)
            )
            const available = clubTrainers.filter(t => !branchTrainerIds.has(t.id))
            if (available.length === 0) return (
              <p className={`text-center py-6 text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>Все тренеры клуба уже в этом филиале</p>
            )
            return available.map(t => (
              <button key={t.id} onClick={() => handleAssignToBranch(t.id, showBranchAssign)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl press-scale text-left ${
                  dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50'
                }`}>
                <Avatar name={t.name} src={t.avatar} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[13px] truncate">{t.name}</div>
                  {t.branchId && (
                    <span className={`text-[10px] ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                      Сейчас: {(data.branches || []).find(b => b.id === t.branchId)?.name || '—'}
                    </span>
                  )}
                </div>
                <Plus size={14} className="text-accent shrink-0" />
              </button>
            ))
          })()}
        </div>
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Редактировать клуб">
        {editForm && (
          <form onSubmit={(e) => { e.preventDefault(); updateClub(id, editForm); setShowEdit(false) }} className="space-y-3">
            <div className="flex justify-center">
              <label className="cursor-pointer press-scale">
                {editForm.logo ? (
                  <img src={editForm.logo} alt="Логотип" className="w-16 h-16 rounded-2xl object-cover" />
                ) : (
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 ${dark ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-gray-50 border border-gray-200'}`}>
                    <Camera size={18} className={dark ? 'text-white/25' : 'text-gray-400'} />
                    <span className={`text-[8px] font-semibold ${dark ? 'text-white/20' : 'text-gray-400'}`}>Логотип</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={async (ev) => {
                  const file = ev.target.files?.[0]
                  if (!file) return
                  try { const url = await api.uploadFile(file); setEditForm(f => ({ ...f, logo: url })) } catch { alert('Ошибка загрузки') }
                }} />
              </label>
            </div>
            <input type="text" placeholder="Название" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            <input type="text" placeholder="Город" value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
            <input type="text" placeholder="Адрес" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
            <input type="tel" placeholder="Телефон" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
            <input type="url" placeholder="Страница ВКонтакте" value={editForm.vk} onChange={e => setEditForm(f => ({ ...f, vk: e.target.value }))} className={inputCls} />
            <button type="submit" className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold press-scale">Сохранить</button>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
