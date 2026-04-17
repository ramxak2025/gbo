# iBorcuha

SaaS-платформа для тренеров и учеников единоборств. Управление группами, учениками, финансами, турнирами, посещаемостью, материалами и push-уведомлениями.

## Стек технологий

| Слой | Технологии |
|------|------------|
| Web | React 19 + Vite 7 + Tailwind CSS 4 (SPA, PWA) |
| Mobile | React Native / Expo SDK 52 (12 экранов) |
| Backend | Express 5, PostgreSQL (pg), JWT, bcryptjs, sharp, web-push |
| Безопасность | helmet, express-rate-limit, AES-256-GCM, audit logging, XSS-санитизация |
| Deploy | Vercel (serverless) или VDS (PM2 + Nginx) |

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните:

```bash
cp .env.example .env
```

```env
# PostgreSQL
DATABASE_URL=postgresql://iborcuha:YOUR_PASSWORD@localhost:5432/iborcuha

# JWT (обязательно сменить в продакшене)
JWT_SECRET=change-me-to-random-string-64-chars

# Сервер
PORT=3000

# CORS (необязательно, для dev)
CORS_ORIGIN=http://localhost:5173

# Шифрование паролей (AES-256-GCM)
ENCRYPTION_KEY=your-encryption-key-32-chars-min

# Push-уведомления (VAPID)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

### 3. Запуск в режиме разработки

Фронтенд (Vite dev server):
```bash
npm run dev
```

Бэкенд (Express, порт 3000):
```bash
npm run server
```

При первом запуске сервер автоматически создаст таблицы в PostgreSQL и добавит seed-данные.

## Сборка и деплой

### Vercel

Проект настроен через `vercel.json`. API работает как serverless function (`api/index.js`).

```bash
vercel deploy
```

### VDS (PM2 + Nginx)

```bash
# Сборка + запуск
npm run start

# Или через PM2
pm2 start ecosystem.config.cjs
```

Пример конфигурации Nginx в файле `nginx.conf.example`.

## Структура проекта

```
gbo/
├── src/                    # Web-приложение (React)
│   ├── pages/              # Страницы (21 файл)
│   ├── components/         # UI-компоненты
│   ├── context/            # React Context (Auth, Data, Theme)
│   └── utils/              # API-клиент, хелперы
├── server/                 # Backend (Express)
│   ├── routes/             # API-маршруты (auth, data, push, upload, health)
│   ├── middleware/          # security, audit, crypto, errorHandler, validate
│   ├── schema.sql          # Схема БД (15 таблиц + audit_log)
│   ├── auth.js             # JWT-авторизация
│   ├── db.js               # PostgreSQL connection pool
│   ├── seed.js             # Начальные данные
│   └── uploads/            # Загруженные файлы
├── mobile/                 # Мобильное приложение (Expo)
│   └── src/screens/        # 12 экранов
├── api/                    # Vercel serverless entry point
├── public/                 # Статика (иконки, manifest, sw.js)
├── vercel.json             # Конфигурация Vercel
├── ecosystem.config.cjs    # Конфигурация PM2
├── nginx.conf.example      # Пример Nginx
└── deploy.sh               # Скрипт деплоя
```

## Доступные скрипты

| Скрипт | Описание |
|--------|----------|
| `npm run dev` | Запуск Vite dev server (HMR) |
| `npm run build` | Сборка фронтенда в `dist/` |
| `npm run server` | Запуск Express backend |
| `npm run start` | Сборка + запуск сервера |
| `npm run lint` | Проверка ESLint |
| `npm run test` | Запуск тестов (Vitest) |
| `npm run preview` | Предпросмотр сборки |

## Переменные окружения

| Переменная | Описание | Обязательна |
|------------|----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL | Да |
| `JWT_SECRET` | Секрет для подписи JWT-токенов | Да |
| `PORT` | Порт сервера (по умолчанию 3000) | Нет |
| `CORS_ORIGIN` | Разрешённый origin для CORS | Нет |
| `ENCRYPTION_KEY` | Ключ шифрования AES-256-GCM | Рекомендуется |
| `VAPID_PUBLIC_KEY` | Публичный ключ VAPID для push | Для push |
| `VAPID_PRIVATE_KEY` | Приватный ключ VAPID для push | Для push |
| `NODE_ENV` | Окружение (development / production) | Нет |
| `DB_SSL` | Включить SSL для БД (true/false) | Нет |

## Мобильное приложение

Мобильное приложение находится в директории `mobile/` и работает на Expo SDK 52.

```bash
cd mobile
npm install
npm start
```

Подробная инструкция по сборке APK: `mobile/BUILD_APK.md`.

### Поддерживаемые экраны

Login, Dashboard, Team, StudentDetail, Groups, Tournaments, TournamentDetail, Cash, Materials, Profile, AddStudent, NotificationSettings

## Роли пользователей

- **superadmin** — полный доступ: управление тренерами, клубами, турнирами, одобрение регистраций
- **trainer** — управление своими учениками, группами, финансами, материалами, внутренними турнирами
- **student** — просмотр своих данных, турниров, материалов, настроек уведомлений

## Документация

- [API.md](./API.md) — справочник API-эндпоинтов
- [SECURITY.md](./SECURITY.md) — механизмы безопасности
- [CHANGELOG.md](./CHANGELOG.md) — история изменений
- [PARITY.md](./PARITY.md) — паритет веб/мобильное приложение
- [AUDIT.md](./AUDIT.md) — полный отчёт аудита

## Лицензия

Проприетарное ПО. Все права защищены.
