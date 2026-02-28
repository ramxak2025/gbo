import { useState } from 'react'
import { Instagram, Globe, Phone, MessageCircle, Edit3, Code } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'

export default function Author() {
  const { auth } = useAuth()
  const { data, update } = useData()
  const { dark } = useTheme()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  const info = data.authorInfo || {}
  const isAdmin = auth.role === 'superadmin'

  const startEdit = () => {
    setForm({ ...info })
    setEditing(true)
  }

  const saveEdit = (e) => {
    e.preventDefault()
    update(d => ({ ...d, authorInfo: { ...form } }))
    setEditing(false)
  }

  const cleanPhone = (phone) => phone?.replace(/[^\d]/g, '') || ''

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none
    ${dark
      ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent'
      : 'bg-white border border-black/[0.06] text-gray-900 placeholder-gray-400 focus:border-accent shadow-sm'
    }
  `

  return (
    <Layout>
      <PageHeader title="Автор" logo>
        {isAdmin && (
          <button onClick={startEdit} className="press-scale p-2">
            <Edit3 size={18} />
          </button>
        )}
      </PageHeader>

      <div className="px-4 space-y-4 slide-in">
        {/* Logo & branding */}
        <div className="flex flex-col items-center text-center pt-4">
          <img
            src="/logo.png"
            alt="iBorcuha"
            className="w-24 h-24 rounded-[22px] shadow-xl shadow-black/40 mb-4"
          />
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${dark ? 'bg-accent/15 text-accent' : 'bg-accent/10 text-accent'}`}>
            <Code size={12} />
            Проект разработал
          </div>
        </div>

        {/* Author name */}
        <GlassCard className="text-center">
          <h2 className="text-xl font-black italic">{info.name || 'Не указано'}</h2>
          {info.description && (
            <p className={`text-sm mt-2 leading-relaxed ${dark ? 'text-white/50' : 'text-gray-500'}`}>
              {info.description}
            </p>
          )}
        </GlassCard>

        {/* Social links */}
        <div className="space-y-2">
          {info.instagram && (
            <a
              href={`https://instagram.com/${info.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <GlassCard className="flex items-center gap-3 press-scale">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Instagram size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Instagram</div>
                  <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>@{info.instagram}</div>
                </div>
              </GlassCard>
            </a>
          )}

          {info.website && (
            <a
              href={`https://${info.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <GlassCard className="flex items-center gap-3 press-scale">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Globe size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Веб-сайт</div>
                  <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{info.website}</div>
                </div>
              </GlassCard>
            </a>
          )}

          {info.phone && (
            <a
              href={`https://wa.me/${cleanPhone(info.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <GlassCard className="flex items-center gap-3 press-scale">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                  <MessageCircle size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm">WhatsApp</div>
                  <div className={`text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>{info.phone}</div>
                </div>
              </GlassCard>
            </a>
          )}
        </div>

        {/* Branding footer */}
        <div className="text-center pt-4 pb-2">
          <p className={`text-xs ${dark ? 'text-white/20' : 'text-gray-300'}`}>
            <span>i</span><span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Borcuha</span> — Web-Kultura Edition
          </p>
        </div>
      </div>

      {/* Edit Modal (admin only) */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Редактировать информацию">
        {form && (
          <form onSubmit={saveEdit} className="space-y-3">
            <input
              type="text"
              placeholder="ФИО автора"
              value={form.name || ''}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Описание"
              value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Instagram (без @)"
              value={form.instagram || ''}
              onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Веб-сайт"
              value={form.website || ''}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Телефон"
              value={form.phone || ''}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className={inputCls}
            />
            <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">
              Сохранить
            </button>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
