import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { Sun, Moon, Eye, EyeOff, MessageCircle, Phone, UserPlus, ArrowLeft, CheckSquare, Square, LogIn, MapPin, Building2, Dumbbell, Lock, User, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { SPORT_TYPES } from '../utils/sports'

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  let d = digits
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
  const [mode, setMode] = useState('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  const [reg, setReg] = useState({ name: '', phone: '', password: '', clubName: '', sportType: '', city: '', consent: false })
  const [regShowPw, setRegShowPw] = useState(false)

  const handleDemoLogin = async (demoPhone, demoPassword) => {
    setError(''); setErrorType(null); setLoading(true)
    try { await login(demoPhone, demoPassword); if (onLogin) onLogin() }
    catch (err) { setError(err.message || 'Ошибка демо-входа') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setErrorType(null)
    const digits = cleanPhone(phone)
    if (digits.length < 11) { setError('Введите полный номер телефона'); return }
    if (!password) { setError('Введите пароль'); return }
    setLoading(true)
    try { await login(digits, password); if (onLogin) onLogin() }
    catch (err) { setError(err.message || 'Ошибка входа'); setErrorType(err.errorType || null) }
    finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault(); setError('')
    if (!reg.name.trim()) { setError('Введите ФИО'); return }
    const digits = cleanPhone(reg.phone)
    if (digits.length < 11) { setError('Введите полный номер телефона'); return }
    if (!reg.password || reg.password.length < 4) { setError('Пароль минимум 4 символа'); return }
    if (!reg.clubName.trim()) { setError('Введите название клуба'); return }
    if (!reg.consent) { setError('Необходимо согласие на обработку персональных данных'); return }
    setLoading(true)
    try {
      await api.register({ name: reg.name.trim(), phone: digits, password: reg.password, clubName: reg.clubName.trim(), sportType: reg.sportType || null, city: reg.city.trim() || null, consent: reg.consent })
      setMode('success')
    } catch (err) { setError(err.message || 'Ошибка регистрации') }
    finally { setLoading(false) }
  }

  const switchToRegister = () => {
    setMode('register'); setError('')
    setReg({ name: '', phone: '', password: '', clubName: '', sportType: '', city: '', consent: false })
  }

  const inputCls = `
    w-full px-4 py-3 rounded-[14px] text-[15px] outline-none transition-all duration-200
    ${dark
      ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.1]'
      : 'bg-white/80 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] shadow-sm'
    }
  `

  const iconInputCls = (icon) => `${inputCls} pl-11`

  return (
    <div className={`h-full flex flex-col relative overflow-hidden ${dark ? 'bg-dark-900 text-white' : 'bg-[#f5f5f7] text-gray-900'}`} style={{ paddingTop: 'var(--sat)' }}>

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-[40%] -left-[30%] w-[80%] h-[80%] rounded-full blur-[120px] ${
          dark ? 'bg-purple-900/30' : 'bg-purple-200/40'
        }`} />
        <div className={`absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full blur-[100px] ${
          dark ? 'bg-red-900/20' : 'bg-red-100/30'
        }`} />
      </div>

      {/* Theme toggle — absolute top right */}
      <div className="absolute right-5 z-20" style={{ top: 'calc(var(--sat) + 16px)' }}>
        <button onClick={toggle} className={`press-scale p-2.5 rounded-xl transition-colors ${dark ? 'bg-white/[0.06]' : 'bg-white/60 shadow-sm'}`}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      {/* Back button for register/success */}
      {mode !== 'login' && (
        <div className="absolute left-5 z-20" style={{ top: 'calc(var(--sat) + 16px)' }}>
          <button onClick={() => { setMode('login'); setError('') }} className="press-scale flex items-center gap-1 py-1.5 px-2 rounded-xl">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Назад</span>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col items-center justify-center min-h-full px-6 py-6">
          <div className="w-full max-w-sm">

            {/* ===== LOGIN ===== */}
            {mode === 'login' && (
              <div className="slide-in">
                {/* Logo */}
                <div className="text-center mb-8">
                  <div className="relative inline-block">
                    <div className={`absolute inset-0 rounded-[28px] blur-2xl scale-110 ${dark ? 'bg-purple-600/30' : 'bg-purple-400/20'}`} />
                    <img
                      src="/logo.png"
                      alt="iBorcuha"
                      className="relative w-[88px] h-[88px] mx-auto rounded-[24px] shadow-2xl shadow-black/30 scale-in"
                    />
                  </div>
                  <h1 className="text-3xl font-black tracking-tight mt-5">
                    <span className={dark ? 'text-white/60' : 'text-gray-500'}>i</span>
                    <span className="bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
                      Borcuha
                    </span>
                  </h1>
                  <p className={`text-[11px] mt-1 font-medium tracking-[0.2em] uppercase ${dark ? 'text-white/20' : 'text-gray-500'}`}>
                    Платформа для единоборств
                  </p>
                </div>

                {/* Login card */}
                <div className={`rounded-[24px] p-5 mb-4 ${
                  dark ? 'bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl shadow-lg shadow-black/[0.04] border border-white/60'
                }`}>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <Phone size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-500'}`} />
                      <input
                        type="tel"
                        placeholder="8 (900) 123-45-67"
                        value={phone}
                        onChange={e => setPhone(formatPhone(e.target.value))}
                        className={iconInputCls()}
                        autoComplete="tel"
                        maxLength={18}
                      />
                    </div>
                    <div className="relative">
                      <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-500'}`} />
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Пароль"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className={iconInputCls()}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 ${dark ? 'text-white/25' : 'text-gray-500'}`}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Errors */}
                    {error && errorType === 'student' && (
                      <div className="text-center space-y-1.5 py-1">
                        <p className="text-accent text-sm font-medium">{error}</p>
                        <p className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>Обратитесь к тренеру за паролем</p>
                      </div>
                    )}
                    {error && errorType === 'trainer' && (
                      <div className="text-center space-y-2 py-1">
                        <p className="text-accent text-sm font-medium">{error}</p>
                        <p className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>Свяжитесь с администратором:</p>
                        <a href="https://wa.me/89884444436" target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] bg-green-600 text-white text-sm font-bold press-scale">
                          <MessageCircle size={16} /> 8-988-444-44-36
                        </a>
                      </div>
                    )}
                    {error && !errorType && (
                      <p className="text-accent text-sm font-medium text-center">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-[14px] bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white font-bold text-[15px] press-scale transition-all shadow-lg shadow-purple-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><LogIn size={18} /> Войти</>
                      )}
                    </button>
                  </form>
                </div>

                {/* Register CTA */}
                <button
                  onClick={switchToRegister}
                  className={`w-full py-3 rounded-[16px] font-semibold text-sm press-scale flex items-center justify-center gap-2 transition-all ${
                    dark ? 'bg-white/[0.04] text-white/60 border border-white/[0.06]' : 'bg-white/60 text-gray-500 border border-black/[0.04] backdrop-blur-sm shadow-sm'
                  }`}
                >
                  <UserPlus size={15} />
                  Я тренер — хочу зарегистрироваться
                </button>

                {/* Demo section */}
                <div className="mt-5">
                  <button
                    onClick={() => setShowDemo(!showDemo)}
                    className={`w-full flex items-center justify-center gap-2 py-2 text-[11px] uppercase tracking-widest font-semibold press-scale ${dark ? 'text-white/20' : 'text-gray-500'}`}
                  >
                    Демо-доступ
                    {showDemo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showDemo && (
                    <div className="grid grid-cols-2 gap-2 mt-2 fade-in">
                      <button
                        type="button"
                        onClick={() => handleDemoLogin('89999999999', 'demo123')}
                        disabled={loading}
                        className={`py-3 rounded-[14px] text-xs font-bold press-scale flex flex-col items-center gap-1 transition-all ${
                          dark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/15' : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}
                      >
                        <span className="text-lg">🥋</span>
                        <span>Тренер</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoLogin('89990000001', 'demo123')}
                        disabled={loading}
                        className={`py-3 rounded-[14px] text-xs font-bold press-scale flex flex-col items-center gap-1 transition-all ${
                          dark ? 'bg-green-500/10 text-green-400 border border-green-500/15' : 'bg-green-50 text-green-600 border border-green-100'
                        }`}
                      >
                        <span className="text-lg">🤼</span>
                        <span>Спортсмен</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sport tags */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5">
                  {['BJJ', 'MMA', 'Самбо', 'Дзюдо', 'Грэпплинг'].map(s => (
                    <span key={s} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                      dark ? 'bg-white/[0.04] text-white/20' : 'bg-black/[0.04] text-gray-500'
                    }`}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ===== REGISTER ===== */}
            {mode === 'register' && (
              <div className="slide-in">
                <div className="text-center mb-6">
                  <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
                    dark ? 'bg-purple-500/15' : 'bg-purple-100'
                  }`}>
                    <UserPlus size={26} className={dark ? 'text-purple-400' : 'text-purple-600'} />
                  </div>
                  <h2 className="text-xl font-bold">Регистрация тренера</h2>
                  <p className={`text-xs mt-1 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                    Заполните данные для подачи заявки
                  </p>
                </div>

                <div className={`rounded-[24px] p-5 ${
                  dark ? 'bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl shadow-lg shadow-black/[0.04] border border-white/60'
                }`}>
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="relative">
                      <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-500'}`} />
                      <input type="text" placeholder="ФИО *" value={reg.name}
                        onChange={e => setReg(r => ({ ...r, name: e.target.value }))}
                        className={iconInputCls()} />
                    </div>

                    <div className="relative">
                      <Phone size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-500'}`} />
                      <input type="tel" placeholder="Телефон *" value={reg.phone}
                        onChange={e => setReg(r => ({ ...r, phone: formatPhone(e.target.value) }))}
                        className={iconInputCls()} maxLength={18} />
                    </div>

                    <div className="relative">
                      <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-500'}`} />
                      <input type={regShowPw ? 'text' : 'password'} placeholder="Пароль *" value={reg.password}
                        onChange={e => setReg(r => ({ ...r, password: e.target.value }))}
                        className={iconInputCls()} />
                      <button type="button" onClick={() => setRegShowPw(!regShowPw)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 ${dark ? 'text-white/25' : 'text-gray-500'}`}>
                        {regShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div className={`h-px ${dark ? 'bg-white/[0.06]' : 'bg-black/[0.04]'}`} />

                    <div className="relative">
                      <Building2 size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-500'}`} />
                      <input type="text" placeholder="Название клуба *" value={reg.clubName}
                        onChange={e => setReg(r => ({ ...r, clubName: e.target.value }))}
                        className={iconInputCls()} />
                    </div>

                    <div className="relative">
                      <Dumbbell size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-500'} pointer-events-none`} />
                      <select value={reg.sportType}
                        onChange={e => setReg(r => ({ ...r, sportType: e.target.value }))}
                        className={iconInputCls()}>
                        <option value="">Вид спорта</option>
                        {SPORT_TYPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>

                    <div className="relative">
                      <MapPin size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-500'}`} />
                      <input type="text" placeholder="Город" value={reg.city}
                        onChange={e => setReg(r => ({ ...r, city: e.target.value }))}
                        className={iconInputCls()} />
                    </div>

                    <div className={`h-px ${dark ? 'bg-white/[0.06]' : 'bg-black/[0.04]'}`} />

                    {/* Consent */}
                    <button type="button" onClick={() => setReg(r => ({ ...r, consent: !r.consent }))}
                      className={`w-full flex items-start gap-3 px-3.5 py-3 rounded-[14px] text-left transition-all ${
                        reg.consent
                          ? dark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
                          : dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/80 border border-white/60'
                      }`}>
                      {reg.consent
                        ? <CheckSquare size={18} className="text-green-500 shrink-0 mt-0.5" />
                        : <Square size={18} className={`shrink-0 mt-0.5 ${dark ? 'text-white/20' : 'text-gray-500'}`} />
                      }
                      <span className={`text-[11px] leading-relaxed ${dark ? 'text-white/50' : 'text-gray-500'}`}>
                        Даю согласие на обработку персональных данных в соответствии с ФЗ №152 «О персональных данных» *
                      </span>
                    </button>

                    {error && <p className="text-accent text-sm font-medium text-center">{error}</p>}

                    <button type="submit" disabled={loading}
                      className="w-full py-3.5 rounded-[14px] bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white font-bold text-[15px] press-scale transition-all shadow-lg shadow-purple-600/25 disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><Send size={16} /> Отправить заявку</>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ===== SUCCESS ===== */}
            {mode === 'success' && (
              <div className="slide-in text-center py-8">
                <div className="relative inline-block mb-5">
                  <div className={`absolute inset-0 rounded-full blur-2xl scale-150 ${dark ? 'bg-green-500/20' : 'bg-green-300/30'}`} />
                  <div className="relative w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center scale-in">
                    <CheckSquare size={36} className="text-green-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Заявка отправлена!</h2>
                <p className={`text-sm leading-relaxed mb-8 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
                  Администратор рассмотрит вашу заявку.<br />
                  После одобрения войдите с указанным номером и паролем.
                </p>
                <button onClick={() => { setMode('login'); setError('') }}
                  className="w-full py-3.5 rounded-[14px] bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white font-bold text-[15px] press-scale shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2">
                  <LogIn size={16} /> Вернуться к входу
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
