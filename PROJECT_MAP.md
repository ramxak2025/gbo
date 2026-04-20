# PROJECT_MAP.md — iBorcuha (gbo)

**Дата:** 2026-04-17 · **Ревизия:** pre-parity-2026

> ⚠️ Важно: README пользователя упоминает «NestJS backend», но фактически бэкенд написан на **Express 5** (не NestJS). Все упоминания NestJS-специфичных инструментов (`@nestjs/swagger`, `@nestjs/throttler`, class-validator Guards, supertest-for-Nest) в этом проекте адаптированы к Express-эквивалентам: `express-rate-limit`, `express-validator`/zod, самописные middleware для ролей. Это отмечено в плане и в PARITY_REPORT.

---

## 1. Стек

### Web
| Категория | Значение |
|-----------|----------|
| Фреймворк | React 19.2 + Vite 7.3 (SPA) |
| Роутинг | `react-router-dom` 7.13 |
| Стейт | React Context (AuthContext, DataContext, ThemeContext) |
| UI | Tailwind CSS 4.1 + самописные компоненты (GlassCard, Modal, Avatar, BottomNav, BracketView) |
| Иконки | `lucide-react` 0.563 |
| HTTP-клиент | самописный `fetch` в `src/utils/api.js` (~131 эндпоинт) |
| Сборка | Vite 7.3, основной бандл после code splitting 281 kB (gzip 88 kB) |

### Mobile
| Категория | Значение |
|-----------|----------|
| Платформа | React Native 0.76.5 + Expo SDK 52 |
| Язык | JavaScript (до parity-2026 апгрейда) |
| Навигация | React Navigation v7 (bottom-tabs + native-stack) |
| Стейт | React Context (Auth, Data, Theme) |
| Безопасное хранение | `expo-secure-store` |
| Hermes | включён по умолчанию в Expo 52 |

### Backend
| Категория | Значение |
|-----------|----------|
| Фреймворк | **Express 5.2** (не NestJS) |
| БД | PostgreSQL (`pg` 8.18), connection pool |
| ORM | нет — сырой SQL с параметризованными запросами |
| Auth | JWT (30 дней) + HttpOnly cookies + bcryptjs (10 rounds) |
| Шифрование паролей отображаемых суперадмину | AES-256-GCM (с версии v1.1.0) |
| Уязвимые пути | rate-limit на `/auth/login`, `/auth/register`, `/api`, `/upload` |
| Security | helmet, sanitize-input middleware, global error handler, audit_log |
| Push | `web-push` (VAPID) |
| Загрузки | `multer` + `sharp` → WebP q75 |

### Infrastructure
| Категория | Значение |
|-----------|----------|
| Production | VDS (iborcuha.ru) + nginx + PM2 + certbot |
| Альтернатива | Vercel |
| Миграции БД | `server/schema.sql` (идемпотентный, `CREATE ... IF NOT EXISTS`) |
| Скрипты | `deploy.sh` (на VDS), `scripts/migrate-passwords.js` (AES миграция) |

---

## 2. Эндпоинты API (по текущему коду Express-роутеров)

### `/api/auth` (`server/routes/auth.js`)
| Метод | Путь | Auth | Назначение |
|-------|------|------|------------|
| POST | `/login` | — | Вход (phone + password) |
| POST | `/register` | — | Заявка на регистрацию тренера (pending) |
| POST | `/logout` | — | Выход, очистка cookie |
| GET | `/me` | cookie/Bearer | Текущий пользователь |

### `/api/data` (`server/routes/data.js`, все — cookie/Bearer)
| Ресурс | Методы |
|--------|--------|
| Общий | `GET /` — роль-зависимый снапшот всех данных |
| students | `POST`, `PUT /:id`, `DELETE /:id` |
| groups | `POST`, `PUT /:id`, `DELETE /:id` |
| transactions | `POST`, `PUT /:id`, `DELETE /:id` |
| tournaments | `POST`, `PUT /:id`, `DELETE /:id` |
| tournament-registrations | `POST`, `DELETE` |
| attendance | `POST`, `POST /bulk`, `DELETE` |
| news | `POST`, `DELETE /:id` |
| trainers (admin) | `POST`, `PUT /:id`, `DELETE /:id` |
| author | `PUT` |
| internal-tournaments | `POST`, `PUT /:id`, `DELETE /:id` |
| materials | `POST`, `PUT /:id`, `DELETE /:id` |
| clubs (admin) | `POST`, `PUT /:id`, `DELETE /:id` |
| club trainers | `POST /:id/trainers`, `DELETE /:id/trainers/:trainerId` |
| registrations (admin) | `GET`, `POST /:id/approve`, `POST /:id/reject` |

### `/api/upload` · `/api/push` · `/api/health`
- `POST /api/upload` (auth) — загрузка изображения → WebP
- `GET /api/push/vapid-key` — публичный ключ
- `POST /api/push/subscribe` (auth), `POST /api/push/unsubscribe`
- `GET/PUT /api/push/settings` — пер-пользовательские настройки
- `POST /api/push/send` (admin/trainer)
- `GET /api/health` — DB + memory + uptime

---

## 3. Роли

| Роль | ID в БД (users.role) | Что видит |
|------|---------------------|-----------|
| Владелец платформы | `superadmin` | Всё: тренеров, заявки, клубы, турниры |
| Тренер | `trainer` | Своих спортсменов, группы, финансы, материалы |
| Тренер-глава клуба | `trainer` + `is_head_trainer=true` | Дополнительно: страница своего клуба |
| Спортсмен | виртуальная (через JWT `role='student'`) | Себя, свою группу, турниры |

---

## 4. Экраны веба (21)

`src/pages/`:

1. Login
2. Dashboard
3. Team (список спортсменов)
4. StudentDetail
5. AddStudent
6. Groups
7. Attendance
8. Cash (касса, только trainer)
9. Materials (видеобиблиотека)
10. Profile
11. NotificationSettings
12. Tournaments (внешние)
13. TournamentDetail
14. AddTournament (admin)
15. CreateInternalTournament (trainer)
16. InternalTournamentDetail (сетки)
17. Clubs (admin)
18. ClubDetail
19. AddTrainer (admin)
20. TrainerDetail (admin)
21. Author (страница автора)

---

## 5. Экраны мобилки (12, на момент карты)

`mobile/src/screens/`:

| # | Файл | Эквивалент веба |
|---|------|----------------|
| 1 | LoginScreen | Login |
| 2 | DashboardScreen | Dashboard |
| 3 | TeamScreen | Team |
| 4 | StudentDetailScreen | StudentDetail |
| 5 | AddStudentScreen | AddStudent |
| 6 | GroupsScreen | Groups |
| 7 | CashScreen | Cash |
| 8 | MaterialsScreen | Materials |
| 9 | ProfileScreen | Profile |
| 10 | NotificationSettingsScreen | NotificationSettings |
| 11 | TournamentsScreen | Tournaments |
| 12 | TournamentDetailScreen | TournamentDetail |

### Отсутствуют в мобилке (9):
- Attendance (отметка посещаемости)
- CreateInternalTournament (создание сеток)
- InternalTournamentDetail (просмотр сеток)
- AddTournament (admin)
- AddTrainer (admin)
- TrainerDetail (admin)
- Clubs (admin)
- ClubDetail
- Author

---

## 6. Обнаруженные узкие места (коротко)

**Web**
- 89 lint-проблем в feature-ветке (`claude/saas-enhancement-security-ihYwC` — 4 критические hooks-ошибки исправлены, осталось ~80 unused-vars).
- Бандл уже урезан до 281 kB после React.lazy.
- Нет единого error reporter (Sentry).

**Mobile**
- JS вместо TS.
- Нет react-query / zustand — самописный Context + REST-хелпер.
- FlatList вместо FlashList → пере-рендеры на больших списках.
- Нет push-уведомлений на клиенте (бэк поддерживает web-push; нужно добавить `expo-notifications` отдельным треком, т.к. web-push и expo-push — разные каналы).
- Нет deep-links (схемы `iborcuha://`).

**Backend**
- Контракты не формализованы (нет OpenAPI).
- Refresh-токенов нет — только 30-дневный JWT.
- «NestJS»-упоминание в требованиях противоречит реальному Express-коду — адаптируем без переписывания бэкенда.

---

## 7. Инварианты (что не трогаем)

- Бизнес-логика ролей (`superadmin` / `trainer` / `student`).
- Визуальный дизайн веба.
- Ключи SecureStore в мобилке (для сохранения сессий).
- Домен `iborcuha.ru` и публичные URL-пути.
- Существующие API-контракты (только аддитивные изменения).
