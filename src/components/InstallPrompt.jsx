import { useState, useEffect } from 'react'
import { X, Share, PlusSquare, MoreVertical, Download, Zap, Bell, Wifi } from 'lucide-react'

function detectPlatform() {
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
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
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // 2 second delay before showing
    const timer = setTimeout(() => {
      setVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true))
      })
    }, 2000)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') handleDismiss()
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setAnimateIn(false)
    setTimeout(() => setVisible(false), 350)
    localStorage.setItem('iborcuha_install_dismissed', Date.now().toString())
  }

  if (!visible) return null

  const benefits = [
    { icon: Zap, label: 'Быстрый доступ', desc: 'Как обычное приложение' },
    { icon: Bell, label: 'Уведомления', desc: 'Push о новостях и турнирах' },
    { icon: Wifi, label: 'Оффлайн', desc: 'Работает без интернета' },
  ]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div
        className={`absolute inset-0 transition-all duration-[400ms] ease-out ${
          animateIn ? 'bg-black/60 backdrop-blur-xl' : 'bg-black/0 backdrop-blur-none'
        }`}
        onClick={handleDismiss}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-[360px] transition-all duration-[400ms]"
        style={{
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.95)',
        }}
      >
        <div className="rounded-[28px] overflow-hidden bg-dark-800/98 backdrop-blur-3xl border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          {/* Gradient accent top */}
          <div className="h-1 bg-gradient-to-r from-purple-500 via-accent to-purple-500" />

          <div className="px-6 pt-6 pb-5">
            {/* Close */}
            <button
              onClick={handleDismiss}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/[0.06] text-white/40 press-scale"
            >
              <X size={16} />
            </button>

            {/* App branding */}
            <div className="flex items-center gap-4 mb-5">
              <div className="relative shrink-0">
                <img src="/logo.png" alt="iBorcuha" className="w-16 h-16 rounded-[18px] shadow-2xl" />
                <div className="absolute -inset-1 rounded-[22px] bg-gradient-to-br from-purple-500/20 to-accent/20 -z-10 blur-md" />
              </div>
              <div>
                <h3 className="text-white text-lg font-black tracking-tight">iBorcuha</h3>
                <p className="text-white/35 text-xs mt-0.5">Тренировки в одном приложении</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2 mb-5">
              {benefits.map(({ icon: Icon, label, desc }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] transition-all duration-500"
                  style={{
                    opacity: animateIn ? 1 : 0,
                    transform: animateIn ? 'translateX(0)' : 'translateX(16px)',
                    transitionDelay: animateIn ? `${150 + i * 80}ms` : '0ms',
                  }}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    i === 0 ? 'bg-purple-500/15' : i === 1 ? 'bg-blue-500/15' : 'bg-green-500/15'
                  }`}>
                    <Icon size={16} className={
                      i === 0 ? 'text-purple-400' : i === 1 ? 'text-blue-400' : 'text-green-400'
                    } />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-bold">{label}</div>
                    <div className="text-white/25 text-[10px]">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Platform-specific */}
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-accent to-purple-600 text-white font-bold text-sm press-scale shadow-lg shadow-accent/25 mb-3 flex items-center justify-center gap-2.5"
              >
                <Download size={18} />
                Установить приложение
              </button>
            ) : platform === 'ios' ? (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-blue-500/[0.08] border border-blue-500/15">
                  <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                    <Share size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-bold">1. Нажмите «Поделиться»</div>
                    <div className="text-white/25 text-[10px]">Кнопка внизу экрана Safari</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-blue-500/[0.08] border border-blue-500/15">
                  <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                    <PlusSquare size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-bold">2. «На экран Домой»</div>
                    <div className="text-white/25 text-[10px]">Пролистайте меню и нажмите</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-green-500/[0.08] border border-green-500/15">
                  <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/30">
                    <MoreVertical size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-bold">1. Меню браузера <span className="text-white/50">⋮</span></div>
                    <div className="text-white/25 text-[10px]">В правом верхнем углу</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-green-500/[0.08] border border-green-500/15">
                  <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/30">
                    <Download size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-bold">2. «На главный экран»</div>
                    <div className="text-white/25 text-[10px]">Добавить на главный экран</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleDismiss}
              className="w-full py-2 text-white/20 text-xs font-medium text-center press-scale"
            >
              Не сейчас
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
