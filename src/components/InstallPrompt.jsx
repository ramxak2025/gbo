import { useState, useEffect } from 'react'
import { X, Share, PlusSquare, MoreVertical, Download } from 'lucide-react'

function detectPlatform() {
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState('android')
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    // Already installed as PWA — don't show
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (window.navigator.standalone) return

    // Dismissed within last 24 hours
    const dismissed = localStorage.getItem('iborcuha_install_dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return

    const plat = detectPlatform()
    setPlatform(plat)

    // Listen for native install prompt (Chrome Android/Desktop)
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Show prompt after delay for all platforms
    const timer = setTimeout(() => setShow(true), 1500)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        setShow(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('iborcuha_install_dismissed', Date.now().toString())
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999]" style={{ animation: 'slideUp 0.4s ease-out' }}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={handleDismiss} />

      {/* Popup */}
      <div className="relative mx-auto max-w-lg bg-dark-800/95 backdrop-blur-2xl border-t border-white/[0.07] rounded-t-3xl px-5 pt-3 pb-6 safe-area-bottom">
        {/* Drag handle */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Close */}
        <button onClick={handleDismiss} className="absolute top-3 right-4 p-1.5 rounded-full bg-white/[0.08] text-white/50">
          <X size={16} />
        </button>

        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-4">
          <img src="/logo.png" alt="iBorcuha" className="w-14 h-14 rounded-2xl" />
          <div>
            <h3 className="text-white font-semibold text-base">iBorcuha</h3>
            <p className="text-white/50 text-sm">Установите приложение</p>
          </div>
        </div>

        {/* Native install button (Chrome) */}
        {deferredPrompt ? (
          <div className="space-y-3">
            <button
              onClick={handleInstall}
              className="w-full py-3.5 rounded-2xl bg-accent text-white font-semibold text-base active:scale-[0.97] transition-transform"
            >
              Установить приложение
            </button>
          </div>
        ) : platform === 'ios' ? (
          /* iOS instructions */
          <div className="space-y-3">
            <p className="text-white/70 text-sm">Чтобы установить приложение:</p>
            <div className="flex items-center gap-3 bg-white/[0.06] rounded-2xl p-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Share size={18} className="text-blue-400" />
              </div>
              <p className="text-white/80 text-sm">
                <span className="font-medium text-white">1.</span> Нажмите <span className="font-medium text-white">«Поделиться»</span> внизу Safari
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.06] rounded-2xl p-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <PlusSquare size={18} className="text-blue-400" />
              </div>
              <p className="text-white/80 text-sm">
                <span className="font-medium text-white">2.</span> Выберите <span className="font-medium text-white">«На экран Домой»</span>
              </p>
            </div>
          </div>
        ) : (
          /* Android / Other */
          <div className="space-y-3">
            <p className="text-white/70 text-sm">Чтобы установить приложение:</p>
            <div className="flex items-center gap-3 bg-white/[0.06] rounded-2xl p-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <MoreVertical size={18} className="text-blue-400" />
              </div>
              <p className="text-white/80 text-sm">
                <span className="font-medium text-white">1.</span> Нажмите <span className="font-medium text-white">⋮</span> в правом верхнем углу браузера
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.06] rounded-2xl p-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Download size={18} className="text-blue-400" />
              </div>
              <p className="text-white/80 text-sm">
                <span className="font-medium text-white">2.</span> Выберите <span className="font-medium text-white">«Добавить на главный экран»</span>
              </p>
            </div>
          </div>
        )}

        <button onClick={handleDismiss} className="w-full mt-3 py-2 text-white/40 text-sm text-center">
          Не сейчас
        </button>
      </div>
    </div>
  )
}
