import { useState, useEffect } from 'react'
import { Bell, BellOff, Newspaper, Trophy, Wallet, Calendar } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export default function NotificationSettings() {
  const { dark } = useTheme()
  const { auth } = useAuth()
  const [pushEnabled, setPushEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    news: true,
    tournaments: true,
    payments: true,
    schedule: true,
  })

  useEffect(() => {
    loadState()
  }, [])

  async function loadState() {
    try {
      // Check if push is supported and currently subscribed
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg) {
          const sub = await reg.pushManager.getSubscription()
          setPushEnabled(!!sub)
        }
      }
      // Load settings from server
      const s = await api.getNotificationSettings()
      setSettings(s)
    } catch (e) {
      console.error('Failed to load notification settings:', e)
    } finally {
      setLoading(false)
    }
  }

  async function togglePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push-уведомления не поддерживаются в этом браузере')
      return
    }

    try {
      if (pushEnabled) {
        // Unsubscribe
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg) {
          const sub = await reg.pushManager.getSubscription()
          if (sub) {
            await api.unsubscribePush(sub.endpoint)
            await sub.unsubscribe()
          }
        }
        setPushEnabled(false)
      } else {
        // Subscribe
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          alert('Разрешите уведомления в настройках браузера')
          return
        }

        const reg = await navigator.serviceWorker.ready
        const { publicKey } = await api.getVapidKey()
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
        await api.subscribePush(sub.toJSON())
        setPushEnabled(true)
      }
    } catch (e) {
      console.error('Push toggle error:', e)
      alert('Ошибка при настройке уведомлений')
    }
  }

  async function updateSetting(key, value) {
    const next = { ...settings, [key]: value }
    setSettings(next)
    try {
      await api.updateNotificationSettings(next)
    } catch (e) {
      console.error('Failed to update settings:', e)
    }
  }

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className={`
        relative w-12 h-7 rounded-full press-scale transition-colors duration-200
        ${value ? 'bg-accent' : dark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}
      `}
    >
      <div className={`
        absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm
        transition-transform duration-200
        ${value ? 'translate-x-5.5' : 'translate-x-0.5'}
      `} />
    </button>
  )

  const settingsItems = [
    { key: 'news', label: 'Новости', desc: 'Новости от тренера и группы', icon: Newspaper },
    { key: 'tournaments', label: 'Турниры', desc: 'Новые турниры и напоминания', icon: Trophy },
    { key: 'payments', label: 'Оплата', desc: 'Напоминания об абонементе', icon: Wallet },
    { key: 'schedule', label: 'Расписание', desc: 'Изменения в расписании', icon: Calendar },
  ]

  return (
    <Layout>
      <PageHeader title="Уведомления" back />
      <div className="px-4 space-y-4 slide-in stagger">
        {/* Main push toggle */}
        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pushEnabled ? 'bg-accent/20' : dark ? 'bg-white/[0.06]' : 'bg-white/60'}`}>
                {pushEnabled ? <Bell size={20} className="text-accent" /> : <BellOff size={20} className={dark ? 'text-white/30' : 'text-gray-500'} />}
              </div>
              <div>
                <div className="font-bold text-sm">Push-уведомления</div>
                <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                  {pushEnabled ? 'Включены' : 'Выключены'}
                </div>
              </div>
            </div>
            <Toggle value={pushEnabled} onChange={togglePush} />
          </div>
        </GlassCard>

        {/* Per-category settings */}
        {pushEnabled && (
          <div>
            <h2 className={`text-sm uppercase font-bold mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
              Категории
            </h2>
            <div className="space-y-2">
              {settingsItems.map(({ key, label, desc, icon: Icon }) => (
                <GlassCard key={key}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="text-accent" />
                      <div>
                        <div className="font-semibold text-sm">{label}</div>
                        <div className={`text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>{desc}</div>
                      </div>
                    </div>
                    <Toggle value={settings[key]} onChange={(v) => updateSetting(key, v)} />
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {!('PushManager' in window) && (
          <p className={`text-center text-sm py-4 ${dark ? 'text-white/30' : 'text-gray-500'}`}>
            Push-уведомления не поддерживаются в этом браузере
          </p>
        )}
      </div>
    </Layout>
  )
}
