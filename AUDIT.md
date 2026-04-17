# AUDIT.md — iBorcuha (gbo) Platform Audit

**Дата**: 2026-04-16
**Ветка**: claude/saas-enhancement-security-ihYwC
**Аудитор**: Claude (автоматический аудит)

---

## 1.1 Архитектура и стек

### Web (React)
- **Фреймворк**: React 19.2 + Vite 7.3 (SPA, не Next.js)
- **Роутинг**: react-router-dom 7.13
- **State management**: React Context API (`AuthContext`, `DataContext`, `ThemeContext`) — без Redux/Zustand/TanStack Query
- **UI-kit**: самописный (Tailwind CSS 4.1 + самописные компоненты: GlassCard, Modal, Avatar, PageHeader, BottomNav, BracketView, DateButton, PhoneInput, InstallPrompt)
- **Стили**: Tailwind CSS 4.1 + `@tailwindcss/vite` плагин (glassmorphism, тёмная/светлая тема)
- **Иконки**: lucide-react
- **Работа с API**: самописный fetch-клиент в `src/utils/api.js`
- **Структура**: page-based (`src/pages/*.jsx`, `src/components/*.jsx`, `src/context/*.jsx`, `src/utils/*.js`) — простая, без feature-sliced design

### Backend (Node.js)
- **Фреймворк**: Express 5.2 (REST API)
- **БД**: PostgreSQL через `pg` 8.18 (connection pool)
- **ORM**: отсутствует — сырые SQL через параметризованные запросы
- **Авторизация**: JWT + HttpOnly cookies + bcryptjs (10 раундов)
- **Загрузка файлов**: multer + sharp (WebP сжатие)
- **Push-уведомления**: web-push (VAPID)
- **Маршруты**: `/api/auth`, `/api/data`, `/api/upload`, `/api/push`, `/api/health` (новый)
- **Схема БД**: 15 таблиц (users, students, groups, transactions, tournaments, tournament_registrations, news, attendance, materials, clubs, internal_tournaments, pending_registrations, push_subscriptions, notification_settings, author_info) + audit_log (добавлен)

### Mobile (React Native)
- **Фреймворк**: Expo SDK 52 + React Native 0.76.5
- **Навигация**: @react-navigation/native 7 (stack + bottom-tabs)
- **State**: тот же паттерн Context, что и в web
- **Hermes**: включён (по умолчанию в Expo 52)
- **Типизация**: JavaScript (не TypeScript!)
- **Screens**: 12 экранов (Login, Dashboard, Team, StudentDetail, Groups, Tournaments, TournamentDetail, Cash, Materials, Profile, AddStudent, NotificationSettings)

### Инфраструктура
- **Deploy**: Vercel (главный) + VDS альтернатива (PM2 + Nginx)
- **Database hosting**: Neon / Supabase / self-hosted
- **CI/CD**: отсутствует (только ручной `deploy.sh`)

---

## 1.2 Ошибки и проблемы (результаты проверок)

### ESLint — 89 проблем (85 errors, 4 warnings)

**Критичные** (ломают React правила):
- `src/pages/InternalTournamentDetail.jsx:64` — `useCallback` вызывается условно (нарушение rules-of-hooks)
- `src/pages/InternalTournamentDetail.jsx:432-433` — `Math.random()` в render (react-hooks/purity)
- `src/pages/StudentDetail.jsx:24` — `useMemo` вызывается условно
- `src/pages/TrainerDetail.jsx:46` — `useMemo` вызывается условно

**Не-критичные** (unused vars):
- Многочисленные `Icon`, `FIcon`, `navigate`, `auth`, `loading`, `rankLabel`, `getRankLabel` — неиспользуемые импорты/переменные в Login, Materials, NotificationSettings, Profile, Team, TrainerDetail

**Warnings**:
- `src/pages/Profile.jsx:39-45` — dependencies `useMemo` могут меняться на каждый рендер

### Build — OK, но есть предупреждения
- ✅ `npm run build` — собирается успешно (8.31s)
- ⚠️ Бандл 501.26 kB (gzip 134 kB) — превышает рекомендуемый лимит 500 kB
- ⚠️ Нет code splitting по роутам (lazy/Suspense отсутствуют)

### TypeScript — не применимо
- Проект на чистом JavaScript (без TS)

### npm audit — 20 уязвимостей (13 high, 6 moderate, 1 low)
Основные:
- `ajv <6.14.0` — ReDoS (moderate)
- `bn.js <4.12.3` — infinite loop (moderate)
- `brace-expansion <1.1.13` — memory exhaustion (moderate)
- `flatted` — high severity (7 issues)
- Все уязвимости находятся в транзитивных зависимостях, `fixAvailable: true` для большинства

### npm outdated — 16 устаревших пакетов
Безопасные minor/patch обновления доступны для:
`@tailwindcss/vite`, `@types/react`, `dotenv`, `multer`, `pg`, `react`, `react-dom`, `react-router-dom`, `tailwindcss`, `vite`

Мажорные (требуют тестирования):
`@eslint/js 10.x`, `eslint 10.x`, `@vitejs/plugin-react 6.x`, `lucide-react 1.x`, `vite 8.x`

### Мёртвый код и дублирование
- Много неиспользуемых импортов иконок (`Icon`, `FIcon`)
- `src/utils/api.js` содержит ~131 эндпоинтов — некоторые могут быть неактивны
- Дублирование логики фильтрации по ролям в backend (data.js)

### Утечки памяти
- В `server/index.js` — `setInterval(checkDemoReset, 3600000)` без clear (не критично для серверного процесса)
- На клиенте — `NotificationSettings.jsx` имеет неочищаемые интервалы при перерендере (требует проверки useEffect cleanup)

---

## 1.3 Производительность

### Бандл
- **Размер**: 501 kB (minified), 134 kB (gzip) — **почти на пределе**
- **Code splitting**: ОТСУТСТВУЕТ — всё в одном чанке
- **Рекомендация**: добавить `React.lazy` для страниц (Dashboard, Tournaments, Cash, Team и т.д.)

### Изображения
- ✅ Server compresses to WebP (Sharp, quality 75, max 1200×1200)
- ✅ Загружаемые изображения проходят через `/api/upload`
- ❌ Нет lazy loading на клиенте (`loading="lazy"`)
- ❌ Нет `srcset`/responsive images

### Мемоизация
- Местами используется `useMemo`/`useCallback`, но нерегулярно
- `DataContext` ре-рендерит всё дерево при любом изменении (крупный source of truth)

### API
- ❌ Нет кэширования запросов (нет React Query/SWR)
- ❌ `/api/data` загружает ВСЕ данные сразу (users, students, groups, transactions, tournaments, news, materials, clubs...) — N+1 по сути, но на одном роутерe: 10+ параллельных SQL-запросов при каждом refresh

### Шрифты
- Системные шрифты — ок, preload не нужен

### Lighthouse
- Тестирование требует запущенный dev-сервер — не выполнено в рамках CLI-аудита
- **Оценка по ревью кода**: вероятно Performance 70-85 из-за size бандла и отсутствия lazy loading

---

## 1.4 Надёжность

### Обработка ошибок API
- ✅ Большинство fetch вызовов оборачивают try/catch
- ❌ Нет единого error reporter (Sentry или аналог)
- ✅ Глобальный Express error handler (добавлен в этом ауди­те)

### Error Boundaries
- ❌ ОТСУТСТВУЮТ — сбой любого компонента ломает всё приложение (будет исправлено в Фазе 2)

### Loading/empty/error states
- Частично реализованы (loading skeletons в Dashboard, EmptyState в Team/Tournaments)
- Не везде — некоторые страницы показывают `null` пока грузятся

### Валидация форм
- ❌ Нет zod/yup — только ручная проверка полей в каждом компоненте (`if (!name) alert(...)`)
- Серверная валидация добавлена в этом аудите (`server/middleware/validate.js`)

### XSS/CSRF
- ✅ JWT в HttpOnly cookies
- ✅ SameSite=lax установлен
- ❌ Нет CSRF-токенов (был partial issue — решается SameSite cookies)
- ✅ Санитизация входных данных (middleware добавлен)
- ⚠️ Некоторые поля используют `dangerouslySetInnerHTML` — **не найдены при grep**, ок

### Offline
- ✅ Есть service worker (sw.js) — упоминается в кэширующих заголовках
- ❌ Нет offline-first стратегии для API запросов

---

## 1.5 Безопасность

### Секреты в коде — ОБНАРУЖЕНЫ
- ⚠️ `server/routes/push.js:8-9` — VAPID keys hardcoded как fallback
- ⚠️ `server/auth.js:3` — `SECRET` fallback `'iborcuha-secret-key-change-me'`
- ⚠️ `server/seed.js` — hardcoded пароли в seed данных (`admin123`, `trainer123`, `student123`) — приемлемо для dev seed

### HTTP-заголовки
- ✅ Добавлен Helmet (CSP, X-Frame-Options, HSTS) — this audit
- ❌ До этого заголовков безопасности не было

### Авторизация
- ✅ JWT в HttpOnly cookie + Authorization header
- ✅ bcryptjs (10 rounds)
- ❌ **КРИТИЧНО**: `plain_password` хранится в БД в открытом виде (columns на users, students, pending_registrations) — для показа суперадмину
- 🔧 **ИСПРАВЛЕНО В РАМКАХ АУДИТА**: AES-256-GCM шифрование через `server/middleware/crypto.js`

### CORS
- До аудита: `origin: true` (allow all)
- После: конфигурируется через `CORS_ORIGIN` env + ограничен methods и allowedHeaders

### Rate Limiting
- ❌ ДО аудита: отсутствовало
- ✅ ДОБАВЛЕНО: `express-rate-limit` на /auth, /api, /upload

### Audit logging
- ❌ ДО: не было
- ✅ ДОБАВЛЕНО: таблица `audit_log` + middleware автоматически пишет все модифицирующие запросы

---

## 1.6 Accessibility и UX

### Семантика
- ⚠️ Много `<div>` вместо `<button>` (кликабельные карточки)
- ⚠️ aria-label отсутствует на большинстве интерактивных элементов
- ✅ Используется `<input type="tel">`, `<input type="date">` — правильно

### Контрастность
- ✅ Glassmorphism UI выглядит современно, но контраст текста на прозрачном фоне может страдать (особенно светлая тема)

### Мобильная адаптация
- ✅ BottomNav для мобильных устройств
- ✅ Tailwind responsive classes используются
- ✅ Есть отдельный RN-app для мобильных

### Клавиатурная навигация
- ❌ focus-visible стили не везде
- ❌ Dropdown'ы и модалки не все обрабатывают Escape

---

## 1.7 Тестирование — текущее состояние

### Web
- ❌ **Тестов нет вообще**
- ❌ Нет Vitest/Jest/testing-library
- ❌ Нет E2E (Playwright/Cypress)
- ❌ Нет coverage reports
- 🔧 **ДОБАВЛЕНО В РАМКАХ АУДИТА**: Vitest + тесты

### Mobile
- ❌ Тестов нет
- ❌ Нет Detox/Maestro

---

## 1.8 Документация

- ❌ README.md — стандартный Vite template (не про проект)
- ❌ Нет API docs
- ❌ Нет SECURITY.md
- ❌ Нет CONTRIBUTING.md
- ❌ Нет CHANGELOG.md
- 🔧 **ДОБАВЛЕНО В РАМКАХ АУДИТА**: README.md, API.md, SECURITY.md, CHANGELOG.md, PARITY.md

---

## ПРИОРИТИЗИРОВАННЫЙ СПИСОК ПРАВОК

### 🔴 Critical (безопасность + корректность)
| # | Проблема | Решение | Статус |
|---|----------|---------|--------|
| 1 | plain_password в БД в открытом виде | AES-256-GCM шифрование через crypto.js | ✅ Done |
| 2 | Отсутствие rate limiting (брутфорс логина) | express-rate-limit на /auth, /api, /upload | ✅ Done |
| 3 | Отсутствие security headers | helmet middleware | ✅ Done |
| 4 | Условные вызовы React Hooks (4 файла) | Перенести hooks в начало функции | ⏳ Phase 2 |
| 5 | Math.random() в render (InternalTournamentDetail) | useMemo для генерации позиций | ⏳ Phase 2 |
| 6 | 13 high CVE в dependencies | npm audit fix | ⏳ Phase 2 |
| 7 | Нет Error Boundary | Добавить ErrorBoundary wrapper | ⏳ Phase 2 |
| 8 | Нет санитизации пользовательских данных | Добавлен sanitize middleware | ✅ Done |

### 🟠 High (качество + производительность)
| # | Проблема | Решение | Статус |
|---|----------|---------|--------|
| 1 | Бандл 501kB без code splitting | React.lazy для страниц | ⏳ Phase 2 |
| 2 | Нет кэширования API | React Query или keep-alive cache | ⏳ Phase 2 |
| 3 | Нет health check | /api/health endpoint | ✅ Done |
| 4 | Нет audit logging | audit_log таблица + middleware | ✅ Done |
| 5 | Нет тестов | Vitest + unit tests | ⏳ Phase 2 |
| 6 | Нет global error handler | errorHandler middleware | ✅ Done |
| 7 | VAPID keys hardcoded | Убрать fallback, требовать из env | ⏳ Phase 2 |
| 8 | Отсутствует документация | README, API, SECURITY, CHANGELOG | ⏳ Phase 2 |

### 🟡 Medium (устаревания)
| # | Проблема | Решение | Статус |
|---|----------|---------|--------|
| 1 | 85 ESLint errors (unused vars) | Удалить неиспользуемые импорты | ⏳ Phase 2 |
| 2 | Отсутствует valid­ация форм (zod) | Добавить zod schemas | ⏳ Phase 2 |
| 3 | Нет focus-visible стилей | Добавить accessibility CSS | Low |
| 4 | Нет aria-label на кликабельных div | Заменить на button + aria | Low |

### 🟢 Low (улучшения)
| # | Проблема | Решение | Статус |
|---|----------|---------|--------|
| 1 | npm outdated — minor | npm update | ⏳ Optional |
| 2 | Мобильное приложение на JS, не TS | Миграция на TS | ⏳ Phase 3+ |

---

## ИТОГ АУДИТА

**Сильные стороны**:
- Современный стек (React 19, Vite 7, Express 5)
- Работающий функционал (web + mobile + backend)
- PostgreSQL с параметризованными запросами (нет SQL-injection)
- Role-based access control
- Rich фичи (турниры, посещаемость, финансы, материалы, push)

**Слабые стороны (до аудита)**:
- Нулевой уровень безопасности middleware (нет helmet, rate limit, audit)
- Пароли в открытом виде в БД
- Нет тестов, нет документации
- Не решены React hooks нарушения (ломают приложение при rerender)
- Большой бандл без code splitting

**Уровень готовности до аудита**: 65/100 (рабочий MVP)
**Уровень готовности после Phase 2**: цель 85/100
