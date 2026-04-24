# Design System — iBorcuha PWA → React Native

Точные значения из мобильной PWA-версии iborcuha.ru.
Этот документ — единственный источник правды для React Native реализации.

## 1. Цветовая палитра

### Тёмная тема (primary)
| Токен | Значение | Использование |
|-------|----------|---------------|
| `dark-900` | `#050505` | Фон приложения |
| `dark-800` | `#09090b` | Фон модалок, карточек elevated |
| `dark-700` | `#111113` | Фон input |
| `dark-600` | `#1a1a1f` | Фон кнопок secondary |
| `dark-500` | `#27272a` | Borders, dividers |

### Светлая тема
| Токен | Значение |
|-------|----------|
| `light-bg` | `#f5f5f7` |
| `light-card` | `#ffffff` |
| `light-border` | `rgba(0, 0, 0, 0.06)` |

### Акцент (красный)
| Токен | Значение |
|-------|----------|
| `accent` | `#dc2626` |
| `accent-dark` | `#b91c1c` |
| `accent-light` | `#ef4444` |

### Glass effect
| Токен | Значение | Тема |
|-------|----------|------|
| `glass-dark` | `rgba(255, 255, 255, 0.05)` | Dark — фон карточки |
| `glass-border-dark` | `rgba(255, 255, 255, 0.07)` | Dark — border карточки |
| `glass-light` | `rgba(255, 255, 255, 0.70)` | Light — фон карточки |
| `glass-border-light` | `rgba(255, 255, 255, 0.60)` | Light — border карточки |
| `glass-hover-dark` | `rgba(255, 255, 255, 0.08)` | Dark — активная вкладка |
| `glass-active-dark` | `rgba(255, 255, 255, 0.12)` | Dark — нажатие |

### Непрозрачности текста (на тёмном фоне)
| Opacity | Использование |
|---------|---------------|
| `1.0` | Primary text |
| `0.70` | Secondary text |
| `0.45` | Tertiary text |
| `0.25` | Quaternary text, placeholder |
| `0.20` | Handle bar модалки |
| `0.15` | Inactive border |
| `0.08` | Card border |
| `0.05` | Card background |

### Семантические цвета
| Цвет | Hex | bg (15% opacity) | Использование |
|------|-----|-------------------|---------------|
| Green (success) | `#22c55e` | `rgba(34,197,94,0.15)` | Активен, доход, здоров |
| Yellow (warning) | `#fbbf24` | `rgba(251,191,36,0.15)` | Болеет (sick) |
| Red (danger) | `#f87171` / `#ef4444` | `rgba(248,113,113,0.15)` | Травма, долг, расход |
| Purple (skip) | `#a855f7` | `rgba(168,85,247,0.15)` | Сачок (skip) |
| Blue (info) | `#3b82f6` | `rgba(59,130,246,0.15)` | Users, info |
| Indigo | `#6366f1` | — | Wallet, charts |

### Категории расходов
| Категория | Цвет |
|-----------|------|
| Аренда | `#3b82f6` (blue) |
| Инвентарь | `#8b5cf6` (purple) |
| Зарплата | `#f59e0b` (amber) |
| Реклама | `#ec4899` (pink) |
| Прочее | `#6b7280` (gray) |
| Абонемент | `#22c55e` (green) |

### Градиенты
| Название | Цвета | Использование |
|----------|-------|---------------|
| Brand logo | `from-purple-400 via-violet-500 to-indigo-500` | Текст "Borcuha" |
| Brand button | `[#dc2626, #b91c1c]` | CTA кнопки |
| Trainer hero | `[#a855f7, #6366f1, #3b82f6]` | Hero trainer |
| Student hero | `[#22c55e, #10b981, #0ea5e9]` | Hero student |
| Admin hero | `[#f59e0b, #dc2626, #7c3aed]` | Hero admin |
| Head trainer | `[#fbbf24, #f97316, #dc2626]` | Champion/head trainer ring |
| Income | `[#22c55e, #10b981]` | Доход |
| Expense | `[#ef4444, #dc2626]` | Расход |
| Wallet | `[#6366f1, #8b5cf6]` | Wallet icon circle |
| Fire | `[#fbbf24, #f97316, #dc2626]` | Турниры, champion |

### Цвета поясов BJJ
| Пояс | Цвет |
|------|------|
| Белый | `#e5e5e5` |
| Синий | `#3b82f6` |
| Фиолетовый | `#8b5cf6` |
| Коричневый | `#92400e` |
| Чёрный | `#1a1a1a` |

## 2. Размеры и отступы

### Border Radius
| Размер | px | Использование |
|--------|-----|---------------|
| `sm` | `12px` | Tab button, small icon |
| `md` | `14px` | Text input |
| `lg` | `16px` | Button |
| `xl` | `20px` | **GlassCard** (основная карточка) |
| `squircle` | `24px` | Login form, profile hero |
| `squircle-lg` | `32px` | Modal bottom sheet (верх) |
| `pill` | `999px` / `full` | Avatar, badge, pill |
| `nav` | `22px` | Bottom nav bar |

### Spacing
| Элемент | px |
|---------|-----|
| Page horizontal padding | `16px` (px-4) |
| Card padding | `16px` (p-4) |
| Card padding large | `20px` (p-5) |
| Modal padding | `20px` (p-5) |
| Button vertical padding | `14px` (py-3.5) |
| Input vertical padding | `12-14px` |
| Gap between cards | `8-12px` (space-y-2 / space-y-3) |
| Section gap | `16-20px` |
| Bottom nav height | `60px` |
| Bottom padding (for nav) | `128px` (pb-32) |

### Font Sizes
| Стиль | px | Weight | Использование |
|-------|-----|--------|---------------|
| Hero | `30-34px` | `900` (black) | Login logo, success |
| Title 1 | `24px` | `900` | Profile name, hero name |
| Title 2 | `18-20px` | `700-800` | Section title, card title |
| Title 3 | `16px` | `700` | Card heading |
| Body | `14px` | `500-600` | Main text |
| Caption | `12px` | `600` | Secondary info, schedule |
| Micro | `10-11px` | `600-700` | Uppercase labels, tagline |
| Nav label | `9px` | `500-700` | Bottom nav text |

### Letter Spacing
| Стиль | em |
|-------|-----|
| Logo tight | `-0.025em` |
| Section wider | `0.05em` |
| Tagline | `0.2em` |

## 3. Тени

| Тень | Значение | Использование |
|------|----------|---------------|
| Card (light) | `0 2px 12px rgba(0,0,0,0.04)` | Light mode card |
| BottomNav (dark) | `0 8px 32px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.1)` | Dark bottom nav |
| BottomNav (light) | `0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.8)` | Light bottom nav |
| Modal | no explicit shadow, uses bg-black/60 backdrop | — |

## 4. Анимации

### Timing функция (ease)
`cubic-bezier(0.22, 1, 0.36, 1)` — primary easing (spring-like)

### Анимации
| Название | Duration | Описание |
|----------|----------|----------|
| slideIn | `0.35s` | Page enter: opacity 0→1, translateY 16→0 |
| fadeIn | `0.3s ease-out` | Simple fade |
| staggerItem | `0.4s` | Card appear: opacity 0→1, translateY 12→0, scale 0.97→1. Delay = child_index × 40ms |
| scaleIn | `0.35s` | Avatar/icon: opacity 0→1, scale 0.8→1 |
| press-scale | `0.12s` | On press: scale 1→0.96, opacity 1→0.85 |
| sheetUp | `0.4s` | Modal: translateY 100%→0 |
| overlayIn | `0.3s ease-out` | Backdrop: opacity 0→1 |
| bounceIn | `0.5s bounce` | Badge: scale 0.3→1.1→1, opacity 0→1 |
| shimmer | `1.5s infinite` | Skeleton loader: gradient shift |
| drawerSlideIn | `0.35s` | Category drawer: translateX 100%→0 |
| toastIn | `0.4s` | Toast: translateY −20→0, scale 0.95→1 |
| championTrophy | `0.8s bounce delay 0.3s` | Trophy: scale 0→1.2→1, rotate −20→5→0 |
| championGlow | `2s infinite` | Pulse: opacity 0.3→0.6→0.3, scale 1→1.1→1 |
| cashParticle | `1s` | Floating particles after payment |

## 5. Компоненты PWA (для переноса в RN)

### GlassCard
```
rounded-[20px] p-4 backdrop-blur-xl
dark: bg-white/[0.05] border border-white/[0.07]
light: bg-white/70 border border-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)]
onClick → press-scale (scale 0.96, opacity 0.85)
```

### Avatar
```
rounded-full, object-cover
fallback: bg-accent (#dc2626), initials (first 2 letters, uppercase)
fontSize = size × 0.35
default size = 40px
```

### BottomNav
```
fixed bottom-0, z-50
rounded-[22px], h-[60px]
dark: bg-white/[0.08], backdrop-blur-3xl, backdrop-saturate-[1.8]
light: bg-white/50
active tab: dark bg-white/[0.12], light bg-black/[0.06]
icon: 22px, active strokeWidth 2.5, inactive 1.5
label: 9px, active font-bold, inactive font-medium
5 tabs по роли (superadmin/trainer/student)
```

### Modal (Bottom Sheet)
```
max-h-[85vh], rounded-t-[32px], p-5
dark: bg-dark-800/95
light: bg-[#f5f5f7]/95
backdrop: bg-black/60, backdrop-blur-sm
handle: w-10 h-1 rounded-full, dark bg-white/20 light bg-black/15
close: X icon 18px in rounded-xl, dark bg-white/[0.05]
title: text-lg font-bold uppercase italic
```

### PageHeader
```
sticky top, z-10
dynamic blur on scroll (0→16px blur as scroll 0→30px)
dark bg: rgba(5,5,5, 0.55×scroll)
light bg: rgba(245,245,247, 0.6×scroll)
back button: ChevronLeft 20px
title: text-lg font-bold uppercase italic
theme toggle: Sun/Moon 18px
```

### PhoneInput
```
format: "8 (XXX) XXX-XX-XX"
type="tel", inputMode="tel", maxLength=18
```

### DateButton
```
pill shape: rounded-full, px-3 py-1.5
icon: Calendar 12px
text: 12px font-medium
selected: bg-accent/15 text-accent border-accent/30
empty: bg-white/[0.06] text-white/40
```

### Layout (atmospheric background)
```
purple blob: absolute -top-[30%] -left-[20%] w-[60%] h-[60%] blur-[120px]
  dark: bg-purple-900/20, light: bg-purple-200/30
red blob: absolute -bottom-[20%] -right-[15%] w-[50%] h-[50%] blur-[100px]
  dark: bg-red-900/15, light: bg-red-100/20
```

## 6. Иконки (Lucide)

Полный список используемых иконок в PWA:
```
Sun, Moon, Eye, EyeOff, MessageCircle, Phone, User, UserPlus, UserMinus,
ArrowLeft, CheckSquare, Square, LogIn, LogOut, MapPin, Building2, Dumbbell,
Lock, Send, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Users,
TrendingUp, TrendingDown, AlertCircle, Newspaper, Calendar, Flame, Clock,
Thermometer, HeartCrack, Zap, Swords, Megaphone, Plus, ClipboardList,
Award, Code, Play, Film, Trash2, Trophy, Search, Edit3, Camera, Link2,
Heart, Video, Upload, FolderPlus, BookOpen, Layers, Bell, BellOff,
CreditCard, Scale, Shield, Wallet, PieChart, CheckCircle2, Sparkles,
BarChart3, X, Weight, ImagePlus, Star, RotateCcw, Check, Archive,
Activity, Crown, Globe, Instagram, Copy, Key
```

В React Native: `lucide-react-native` (тот же API, те же имена)

## 7. Состояния

### Loading
```
shimmer skeleton
dark: bg gradient rgba(255,255,255, 0.04→0.08→0.04)
light: bg gradient rgba(0,0,0, 0.04→0.07→0.04)
rounded-[12px], animation 1.5s infinite
```

### Empty
```
Centered icon (faded), title, subtitle
example: "Нет групп. Нажмите + чтобы создать."
```

### Error
```
Red text on accent/15 background
rounded card, centered text
```

## 8. Статус-бейджи
| Статус | Иконка | Текст | Цвет bg | Цвет text |
|--------|--------|-------|---------|-----------|
| sick | Thermometer 10px | Болеет | yellow-500/15 | yellow-400 |
| injury | HeartCrack 10px | Травма | red-500/15 | red-400 |
| skip | Zap 10px | Сачок | purple-500/15 | purple-400 |
| null | — | В строю | green-500/15 | green-400 |

Бейдж: `px-2 py-1 rounded-full flex-row gap-1 text-[10px] font-semibold uppercase`
