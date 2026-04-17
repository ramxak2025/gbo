# API Reference — iBorcuha

Базовый URL: `/api`

Все эндпоинты возвращают JSON. При ошибке возвращается `{ "error": "сообщение" }`.

Авторизация: JWT-токен передаётся в HttpOnly cookie `token` или заголовке `Authorization: Bearer <token>`.

---

## Аутентификация

### POST /api/auth/login

Вход в систему (тренер, суперадмин или ученик).

- **Auth**: нет
- **Rate limit**: 20 запросов / 15 минут
- **Body**:
  ```json
  { "phone": "+79001234567", "password": "string" }
  ```
- **Ответ (тренер/суперадмин)**:
  ```json
  {
    "token": "jwt...",
    "userId": "id",
    "role": "trainer|superadmin",
    "user": { "id", "name", "phone", "role", "avatar", "clubName", "clubId", "isHeadTrainer", "sportType", "sportTypes", "city" }
  }
  ```
- **Ответ (ученик)**:
  ```json
  {
    "token": "jwt...",
    "userId": "trainerId",
    "role": "student",
    "studentId": "id",
    "user": { ... },
    "student": { "id", "name", "phone", "belt", "weight", "status", "groupId", "subscriptionExpiresAt" }
  }
  ```
- **Ошибки**: 400 (нет данных), 401 (неверный пароль / не найден)

### POST /api/auth/register

Регистрация тренера (заявка на одобрение суперадмином).

- **Auth**: нет
- **Rate limit**: 20 запросов / 15 минут
- **Body**:
  ```json
  {
    "name": "Имя",
    "phone": "+79001234567",
    "password": "string",
    "clubName": "string",
    "sportType": "string",
    "city": "string",
    "consent": true
  }
  ```
- **Ответ**: `{ "ok": true, "message": "Заявка отправлена!" }`
- **Ошибки**: 400 (валидация, дубликат номера, уже есть заявка)

### POST /api/auth/logout

Выход из системы.

- **Auth**: нет (очищает cookie)
- **Ответ**: `{ "ok": true }`

### GET /api/auth/me

Текущий пользователь по токену.

- **Auth**: нет (но требуется токен для результата)
- **Ответ**: объект пользователя (как при login) или `null`

---

## Данные (все требуют авторизации)

### GET /api/data

Все данные текущего пользователя (role-aware).

- **Auth**: да
- **Ответ**:
  ```json
  {
    "users": [...],
    "groups": [...],
    "students": [...],
    "transactions": [...],
    "tournaments": [...],
    "news": [...],
    "tournamentRegistrations": [...],
    "authorInfo": { ... },
    "internalTournaments": [...],
    "attendance": [...],
    "materials": [...],
    "clubs": [...],
    "pendingRegistrations": [...]  // только superadmin
  }
  ```

---

### Ученики

#### POST /api/data/students

Создание ученика.

- **Auth**: да
- **Body**:
  ```json
  {
    "name": "string",
    "phone": "string",
    "password": "string",
    "weight": 70.5,
    "belt": "string",
    "birthDate": "2000-01-01",
    "groupId": "id",
    "avatar": "/uploads/...",
    "subscriptionExpiresAt": "2026-05-01T00:00:00Z",
    "trainerId": "id",
    "trainingStartDate": "2026-01-01"
  }
  ```
- **Ответ**: объект ученика

#### PUT /api/data/students/:id

Обновление ученика.

- **Auth**: да
- **Body**: любые поля из POST (все необязательные)
- **Ответ**: обновлённый объект ученика

#### DELETE /api/data/students/:id

Удаление ученика (каскадно удаляет транзакции и регистрации на турниры).

- **Auth**: да
- **Ответ**: `{ "ok": true }`

---

### Группы

#### POST /api/data/groups

- **Auth**: да
- **Body**: `{ "name", "schedule", "subscriptionCost", "trainerId", "sportType" }`
- **Ответ**: объект группы

#### PUT /api/data/groups/:id

- **Auth**: да
- **Body**: `{ "name", "schedule", "subscriptionCost", "attendanceEnabled", "sportType", "pinnedMaterialId" }`
- **Ответ**: `{ "ok": true }`

#### DELETE /api/data/groups/:id

Удаление группы (ученики открепляются).

- **Auth**: да
- **Ответ**: `{ "ok": true }`

---

### Транзакции (финансы)

#### POST /api/data/transactions

- **Auth**: да
- **Body**: `{ "type": "income|expense", "amount": 5000, "category", "description", "studentId", "trainerId" }`
- **Ответ**: объект транзакции

#### PUT /api/data/transactions/:id

- **Auth**: да
- **Body**: `{ "type", "amount", "category", "description" }`
- **Ответ**: `{ "ok": true }`

#### DELETE /api/data/transactions/:id

- **Auth**: да
- **Ответ**: `{ "ok": true }`

---

### Турниры

#### POST /api/data/tournaments

- **Auth**: да
- **Body**: `{ "title", "date", "location", "description", "coverImage" }`
- **Ответ**: объект турнира

#### PUT /api/data/tournaments/:id

- **Auth**: да
- **Body**: `{ "title", "date", "location", "description", "coverImage" }`
- **Ответ**: `{ "ok": true }`

#### DELETE /api/data/tournaments/:id

Удаление турнира (каскадно удаляет регистрации).

- **Auth**: да
- **Ответ**: `{ "ok": true }`

---

### Регистрации на турниры

#### POST /api/data/tournament-registrations

- **Auth**: да
- **Body**: `{ "tournamentId", "studentId" }`
- **Ответ**: `{ "ok": true }`

#### DELETE /api/data/tournament-registrations

- **Auth**: да
- **Body**: `{ "tournamentId", "studentId" }`
- **Ответ**: `{ "ok": true }`

---

### Посещаемость

#### POST /api/data/attendance

Отметить одного ученика.

- **Auth**: да
- **Body**: `{ "groupId", "studentId", "date": "2026-04-17", "present": true }`
- **Ответ**: объект посещаемости

#### POST /api/data/attendance/bulk

Массовая отметка посещаемости.

- **Auth**: да
- **Body**: `{ "groupId", "date", "records": [{ "studentId", "present": true }] }`
- **Ответ**: `{ "ok": true }`

#### DELETE /api/data/attendance

- **Auth**: да
- **Body**: `{ "groupId", "studentId", "date" }`
- **Ответ**: `{ "ok": true }`

---

### Новости

#### POST /api/data/news

- **Auth**: да
- **Body**: `{ "title", "content", "groupId", "trainerId" }`
- **Ответ**: объект новости

#### DELETE /api/data/news/:id

- **Auth**: да
- **Ответ**: `{ "ok": true }`

---

### Тренеры (superadmin)

#### POST /api/data/trainers

- **Auth**: да (superadmin)
- **Body**: `{ "name", "phone", "password", "clubName", "avatar", "sportType", "sportTypes": [], "city" }`
- **Ответ**: объект тренера с `plainPassword`

#### PUT /api/data/trainers/:id

- **Auth**: да
- **Body**: `{ "name", "phone", "clubName", "avatar", "sportType", "sportTypes", "city", "password", "materialCategories" }`
- **Ответ**: `{ "ok": true }`

#### DELETE /api/data/trainers/:id

Каскадное удаление тренера (новости, транзакции, ученики, группы).

- **Auth**: да (superadmin)
- **Ответ**: `{ "ok": true }`

---

### Внутренние турниры

#### POST /api/data/internal-tournaments

- **Auth**: да
- **Body**: `{ "title", "date", "brackets": {}, "sportType", "coverImage" }`
- **Ответ**: объект внутреннего турнира

#### PUT /api/data/internal-tournaments/:id

- **Auth**: да
- **Body**: `{ "title", "date", "status", "brackets", "sportType", "coverImage" }`
- **Ответ**: обновлённый объект

#### DELETE /api/data/internal-tournaments/:id

- **Auth**: да
- **Ответ**: `{ "ok": true }`

---

### Материалы

#### POST /api/data/materials

- **Auth**: да
- **Body**: `{ "title", "description", "videoUrl", "groupIds": [], "trainerId", "category", "customThumb" }`
- **Ответ**: объект материала

#### PUT /api/data/materials/:id

- **Auth**: да
- **Body**: `{ "title", "description", "videoUrl", "groupIds", "category", "customThumb" }`
- **Ответ**: `{ "ok": true }`

#### DELETE /api/data/materials/:id

- **Auth**: да
- **Ответ**: `{ "ok": true }`

---

### Клубы (superadmin)

#### POST /api/data/clubs

- **Auth**: да (superadmin)
- **Body**: `{ "name", "city", "sportTypes": [], "headTrainerId" }`
- **Ответ**: объект клуба

#### PUT /api/data/clubs/:id

- **Auth**: да
- **Body**: `{ "name", "city", "sportTypes", "headTrainerId" }`
- **Ответ**: `{ "ok": true }`

#### DELETE /api/data/clubs/:id

- **Auth**: да (superadmin)
- **Ответ**: `{ "ok": true }`

#### POST /api/data/clubs/:id/trainers

Привязать тренера к клубу.

- **Auth**: да
- **Body**: `{ "trainerId" }`
- **Ответ**: `{ "ok": true }`

#### DELETE /api/data/clubs/:id/trainers/:trainerId

Открепить тренера от клуба.

- **Auth**: да
- **Ответ**: `{ "ok": true }`

---

### Заявки на регистрацию (superadmin)

#### GET /api/data/registrations

Список всех заявок.

- **Auth**: да (superadmin)
- **Ответ**: массив заявок с расшифрованным `plainPassword`

#### POST /api/data/registrations/:id/approve

Одобрить заявку (создаёт тренера).

- **Auth**: да (superadmin)
- **Ответ**: `{ "ok": true, "trainerId": "id" }`

#### POST /api/data/registrations/:id/reject

Отклонить заявку.

- **Auth**: да (superadmin)
- **Ответ**: `{ "ok": true }`

---

### Информация об авторе

#### PUT /api/data/author

- **Auth**: да
- **Body**: `{ "name", "instagram", "website", "description", "phone" }`
- **Ответ**: `{ "ok": true }`

---

## Загрузка файлов

### POST /api/upload

Загрузка изображения.

- **Auth**: да
- **Rate limit**: 20 запросов в минуту
- **Content-Type**: `multipart/form-data`
- **Поле**: `file` (только `image/*`, максимум 10 MB)
- **Обработка**: сжатие через Sharp -> WebP (quality 75, max 1200x1200)
- **Ответ**: `{ "url": "/uploads/abc123.webp" }`
- **Ошибки**: 400 (нет файла / не изображение), 413 (превышен размер)

---

## Push-уведомления

### GET /api/push/vapid-key

Публичный ключ VAPID для подписки.

- **Auth**: нет
- **Ответ**: `{ "publicKey": "B..." }`

### POST /api/push/subscribe

Подписка на push-уведомления.

- **Auth**: да
- **Body**:
  ```json
  {
    "subscription": {
      "endpoint": "https://...",
      "keys": { "p256dh": "...", "auth": "..." }
    }
  }
  ```
- **Ответ**: `{ "ok": true }`

### POST /api/push/unsubscribe

Отписка от push-уведомлений.

- **Auth**: да
- **Body**: `{ "endpoint": "https://..." }`
- **Ответ**: `{ "ok": true }`

### GET /api/push/settings

Настройки уведомлений пользователя.

- **Auth**: да
- **Ответ**: `{ "news": true, "tournaments": true, "payments": true, "schedule": true }`

### PUT /api/push/settings

Обновление настроек уведомлений.

- **Auth**: да
- **Body**: `{ "news": true, "tournaments": false, "payments": true, "schedule": true }`
- **Ответ**: `{ "ok": true }`

### POST /api/push/send

Отправка push-уведомления (только trainer/superadmin).

- **Auth**: да (trainer/superadmin)
- **Body**: `{ "title", "body", "url", "userId", "studentId" }`
- **Ответ**: `{ "sent": 3, "results": [{ "endpoint", "success": true }] }`

---

## Health Check

### GET /api/health

Проверка состояния сервера.

- **Auth**: нет
- **Ответ (200)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-04-17T12:00:00.000Z",
    "uptime": 3600,
    "version": "1.0.0",
    "environment": "production",
    "database": { "status": "connected", "responseTime": 5 },
    "memory": { "heapUsed": "45MB", "heapTotal": "60MB", "rss": "80MB" }
  }
  ```
- **Ответ (503)**: `status: "degraded"` — если БД недоступна

---

## Коды ошибок

| Код | Значение |
|-----|----------|
| 200 | Успех |
| 400 | Некорректный запрос (валидация) |
| 401 | Не авторизован (нет/невалидный токен) |
| 403 | Доступ запрещён (нет прав) |
| 413 | Файл слишком большой |
| 429 | Слишком много запросов (rate limit) |
| 500 | Внутренняя ошибка сервера |
| 503 | Сервер работает, но БД недоступна |
