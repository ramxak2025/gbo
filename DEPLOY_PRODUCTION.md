# Инструкция по деплою iBorcuha v1.1.0 на production

Пошаговое руководство. Выполняйте строго в указанном порядке.

---

## ⚠️ Перед началом

1. **Сделайте бэкап базы данных** (критично!):
   ```bash
   pg_dump $DATABASE_URL > /backups/iborcuha-$(date +%Y%m%d-%H%M).sql
   ```
2. **Запишите старый `JWT_SECRET`** где-нибудь — он понадобится, если потребуется откат.
3. **Запланируйте окно downtime ~2-5 минут** для миграции паролей.

---

## Шаг 1 — Сгенерировать новые секреты

На любой машине с Node.js:

```bash
# ENCRYPTION_KEY (32 байта hex) — ОБЯЗАТЕЛЕН в v1.1.0
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT_SECRET (если ещё не сгенерирован)
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# VAPID ключи для push (если ещё не настроены)
npx web-push generate-vapid-keys
```

**Сохраните результаты в безопасное место** (password manager, vault).

> ⚠️ **Критично**: `ENCRYPTION_KEY` нельзя менять после установки — иначе зашифрованные пароли в БД перестанут расшифровываться. Если нужно ротировать — сначала мигрируйте данные старым ключом в plain, потом установите новый и запустите миграцию заново.

---

## Шаг 2 — Обновить переменные окружения

### Vercel (веб UI или CLI)

```bash
vercel env add ENCRYPTION_KEY production
# Вставьте значение, сгенерированное на шаге 1
```

Проверьте что установлены:
- `DATABASE_URL` — PostgreSQL (Neon/Supabase)
- `JWT_SECRET` — существующий (если меняете — пользователи будут разлогинены)
- `ENCRYPTION_KEY` — **новое, обязательно**
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — если используете push
- `CORS_ORIGIN=https://ваш-домен.ru` — для production
- `NODE_ENV=production`

### VDS (self-hosted)

Отредактируйте `/var/www/iborcuha/.env`:

```ini
DATABASE_URL=postgresql://iborcuha:YOUR_PASS@localhost:5432/iborcuha
JWT_SECRET=<существующий или новый>
ENCRYPTION_KEY=<сгенерированный на шаге 1>
VAPID_PUBLIC_KEY=<ваш>
VAPID_PRIVATE_KEY=<ваш>
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://ваш-домен.ru
```

Права доступа:
```bash
chmod 600 /var/www/iborcuha/.env
chown www-data:www-data /var/www/iborcuha/.env
```

---

## Шаг 3 — Выкатить код

### Vercel
Мерж в `main` триггерит авто-деплой. Либо вручную:
```bash
vercel --prod
```

### VDS
```bash
cd /var/www/iborcuha
git fetch origin
git checkout main
git pull origin main
npm install --production=false   # нужны dev deps для билда
npm run build
```

**Пока не запускайте** `pm2 restart` — сперва миграция паролей (шаг 4).

---

## Шаг 4 — Миграция старых паролей (ОБЯЗАТЕЛЬНО)

До v1.1.0 `plain_password` хранился открытым текстом. Новый код сохраняет шифрованным (AES-256-GCM). Декриптор безопасен — для plain-текста вернёт его as-is, поэтому **логин НЕ сломается**, но новые пароли будут шифрованными, а старые останутся открытыми. Миграция приведёт БД к единому формату.

```bash
cd /var/www/iborcuha                       # VDS
# или локально, если Vercel — подключитесь к production БД через DATABASE_URL в .env

# 1) Dry-run — посмотреть, что будет сделано:
node scripts/migrate-passwords.js --dry-run

# 2) Реальная миграция:
node scripts/migrate-passwords.js
```

Ожидаемый вывод:
```
iBorcuha: миграция паролей v1.0.x → v1.1.0 (AES-256-GCM)
Миграция таблиц:
  users: мигрировано N, пропущено 0
  students: мигрировано N, пропущено 0
  pending_registrations: мигрировано N, пропущено 0
ИТОГО: мигрировано N, пропущено 0
✓ Миграция завершена успешно.
```

**Скрипт идемпотентен** — можно запускать повторно, уже зашифрованные записи пропустятся.

---

## Шаг 5 — Перезапустить сервер

### Vercel
Происходит автоматически после выката.

### VDS
```bash
pm2 restart iborcuha
pm2 logs iborcuha --lines 40      # проверьте что нет ошибок
```

Первый запуск сам применит миграцию схемы (`CREATE TABLE audit_log`, `ALTER COLUMN plain_password TYPE VARCHAR(512)`) — всё идемпотентно через `IF NOT EXISTS` и `DO $$ ... EXCEPTION $$`.

---

## Шаг 6 — Smoke-тесты

```bash
# 1) Health check
curl https://ваш-домен.ru/api/health
# Должен вернуть: {"status":"ok","database":{"status":"connected",...}}

# 2) Проверка security headers
curl -I https://ваш-домен.ru/api/health | grep -iE "x-content-type|x-frame|strict-transport"

# 3) Проверка rate-limit (должен отдать 429 после 20 попыток за 15 мин)
for i in {1..25}; do
  curl -s -o /dev/null -w "%{http_code} " -X POST https://ваш-домен.ru/api/auth/login \
    -H "Content-Type: application/json" -d '{"phone":"1","password":"1"}'
done
```

Ручные проверки:
- [ ] Войти как суперадмин — пароль существующий
- [ ] Войти как тренер — пароль существующий
- [ ] Войти как спортсмен — пароль существующий
- [ ] Создать тренера, проверить что `plainPassword` показывается суперадмину
- [ ] Проверить в БД: `SELECT LEFT(plain_password, 30) FROM users LIMIT 3` — должны быть в формате `base64:base64:...`
- [ ] Отметить посещаемость
- [ ] Push-уведомление (если настроены VAPID)

---

## Шаг 7 — Проверить audit log

```sql
-- Последние 20 событий
SELECT action, user_id, ip_address, created_at
FROM audit_log
ORDER BY id DESC
LIMIT 20;

-- Неудачные попытки логина за сутки
SELECT ip_address, COUNT(*) as attempts
FROM audit_log
WHERE action = 'login_failed' AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY attempts DESC;
```

---

## Откат (rollback)

Если что-то пошло не так:

```bash
# VDS
cd /var/www/iborcuha
git log --oneline -5                 # найдите предыдущий коммит
git checkout <prev-sha>
npm install && npm run build
pm2 restart iborcuha

# Восстановить БД из бэкапа (если нужно)
psql $DATABASE_URL < /backups/iborcuha-YYYYMMDD-HHMM.sql
```

Старые пароли в plain остаются совместимыми — крипто-декодер вернёт plain-строку как есть.

---

## Что нового в v1.1.0

**Безопасность:**
- Helmet HTTP headers
- Rate limiting: 20 попыток логина/15мин, 200 API запросов/мин, 20 загрузок/мин
- AES-256-GCM шифрование паролей в БД
- Санитизация входных данных (XSS-защита)
- Audit log — все POST/PUT/DELETE + логины пишутся в таблицу `audit_log`
- Глобальный error handler
- Валидация телефонов/паролей/полей

**Производительность:**
- Code splitting (React.lazy): бандл 501kB → 281kB (−44%)
- ErrorBoundary — защита от крашей UI

**Надёжность:**
- `/api/health` — мониторинг для uptime-трекера
- `asyncHandler` — async-ошибки больше не проваливаются молча
- 57 Vitest-тестов на middleware

---

## Быстрая шпаргалка — что положить в переменные окружения

| Переменная | Обязательно | Пример значения | Описание |
|-----------|-------------|-----------------|----------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/db` | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | 64+ hex | Ключ JWT-подписи |
| `ENCRYPTION_KEY` | ✅ **(новое)** | 64 hex (32 байта) | AES-256-GCM ключ для паролей |
| `PORT` | — | `3000` | Порт сервера |
| `NODE_ENV` | рекомендуется | `production` | Режим Node.js |
| `CORS_ORIGIN` | рекомендуется | `https://iborcuha.ru` | Разрешённый origin |
| `VAPID_PUBLIC_KEY` | если push | base64url | Публичный VAPID |
| `VAPID_PRIVATE_KEY` | если push | base64url | Приватный VAPID |
| `DB_SSL` | редко | `true` | Принудительный SSL для БД |

---

Готово. Если smoke-тесты прошли и audit_log заполняется — деплой успешен.
