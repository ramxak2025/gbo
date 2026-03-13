import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'

export default function QRCheckin() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { qrCheckin } = useData()
  const { dark } = useTheme()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error' | 'wrong_role'
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token || !auth) return

    if (auth.role !== 'student') {
      setStatus('wrong_role')
      return
    }

    qrCheckin(token)
      .then(() => setStatus('success'))
      .catch(e => { setStatus('error'); setErrorMsg(e.message || 'Ошибка') })
  }, [token, auth])

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-4 max-w-sm">
          {status === 'loading' && (
            <div className={`text-sm animate-pulse ${dark ? 'text-white/40' : 'text-gray-500'}`}>
              Отмечаем посещение...
            </div>
          )}

          {status === 'success' && (
            <>
              <div className="w-24 h-24 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
                <CheckCircle size={48} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-green-500">Отмечено!</h2>
              <p className={`text-sm ${dark ? 'text-white/50' : 'text-gray-600'}`}>
                Ваше посещение записано на сегодня
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-24 h-24 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
                <XCircle size={48} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-red-500">Ошибка</h2>
              <p className={`text-sm ${dark ? 'text-white/50' : 'text-gray-600'}`}>{errorMsg}</p>
            </>
          )}

          {status === 'wrong_role' && (
            <>
              <div className={`w-24 h-24 rounded-full ${dark ? 'bg-white/[0.06]' : 'bg-gray-100'} flex items-center justify-center mx-auto`}>
                <XCircle size={48} className={dark ? 'text-white/30' : 'text-gray-400'} />
              </div>
              <h2 className={`text-xl font-bold ${dark ? 'text-white/70' : 'text-gray-700'}`}>Только для учеников</h2>
              <p className={`text-sm ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                QR-код для отметки посещения доступен только ученикам
              </p>
            </>
          )}

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent text-white font-bold text-sm press-scale"
          >
            <ArrowLeft size={16} /> На главную
          </button>
        </div>
      </div>
    </Layout>
  )
}
