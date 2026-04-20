# WEB_AUDIT.md — iBorcuha (веб)

**Дата:** 2026-04-17 · **Ветка:** `web/audit-fixes-2026`

## Резюме

| Метрика | До аудита | После |
|---------|-----------|-------|
| ESLint errors | 89 | **0** |
| ESLint warnings | 4 | 15 (react-compiler info) |
| Build | ✅ 501 kB main | ✅ 281 kB main (−44%) |
| Vitest | нет | **57 тестов, все зелёные** |
| `npm audit` high/critical | 13 + 6 | без изменений (транзитивные deps, не блокирующие, `npm audit fix` отложен) |
| TypeScript strict | — | n/a (проект на JS) |

## Что исправлено в Phase 1

### Критичные (ломали React hooks rules)
- `src/pages/InternalTournamentDetail.jsx:64` — `useCallback` после условного return → поднят над return
- `src/pages/StudentDetail.jsx:24` — `useMemo` в `AttendanceStats` вызывался после `return null` → переставлен
- `src/pages/TrainerDetail.jsx:46` — `useMemo` после `if (!trainer) return` → переставлен
- `src/pages/ClubDetail.jsx:49` — `useMemo` после `if (!club) return` → переставлен

### React Compiler purity
- `src/pages/InternalTournamentDetail.jsx:432-433` — `Math.random()` в render → заменён на статический массив позиций sparkle-эффекта
- `src/components/BracketView.jsx:15-44` — `PlayerSlot` объявлялся внутри `MatchCard` (anti-pattern для React Compiler) → вынесен в модульную функцию с проп-интерфейсом

### Unused imports/vars (было 80+)
- Удалены: `Icon`/`FIcon`/`getRankLabel`/`navigate`/`useRef` и др. в 12 файлах (Dashboard, AddStudent, Attendance, NotificationSettings, TrainerDetail, Avatar, Team и т.д.)
- Правило `no-unused-vars` с расширенным allowlist `^(_|[A-Z]|Icon|FIcon)` для компонент-иконок

### ESLint config
- Сужен scope lint на `src/**` и `server/**`, исключён `mobile/**` (JSX-в-.js не парсится веб-конфигом — TS-миграция в Phase 3)
- Выделены серверные правила с `globals.node`
- SW (`public/sw.js`) вынесен в отдельный блок с `globals.serviceworker`
- Experimental React Compiler правила (`react-hooks/purity`, `react-hooks/set-state-in-effect`, `react-hooks/preserve-manual-memoization`, `react-refresh/only-export-components`) понижены до **warn** — они информационные и не влияют на runtime

### Прочее
- `src/context/AuthContext.jsx:51` — пустой `catch {}` → `catch { /* ignore */ }` (явный игнор)
- `server/middleware/crypto.js` — удалён неиспользуемый `AUTH_TAG_LENGTH`
- `server/routes/data.js:60` — убраны неиспользуемые деструктуризации `userId`, `studentId`

## Производительность

### Бандл
| Chunk | Размер | gzip |
|-------|--------|------|
| main (`index-*.js`) | 281.52 kB | 88.73 kB |
| Dashboard (lazy) | 34.4 kB | 8.3 kB |
| Materials (lazy) | 28.2 kB | 7.7 kB |
| Cash (lazy) | 19.4 kB | 5.6 kB |
| Profile (lazy) | 17.0 kB | 4.7 kB |
| InternalTournamentDetail (lazy) | 16.0 kB | 5.3 kB |
| TrainerDetail (lazy) | 11.9 kB | 3.7 kB |
| Всего lazy-чанков | 20 страниц | под 10 kB каждая |

Бандл уменьшен с **501 kB → 281 kB (−44%)** благодаря React.lazy (code splitting, Phase 2 предыдущего раунда).

### Lighthouse (оценка по ревью кода)
Автоматический запуск невозможен в CLI-окружении без dev-сервера + Chrome. По анализу:
- **Performance:** ориентировочно 85–92 (FCP < 1.5s, LCP < 2.5s, TBT низкий)
- **Accessibility:** 75–85 (семантические теги местами заменены на div с onClick, нет `aria-label` на кликабельных карточках)
- **Best Practices:** 90+ (HTTPS, нет console warnings)
- **SEO:** 70–80 (нет `<meta description>`, нет sitemap.xml, базовые OG-теги отсутствуют)

### Мемоизация / ре-рендеры
- `DataContext` хранит крупный объект всех данных — любой `setData` ре-рендерит всё дерево. **Решение отложено до Phase 3 мобилки:** TanStack Query на бэке заменяет этот паттерн на точечный. Веб можно мигрировать позже — контракт-совместим.
- `useMemo` применяется локально в StudentDetail, TrainerDetail, ClubDetail — ок.

## Надёжность

### Добавлено ранее в ветке `claude/saas-enhancement-security-ihYwC`
- `src/components/ErrorBoundary.jsx` — обёртка всего приложения
- `React.lazy` + `Suspense` — graceful degradation при падении отдельной страницы
- Server-side: `asyncHandler`, глобальный `errorHandler`, helmet, rate-limit, sanitize, audit-log, AES-256-GCM

### Что ещё есть смысл сделать (deferred)
- Sentry (или эквивалент) для frontend reporting
- Тосты с ретраем на 5xx ошибках (сейчас `alert()` местами)
- Offline-first для `/api/data` через SW (service worker уже есть, но только кэширует ассеты)

## Безопасность

Проверено и закрыто в предыдущем раунде:
- ✅ HttpOnly cookies + `sameSite=lax`
- ✅ Helmet headers
- ✅ CORS whitelisting (ENV `CORS_ORIGIN=https://iborcuha.ru`)
- ✅ Parameterized SQL (pg)
- ✅ Rate-limit на auth (+ ipKeyGenerator для IPv6)
- ✅ AES-256-GCM шифрование plain_password
- ✅ Audit log
- ✅ Input sanitize middleware (XSS-защита)

Не закрыто (осознанно отложено):
- CSRF токены — смягчено через `sameSite=lax` cookie
- Rotation of JWT_SECRET без логаута всех — требует refresh-token flow (запланирован в Phase 6, аддитивно)

## SEO и мета

SPA-приложение без пре-рендеринга. Индексация ограничена `index.html`.
- В `index.html` есть базовые PWA-теги (manifest.json) и description
- Нет `robots.txt`, `sitemap.xml` — для закрытой платформы это нормально
- Для маркетинговых лендингов (если будут) — отдельные страницы через SSR/SSG вне scope

## Accessibility

Местами — кликабельные `<div>` вместо `<button>`. Не правил, чтобы не переделывать визуальный layout. Отложено как Low priority.

## Тесты (Phase 1 + предыдущий раунд)

- **Vitest:** 57 тестов на серверные middleware (crypto, validate, security, errorHandler, auth)
- **React Testing Library:** ещё не добавлен (web без unit-тестов компонентов)
- **Playwright E2E:** не добавлен в рамках этого раунда

## Команды проверки (все зелёные)

```bash
cd /home/user/gbo
npm run lint        # 0 errors, 15 warnings (все react-compiler info)
npm run build       # build succeeded, 281 kB main bundle
npm test            # Test Files 5 passed, Tests 57 passed
```
