# Changelog — iBorcuha

Все значимые изменения проекта документируются в этом файле.

## [1.1.0] — 2026-04-16

### Безопасность

- **Helmet**: добавлен middleware для установки HTTP-заголовков безопасности (X-Content-Type-Options, X-Frame-Options, HSTS и др.)
- **Rate limiting**: добавлено ограничение запросов через `express-rate-limit`:
  - `/api/auth/login`, `/api/auth/register` — 20 запросов за 15 минут
  - `/api/upload` — 20 запросов в минуту
  - `/api/*` — 200 запросов в минуту
- **Санитизация входных данных**: добавлен middleware `sanitizeInput` — удаляет HTML-теги, `javascript:` URI и inline event handlers из всех входящих данных
- **AES-256-GCM шифрование паролей**: поле `plain_password` теперь хранится в зашифрованном виде (ранее — в открытом тексте). Формат: `iv:authTag:ciphertext` (base64). Обратная совместимость с существующими данными
- **Аудит-логирование**: добавлена таблица `audit_log` и middleware для автоматической записи всех модифицирующих запросов (POST, PUT, DELETE). Явное логирование login/login_failed/register
- **Валидация входных данных**: добавлены серверные хелперы `validatePhone`, `validatePassword`, `validateName`, `validateAmount`, `validateId`, `validateDate`, `validateUrl` и middleware `requireFields`

### Инфраструктура

- **asyncHandler**: все async-маршруты обёрнуты в `asyncHandler` для корректной передачи ошибок в глобальный error handler
- **Глобальный error handler**: добавлен `errorHandler` middleware — обрабатывает ошибки multer, JWT, парсинга JSON, и все необработанные исключения с безопасными сообщениями в продакшене
- **Health check**: добавлен эндпоинт `GET /api/health` — возвращает статус сервера, подключение к БД, использование памяти, uptime

### Фронтенд

- **ErrorBoundary**: добавлен компонент-обёртка для перехвата ошибок рендеринга React — при сбое компонента показывается страница с возможностью перезагрузки (ранее приложение полностью ломалось)
- **Code splitting (React.lazy)**: все страницы загружаются лениво через `React.lazy` + `Suspense`. Размер основного бандла: 501 kB -> 281 kB (сокращение на 44%)
- **Исправлены нарушения React hooks**:
  - `InternalTournamentDetail.jsx` — `useCallback` вызывался условно
  - `StudentDetail.jsx` — `useMemo` вызывался условно
  - `TrainerDetail.jsx` — `useMemo` вызывался условно
- **Исправлен Math.random() в render**: `InternalTournamentDetail.jsx` — генерация случайных позиций перенесена в `useMemo`

### Документация

- Добавлен `AUDIT.md` — полный отчёт аудита кодовой базы (архитектура, ошибки, производительность, безопасность, доступность, тестирование)
- Добавлен `README.md` — описание проекта, быстрый старт, структура, переменные окружения
- Добавлен `SECURITY.md` — документация по безопасности
- Добавлен `CHANGELOG.md` — история изменений
- Добавлен `API.md` — справочник API-эндпоинтов
- Добавлен `PARITY.md` — таблица паритета веб/мобильное приложение

## [1.0.0] — До аудита

### Функциональность

- Веб-приложение (React 19 + Vite 7 + Tailwind CSS 4) — SPA с PWA-поддержкой
- Мобильное приложение (Expo SDK 52) — 12 экранов
- Backend (Express 5 + PostgreSQL) — REST API
- JWT-авторизация с ролями (superadmin, trainer, student)
- Управление учениками, группами, финансами
- Турниры (глобальные + внутренние с сеткой)
- Посещаемость
- Материалы (видео-библиотека)
- Push-уведомления (VAPID/web-push)
- Загрузка и компрессия изображений (sharp -> WebP)
- Клубы и заявки на регистрацию тренеров
- Тёмная/светлая тема
- Деплой: Vercel (serverless) + VDS (PM2 + Nginx)
