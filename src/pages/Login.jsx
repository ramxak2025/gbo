import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Sun, Moon, Eye, EyeOff, MessageCircle, Phone } from 'lucide-react'

function cleanPhone(phone) {
  return (phone || '').replace(/[^\d+]/g, '')
}

function phonesMatch(a, b) {
  const da = (a || '').replace(/\D/g, '')
  const db = (b || '').replace(/\D/g, '')
  if (!da || !db) return false
  // compare last 10 digits (ignore country code variations)
  return da.slice(-10) === db.slice(-10)
}

export default function Login() {
  const { dark, toggle } = useTheme()
  const { login } = useAuth()
  const { data } = useData()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState(null) // 'student' | 'trainer' | null

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setErrorType(null)

    const trimmedPhone = phone.trim()
    if (!trimmedPhone || !password) {
      setError('Введите номер телефона и пароль')
      return
    }

    // 1. Check users (admin/trainer) by phone
    const user = data.users.find(u => phonesMatch(u.phone, trimmedPhone) && u.password === password)
    if (user) {
      login(user.id, user.role)
      return
    }

    // 2. Check students by phone
    const student = data.students.find(s => phonesMatch(s.phone, trimmedPhone) && s.password === password)
    if (student) {
      const trainer = data.users.find(u => u.id === student.trainerId)
      if (!trainer) {
        setError('Тренер не найден')
        setErrorType('student')
        return
      }
      login(trainer.id, 'student', student.id)
      return
    }

    // 3. Determine error type — check if phone exists in any list
    const isTrainerPhone = data.users.find(u => phonesMatch(u.phone, trimmedPhone))
    if (isTrainerPhone) {
      setError('Неверный пароль')
      setErrorType('trainer')
    } else {
      setError('Неверный номер или пароль')
      setErrorType('student')
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
          {/* Logo & Branding */}
          <div className="text-center mb-10">
            <img
              src="/logo.png"
              alt="iBorcuha"
              className="w-28 h-28 mx-auto rounded-[28px] shadow-2xl shadow-black/50 mb-6"
            />
            <h1 className="text-3xl font-black tracking-tight">
              <span className={`${dark ? 'text-white/70' : 'text-gray-500'}`}>i</span>
              <span className="bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
                Borcuha
              </span>
            </h1>
            <p className={`text-xs mt-1.5 font-medium tracking-widest uppercase ${dark ? 'text-white/25' : 'text-gray-300'}`}>
              Web-Kultura Edition
            </p>
          </div>

          {/* Unified login form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Phone size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-300'}`} />
              <input
                type="tel"
                placeholder="Номер телефона"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={`${inputCls} pl-11`}
                autoComplete="tel"
              />
            </div>
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

            {/* Error messages */}
            {error && errorType === 'student' && (
              <div className="text-center space-y-2 py-1">
                <p className="text-accent text-sm font-medium">{error}</p>
                <p className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                  Обратитесь к своему тренеру за паролем
                </p>
              </div>
            )}

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

            {error && !errorType && (
              <p className="text-accent text-sm font-medium text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-[16px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-base press-scale hover:opacity-90 transition-opacity shadow-lg shadow-purple-600/20"
            >
              Войти
            </button>
          </form>

          {/* Footer */}
          <div className={`mt-10 text-center text-[11px] ${dark ? 'text-white/15' : 'text-gray-300'}`}>
            BJJ / MMA / Grappling
          </div>
        </div>
      </div>
    </div>
  )
}
