import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { Sun, Moon, Eye, EyeOff, MessageCircle, Phone } from 'lucide-react'

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  let d = digits
  // Normalize: if starts with 7 and has 11 digits, treat as 8
  if (d.length > 0 && d[0] === '7' && d.length <= 11) d = '8' + d.slice(1)
  if (d.length > 0 && d[0] !== '8') d = '8' + d

  let result = d[0] || ''
  if (d.length > 1) result += ' (' + d.slice(1, 4)
  if (d.length >= 4) result += ') '
  if (d.length > 4) result += d.slice(4, 7)
  if (d.length > 7) result += '-' + d.slice(7, 9)
  if (d.length > 9) result += '-' + d.slice(9, 11)
  return result
}

function cleanPhone(value) {
  return value.replace(/\D/g, '')
}

export default function Login({ onLogin }) {
  const { dark, toggle } = useTheme()
  const { login } = useAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleDemoLogin = async (demoPhone, demoPassword) => {
    setError('')
    setErrorType(null)
    setLoading(true)
    try {
      await login(demoPhone, demoPassword)
      if (onLogin) onLogin()
    } catch (err) {
      setError(err.message || 'Ошибка демо-входа')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrorType(null)

    const digits = cleanPhone(phone)
    if (digits.length < 11) {
      setError('Введите полный номер телефона')
      return
    }
    if (!password) {
      setError('Введите пароль')
      return
    }

    setLoading(true)
    try {
      await login(digits, password)
      if (onLogin) onLogin()
    } catch (err) {
      setError(err.message || 'Ошибка входа')
      setErrorType(err.errorType || null)
    } finally {
      setLoading(false)
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
              className="w-28 h-28 mx-auto rounded-[28px] shadow-2xl shadow-black/50 mb-6 scale-in"
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
                placeholder="8 (900) 123-45-67"
                value={phone}
                onChange={handlePhoneChange}
                className={`${inputCls} pl-11`}
                autoComplete="tel"
                maxLength={18}
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
              disabled={loading}
              className="w-full py-3.5 rounded-[16px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-base press-scale hover:opacity-90 transition-opacity shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          {/* Demo access */}
          <div className="mt-8">
            <div className={`text-center text-[10px] uppercase tracking-widest font-semibold mb-3 ${dark ? 'text-white/20' : 'text-gray-300'}`}>
              Попробовать демо
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('89999999999', 'demo123')}
                disabled={loading}
                className={`py-2.5 rounded-[14px] text-xs font-bold press-scale flex items-center justify-center gap-1.5 transition-all ${
                  dark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'
                }`}
              >
                <span className="text-base">🥋</span>
                Тренер
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('89990000001', 'demo123')}
                disabled={loading}
                className={`py-2.5 rounded-[14px] text-xs font-bold press-scale flex items-center justify-center gap-1.5 transition-all ${
                  dark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-600 border border-green-100'
                }`}
              >
                <span className="text-base">🤼</span>
                Спортсмен
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className={`mt-8 text-center text-[11px] ${dark ? 'text-white/15' : 'text-gray-300'}`}>
            BJJ / MMA / Grappling
          </div>
        </div>
      </div>
    </div>
  )
}
