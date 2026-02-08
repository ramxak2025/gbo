import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingUp, TrendingDown, AlertCircle, Newspaper, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function isExpired(dateStr) {
  if (!dateStr) return true
  return new Date(dateStr) < new Date()
}

export default function Dashboard() {
  const { auth } = useAuth()
  const { data } = useData()
  const { dark } = useTheme()
  const navigate = useNavigate()

  if (auth.role === 'superadmin') return <SuperAdminDash data={data} dark={dark} navigate={navigate} />
  if (auth.role === 'trainer') return <TrainerDash auth={auth} data={data} dark={dark} navigate={navigate} />
  return <StudentDash auth={auth} data={data} dark={dark} navigate={navigate} />
}

function SuperAdminDash({ data, dark, navigate }) {
  const trainers = data.users.filter(u => u.role === 'trainer')
  const totalStudents = data.students.length

  return (
    <Layout>
      <PageHeader title="iBorcuha" logo />
      <div className="px-4 space-y-4 slide-in">
        <div className="grid grid-cols-2 gap-3">
          <GlassCard>
            <div className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>Тренеры</div>
            <div className="text-3xl font-black mt-1">{trainers.length}</div>
          </GlassCard>
          <GlassCard>
            <div className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>Спортсмены</div>
            <div className="text-3xl font-black mt-1">{totalStudents}</div>
          </GlassCard>
        </div>

        <div>
          <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Клубы</h2>
          <div className="space-y-2">
            {trainers.map(t => {
              const count = data.students.filter(s => s.trainerId === t.id).length
              return (
                <GlassCard key={t.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{t.clubName}</div>
                    <div className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>{t.name}</div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Users size={14} />
                    <span>{count}</span>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Ближайшие турниры</h2>
          <div className="space-y-2">
            {data.tournaments
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .slice(0, 3)
              .map(t => (
                <GlassCard key={t.id} onClick={() => navigate(`/tournaments/${t.id}`)}>
                  <div className="font-bold">{t.title}</div>
                  <div className={`text-sm mt-1 flex items-center gap-1 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                    <Calendar size={13} />
                    {formatDate(t.date)} — {t.location}
                  </div>
                </GlassCard>
              ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function TrainerDash({ auth, data, dark, navigate }) {
  const myStudents = data.students.filter(s => s.trainerId === auth.userId)
  const myGroups = data.groups.filter(g => g.trainerId === auth.userId)
  const myTx = data.transactions.filter(t => t.trainerId === auth.userId)
  const myNews = data.news.filter(n => n.trainerId === auth.userId)

  const stats = useMemo(() => {
    const active = myStudents.filter(s => !isExpired(s.subscriptionExpiresAt)).length
    const debtors = myStudents.filter(s => isExpired(s.subscriptionExpiresAt)).length
    const income = myTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = myTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    return { total: myStudents.length, active, debtors, income, expense, balance: income - expense }
  }, [myStudents, myTx])

  return (
    <Layout>
      <PageHeader title={auth.user?.clubName || 'Мой клуб'} logo />
      <div className="px-4 space-y-4 slide-in">
        <div className="grid grid-cols-3 gap-2">
          <GlassCard className="text-center">
            <Users size={18} className="mx-auto mb-1 text-accent" />
            <div className="text-2xl font-black">{stats.total}</div>
            <div className={`text-[10px] uppercase ${dark ? 'text-white/40' : 'text-gray-400'}`}>Всего</div>
          </GlassCard>
          <GlassCard className="text-center">
            <TrendingUp size={18} className="mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-black">{stats.active}</div>
            <div className={`text-[10px] uppercase ${dark ? 'text-white/40' : 'text-gray-400'}`}>Активных</div>
          </GlassCard>
          <GlassCard className="text-center">
            <AlertCircle size={18} className="mx-auto mb-1 text-accent" />
            <div className="text-2xl font-black">{stats.debtors}</div>
            <div className={`text-[10px] uppercase ${dark ? 'text-white/40' : 'text-gray-400'}`}>Должников</div>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>Баланс</div>
              <div className={`text-2xl font-black ${stats.balance >= 0 ? 'text-green-500' : 'text-accent'}`}>
                {stats.balance.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-500 text-sm">
                <TrendingUp size={14} />
                +{stats.income.toLocaleString('ru-RU')} ₽
              </div>
              <div className="flex items-center gap-1 text-accent text-sm">
                <TrendingDown size={14} />
                -{stats.expense.toLocaleString('ru-RU')} ₽
              </div>
            </div>
          </div>
        </GlassCard>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-sm uppercase font-bold ${dark ? 'text-white/50' : 'text-gray-500'}`}>Группы</h2>
            <button
              onClick={() => navigate('/groups')}
              className="text-accent text-xs font-semibold press-scale"
            >
              Управление
            </button>
          </div>
          <div className="space-y-2">
            {myGroups.map(g => {
              const count = myStudents.filter(s => s.groupId === g.id).length
              return (
                <GlassCard key={g.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{g.name}</div>
                    <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{g.schedule}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{count} чел.</span>
                    <span className="text-xs text-accent font-semibold">{g.subscriptionCost?.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </GlassCard>
              )
            })}
            {myGroups.length === 0 && (
              <p className={`text-center py-4 text-sm ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                Нет групп. Создайте первую!
              </p>
            )}
          </div>
        </div>

        {myNews.length > 0 && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Последние новости</h2>
            <div className="space-y-2">
              {myNews.slice(-2).reverse().map(n => (
                <GlassCard key={n.id}>
                  <div className="flex items-start gap-2">
                    <Newspaper size={16} className="text-accent shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm">{n.title}</div>
                      <div className={`text-xs mt-0.5 ${dark ? 'text-white/40' : 'text-gray-400'}`}>{n.content}</div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function StudentDash({ auth, data, dark, navigate }) {
  const student = data.students.find(s => s.id === auth.studentId)
  const group = student ? data.groups.find(g => g.id === student.groupId) : null
  const trainer = data.users.find(u => u.id === auth.userId)
  const myNews = data.news.filter(n => n.groupId === student?.groupId)
  const expired = isExpired(student?.subscriptionExpiresAt)

  return (
    <Layout>
      <PageHeader title="Мой кабинет" />
      <div className="px-4 space-y-4 slide-in">
        <GlassCard>
          <div className="text-center">
            <div className="text-lg font-bold">{student?.name}</div>
            <div className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>
              {trainer?.clubName} — {group?.name || 'Без группы'}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>Статус</div>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                expired
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {expired ? 'Долг' : 'Активен'}
              </span>
            </div>
            <div className="text-right">
              <div className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                {expired ? 'Истек' : 'Действует до'}
              </div>
              <div className="font-bold mt-1">
                {formatDate(student?.subscriptionExpiresAt)}
              </div>
            </div>
          </div>
        </GlassCard>

        {student?.belt && (
          <GlassCard className="flex items-center justify-between">
            <span className={`text-xs uppercase font-semibold ${dark ? 'text-white/40' : 'text-gray-400'}`}>Пояс</span>
            <span className="font-bold">{student.belt}</span>
          </GlassCard>
        )}

        {myNews.length > 0 && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Новости группы</h2>
            {myNews.slice(-3).reverse().map(n => (
              <GlassCard key={n.id} className="mb-2">
                <div className="font-semibold text-sm">{n.title}</div>
                <div className={`text-xs mt-1 ${dark ? 'text-white/40' : 'text-gray-400'}`}>{n.content}</div>
              </GlassCard>
            ))}
          </div>
        )}

        <div>
          <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Ближайшие турниры</h2>
          {data.tournaments
            .filter(t => new Date(t.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3)
            .map(t => (
              <GlassCard key={t.id} onClick={() => navigate(`/tournaments/${t.id}`)} className="mb-2">
                <div className="font-bold">{t.title}</div>
                <div className={`text-sm mt-1 flex items-center gap-1 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                  <Calendar size={13} />
                  {formatDate(t.date)} — {t.location}
                </div>
              </GlassCard>
            ))}
        </div>
      </div>
    </Layout>
  )
}
