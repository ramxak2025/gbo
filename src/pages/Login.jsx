import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Sun, Moon, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { dark, toggle } = useTheme()
  const { login } = useAuth()
  const { data } = useData()
  const [tab, setTab] = useState('admin') // admin | student
  const [email, setEmail] = useState('')
  const [studentLogin, setStudentLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (tab === 'admin') {
      const user = data.users.find(u => u.email === email && u.password === password)
      if (!user) {
        setError('Неверный email или пароль')
        return
      }
      login(user.id, user.role)
    } else {
      const student = data.students.find(s => s.login === studentLogin && s.password === password)
      if (!student) {
        setError('Неверный логин или пароль')
        return
      }
      const trainer = data.users.find(u => u.id === student.trainerId)
      if (!trainer) {
        setError('Тренер не найден')
        return
      }
      login(trainer.id, 'student', student.id)
    }
  }

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none
    transition-colors duration-200
    ${dark
      ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent'
      : 'bg-black/[0.03] border border-black/[0.08] text-gray-900 placeholder-gray-400 focus:border-accent'
    }
  `

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-dark-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex justify-end p-4">
        <button onClick={toggle} className="press-scale p-2 rounded-full">
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="slide-in w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black italic tracking-tight">
              i<span className="text-accent">Borcuha</span>
            </h1>
            <p className={`text-sm mt-2 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
              Web-Kultura Edition
            </p>
          </div>

          <div className={`flex rounded-[16px] p-1 mb-6 ${dark ? 'bg-white/5' : 'bg-black/[0.05]'}`}>
            {[
              { key: 'admin', label: 'Тренер / Админ' },
              { key: 'student', label: 'Ученик' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError('') }}
                className={`
                  flex-1 py-2.5 rounded-[12px] text-sm font-semibold transition-all duration-200
                  ${tab === key
                    ? (dark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm')
                    : (dark ? 'text-white/40' : 'text-gray-400')
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'admin' ? (
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
                autoComplete="email"
              />
            ) : (
              <input
                type="text"
                placeholder="Логин"
                value={studentLogin}
                onChange={e => setStudentLogin(e.target.value)}
                className={inputCls}
                autoComplete="username"
              />
            )}

            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputCls}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${dark ? 'text-white/30' : 'text-gray-400'}`}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="text-accent text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold text-base press-scale hover:bg-accent-dark transition-colors"
            >
              Войти
            </button>
          </form>

          <div className={`mt-8 text-center text-xs space-y-1 ${dark ? 'text-white/20' : 'text-gray-300'}`}>
            <p>Демо: admin@iborcuha.com / admin123</p>
            <p>Тренер: rustam@club.com / trainer123</p>
            <p>Ученик: alikhan / student123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
