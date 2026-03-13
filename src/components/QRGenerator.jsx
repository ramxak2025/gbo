import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { RefreshCw, Printer, Copy, Check } from 'lucide-react'
import { api } from '../utils/api'
import { useTheme } from '../context/ThemeContext'
import GlassCard from './GlassCard'

export default function QRGenerator({ groupId, groupName }) {
  const { dark } = useTheme()
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.getQrToken(groupId).then(r => { setToken(r.token); setLoading(false) }).catch(() => setLoading(false))
  }, [groupId])

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const r = await api.regenerateQrToken(groupId)
      setToken(r.token)
    } catch (e) {
      console.error(e)
    }
    setRegenerating(false)
  }

  const qrUrl = token ? `${window.location.origin}/qr-checkin/${token}` : ''

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=420,height=600')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>QR - ${groupName}</title><style>
      body { font-family: -apple-system, sans-serif; text-align: center; padding: 40px 20px; }
      h2 { margin-bottom: 8px; font-size: 22px; }
      p { color: #666; margin-bottom: 24px; font-size: 14px; }
      svg { max-width: 280px; height: auto; }
      .hint { margin-top: 20px; color: #999; font-size: 12px; }
    </style></head><body>
      <h2>${groupName}</h2>
      <p>Отсканируйте QR-код для отметки посещения</p>
      <div id="qr"></div>
      <p class="hint">iBorcuha</p>
    </body></html>`)
    const svgEl = document.getElementById('qr-svg-print')
    if (svgEl) w.document.getElementById('qr').innerHTML = svgEl.outerHTML
    w.document.close()
    setTimeout(() => { w.print(); w.close() }, 300)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(qrUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <GlassCard className="text-center py-12">
        <div className={`animate-pulse text-sm ${dark ? 'text-white/40' : 'text-gray-500'}`}>Загрузка QR-кода...</div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-3">
      <GlassCard className="text-center">
        <div className={`text-[10px] uppercase font-bold tracking-wider mb-4 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
          QR-код для посещаемости
        </div>

        {/* QR Code */}
        <div className={`inline-block p-4 rounded-[20px] ${dark ? 'bg-white' : 'bg-white shadow-lg'}`}>
          <QRCodeSVG
            id="qr-svg-print"
            value={qrUrl}
            size={220}
            level="M"
            includeMargin={false}
          />
        </div>

        <div className={`mt-4 text-xs ${dark ? 'text-white/30' : 'text-gray-500'}`}>
          Ученики сканируют этот код через свой кабинет
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handlePrint}
          className={`flex flex-col items-center gap-1.5 py-3 rounded-[16px] press-scale transition-all ${
            dark ? 'bg-white/[0.06] border border-white/[0.08] text-white/70' : 'bg-white/70 border border-white/60 text-gray-700 shadow-sm'
          }`}
        >
          <Printer size={18} />
          <span className="text-[10px] font-semibold">Печать</span>
        </button>
        <button
          onClick={handleCopy}
          className={`flex flex-col items-center gap-1.5 py-3 rounded-[16px] press-scale transition-all ${
            copied
              ? 'bg-green-500/15 border border-green-500/30 text-green-400'
              : dark ? 'bg-white/[0.06] border border-white/[0.08] text-white/70' : 'bg-white/70 border border-white/60 text-gray-700 shadow-sm'
          }`}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          <span className="text-[10px] font-semibold">{copied ? 'Готово' : 'Ссылка'}</span>
        </button>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className={`flex flex-col items-center gap-1.5 py-3 rounded-[16px] press-scale transition-all ${
            dark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-500 shadow-sm'
          } disabled:opacity-50`}
        >
          <RefreshCw size={18} className={regenerating ? 'animate-spin' : ''} />
          <span className="text-[10px] font-semibold">Новый</span>
        </button>
      </div>

      <div className={`text-center text-[10px] ${dark ? 'text-white/20' : 'text-gray-400'}`}>
        При генерации нового QR старый перестанет работать
      </div>
    </div>
  )
}
