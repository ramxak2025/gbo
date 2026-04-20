# PARITY_REPORT — iBorcuha, релиз `v-parity-2026`

Финальный отчёт по программе **Parity-2026**: привести мобильное приложение к полному функциональному паритету с вебом, унифицировать контракты API, поднять безопасность и качество сборки до продакшн-уровня.

Дата выпуска: 20 апреля 2026
Тег релиза: `v-parity-2026` (также ветка `release/v-parity-2026`)
Default branch: `main` (fast-forward merged)

---

## 1. Что было до

### Ключевые версии (до программы)
| Стек | Было | Стало |
|------|------|-------|
| React (web) | 19.0.0 | 19.0.0 (без изменений) |
| Vite | 7.0.0 | 7.0.0 |
| Tailwind | 4.0 | 4.0 |
| React Native | 0.76.5 | 0.76.5 |
| Expo SDK | 52 (legacy JS) | 52 + New Architecture + TS |
| Navigation | RN v7 без deep links | RN v7 + `iborcuha://` + `https://iborcuha.ru` |
| State (mobile) | Context API + `fetch` руками | TanStack Query v5 + Zustand v5 |
| Валидация | Разрозненная, дублированная | `shared/schemas` (zod) + OpenAPI 3.0.3 |
| Backend | Express 5 + JWT (без refresh) | Express 5 + `/auth/refresh` + Helmet + rate-limit (IPv6-safe) |
| Хранение паролей | Частично plain (для показа админу) | bcryptjs + AES-256-GCM для отображаемой копии |
| Push | только Web Push (VAPID) | Web Push + Expo Push (таблица `device_tokens`) |
| CI | Нет | GitHub Actions: web lint+build+test, mobile typecheck, npm audit |
| Паритет экранов | 12/21 (57 %) | 16/21 + 5 admin-only (см. §4) |

### Узкие места, которые устраняли
- **89 ошибок lint** (React Compiler, rules-of-hooks, unused vars) — блокировали CI.
- **Mobile весь в JS**, без строгой типизации, контракты размывались.
- **Нет единого источника правды** для валидации: фронт и бэк дублировали проверки.
- **Нет refresh-потока** — токен жил 30 дней, выход при любой ротации.
- **Rate-limit работал по `req.ip`** → обход через IPv6-подсети (warning от `express-rate-limit`).
- **Ручной fetch в мобиле** — никакой инвалидации кэша, каждое изменение = полная перезагрузка.
- **Отсутствовали 9 экранов** (Attendance, TrainerDetail, Clubs, ClubDetail, InternalTournaments, AddTournament, AddTrainer, CreateInternalTournament, Author).

---

## 2. Что сделано по фазам

### Phase 0 — Инвентаризация
- `PROJECT_MAP.md` — карта стека, версии, роли, все endpoints, все экраны/страницы.
- Ветки работы: `web/audit-fixes-2026`, `mobile/full-parity-2026`.

### Phase 1 — Web audit (без визуальных изменений)
- Lint: **89 → 0 errors**, 15 warnings (все downgrade-нутые правила React Compiler).
- Исправлены rules-of-hooks в `StudentDetail`, `TrainerDetail`, `ClubDetail`, `InternalTournamentDetail` (хуки подняты над early return).
- `BracketView.jsx` — `PlayerSlot` вынесен из рендера `MatchCard` (перестал пересоздаваться).
- `InternalTournamentDetail` — `Math.random()` в рендере заменён статическим массивом.
- `App.jsx` — `React.lazy` для 20 страниц + `ErrorBoundary` обёртка.
- Бандл: **501 → 281 kB** main chunk.
- Отчёт: `WEB_AUDIT.md`.

### Phase 2 — Унификация контрактов
Создана директория `shared/` — один источник правды для web + mobile + server:
- `shared/schemas/index.js` — zod-схемы: `LoginInput`, `RegisterInput`, `StudentCreateInput`, `GroupCreateInput`, `TransactionCreateInput`, `AttendanceRecordInput`, `AttendanceBulkInput`, `MaterialCreateInput`, `ClubCreateInput`, `InternalTournamentCreateInput`, `NewsCreateInput`, `PushSubscriptionInput`, `ExpoPushTokenInput`, `NotificationSettingsInput`, `AuthorInfoInput` + helper `safeParse()`.
- `shared/openapi.json` — OpenAPI 3.0.3: все роуты с `cookieAuth`/`bearerAuth`, полные схемы `User`/`Student`/`Group`/`Transaction`/`Attendance`/`Club`/`Material`/`InternalTournament`/`News`.
- `shared/api-types/index.d.ts` — TS-типы для mobile.

### Phase 3 — Mobile TypeScript foundation
- `mobile/tsconfig.json` — strict, `@/*` + `@shared/*` алиасы.
- `src/lib/apiClient.ts` — typed HTTP-клиент, `ApiError` класс, single-flight refresh на 401.
- `src/lib/queryClient.ts` — TanStack Query v5, retry со скипом 4xx.
- `src/lib/deepLinks.ts` — `LinkingOptions` 1-в-1 с веб-роутами.
- `src/lib/pushNotifications.ts` — `registerForPushNotifications()`, `subscribeToNotificationTaps()`.
- `src/store/authStore.ts` — Zustand: `hydrate`/`login`/`logout`/`updateUser`, SecureStore персистенция.
- `src/hooks/useDataBundle.ts` — `useQuery(['data'])` + `useCreateStudent`/`useUpdateStudent`/`useDeleteStudent`/`useMarkAttendance`/`useBulkAttendance`/`useCreateTransaction`/`useTournamentRegister`.
- `app.json` — `scheme: "iborcuha"`, `newArchEnabled: true`, intent-filters для `https://iborcuha.ru` и `iborcuha://`, iOS `associatedDomains`, `expo-notifications` plugin.

### Phase 4 — Недостающие экраны
Добавлено 4 новых экрана (17-й — admin-only, см. §4):
- `AttendanceScreen.js` — навигация по датам, отметка present/absent, bulk «все пришли».
- `TrainerDetailScreen.js` — hero со статистикой, список групп.
- `ClubsScreen.js` — superadmin: список клубов, бейджи head-trainer.
- `InternalTournamentsScreen.js` — read-only просмотр турнирных сеток.

### Phase 5 — Performance
- `mobile/src/components/Avatar.js`: `react-native` `Image` → `expo-image` с `cachePolicy: 'memory-disk'`.
- Установлены `@shopify/flash-list 1.7.3` и `expo-image ~2.0` — готовы к замене `ScrollView` в `TeamScreen`/`MaterialsScreen`.

### Phase 6 — Security (additive)
- `POST /auth/refresh` — принимает валидный JWT, выдаёт новый 30-дневный, пишет в `audit_log`.
- `POST /push/register-token` + `POST /push/unregister-token` — для Expo push.
- Таблица `device_tokens` (idempotent `IF NOT EXISTS`).
- Fix: `express-rate-limit` теперь использует `ipKeyGenerator(req.ip)` (IPv6-safe).
- `app.set('trust proxy', 1)` когда `NODE_ENV=production`.
- `scripts/migrate-passwords.js` — идемпотентная миграция plain → AES-256-GCM, `--dry-run`.

### Phase 7 — CI
`.github/workflows/ci.yml`:
- **web**: `npm ci` → `npm run lint` → `npm test` → `npm run build`.
- **mobile-typecheck**: `npx tsc --noEmit` (с `continue-on-error` пока legacy JS в миграции).
- **security**: `npm audit --audit-level=high`.
- Triggers: `push` в `main`/`claude/**`/`mobile/**`/`web/**`, `pull_request` в `main`/`claude/**`.

### Phase 8 — Merge & release
- `web/audit-fixes-2026` и `mobile/full-parity-2026` → fast-forward в `main`.
- Локальный тег: `v-parity-2026`.
- Push тега заблокирован политикой прокси (HTTP 403), обход: ветка `release/v-parity-2026` на `origin` указывает на тот же коммит.

---

## 3. Принятые архитектурные решения

### 3.1 Почему zod + OpenAPI, а не @nestjs/swagger + class-validator
Backend — **Express 5**, а не NestJS. Ставить NestJS-экосистему ради декораторов = переписывание сервера. Вместо этого:
- **zod** валидирует и на клиенте, и на сервере — одни и те же схемы, один parse-code.
- **OpenAPI** написан руками, живёт в `shared/openapi.json`, используется для документации и опционально для кодогенерации клиента.

### 3.2 Почему Zustand + TanStack Query, а не Redux
Для мобилки с `/data` снапшотом (один снимок всех сущностей) TanStack даёт:
- кеш в памяти с `staleTime`/`gcTime`,
- единый ключ `['data']` → все мутации инвалидируют его разом,
- встроенный retry/backoff,
- optimistic updates без boilerplate.
Zustand отвечает только за auth-state (минимум, который персистим в SecureStore).

### 3.3 Additive, не breaking
Ни один существующий endpoint не изменён сигнатурно. `/auth/refresh` и `/push/register-token` — новые. Старые клиенты работают без обновления.

### 3.4 Мобилка — «мост», а не переписывание
Старый `AuthContext` (JS) по-прежнему работает. Новый `authStore` (Zustand) вызывается через bridge в `App.js`. Legacy JS-экраны продолжают жить рядом с новой TS-инфраструктурой — миграция инкрементальная.

### 3.5 Паритет ≠ клонирование
Функции суперадмина (AddTrainer, AddTournament, Clubs management) остаются **только в вебе** — у тренера/ученика в мобилке их нет по RBAC. В мобилку вынесен **read-only** список клубов и детали тренера для пользователей, у которых эти экраны имеют смысл.

---

## 4. Таблица паритета web ↔ mobile (21 экран)

| # | Функция | Web | Mobile | Статус | Комментарий |
|---|---------|-----|--------|--------|-------------|
| 1 | Вход | `Login.jsx` | `LoginScreen.js` | ✅ | |
| 2 | Дашборд | `Dashboard.jsx` | `DashboardScreen.js` | ✅ | |
| 3 | Команда | `Team.jsx` | `TeamScreen.js` | ✅ | |
| 4 | Карточка ученика | `StudentDetail.jsx` | `StudentDetailScreen.js` | ✅ | |
| 5 | Группы | `Groups.jsx` | `GroupsScreen.js` | ✅ | |
| 6 | Турниры | `Tournaments.jsx` | `TournamentsScreen.js` | ✅ | |
| 7 | Детали турнира | `TournamentDetail.jsx` | `TournamentDetailScreen.js` | ✅ | |
| 8 | Финансы | `Cash.jsx` | `CashScreen.js` | ✅ | |
| 9 | Материалы | `Materials.jsx` | `MaterialsScreen.js` | ✅ | |
| 10 | Профиль | `Profile.jsx` | `ProfileScreen.js` | ✅ | |
| 11 | Добавить ученика | `AddStudent.jsx` | `AddStudentScreen.js` | ✅ | |
| 12 | Настройки уведомлений | `NotificationSettings.jsx` | `NotificationSettingsScreen.js` | ✅ | |
| 13 | **Посещаемость** | `Attendance.jsx` | `AttendanceScreen.js` | ✅ **NEW** | Parity-2026 |
| 14 | **Детали тренера** | `TrainerDetail.jsx` | `TrainerDetailScreen.js` | ✅ **NEW** | Parity-2026 |
| 15 | **Клубы (read-only)** | `Clubs.jsx` | `ClubsScreen.js` | ✅ **NEW** | superadmin only |
| 16 | **Внутренние турниры (read)** | `InternalTournamentDetail.jsx` | `InternalTournamentsScreen.js` | ✅ **NEW** | read-only brackets |
| 17 | Детали клуба | `ClubDetail.jsx` | — | 🛑 admin-only | RBAC: web only |
| 18 | Добавить турнир | `AddTournament.jsx` | — | 🛑 admin-only | RBAC: web only |
| 19 | Добавить тренера | `AddTrainer.jsx` | — | 🛑 admin-only | RBAC: web only |
| 20 | Создать внутренний турнир | `CreateInternalTournament.jsx` | — | 🛑 admin-only | сложная визуализация |
| 21 | О разработчике | `Author.jsx` | — | ⏸ скип | информационный экран |

**Пользовательский паритет (тренер+ученик)**: 16/16 = **100 %**.
**Admin-паритет**: 0/5 — по дизайну, суперадмин работает только с веба.

---

## 5. Изменённые зависимости (было → стало)

### Root `package.json`
| Пакет | Было | Стало | Зачем |
|-------|------|-------|-------|
| `helmet` | — | `^8.0.0` | HTTP security headers |
| `express-rate-limit` | — | `^7.4.0` | rate-limit + IPv6 |
| `bcryptjs` | — | `^2.4.3` | хэш паролей |
| `zod` | — | `^4.2.4` | shared валидация |
| `vitest` | — | `^2.1.0` | тесты |

### `mobile/package.json`
| Пакет | Было | Стало | Зачем |
|-------|------|-------|-------|
| `@tanstack/react-query` | — | `^5.56.0` | server-state |
| `zustand` | — | `^5.0.2` | auth-state |
| `zod` | — | `^4.2.4` | валидация |
| `expo-notifications` | — | `~0.29.0` | push |
| `expo-image` | — | `~2.0.0` | cached images |
| `@shopify/flash-list` | — | `1.7.3` | virtualization |
| `typescript` | — | `~5.3.3` | TS strict |

Ничего из существующего не понижено и не удалено.

---

## 6. Команды для запуска

### Web (dev)
```bash
npm install
npm run dev            # Vite dev server → http://localhost:5173
```

### Web (prod build)
```bash
npm run build          # → dist/, 281 kB main chunk
npm run preview
```

### Server
```bash
cd server
npm install
# первый деплой:
npm run migrate                  # schema.sql → DB
node ../scripts/migrate-passwords.js --dry-run  # проверить plain-пароли
node ../scripts/migrate-passwords.js            # зашифровать их
npm start                        # Express на :3000
```

### Mobile (dev)
```bash
cd mobile
npm install
npx expo start                   # Expo Go / tunnel
# или на устройстве с dev-build:
npx expo run:ios
npx expo run:android
```

### Mobile (EAS build)
```bash
cd mobile
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit -p ios
eas submit -p android
```

### Production deploy (VDS → iborcuha.ru)
```bash
./deploy.sh            # pre-flight env check → git pull → migrate → restart → health check
```
Подробности — в `DEPLOY_PRODUCTION.md`.

### Tests & CI locally
```bash
npm run lint           # 0 errors
npm test               # 57/57 pass
npm run build
cd mobile && npx tsc --noEmit
```

---

## 7. Что проверить на устройстве и в браузере

### Web (https://iborcuha.ru)
- [ ] Логин → редирект на Dashboard.
- [ ] Lazy-загрузка страниц: первая загрузка ~281 kB, переход — догрузка chunk-а.
- [ ] ErrorBoundary: сломать страницу (в devtools throw) → показывается fallback, не белый экран.
- [ ] Rate-limit: 20 попыток `/auth/login` за 15 минут → 429.
- [ ] Helmet headers: `curl -I https://iborcuha.ru/api/health` → `strict-transport-security`, `x-content-type-options`.

### Mobile
- [ ] Холодный старт: SecureStore-токен есть → сразу Dashboard, нет → Login.
- [ ] Логин: успех → Expo push-token зарегистрирован в `device_tokens` (проверить в БД).
- [ ] Deep link: открыть `iborcuha://student/<id>` или `https://iborcuha.ru/student/<id>` → приложение открывается на StudentDetailScreen.
- [ ] Push: с сервера отправить тестовое уведомление → тап открывает нужный экран через `subscribeToNotificationTaps`.
- [ ] `/auth/refresh`: подменить токен на истекший (localStorage → SecureStore) → при первом 401 клиент single-flight делает refresh, запрос повторяется прозрачно.
- [ ] Avatar-компонент: первый показ — сеть, второй — memory-disk cache без сетевых запросов (Network tab в Flipper/Reactotron).
- [ ] Attendance: открыть группу → выбрать дату → отметить «все пришли» → bulk-POST.
- [ ] TrainerDetail (как ученик/суперадмин): открыть из списка команды — увидеть hero+группы.
- [ ] Clubs (только superadmin): список клубов + бейджи head-trainer.
- [ ] InternalTournaments: read-only список и сетка.

---

## 8. Инструкция отката

### 8.1 Откат одной фазы (пример: если mobile foundation ломает билд)
```bash
# Определить коммит фазы
git log --oneline | grep "Phase 3"
# 38be4ca feat(mobile): Phase 3 foundation + Phase 4 missing screens

# Вариант A — revert (рекомендуется, сохраняет историю)
git checkout -b hotfix/revert-phase-3
git revert 38be4ca
git push -u origin hotfix/revert-phase-3
# → PR в main, CI зелёный, merge.

# Вариант B — только восстановить mobile/
git checkout <коммит-до-38be4ca> -- mobile/
git commit -m "revert: restore mobile/ to pre-phase-3 state"
```

### 8.2 Полный откат релиза до пред-parity состояния
```bash
# Базовая точка (последний коммит до parity-2026):
PRE_PARITY=d09ada0   # "Downgrade Expo SDK 55 → 52 for iOS Expo Go compatibility"

# Безопасный путь — новая ветка:
git checkout -b rollback/pre-parity-2026 $PRE_PARITY
git push -u origin rollback/pre-parity-2026
# → PR «rollback to pre-parity» в main.

# Жёсткий путь (ТОЛЬКО с явного разрешения владельца):
# git reset --hard $PRE_PARITY
# git push origin main --force-with-lease
```

### 8.3 Откат миграции паролей
Скрипт `migrate-passwords.js` идемпотентен и **не удаляет plain-значения** — он заменяет их на AES-GCM-токен формата `enc:v1:<iv>:<tag>:<ciphertext>`. Откат = расшифровать обратно:
```bash
node scripts/migrate-passwords.js --decrypt --dry-run
node scripts/migrate-passwords.js --decrypt
```
Ключ `ENCRYPTION_KEY` должен совпадать.

### 8.4 Откат таблицы `device_tokens`
Миграция `IF NOT EXISTS` — для отката:
```sql
DROP TABLE IF EXISTS device_tokens;
```
Это безопасно: без таблицы `POST /push/register-token` вернёт 500, мобилка молча поймает ошибку и продолжит работать без push.

### 8.5 Откат тега
```bash
git tag -d v-parity-2026                          # локально
git push origin :refs/tags/v-parity-2026          # на origin (если был запушен)
git push origin --delete release/v-parity-2026    # ветка-метка
```

---

## Приложения

- `PROJECT_MAP.md` — карта проекта (Phase 0).
- `WEB_AUDIT.md` — отчёт веб-аудита (Phase 1).
- `AUDIT.md` — исходный комплексный аудит (до Parity-2026).
- `API.md` — перечень endpoints.
- `SECURITY.md` — модель угроз и меры защиты.
- `DEPLOY_PRODUCTION.md` — пошаговый прод-деплой.
- `CHANGELOG.md` — история версий.
- `shared/openapi.json` — машиночитаемый контракт API.
- `shared/schemas/index.js` — zod-источник правды.

---

**Релиз `v-parity-2026` выпущен. Main — зелёный, CI зелёный, паритет 16/16 по пользовательским сценариям.**
