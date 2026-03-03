import { useState, useMemo, useRef, useCallback } from 'react'
import { Plus, Trash2, Film, Play, X, Link2, Search, Tag, Heart, Video, Upload, MapPin, FolderPlus, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../utils/api'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Modal from '../components/Modal'

function getVideoEmbed(url) {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return { type: 'youtube', id: ytMatch[1], src: `https://www.youtube.com/embed/${ytMatch[1]}` }
  const vkMatch = url.match(/(?:vk\.com|vkvideo\.ru)\/video(-?\d+)_(\d+)/)
  if (vkMatch) return { type: 'vk', id: `${vkMatch[1]}_${vkMatch[2]}`, src: `https://vk.com/video_ext.php?oid=${vkMatch[1]}&id=${vkMatch[2]}&hd=2` }
  const vkClip = url.match(/(?:vk\.com|vkvideo\.ru)\/clip(-?\d+)_(\d+)/)
  if (vkClip) return { type: 'vk', id: `${vkClip[1]}_${vkClip[2]}`, src: `https://vk.com/video_ext.php?oid=${vkClip[1]}&id=${vkClip[2]}&hd=2` }
  return null
}

function getVideoThumb(url) {
  const embed = getVideoEmbed(url)
  if (embed?.type === 'youtube') return `https://img.youtube.com/vi/${embed.id}/mqdefault.jpg`
  return null
}

function getFavorites(userId) {
  try {
    const stored = localStorage.getItem(`iborcuha_favorites_${userId}`)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveFavorites(userId, ids) {
  localStorage.setItem(`iborcuha_favorites_${userId}`, JSON.stringify(ids))
}

export default function Materials() {
  const { auth } = useAuth()
  const { data, addMaterial, updateMaterial, deleteMaterial, updateGroup } = useData()
  const { dark } = useTheme()

  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '', groupIds: [], category: '', customThumb: '' })
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [showPinModal, setShowPinModal] = useState(null)
  const thumbInputRef = useRef(null)

  const isTrainer = auth.role === 'trainer'
  const myGroups = data.groups.filter(g => g.trainerId === (isTrainer ? auth.userId : null))

  const favUserId = auth.studentId || auth.userId
  const [favorites, setFavoritesState] = useState(() => getFavorites(favUserId))

  const toggleFavorite = useCallback((materialId) => {
    setFavoritesState(prev => {
      const next = prev.includes(materialId) ? prev.filter(id => id !== materialId) : [...prev, materialId]
      saveFavorites(favUserId, next)
      return next
    })
  }, [favUserId])

  // Filter materials by role
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

  // Dynamic categories
  const existingCategories = useMemo(() => {
    const cats = new Set()
    allMaterials.forEach(m => { if (m.category) cats.add(m.category) })
    return [...cats].sort()
  }, [allMaterials])

  const hasFavorites = useMemo(() => allMaterials.some(m => favorites.includes(m.id)), [allMaterials, favorites])

  // Filter by category, favorites, and search
  const materials = useMemo(() => {
    let filtered = allMaterials
    if (activeCategory === 'favorites') {
      filtered = filtered.filter(m => favorites.includes(m.id))
    } else if (activeCategory !== 'all') {
      filtered = filtered.filter(m => (m.category || '') === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q))
      )
    }
    return filtered
  }, [allMaterials, activeCategory, search, favorites])

  const categoryCounts = useMemo(() => {
    const counts = { all: allMaterials.length, favorites: allMaterials.filter(m => favorites.includes(m.id)).length }
    existingCategories.forEach(cat => {
      counts[cat] = allMaterials.filter(m => m.category === cat).length
    })
    return counts
  }, [allMaterials, existingCategories, favorites])

  const handleThumbUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumb(true)
    try {
      const url = await api.uploadFile(file)
      setForm(f => ({ ...f, customThumb: url }))
    } catch {
      alert('Ошибка загрузки обложки')
    }
    setUploadingThumb(false)
  }

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
      category: form.category.trim() || '',
      customThumb: form.customThumb || '',
    })
    setForm({ title: '', description: '', videoUrl: '', groupIds: [], category: '', customThumb: '' })
    setNewCategoryInput('')
    setShowAdd(false)
  }

  const handleDelete = (id) => {
    if (confirm('Удалить материал?')) {
      deleteMaterial(id)
      if (expandedId === id) setExpandedId(null)
    }
  }

  const handlePin = (materialId, groupId) => {
    updateGroup(groupId, { pinnedMaterialId: materialId })
    setShowPinModal(null)
  }

  const handleUnpin = (groupId) => {
    updateGroup(groupId, { pinnedMaterialId: null })
  }

  const toggleGroup = (gId) => {
    setForm(f => ({
      ...f,
      groupIds: f.groupIds.includes(gId) ? f.groupIds.filter(id => id !== gId) : [...f.groupIds, gId]
    }))
  }

  const handleSelectCategory = (cat) => {
    setForm(f => ({ ...f, category: cat }))
    setNewCategoryInput('')
  }

  const handleNewCategory = () => {
    const val = newCategoryInput.trim()
    if (val) {
      setForm(f => ({ ...f, category: val }))
      setNewCategoryInput('')
    }
  }

  const getPinnedGroups = (materialId) => myGroups.filter(g => g.pinnedMaterialId === materialId)

  const inputCls = `w-full px-4 py-3 rounded-[16px] text-base outline-none transition-all ${dark
    ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.1]'
    : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] shadow-sm'
  }`

  return (
    <Layout>
      <PageHeader title="Материалы">
        {isTrainer && (
          <button
            onClick={() => { setForm({ title: '', description: '', videoUrl: '', groupIds: [], category: '', customThumb: '' }); setNewCategoryInput(''); setShowAdd(true) }}
            className="press-scale p-2"
          >
            <Plus size={20} />
          </button>
        )}
      </PageHeader>

      {/* Search */}
      {allMaterials.length > 0 && (
        <div className="px-4 mb-3">
          <div className="relative">
            <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Поиск материалов..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm outline-none transition-all ${dark
                ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder-white/20 focus:border-purple-500/40'
                : 'bg-white/60 border border-white/50 text-gray-900 placeholder-gray-400 focus:border-purple-400 shadow-sm'
              }`}
            />
          </div>
        </div>
      )}

      {/* Category tabs */}
      {(existingCategories.length > 0 || hasFavorites) && (
        <div className="mb-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 px-4 pb-1">
            <CategoryTab active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} dark={dark} label="Все" count={categoryCounts.all} />
            {hasFavorites && (
              <CategoryTab
                active={activeCategory === 'favorites'}
                onClick={() => setActiveCategory('favorites')}
                dark={dark}
                label="Избранное"
                count={categoryCounts.favorites}
                icon={<Heart size={12} fill={activeCategory === 'favorites' ? 'currentColor' : 'none'} />}
                accent="red"
              />
            )}
            {existingCategories.map(cat => (
              <CategoryTab
                key={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                dark={dark}
                label={cat}
                count={categoryCounts[cat]}
                icon={<Tag size={12} />}
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-4 space-y-3 slide-in">
        {/* Empty state */}
        {materials.length === 0 && (
          <div className="text-center py-8">
            {search.trim() || (activeCategory !== 'all' && activeCategory !== 'favorites') ? (
              <>
                <Search size={48} className={`mx-auto mb-3 ${dark ? 'text-white/10' : 'text-gray-200'}`} />
                <p className={`text-sm ${dark ? 'text-white/30' : 'text-gray-500'}`}>Ничего не найдено</p>
                <button onClick={() => { setSearch(''); setActiveCategory('all') }} className={`mt-2 text-xs font-semibold ${dark ? 'text-purple-400' : 'text-purple-600'}`}>
                  Сбросить фильтры
                </button>
              </>
            ) : activeCategory === 'favorites' ? (
              <>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center ${dark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                  <Heart size={28} className={dark ? 'text-red-400/40' : 'text-red-300'} />
                </div>
                <p className={`text-sm font-semibold mb-1 ${dark ? 'text-white/60' : 'text-gray-700'}`}>Нет избранных</p>
                <p className={`text-xs ${dark ? 'text-white/25' : 'text-gray-400'}`}>Нажмите на сердечко, чтобы добавить</p>
              </>
            ) : (
              <div className="space-y-6">
                <div className={`w-20 h-20 mx-auto rounded-[28px] flex items-center justify-center ${
                  dark ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/10' : 'bg-gradient-to-br from-purple-100 to-blue-50'
                }`}>
                  <Video size={36} className={dark ? 'text-purple-400/60' : 'text-purple-400'} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white/80' : 'text-gray-800'}`}>Медиатека</h3>
                  <p className={`text-sm leading-relaxed max-w-[280px] mx-auto ${dark ? 'text-white/35' : 'text-gray-500'}`}>
                    {isTrainer
                      ? 'Загружайте видео с YouTube и VK для своих спортсменов. Создавайте разделы, управляйте доступом.'
                      : 'Здесь будут учебные видео от вашего тренера — техника, тактика и другие материалы.'}
                  </p>
                </div>
                <div className="space-y-2 max-w-[300px] mx-auto text-left">
                  {(isTrainer ? [
                    { icon: Video, text: 'Видео с YouTube и VK Video' },
                    { icon: FolderPlus, text: 'Разделы для организации' },
                    { icon: BookOpen, text: 'Доступ по группам' },
                  ] : [
                    { icon: Video, text: 'Учебные видео от тренера' },
                    { icon: Heart, text: 'Избранное для быстрого доступа' },
                    { icon: BookOpen, text: 'Разделы по темам' },
                  ]).map(({ icon: FIcon, text }, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl ${dark ? 'bg-white/[0.03]' : 'bg-white/40'}`}>
                      <FIcon size={16} className={dark ? 'text-purple-400/50' : 'text-purple-400'} />
                      <span className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>{text}</span>
                    </div>
                  ))}
                </div>
                {isTrainer && (
                  <button
                    onClick={() => { setForm({ title: '', description: '', videoUrl: '', groupIds: [], category: '', customThumb: '' }); setShowAdd(true) }}
                    className="px-6 py-3 rounded-2xl bg-accent text-white text-sm font-bold press-scale"
                  >
                    Добавить первый материал
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Material cards */}
        {materials.map(m => {
          const isExpanded = expandedId === m.id
          const thumb = m.customThumb || getVideoThumb(m.videoUrl)
          const embed = getVideoEmbed(m.videoUrl)
          const groups = (m.groupIds || []).map(gId => data.groups.find(g => g.id === gId)).filter(Boolean)
          const isFav = favorites.includes(m.id)
          const pinnedGroups = isTrainer ? getPinnedGroups(m.id) : []

          return (
            <GlassCard key={m.id} className="overflow-hidden">
              {/* Thumbnail / Player */}
              <div className={`relative -mx-4 -mt-4 ${isExpanded ? '' : 'mb-3'} aspect-video flex items-center justify-center overflow-hidden ${dark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                {isExpanded && embed ? (
                  <iframe
                    src={embed.src}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    frameBorder="0"
                  />
                ) : (
                  <>
                    {thumb ? (
                      <img src={thumb} alt={m.title} className="w-full h-full object-cover cursor-pointer" onClick={() => setExpandedId(m.id)} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={() => setExpandedId(m.id)}>
                        <Film size={32} className={dark ? 'text-white/10' : 'text-gray-200'} />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={() => setExpandedId(m.id)}>
                      <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <Play size={22} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  </>
                )}

                {/* Platform badge */}
                {embed?.type && !isExpanded && (
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    embed.type === 'youtube' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {embed.type === 'youtube' ? 'YouTube' : 'VK'}
                  </span>
                )}

                {/* Category badge */}
                {m.category && !isExpanded && (
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm ${dark ? 'bg-black/40 text-white/80' : 'bg-white/70 text-gray-700'}`}>
                    {m.category}
                  </span>
                )}

                {/* Favorite button in thumbnail */}
                {!isExpanded && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(m.id) }}
                    className="absolute bottom-2 right-2 press-scale p-1.5 rounded-full bg-black/30 backdrop-blur-sm"
                  >
                    <Heart size={16} className={isFav ? 'text-red-400' : 'text-white/60'} fill={isFav ? 'currentColor' : 'none'} strokeWidth={2} />
                  </button>
                )}

                {/* Pinned badge in thumbnail */}
                {!isExpanded && pinnedGroups.length > 0 && (
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-500/80 text-white backdrop-blur-sm">
                    <MapPin size={10} /> Отработка
                  </span>
                )}

                {/* Close button when expanded */}
                {isExpanded && (
                  <button onClick={() => setExpandedId(null)} className="absolute top-2 right-2 press-scale p-1.5 rounded-full bg-black/50 backdrop-blur-sm z-10">
                    <X size={16} className="text-white" />
                  </button>
                )}
              </div>

              {/* Info */}
              <div className={isExpanded ? 'pt-3' : ''}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm truncate">{m.title}</h3>
                    {m.description && (
                      <p className={`text-xs mt-0.5 ${isExpanded ? '' : 'line-clamp-2'} ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                        {m.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {isExpanded && (
                      <button onClick={() => toggleFavorite(m.id)} className="press-scale p-1.5">
                        <Heart size={16} className={isFav ? 'text-red-400' : dark ? 'text-white/30' : 'text-gray-300'} fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    )}
                    {isTrainer && isExpanded && (
                      <button onClick={() => setShowPinModal(m)} className="press-scale p-1.5">
                        <MapPin size={14} className={pinnedGroups.length > 0 ? 'text-green-400' : dark ? 'text-white/30' : 'text-gray-300'} />
                      </button>
                    )}
                    {isTrainer && (
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }} className="press-scale p-1.5">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {m.category && isExpanded && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${dark ? 'bg-white/[0.06] text-white/40' : 'bg-gray-100 text-gray-500'}`}>
                      {m.category}
                    </span>
                  )}
                  {groups.map(g => (
                    <span key={g.id} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${dark ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                      {g.name}
                    </span>
                  ))}
                  {pinnedGroups.length > 0 && isExpanded && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 flex items-center gap-0.5">
                      <MapPin size={8} /> Закреплено
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {/* Add material modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Новый материал">
        <form onSubmit={handleAdd} className="space-y-4">
          <input type="text" placeholder="Название *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} required />
          <textarea placeholder="Описание (необязательно)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} min-h-[80px] resize-none`} rows={2} />
          <div className="relative">
            <Link2 size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/20' : 'text-gray-400'}`} />
            <input type="url" placeholder="Ссылка на видео (YouTube / VK) *" value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} className={`${inputCls} pl-10`} required />
          </div>

          {/* Video preview */}
          {form.videoUrl && getVideoEmbed(form.videoUrl) && (
            <div className={`rounded-xl overflow-hidden aspect-video ${dark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
              <iframe src={getVideoEmbed(form.videoUrl).src} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen frameBorder="0" />
            </div>
          )}

          {/* Custom thumbnail upload */}
          <div>
            <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Обложка (необязательно)</div>
            <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumbUpload} className="hidden" />
            {form.customThumb ? (
              <div className="relative rounded-xl overflow-hidden aspect-video">
                <img src={form.customThumb} alt="Обложка" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setForm(f => ({ ...f, customThumb: '' }))} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm press-scale">
                  <X size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                disabled={uploadingThumb}
                className={`w-full py-3 rounded-[16px] border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium press-scale ${
                  dark ? 'border-white/10 text-white/30' : 'border-gray-200 text-gray-400'
                }`}
              >
                <Upload size={18} />
                {uploadingThumb ? 'Загрузка...' : 'Загрузить свою обложку'}
              </button>
            )}
          </div>

          {/* Category / Section */}
          <div>
            <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Раздел</div>
            {form.category && (
              <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-2xl ${dark ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-purple-100 border border-purple-200'}`}>
                <Tag size={14} className={dark ? 'text-purple-300' : 'text-purple-600'} />
                <span className={`text-sm font-bold flex-1 ${dark ? 'text-purple-300' : 'text-purple-700'}`}>{form.category}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, category: '' }))} className="press-scale">
                  <X size={16} className={dark ? 'text-purple-300/60' : 'text-purple-400'} />
                </button>
              </div>
            )}
            {existingCategories.length > 0 && !form.category && (
              <div className="flex flex-wrap gap-2 mb-3">
                {existingCategories.map(cat => (
                  <button key={cat} type="button" onClick={() => handleSelectCategory(cat)} className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold press-scale transition-all ${dark ? 'bg-white/[0.05] text-white/50 border border-white/[0.05]' : 'bg-white/60 text-gray-600 border border-white/50'}`}>
                    <Tag size={12} />{cat}
                  </button>
                ))}
              </div>
            )}
            {!form.category && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={existingCategories.length > 0 ? 'Или новый раздел...' : 'Название раздела...'}
                  value={newCategoryInput}
                  onChange={e => setNewCategoryInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleNewCategory() } }}
                  className={`flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none transition-all ${dark ? 'bg-white/[0.07] border border-white/[0.08] text-white placeholder-white/20 focus:border-purple-500/50' : 'bg-white/70 border border-white/60 text-gray-900 placeholder-gray-400 focus:border-purple-400 shadow-sm'}`}
                />
                {newCategoryInput.trim() && (
                  <button type="button" onClick={handleNewCategory} className="px-4 py-2.5 rounded-2xl bg-accent text-white text-sm font-bold press-scale shrink-0">OK</button>
                )}
              </div>
            )}
            <p className={`text-[10px] mt-1.5 ${dark ? 'text-white/25' : 'text-gray-400'}`}>Раздел помогает организовать материалы по темам</p>
          </div>

          {/* Group selection */}
          {myGroups.length > 0 && (
            <div>
              <div className={`text-xs uppercase font-semibold mb-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>Доступ по группам</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, groupIds: [] }))} className={`px-3 py-1.5 rounded-full text-xs font-bold press-scale transition-all ${form.groupIds.length === 0 ? 'bg-accent text-white' : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'}`}>
                  Все группы
                </button>
                {myGroups.map(g => (
                  <button key={g.id} type="button" onClick={() => toggleGroup(g.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold press-scale transition-all ${form.groupIds.includes(g.id) ? 'bg-purple-500 text-white' : dark ? 'bg-white/[0.06] text-white/50 border border-white/[0.06]' : 'bg-white/70 text-gray-500 border border-white/60'}`}>
                    {g.name}
                  </button>
                ))}
              </div>
              <p className={`text-[10px] mt-1.5 ${dark ? 'text-white/25' : 'text-gray-400'}`}>
                {form.groupIds.length === 0 ? 'Доступен всем спортсменам' : 'Только выбранным группам'}
              </p>
            </div>
          )}

          <button type="submit" className="w-full py-3.5 rounded-[16px] bg-accent text-white font-bold press-scale text-base">
            Добавить материал
          </button>
        </form>
      </Modal>

      {/* Pin for group modal */}
      <Modal open={!!showPinModal} onClose={() => setShowPinModal(null)} title="Отработка дня">
        {showPinModal && (
          <div className="space-y-2">
            <p className={`text-sm mb-3 ${dark ? 'text-white/50' : 'text-gray-500'}`}>
              Выберите группу — ученики увидят это видео как «Отработка дня» на главной
            </p>
            {myGroups.map(g => {
              const isPinned = g.pinnedMaterialId === showPinModal.id
              return (
                <button
                  key={g.id}
                  onClick={() => isPinned ? handleUnpin(g.id) : handlePin(showPinModal.id, g.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] press-scale transition-all text-left ${
                    isPinned
                      ? 'bg-green-500/15 border border-green-500/30'
                      : dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white/60 border border-white/50'
                  }`}
                >
                  <MapPin size={16} className={isPinned ? 'text-green-400' : dark ? 'text-white/30' : 'text-gray-400'} />
                  <span className="flex-1 font-semibold text-sm">{g.name}</span>
                  {isPinned && <span className="text-xs font-bold text-green-400">Закреплено</span>}
                </button>
              )
            })}
          </div>
        )}
      </Modal>
    </Layout>
  )
}

function CategoryTab({ active, onClick, dark, label, count, icon, accent = 'purple' }) {
  const colors = accent === 'red'
    ? {
        active: dark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-600 border border-red-200',
        badge: dark ? 'bg-red-400/30 text-red-200' : 'bg-red-200 text-red-600',
      }
    : {
        active: dark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-200',
        badge: dark ? 'bg-purple-400/30 text-purple-200' : 'bg-purple-200 text-purple-700',
      }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap press-scale transition-all shrink-0 ${
        active
          ? colors.active
          : dark ? 'bg-white/[0.05] text-white/40 border border-white/[0.05]' : 'bg-white/50 text-gray-500 border border-white/40'
      }`}
    >
      {icon}
      <span>{label}</span>
      {(count || 0) > 0 && (
        <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
          active ? colors.badge : dark ? 'bg-white/[0.08] text-white/30' : 'bg-black/[0.05] text-gray-400'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}
