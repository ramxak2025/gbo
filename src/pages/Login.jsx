import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Sun, Moon, Eye, EyeOff, MessageCircle } from 'lucide-react'

export default function Login() {
  const { dark, toggle } = useTheme()
  const { login } = useAuth()
  const { data } = useData()
  const [mode, setMode] = useState('student')
  const [email, setEmail] = useState('')
  const [studentLogin, setStudentLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setErrorType(null)

    if (mode === 'trainer') {
      const user = data.users.find(u => u.email === email && u.password === password)
      if (!user) {
        setError('Неверный email или пароль')
        setErrorType('trainer')
        return
      }
      login(user.id, user.role)
    } else {
      const student = data.students.find(s => s.login === studentLogin && s.password === password)
      if (!student) {
        setError('Неверный логин или пароль')
        setErrorType('student')
        return
      }
      const trainer = data.users.find(u => u.id === student.trainerId)
      if (!trainer) {
        setError('Тренер не найден')
        setErrorType('student')
        return
      }
      login(trainer.id, 'student', student.id)
    }
  }

  const inputCls = `
    w-full px-4 py-3.5 rounded-[16px] text-base outline-none transition-colors duration-200
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

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="slide-in w-full max-w-sm">
          <div className="text-center mb-8">
            <img
              src="/icon.svg"
              alt="iBorcuha"
              className="w-28 h-28 mx-auto rounded-[24px] shadow-2xl shadow-black/40 mb-5"
            />
            <h1 className="text-4xl font-black italic tracking-tight">
              i<span className="text-accent">Borcuha</span>
            </h1>
            <p className={`text-sm mt-1 ${dark ? 'text-white/40' : 'text-gray-400'}`}>
              Web-Kultura Edition
            </p>
          </div>

          {mode === 'student' ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Логин"
                  value={studentLogin}
                  onChange={e => setStudentLogin(e.target.value)}
                  className={inputCls}
                  autoComplete="username"
                />
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

                {error && errorType === 'student' && (
                  <div className="text-center space-y-2 py-1">
                    <p className="text-accent text-sm font-medium">{error}</p>
                    <p className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                      Обратитесь к своему тренеру за паролем
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold text-base press-scale hover:bg-accent-dark transition-colors"
                >
                  Войти
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => { setMode('trainer'); setError(''); setErrorType(null) }}
                  className={`text-sm font-medium press-scale ${dark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Войти как тренер
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputCls}
                  autoComplete="email"
                />
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

                {error && errorType === 'trainer' && (
                  <div className="text-center space-y-3 py-1">
                    <p className="text-accent text-sm font-medium">{error}</p>
                    <p className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                      Обратитесь к автору проекта по номеру:
                    </p>
                    <a
                      href="https://wa.me/89884444436"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-green-600 text-white text-sm font-bold press-scale"
                    >
                      <MessageCircle size={18} />
                      8-988-444-44-36
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold text-base press-scale hover:bg-accent-dark transition-colors"
                >
                  Войти
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => { setMode('student'); setError(''); setErrorType(null) }}
                  className={`text-sm font-medium press-scale ${dark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Войти как ученик
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
