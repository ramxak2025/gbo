import { useState, useEffect } from 'react'
import { X, Share, PlusSquare, MoreVertical, Download, Zap, Bell, Wifi } from 'lucide-react'

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
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (window.navigator.standalone) return

    const dismissed = localStorage.getItem('iborcuha_install_dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return

    const plat = detectPlatform()
    setPlatform(plat)

    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

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
      if (result.outcome === 'accepted') setShow(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('iborcuha_install_dismissed', Date.now().toString())
  }

  if (!show) return null

  const benefits = [
    { icon: Zap, label: 'Быстрый доступ' },
    { icon: Bell, label: 'Уведомления' },
    { icon: Wifi, label: 'Оффлайн' },
  ]

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      {/* Gradient backdrop */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20 modal-overlay"
        onClick={handleDismiss}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg modal-sheet">
        {/* Gradient accent line */}
        <div className="h-[2px] rounded-t-full bg-gradient-to-r from-purple-500 via-accent to-purple-500" />

        <div className="bg-dark-800/98 backdrop-blur-3xl rounded-t-[32px] px-6 pt-2 pb-6 safe-area-bottom">
          {/* Drag handle */}
          <div className="flex justify-center mb-5">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/[0.06] text-white/40 press-scale"
          >
            <X size={16} />
          </button>

          {/* App branding */}
          <div className="text-center mb-5">
            <div className="relative inline-block mb-3">
              <img src="/logo.png" alt="iBorcuha" className="w-[72px] h-[72px] rounded-[20px] shadow-2xl" />
              {/* Glow ring */}
              <div className="absolute -inset-1.5 rounded-[24px] bg-gradient-to-br from-purple-500/25 to-accent/25 -z-10 blur-md" />
            </div>
            <h3 className="text-white text-xl font-black tracking-tight">iBorcuha</h3>
            <p className="text-white/35 text-sm mt-1">Тренировки в одном приложении</p>
          </div>

          {/* Benefits */}
          <div className="flex gap-2 justify-center mb-6">
            {benefits.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]"
              >
                <Icon size={12} className="text-purple-400" />
                <span className="text-[11px] font-semibold text-white/50">{label}</span>
              </div>
            ))}
          </div>

          {/* Platform-specific content */}
          {deferredPrompt ? (
            /* Chrome native install */
            <button
              onClick={handleInstall}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-purple-600 text-white font-bold text-base press-scale shadow-lg shadow-accent/25 mb-4 flex items-center justify-center gap-2.5"
            >
              <Download size={20} />
              Установить приложение
            </button>
          ) : platform === 'ios' ? (
            /* iOS instructions */
            <div className="space-y-2.5 mb-5">
              <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25">
                  <Share size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-semibold">1. Нажмите «Поделиться»</div>
                  <div className="text-white/25 text-xs mt-0.5">Кнопка внизу экрана Safari</div>
                </div>
              </div>
              <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25">
                  <PlusSquare size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-semibold">2. «На экран Домой»</div>
                  <div className="text-white/25 text-xs mt-0.5">Пролистайте меню и нажмите</div>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Other */
            <div className="space-y-2.5 mb-5">
              <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/25">
                  <MoreVertical size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-semibold">1. Откройте меню браузера</div>
                  <div className="text-white/25 text-xs mt-0.5">Кнопка <span className="text-white/50 font-bold">⋮</span> в правом верхнем углу</div>
                </div>
              </div>
              <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/25">
                  <Download size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-semibold">2. «На главный экран»</div>
                  <div className="text-white/25 text-xs mt-0.5">Добавить на главный экран</div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleDismiss}
            className="w-full py-2.5 text-white/25 text-sm font-medium text-center press-scale"
          >
            Не сейчас
          </button>
        </div>
      </div>
    </div>
  )
}
