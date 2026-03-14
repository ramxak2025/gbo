import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shield, Users, Trash2, Plus, Crown, UserMinus, ChevronRight, MapPin, Award, Dumbbell, TrendingUp, Edit3, Building2, DollarSign, BarChart3, Activity, Camera, Phone, Globe } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'
import Avatar from '../components/Avatar'
import { getSportLabel, SPORT_TYPES } from '../utils/sports'
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

export default function ClubDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data, updateClub, deleteClub, assignTrainerToClub, removeTrainerFromClub, addBranch, deleteBranch } = useData()
  const { dark } = useTheme()

  const [showAddTrainer, setShowAddTrainer] = useState(false)
  const [showHeadPicker, setShowHeadPicker] = useState(false)
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [branchForm, setBranchForm] = useState({ name: '', city: '', address: '' })
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [expandedTrainer, setExpandedTrainer] = useState(null)

  const club = (data.clubs || []).find(c => c.id === id)
  const isSuperadmin = auth.role === 'superadmin'
  const isOwner = auth.role === 'club_owner' && auth.user?.clubId === id
  const isAdmin = auth.role === 'club_admin' && auth.user?.clubId === id
  const isHead = auth.role === 'trainer' && auth.user?.isHeadTrainer && auth.user?.clubId === id
  const canManage = isSuperadmin || isOwner || isAdmin || isHead
  // Owners/admins can view but NOT add/remove trainers or themselves
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
    // Finances
    const allTx = data.transactions.filter(t => trainerIds.has(t.trainerId))
    const totalIncome = allTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { trainers: clubTrainers.length, students: allStudents.length, active, groups: allGroups.length, totalIncome, totalExpense, allGroups, allStudents, allTx }
  }, [clubTrainers, data.students, data.groups, data.transactions])

  // Per-group finance stats
  const groupFinances = useMemo(() => {
    return stats.allGroups.map(g => {
      const sgStudentIds = new Set(data.studentGroups.filter(sg => sg.groupId === g.id).map(sg => sg.studentId))
      data.students.forEach(s => { if (s.groupId === g.id) sgStudentIds.add(s.id) })
      const students = data.students.filter(s => sgStudentIds.has(s.id))
      const activeCount = students.filter(s => !isExpired(s.subscriptionExpiresAt)).length
      const expectedIncome = activeCount * (g.subscriptionCost || 0)
      return { ...g, studentCount: students.length, activeCount, expectedIncome }
    })
  }, [stats.allGroups, data.studentGroups, data.students])

  const handleDelete = () => {
    if (confirm('Удалить клуб? Все тренеры будут откреплены.')) {
      deleteClub(id)
      navigate(-1)
    }
  }

  const handleSetHead = (trainerId) => {
    updateClub(id, { headTrainerId: trainerId })
    setShowHeadPicker(false)
  }

  const handleRemoveHead = () => {
    updateClub(id, { headTrainerId: null })
    setShowHeadPicker(false)
  }

  const handleAddTrainer = (trainerId) => {
    assignTrainerToClub(id, trainerId)
    setShowAddTrainer(false)
  }

  const handleRemoveTrainer = (trainerId) => {
    if (confirm('Убрать из клуба?')) {
      removeTrainerFromClub(id, trainerId)
    }
  }

  const handleAddBranch = (e) => {
    e.preventDefault()
    if (!branchForm.name.trim()) return
    addBranch({ clubId: id, name: branchForm.name.trim(), city: branchForm.city.trim(), address: branchForm.address.trim() })
    setBranchForm({ name: '', city: '', address: '' })
    setShowAddBranch(false)
  }

  const handleDeleteBranch = (branchId) => {
    if (confirm('Удалить филиал?')) deleteBranch(branchId)
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
      <PageHeader title="Клуб" back>
        {isSuperadmin && (
          <div className="flex items-center gap-1">
            <button onClick={() => { setEditForm({ name: club.name, city: club.city || '', phone: club.phone || '', vk: club.vk || '', address: club.address || '', logo: club.logo || null }); setShowEdit(true) }} className="press-scale p-2">
              <Edit3 size={18} />
            </button>
            <button onClick={handleDelete} className="press-scale p-2 text-red-400">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </PageHeader>

      <div className="px-4 space-y-4 slide-in">
        {/* Club header card */}
        <div className={`rounded-[28px] p-6 relative overflow-hidden ${
          dark
            ? 'bg-gradient-to-br from-blue-500/15 via-white/[0.04] to-purple-500/15 border border-white/[0.08]'
            : 'bg-gradient-to-br from-blue-50 via-white/80 to-purple-50 border border-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
        }`}>
          <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${dark ? 'bg-blue-500/5' : 'bg-blue-100/40'}`} />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              {club.logo ? (
                <img src={club.logo} alt={club.name} className="w-16 h-16 rounded-[20px] object-cover shrink-0" />
              ) : (
                <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 ${
                  dark ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' : 'bg-gradient-to-br from-blue-100 to-purple-100'
                }`}>
                  <Shield size={28} className={dark ? 'text-blue-400' : 'text-blue-600'} />
                </div>
              )}
              <div>
                <h2 className="text-xl font-black">{club.name}</h2>
                {club.city && (
                  <div className={`flex items-center gap-1 mt-0.5 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                    <MapPin size={12} /> <span className="text-xs font-medium">{club.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sport types */}
            {club.sportTypes?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {club.sportTypes.map(st => (
                  <span key={st} className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    dark ? 'bg-accent/15 text-accent-light border border-accent/20' : 'bg-red-50 text-red-600'
                  }`}>{getSportLabel(st)}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Users, label: 'Тренеры', value: stats.trainers, color: 'text-blue-500' },
            { icon: Award, label: 'Ученики', value: stats.students, color: 'text-accent' },
            { icon: TrendingUp, label: 'Активных', value: stats.active, color: 'text-green-500' },
            { icon: Dumbbell, label: 'Групп', value: stats.groups, color: 'text-purple-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`rounded-[16px] p-2.5 text-center backdrop-blur-xl ${
              dark ? 'bg-white/[0.05] border border-white/[0.07]' : 'bg-white/70 border border-white/60 shadow-sm'
            }`}>
              <Icon size={16} className={`mx-auto mb-1 ${color}`} />
              <div className="text-lg font-black">{value}</div>
              <div className={`text-[9px] uppercase font-semibold ${dark ? 'text-white/30' : 'text-gray-400'}`}>{label}</div>
            </div>
          ))}
        </div>

        {/* Finances overview */}
        {canManage && (
          <div className={`rounded-[20px] p-4 backdrop-blur-xl ${
            dark ? 'bg-white/[0.05] border border-white/[0.07]' : 'bg-white/70 border border-white/60 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={16} className="text-green-500" />
              <span className={`text-xs uppercase font-bold ${dark ? 'text-white/40' : 'text-gray-500'}`}>Финансы клуба</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className={`text-[10px] uppercase font-semibold ${dark ? 'text-white/30' : 'text-gray-400'}`}>Доходы</div>
                <div className="text-lg font-black text-green-500">{stats.totalIncome.toLocaleString('ru-RU')} ₽</div>
              </div>
              <div>
                <div className={`text-[10px] uppercase font-semibold ${dark ? 'text-white/30' : 'text-gray-400'}`}>Расходы</div>
                <div className="text-lg font-black text-red-400">{stats.totalExpense.toLocaleString('ru-RU')} ₽</div>
              </div>
            </div>
            <div className={`mt-2 pt-2 ${dark ? 'border-t border-white/[0.06]' : 'border-t border-black/[0.05]'}`}>
              <div className={`text-[10px] uppercase font-semibold ${dark ? 'text-white/30' : 'text-gray-400'}`}>Баланс</div>
              <div className={`text-xl font-black ${(stats.totalIncome - stats.totalExpense) >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                {(stats.totalIncome - stats.totalExpense).toLocaleString('ru-RU')} ₽
              </div>
            </div>
          </div>
        )}

        {/* Group finances */}
        {canManage && groupFinances.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-purple-500" />
              <h3 className={`text-xs uppercase font-bold ${dark ? 'text-white/40' : 'text-gray-500'}`}>Финансы по группам</h3>
            </div>
            <div className="space-y-2">
              {groupFinances.map(g => (
                <GlassCard key={g.id}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm truncate">{g.name}</div>
                      <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                        {g.activeCount}/{g.studentCount} учеников • {(g.subscriptionCost || 0).toLocaleString('ru-RU')} ₽/мес
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-sm font-black text-green-500">{g.expectedIncome.toLocaleString('ru-RU')} ₽</div>
                      <div className={`text-[9px] uppercase ${dark ? 'text-white/25' : 'text-gray-400'}`}>ожидаемый</div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Branches */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-cyan-500" />
              <h3 className={`text-xs uppercase font-bold ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                Филиалы ({clubBranches.length})
              </h3>
            </div>
            {canManage && (
              <button onClick={() => setShowAddBranch(true)} className="press-scale p-1">
                <Plus size={18} className="text-accent" />
              </button>
            )}
          </div>
          {clubBranches.length > 0 ? (
            <div className="space-y-2">
              {clubBranches.map(b => (
                <GlassCard key={b.id}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm truncate">{b.name}</div>
                      <div className={`text-xs flex items-center gap-1 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                        {b.city && <><MapPin size={10} /> {b.city}</>}
                        {b.city && b.address && <span>•</span>}
                        {b.address && <span>{b.address}</span>}
                      </div>
                    </div>
                    {canManage && (
                      <button onClick={() => handleDeleteBranch(b.id)} className="press-scale p-1.5 shrink-0">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="text-center py-3">
              <p className={`text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>Нет филиалов</p>
            </GlassCard>
          )}
        </div>

        {/* Club owners & admins */}
        {(clubOwners.length > 0 || clubAdmins.length > 0) && (
          <div>
            <h3 className={`text-xs uppercase font-bold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
              Руководство
            </h3>
            <div className="space-y-2">
              {[...clubOwners, ...clubAdmins].map(t => (
                <GlassCard key={t.id}>
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name} src={t.avatar} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm truncate">{t.name}</div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getRoleBadgeCls(t.role, dark)}`}>
                        {getRoleLabel(t.role)}
                      </span>
                    </div>
                    {isSuperadmin && (
                      <button onClick={() => handleRemoveTrainer(t.id)} className="press-scale p-1.5 shrink-0">
                        <UserMinus size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Head trainer */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xs uppercase font-bold ${dark ? 'text-white/40' : 'text-gray-500'}`}>Главный тренер</h3>
            {canManage && clubTrainers.length > 0 && (
              <button onClick={() => setShowHeadPicker(true)} className="press-scale p-1">
                <Edit3 size={14} className="text-accent" />
              </button>
            )}
          </div>
          {headTrainer ? (
            <GlassCard
              onClick={() => canManage && clubTrainers.length > 0 && setShowHeadPicker(true)}
              className={`flex items-center gap-3 ${canManage ? 'cursor-pointer' : ''}`}
            >
              <Avatar name={headTrainer.name} src={headTrainer.avatar} size={44} />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{headTrainer.name}</div>
                <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                  {headTrainer.sportTypes?.map(st => getSportLabel(st)).join(', ') || getSportLabel(headTrainer.sportType)}
                </div>
              </div>
              <Crown size={18} className="text-yellow-400 shrink-0" />
            </GlassCard>
          ) : (
            <GlassCard
              onClick={() => canManage && clubTrainers.length > 0 && setShowHeadPicker(true)}
              className={`text-center py-3 ${canManage && clubTrainers.length > 0 ? 'cursor-pointer' : ''}`}
            >
              <p className={`text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                {clubTrainers.length > 0 ? 'Нажмите, чтобы назначить' : 'Сначала добавьте тренеров'}
              </p>
            </GlassCard>
          )}
        </div>

        {/* Trainers list with expandable stats */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xs uppercase font-bold ${dark ? 'text-white/40' : 'text-gray-500'}`}>
              Тренеры ({clubTrainers.length})
            </h3>
            {canManageTrainers && (
              <button onClick={() => setShowAddTrainer(true)} className="press-scale p-1">
                <Plus size={18} className="text-accent" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {clubTrainers.map(t => {
              const tStudents = data.students.filter(s => s.trainerId === t.id)
              const tActive = tStudents.filter(s => !isExpired(s.subscriptionExpiresAt)).length
              const tGroups = data.groups.filter(g => g.trainerId === t.id)
              const tTx = data.transactions.filter(tx => tx.trainerId === t.id)
              const tIncome = tTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
              const tExpense = tTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
              const expanded = expandedTrainer === t.id
              return (
                <GlassCard key={t.id} onClick={() => setExpandedTrainer(expanded ? null : t.id)} className="cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name} src={t.avatar} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate">{t.name}</span>
                        {t.isHeadTrainer && <Crown size={12} className="text-yellow-400 shrink-0" />}
                      </div>
                      <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                        {tStudents.length} учеников • {tGroups.length} групп
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canManageTrainers && !t.isHeadTrainer && (
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveTrainer(t.id) }} className="press-scale p-1.5">
                          <UserMinus size={14} className="text-red-400" />
                        </button>
                      )}
                      <ChevronRight size={16} className={`transition-transform ${expanded ? 'rotate-90' : ''} ${dark ? 'text-white/15' : 'text-gray-300'}`} />
                    </div>
                  </div>
                  {/* Expanded details */}
                  {expanded && canManage && (
                    <div className={`mt-3 pt-3 space-y-2 ${dark ? 'border-t border-white/[0.06]' : 'border-t border-black/[0.05]'}`}>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <div className="text-sm font-black text-blue-500">{tStudents.length}</div>
                          <div className={`text-[8px] uppercase font-bold ${dark ? 'text-white/25' : 'text-gray-400'}`}>Всего</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-black text-green-500">{tActive}</div>
                          <div className={`text-[8px] uppercase font-bold ${dark ? 'text-white/25' : 'text-gray-400'}`}>Активных</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-black text-purple-500">{tGroups.length}</div>
                          <div className={`text-[8px] uppercase font-bold ${dark ? 'text-white/25' : 'text-gray-400'}`}>Групп</div>
                        </div>
                      </div>
                      <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-[12px] ${dark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                        <div>
                          <div className={`text-[9px] uppercase font-bold ${dark ? 'text-white/25' : 'text-gray-400'}`}>Доходы</div>
                          <div className="text-sm font-bold text-green-500">{tIncome.toLocaleString('ru-RU')} ₽</div>
                        </div>
                        <div>
                          <div className={`text-[9px] uppercase font-bold ${dark ? 'text-white/25' : 'text-gray-400'}`}>Расходы</div>
                          <div className="text-sm font-bold text-red-400">{tExpense.toLocaleString('ru-RU')} ₽</div>
                        </div>
                      </div>
                      {/* Trainer's groups */}
                      {tGroups.length > 0 && (
                        <div>
                          <div className={`text-[9px] uppercase font-bold mb-1 ${dark ? 'text-white/25' : 'text-gray-400'}`}>Группы</div>
                          {tGroups.map(g => {
                            const sgIds = new Set(data.studentGroups.filter(sg => sg.groupId === g.id).map(sg => sg.studentId))
                            data.students.forEach(s => { if (s.groupId === g.id) sgIds.add(s.id) })
                            return (
                              <div key={g.id} className={`flex items-center justify-between py-1.5 text-xs ${dark ? 'text-white/50' : 'text-gray-600'}`}>
                                <span className="font-medium">{g.name}</span>
                                <span>{sgIds.size} чел. • {(g.subscriptionCost || 0).toLocaleString('ru-RU')} ₽</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </div>
        </div>
      </div>

      {/* Head trainer picker modal */}
      <Modal open={showHeadPicker} onClose={() => setShowHeadPicker(false)} title="Назначить главного тренера">
        <div className="space-y-2">
          {clubTrainers.map(t => {
            const isCurrentHead = t.isHeadTrainer
            return (
              <button
                key={t.id}
                onClick={() => !isCurrentHead && handleSetHead(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] press-scale transition-all text-left ${
                  isCurrentHead
                    ? dark
                      ? 'bg-yellow-500/10 border-2 border-yellow-500/30'
                      : 'bg-yellow-50 border-2 border-yellow-400/40'
                    : dark
                      ? 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'
                      : 'bg-white/60 border border-white/50 hover:bg-white/80'
                }`}
              >
                <Avatar name={t.name} src={t.avatar} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">{t.name}</div>
                  <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                    {t.sportTypes?.map(st => getSportLabel(st)).join(', ') || getSportLabel(t.sportType)}
                  </div>
                </div>
                {isCurrentHead ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold uppercase ${dark ? 'text-yellow-400' : 'text-yellow-600'}`}>Главный</span>
                    <Crown size={16} className="text-yellow-400" />
                  </div>
                ) : (
                  <Crown size={16} className={dark ? 'text-white/15' : 'text-gray-200'} />
                )}
              </button>
            )
          })}

          {headTrainer && (
            <button
              onClick={handleRemoveHead}
              className={`w-full py-3 rounded-[16px] text-sm font-medium press-scale mt-2 ${
                dark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-500 border border-red-200'
              }`}
            >
              Снять главного тренера
            </button>
          )}
        </div>
      </Modal>

      {/* Add Trainer/Member Modal */}
      <Modal open={showAddTrainer} onClose={() => setShowAddTrainer(false)} title="Добавить в клуб">
        <div className="space-y-2">
          {availableTrainers.length === 0 ? (
            <p className={`text-center py-6 text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>
              Нет свободных сотрудников
            </p>
          ) : (
            availableTrainers.map(t => (
              <button key={t.id} onClick={() => handleAddTrainer(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] press-scale transition-all text-left ${
                  dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50'
                }`}
              >
                <Avatar name={t.name} src={t.avatar} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{t.name}</div>
                  <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                    <span className={`font-bold ${getRoleBadgeCls(t.role, dark)} px-1.5 py-0.5 rounded-full text-[9px] uppercase`}>{getRoleLabel(t.role)}</span>
                  </div>
                </div>
                <Plus size={16} className="text-accent shrink-0" />
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* Add Branch Modal */}
      <Modal open={showAddBranch} onClose={() => setShowAddBranch(false)} title="Новый филиал">
        <form onSubmit={handleAddBranch} className="space-y-3">
          <input type="text" placeholder="Название филиала *" value={branchForm.name} onChange={e => setBranchForm(f => ({ ...f, name: e.target.value }))} className={inputCls} required />
          <input type="text" placeholder="Город" value={branchForm.city} onChange={e => setBranchForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
          <input type="text" placeholder="Адрес" value={branchForm.address} onChange={e => setBranchForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">Добавить филиал</button>
        </form>
      </Modal>

      {/* Edit Club Modal (superadmin) */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Редактировать клуб">
        {editForm && (
          <form onSubmit={(e) => { e.preventDefault(); updateClub(id, editForm); setShowEdit(false) }} className="space-y-3">
            <div className="flex justify-center">
              <label className="cursor-pointer press-scale">
                {editForm.logo ? (
                  <img src={editForm.logo} alt="Логотип" className="w-20 h-20 rounded-[20px] object-cover" />
                ) : (
                  <div className={`w-20 h-20 rounded-[20px] flex flex-col items-center justify-center gap-1 ${dark ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-gray-50 border border-gray-200'}`}>
                    <Camera size={20} className={dark ? 'text-white/25' : 'text-gray-400'} />
                    <span className={`text-[9px] font-semibold ${dark ? 'text-white/25' : 'text-gray-400'}`}>Логотип</span>
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
            <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">Сохранить</button>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
