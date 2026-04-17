# Безопасность — iBorcuha

Описание механизмов безопасности, применяемых в платформе.

## Аутентификация

### JWT + HttpOnly cookies

- Токен подписывается алгоритмом HS256 с секретом из `JWT_SECRET`
- Срок жизни токена: 30 дней
- Токен передаётся в HttpOnly cookie (`sameSite: lax`) — недоступен из JavaScript
- Альтернативно поддерживается заголовок `Authorization: Bearer <token>`
- При логауте cookie очищается на сервере

### Хеширование паролей

- Библиотека: `bcryptjs`, 10 раундов соли
- Каждый пароль хешируется при создании/обновлении пользователя или ученика
- Сравнение через `bcrypt.compareSync` — timing-safe

### Шифрование паролей (AES-256-GCM)

Для функции просмотра паролей суперадмином используется симметричное шифрование:

- **Алгоритм**: AES-256-GCM (authenticated encryption)
- **Ключ**: SHA-256 хеш от `ENCRYPTION_KEY` (или `JWT_SECRET` как fallback)
- **IV**: 16 случайных байт (crypto.randomBytes) — уникальный для каждого шифрования
- **Auth Tag**: 16 байт — обеспечивает целостность данных
- **Формат хранения**: `iv:authTag:ciphertext` (base64)
- Обратная совместимость: если значение не в формате `iv:authTag:ciphertext`, возвращается как есть (миграция с plain text)

Шифруются поля `plain_password` в таблицах: `users`, `students`, `pending_registrations`.

## Rate Limiting

Три уровня ограничения запросов (`express-rate-limit`):

| Эндпоинт | Окно | Максимум | Назначение |
|----------|------|----------|------------|
| `/api/auth/login`, `/api/auth/register` | 15 минут | 20 запросов | Защита от брутфорса |
| `/api/upload` | 1 минута | 20 запросов | Защита от флуда загрузками |
| `/api/*` | 1 минута | 200 запросов | Общее ограничение |

- Идентификация по IP (`req.ip` или `X-Forwarded-For`)
- Стандартные заголовки `RateLimit-*` включены
- При превышении лимита возвращается JSON с сообщением об ошибке

## Заголовки безопасности (Helmet)

Middleware `helmet` устанавливает HTTP-заголовки:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection`
- `Strict-Transport-Security` (HSTS)
- `X-Download-Options`
- `X-Permitted-Cross-Domain-Policies`
- `Referrer-Policy`

CSP отключён (`contentSecurityPolicy: false`) — управляется фронтенд-фреймворком.
Cross-Origin-Embedder-Policy отключён для загрузки внешних изображений/видео.

## Санитизация входных данных

Глобальный middleware `sanitizeInput` обрабатывает все входящие `req.body`:

- Рекурсивно обходит все строковые поля объекта
- Удаляет HTML-теги (`<script>`, `<img onerror>` и т.д.)
- Удаляет `javascript:` URI
- Удаляет inline event handlers (`onclick=`, `onerror=` и т.д.)
- **Исключения** (не санитизируются): `password`, `videoUrl`, `coverImage`, `avatar`, `customThumb`, `endpoint`, `url`

## Аудит-логирование

### Таблица `audit_log`

```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  user_id TEXT,
  details JSONB,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Индексы: по `user_id`, `created_at DESC`, `action`.

### Что логируется

- **Автоматически** (middleware): все POST, PUT, DELETE запросы к `/api/*` — метод, путь, IP, роль, user-agent
- **Явно** (в коде маршрутов):
  - `login` — успешный вход (IP, роль, studentId)
  - `login_failed` — неудачная попытка входа (IP, номер телефона)
  - `register` — подача заявки на регистрацию

## Конфигурация CORS

```javascript
cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

- В продакшене рекомендуется указать конкретный origin через `CORS_ORIGIN`
- `credentials: true` — разрешает передачу cookies

## Безопасность загрузки файлов

- **Multer**: ограничение размера 10 MB (`limits.fileSize`)
- **Фильтр типов**: только `image/*` (проверка `file.mimetype`)
- **Имена файлов**: генерируются через `crypto.randomBytes(12)` — оригинальные имена не сохраняются
- **Компрессия**: Sharp конвертирует в WebP (quality 75, максимум 1200x1200)
- Загруженные файлы хранятся в `server/uploads/` (VDS) или `/tmp/uploads` (Vercel)
- Статический доступ: `/uploads/<filename>`

## Валидация входных данных

Серверные хелперы валидации (`server/middleware/validate.js`):

| Функция | Правила |
|---------|---------|
| `validatePhone(phone)` | 10-15 цифр |
| `validatePassword(password)` | 6-128 символов |
| `validateName(name)` | 1-255 символов, не пустая строка |
| `validateAmount(amount)` | Число > 0, <= 99 999 999 |
| `validateId(id)` | Alphanumeric + `-_`, 1-64 символа |
| `validateDate(date)` | Валидная дата (Date.parse) |
| `validateUrl(url)` | Валидный URL или путь `/uploads/...` |

Middleware `requireFields(...fields)` — проверяет наличие обязательных полей в теле запроса.

## SQL-инъекции

Все SQL-запросы используют параметризованные выражения через `pg`:

```javascript
pool.query('SELECT * FROM users WHERE id = $1', [userId])
```

Конкатенация пользовательских данных в SQL отсутствует.

## Обработка ошибок

Глобальный error handler (`errorHandler`) перехватывает все ошибки в API:

- Ошибки multer (размер файла, невалидный формат)
- Ошибки парсинга JSON
- Ошибки JWT (невалидный/просроченный токен)
- Все необработанные ошибки — в продакшене возвращается «Внутренняя ошибка сервера» без деталей
- Stack trace выводится в консоль только в development

`asyncHandler(fn)` оборачивает все async-маршруты для корректной передачи ошибок в error handler.

## Рекомендации для продакшена

1. **Обязательно задайте уникальные значения**:
   - `JWT_SECRET` — минимум 64 случайных символа
   - `ENCRYPTION_KEY` — минимум 32 случайных символа
   - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — сгенерируйте через `web-push generate-vapid-keys`

2. **CORS**: укажите конкретный origin (`CORS_ORIGIN=https://yourdomain.com`)

3. **HTTPS**: обязательно в продакшене (Nginx с SSL или Vercel)

4. **БД**: используйте SSL (`DB_SSL=true` или `?sslmode=require` в DATABASE_URL)

5. **Мониторинг**: подключите Sentry или аналог для отслеживания ошибок

6. **Бекапы**: настройте регулярные бекапы PostgreSQL

7. **Обновления**: регулярно запускайте `npm audit` и обновляйте зависимости

8. **Логи**: настройте ротацию логов PM2 (`pm2 install pm2-logrotate`)

## Ответственное раскрытие

Если вы обнаружили уязвимость в безопасности платформы, свяжитесь с нами:

- Email: admin@iborcuha.ru
- Не публикуйте информацию об уязвимости до её устранения
- Мы обязуемся ответить в течение 48 часов и устранить подтверждённые уязвимости в кратчайшие сроки
