import { useEffect, useRef, useState } from 'react'
import { CheckCircle, XCircle, Camera } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function QRScanner({ onCheckin, onClose }) {
  const { dark } = useTheme()
  const [status, setStatus] = useState('scanning') // 'scanning' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const scannerRef = useRef(null)
  const processedRef = useRef(false)

  useEffect(() => {
    let scanner = null

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (processedRef.current) return
            // Extract token from URL /qr-checkin/<token>
            const match = decodedText.match(/qr-checkin\/([a-f0-9]{64})/)
            if (!match) return
            processedRef.current = true
            try {
              await scanner.stop()
            } catch {}
            try {
              await onCheckin(match[1])
              setStatus('success')
            } catch (e) {
              setStatus('error')
              setErrorMsg(e.message || 'Ошибка при отметке')
            }
          }
        )
      } catch (err) {
        console.error('Camera error:', err)
        if (err?.toString().includes('NotAllowedError') || err?.toString().includes('Permission')) {
          setPermissionDenied(true)
        } else {
          setErrorMsg('Не удалось запустить камеру')
          setStatus('error')
        }
      }
    }

    startScanner()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [onCheckin])

  if (permissionDenied) {
    return (
      <div className="text-center py-8 space-y-3">
        <Camera size={48} className={dark ? 'text-white/20 mx-auto' : 'text-gray-300 mx-auto'} />
        <p className={`text-sm font-semibold ${dark ? 'text-white/60' : 'text-gray-700'}`}>Нет доступа к камере</p>
        <p className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
          Разрешите доступ к камере в настройках браузера
        </p>
        <button
          onClick={onClose}
          className={`px-6 py-2.5 rounded-full text-sm font-bold press-scale ${
            dark ? 'bg-white/[0.08] text-white/60' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Закрыть
        </button>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <p className="text-lg font-bold text-green-500">Отмечено!</p>
        <p className={`text-sm ${dark ? 'text-white/50' : 'text-gray-600'}`}>Посещение записано на сегодня</p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-full bg-green-500 text-white font-bold text-sm press-scale"
        >
          Готово
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-20 h-20 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
          <XCircle size={40} className="text-red-500" />
        </div>
        <p className="text-lg font-bold text-red-500">Ошибка</p>
        <p className={`text-sm ${dark ? 'text-white/50' : 'text-gray-600'}`}>{errorMsg}</p>
        <button
          onClick={onClose}
          className={`px-6 py-2.5 rounded-full text-sm font-bold press-scale ${
            dark ? 'bg-white/[0.08] text-white/60' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Закрыть
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div id="qr-reader" className="rounded-[16px] overflow-hidden" />
      <p className={`text-center text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
        Наведите камеру на QR-код тренера
      </p>
    </div>
  )
}
