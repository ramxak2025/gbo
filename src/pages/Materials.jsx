import { useState, useMemo } from 'react'
import { Plus, Trash2, Film, Play, X, Link2, Search, FolderOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'

const CATEGORIES = [
  { id: 'all', label: 'Все', icon: '📂' },
  { id: 'technique', label: 'Техника', icon: '🥋' },
  { id: 'tactics', label: 'Тактика', icon: '🧠' },
  { id: 'warmup', label: 'Разминка', icon: '🔥' },
  { id: 'physical', label: 'ОФП', icon: '💪' },
  { id: 'sparring', label: 'Спарринг', icon: '🤼' },
  { id: 'theory', label: 'Теория', icon: '📖' },
  { id: 'other', label: 'Другое', icon: '📁' },
]

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.filter(c => c.id !== 'all').map(c => [c.id, c]))

function getCategoryInfo(id) {
  return CATEGORY_MAP[id] || CATEGORY_MAP.other
}

function getVideoEmbed(url) {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return { type: 'youtube', id: ytMatch[1], src: `https://www.youtube.com/embed/${ytMatch[1]}` }
  const vkMatch = url.match(/vk\.com\/video(-?\d+)_(\d+)/)
  if (vkMatch) return { type: 'vk', id: `${vkMatch[1]}_${vkMatch[2]}`, src: `https://vk.com/video_ext.php?oid=${vkMatch[1]}&id=${vkMatch[2]}&hd=2` }
  const vkClip = url.match(/vk\.com\/clip(-?\d+)_(\d+)/)
  if (vkClip) return { type: 'vk', id: `${vkClip[1]}_${vkClip[2]}`, src: `https://vk.com/video_ext.php?oid=${vkClip[1]}&id=${vkClip[2]}&hd=2` }
  return null
}

function getVideoThumb(url) {
  const embed = getVideoEmbed(url)
  if (embed?.type === 'youtube') return `https://img.youtube.com/vi/${embed.id}/mqdefault.jpg`
  return null
}

export default function Materials() {
  const { auth } = useAuth()
  const { data, addMaterial, deleteMaterial } = useData()
  const { dark } = useTheme()
  const [showAdd, setShowAdd] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '', groupIds: [], category: 'technique' })

  const isTrainer = auth.role === 'trainer'
  const myGroups = data.groups.filter(g => g.trainerId === (isTrainer ? auth.userId : null))

  // Filter materials based on role
  const allMaterials = useMemo(() => {
    const mats = data.materials || []
    if (auth.role === 'superadmin') return mats
    if (auth.role === 'trainer') return mats.filter(m => m.trainerId === auth.userId)
    const student = data.students.find(s => s.id === auth.studentId)
    if (!student) return []
    return mats.filter(m => {
      if (!m.groupIds || m.groupIds.length === 0) return m.trainerId === student.trainerId
      return m.groupIds.includes(student.groupId)
    })
  }, [data.materials, data.students, auth])

  // Filter by category and search
  const materials = useMemo(() => {
    let filtered = allMaterials
    if (activeCategory !== 'all') {
      filtered = filtered.filter(m => (m.category || 'other') === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
      )
    }
    return filtered
  }, [allMaterials, activeCategory, search])

  // Count materials per category
  const categoryCounts = useMemo(() => {
    const counts = { all: allMaterials.length }
    for (const cat of CATEGORIES) {
      if (cat.id !== 'all') {
        counts[cat.id] = allMaterials.filter(m => (m.category || 'other') === cat.id).length
      }
    }
    return counts
  }, [allMaterials])

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.videoUrl.trim()) return
    const embed = getVideoEmbed(form.videoUrl.trim())
    if (!embed) {
      alert('Вставьте корректную ссылку на YouTube или VK Video')
      return
    }
    addMaterial({
      trainerId: auth.userId,
      title: form.title.trim(),
      description: form.description.trim(),
      videoUrl: form.videoUrl.trim(),
      groupIds: form.groupIds,
      category: form.category,
    })
    setForm({ title: '', description: '', videoUrl: '', groupIds: [], category: 'technique' })
    setShowAdd(false)
  }

  const handleDelete = (id) => {
    if (confirm('Удалить материал?')) {
      deleteMaterial(id)
      if (viewing?.id === id) setViewing(null)
    }
  }

  const toggleGroup = (gId) => {
    setForm(f => ({
      ...f,
      groupIds: f.groupIds.includes(gId)
        ? f.groupIds.filter(id => id !== gId)
        : [...f.groupIds, gId]
    }))
  }

  const inputCls = `
    w-full px-4 py-3 rounded-[16px] text-base outline-none transition-all
    ${dark
      ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.1]'
      : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] shadow-sm'
    }
  `

  return (
    <Layout>
      <PageHeader title="Материалы">
        {isTrainer && (
          <button
            onClick={() => { setForm({ title: '', description: '', videoUrl: '', groupIds: [], category: 'technique' }); setShowAdd(true) }}
            className="press-scale p-2"
          >
            <Plus size={20} />
          </button>
        )}
      </PageHeader>

      {/* Search bar */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Поиск материалов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`
              w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm outline-none transition-all
              ${dark
                ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder-white/20 focus:border-purple-500/40'
                : 'bg-white/60 border border-white/50 text-gray-900 placeholder-gray-400 focus:border-purple-400 shadow-sm'
              }
            `}
          />
        </div>
      </div>

      {/* Category tabs - horizontal scroll */}
      <div className="mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4 pb-1">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id
            const count = categoryCounts[cat.id] || 0
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap
                  press-scale transition-all shrink-0
                  ${isActive
                    ? dark
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-purple-100 text-purple-700 border border-purple-200'
                    : dark
                      ? 'bg-white/[0.05] text-white/40 border border-white/[0.05]'
                      : 'bg-white/50 text-gray-500 border border-white/40'
                  }
                `}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.label}</span>
                {count > 0 && (
                  <span className={`
                    min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1
                    ${isActive
                      ? dark ? 'bg-purple-400/30 text-purple-200' : 'bg-purple-200 text-purple-700'
                      : dark ? 'bg-white/[0.08] text-white/30' : 'bg-black/[0.05] text-gray-400'
                    }
                  `}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 space-y-3 slide-in">
        {/* Empty state */}
        {materials.length === 0 && (
          <div className="text-center py-12">
            {search.trim() || activeCategory !== 'all' ? (
              <>
                <Search size={48} className={`mx-auto mb-3 ${dark ? 'text-white/10' : 'text-gray-200'}`} />
                <p className={`text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                  Ничего не найдено
                </p>
                <button
                  onClick={() => { setSearch(''); setActiveCategory('all') }}
                  className={`mt-2 text-xs font-semibold ${dark ? 'text-purple-400' : 'text-purple-600'}`}
                >
                  Сбросить фильтры
                </button>
              </>
            ) : (
              <>
                <Film size={48} className={`mx-auto mb-3 ${dark ? 'text-white/10' : 'text-gray-200'}`} />
                <p className={`text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>
                  {isTrainer ? 'Нет материалов. Добавьте первый!' : 'Нет доступных материалов'}
                </p>
                {isTrainer && (
                  <button
                    onClick={() => { setForm({ title: '', description: '', videoUrl: '', groupIds: [], category: 'technique' }); setShowAdd(true) }}
                    className="mt-3 px-5 py-2 rounded-full bg-accent text-white text-sm font-bold press-scale"
                  >
                    Добавить материал
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Material cards */}
        {materials.map(m => {
          const thumb = getVideoThumb(m.videoUrl)
          const embed = getVideoEmbed(m.videoUrl)
          const groups = (m.groupIds || []).map(gId => data.groups.find(g => g.id === gId)).filter(Boolean)
          const catInfo = getCategoryInfo(m.category)
          return (
            <GlassCard
              key={m.id}
              onClick={() => setViewing(m)}
              className="overflow-hidden"
            >
              {/* Thumbnail */}
              <div className={`relative -mx-4 -mt-4 mb-3 aspect-video flex items-center justify-center overflow-hidden ${
                dark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'
              }`}>
                {thumb ? (
                  <img src={thumb} alt={m.title} className="w-full h-full object-cover" />
                ) : (
                  <Film size={32} className={dark ? 'text-white/10' : 'text-gray-200'} />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <Play size={22} className="text-white ml-0.5" fill="white" />
                  </div>
                </div>
                {/* Platform badge */}
                {embed?.type && (
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    embed.type === 'youtube' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {embed.type === 'youtube' ? 'YouTube' : 'VK'}
                  </span>
                )}
                {/* Category badge */}
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm ${
                  dark ? 'bg-black/40 text-white/80' : 'bg-white/70 text-gray-700'
                }`}>
                  {catInfo.icon} {catInfo.label}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm truncate">{m.title}</h3>
                  {m.description && (
                    <p className={`text-xs mt-0.5 line-clamp-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                      {m.description}
                    </p>
                  )}
                  {groups.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {groups.map(g => (
                        <span key={g.id} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          dark ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {isTrainer && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }}
                    className="press-scale p-1.5 shrink-0"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                )}
              </div>
            </GlassCard>
          )
        })}
      </div>

      {/* Video player modal */}
      {viewing && (
        <div className="fixed inset-0 z-[100] flex flex-col">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setViewing(null)} />
          <div className="relative z-10 flex flex-col h-full safe-top">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1 mr-3">
                <h2 className="text-white font-bold truncate">{viewing.title}</h2>
                {viewing.description && (
                  <p className="text-white/50 text-xs truncate">{viewing.description}</p>
                )}
              </div>
              <button onClick={() => setViewing(null)} className="press-scale p-2 rounded-full bg-white/10">
                <X size={20} className="text-white" />
              </button>
            </div>
            <div className="flex-1 flex items-center px-2">
              {getVideoEmbed(viewing.videoUrl) ? (
                <div className="w-full aspect-video rounded-2xl overflow-hidden">
                  <iframe
                    src={getVideoEmbed(viewing.videoUrl).src}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    frameBorder="0"
                  />
                </div>
              ) : (
                <div className="w-full text-center">
                  <p className="text-white/50">Не удалось загрузить видео</p>
                  <a href={viewing.videoUrl} target="_blank" rel="noopener noreferrer" className="text-accent text-sm mt-2 inline-flex items-center gap-1">
                    <Link2 size={14} /> Открыть ссылку
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add material modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Новый материал">
        <form onSubmit={handleAdd} className="space-y-3">
          <input
            type="text"
            placeholder="Название *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className={inputCls}
            required
          />
          <textarea
            placeholder="Описание (необязательно)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className={`${inputCls} min-h-[80px] resize-none`}
            rows={2}
          />
          <div className="relative">
            <Link2 size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-400'}`} />
            <input
              type="url"
              placeholder="Ссылка на видео (YouTube / VK) *"
              value={form.videoUrl}
              onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
              className={`${inputCls} pl-10`}
              required
            />
          </div>

          {/* Video preview */}
          {form.videoUrl && getVideoEmbed(form.videoUrl) && (
            <div className={`rounded-xl overflow-hidden aspect-video ${dark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
              <iframe
                src={getVideoEmbed(form.videoUrl).src}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                frameBorder="0"
              />
            </div>
          )}

          {/* Category selection */}
          <div>
            <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
              Раздел
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold
                    press-scale transition-all text-left
                    ${form.category === cat.id
                      ? dark
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-purple-100 text-purple-700 border border-purple-200'
                      : dark
                        ? 'bg-white/[0.05] text-white/40 border border-white/[0.05]'
                        : 'bg-white/50 text-gray-500 border border-white/40'
                    }
                  `}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Group selection */}
          {myGroups.length > 0 && (
            <div>
              <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                Доступ по группам
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, groupIds: [] }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold press-scale transition-all ${
                    form.groupIds.length === 0
                      ? 'bg-accent text-white'
                      : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'
                  }`}
                >
                  Все группы
                </button>
                {myGroups.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold press-scale transition-all ${
                      form.groupIds.includes(g.id)
                        ? 'bg-purple-500 text-white'
                        : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
              <p className={`text-[10px] mt-1.5 ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                {form.groupIds.length === 0 ? 'Материал доступен всем вашим спортсменам' : 'Материал доступен только выбранным группам'}
              </p>
            </div>
          )}

          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale">
            Добавить
          </button>
        </form>
      </Modal>
    </Layout>
  )
}
