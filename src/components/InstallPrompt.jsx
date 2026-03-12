import { useState, useEffect } from 'react'
import { X, Share, PlusSquare, Download, WifiOff, AppWindow } from 'lucide-react'

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

  const handleInstall = () => {
    if (platform === 'android') {
      const link = document.createElement('a')
      link.href = 'https://drive.google.com/uc?export=download&id=1zQps_3q2tu3_XnQeeXMXmHAbeFHjnWkV'
      link.target = '_blank'
      link.click()
      handleDismiss()
      return
    }
    if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then((result) => {
        if (result.outcome === 'accepted') handleDismiss()
        setDeferredPrompt(null)
      })
    }
  }

  const handleDismiss = () => {
    setAnimateIn(false)
    setTimeout(() => setVisible(false), 400)
    localStorage.setItem('iborcuha_install_dismissed', Date.now().toString())
  }

  if (!visible) return null

  const badges = [
    { icon: WifiOff, label: 'Работает офлайн' },
    { icon: AppWindow, label: 'Без App Store' },
  ]

  const iosSteps = [
    { num: '1', text: 'Нажмите кнопку', accent: 'Поделиться', icon: Share, hint: 'внизу экрана Safari' },
    { num: '2', text: 'Пролистайте вниз', accent: null, icon: null, hint: 'в открывшемся меню' },
    { num: '3', text: 'Нажмите', accent: 'На экран «Домой»', icon: PlusSquare, hint: null },
  ]


  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      {/* Backdrop with blur */}
      <div
        className={`absolute inset-0 transition-all duration-[400ms] ease-out ${
          animateIn ? 'bg-black/50 backdrop-blur-md' : 'bg-black/0 backdrop-blur-none'
        }`}
        onClick={handleDismiss}
      />

      {/* Bottom sheet */}
      <div
        className="relative w-full max-w-[440px] transition-all duration-[450ms]"
        style={{
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          transform: animateIn ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div className="rounded-t-[28px] overflow-hidden bg-[#1c1c1e] shadow-[0_-8px_40px_rgba(0,0,0,0.4)]">

          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-9 h-1 rounded-full bg-white/20" />
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3.5 right-4 p-1.5 rounded-full bg-white/10 text-white/50 press-scale"
          >
            <X size={16} />
          </button>

          <div className="px-5 pb-6">
            {/* App info row */}
            <div className="flex items-center gap-3.5 mb-5">
              <img src="/logo.png" alt="iBorcuha" className="w-14 h-14 rounded-[14px] shadow-lg" />
              <div>
                <div className="text-white text-base font-bold">Установить iBorcuha</div>
                <div className="text-white/35 text-xs mt-0.5">Тренировки в одном приложении</div>
              </div>
            </div>

            {/* Feature badges */}
            <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide -mx-1 px-1">
              {badges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.08] whitespace-nowrap shrink-0">
                  <Icon size={13} className="text-purple-400" />
                  <span className="text-white/60 text-[11px] font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Android: install button + fallback steps; iOS: steps only */}
            {platform === 'android' ? (
              <div className="mb-4">
                <button
                  onClick={handleInstall}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm press-scale flex items-center justify-center gap-2.5 shadow-lg mb-3 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-600/25"
                >
                  <Download size={18} />
                  Скачать приложение
                </button>
                <div className="text-white/30 text-[11px] text-center">APK · 52 МБ</div>
              </div>
            ) : (
              <div className="space-y-2.5 mb-4">
                {iosSteps.map((step, i) => (
                  <div
                    key={step.num}
                    className="flex items-center gap-3 transition-all duration-500"
                    style={{
                      opacity: animateIn ? 1 : 0,
                      transform: animateIn ? 'translateY(0)' : 'translateY(12px)',
                      transitionDelay: animateIn ? `${200 + i * 100}ms` : '0ms',
                    }}
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                      <span className="text-purple-400 text-xs font-bold">{step.num}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-white/70 text-[13px]">{step.text}</span>
                      {step.icon && <step.icon size={14} className="text-blue-400 shrink-0" />}
                      {step.accent && <span className="text-white text-[13px] font-semibold">{step.accent}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom note */}
            <div className="text-center">
              <p className="text-white/20 text-[10px]">Приложение бесплатное и не занимает много места</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
