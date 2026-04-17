#!/bin/bash
# iBorcuha VDS deploy script (v1.1.0+)
# Запуск: bash deploy.sh

set -e

BRANCH="${BRANCH:-claude/iborcuha-saas-platform-m8HZw}"
APP_DIR="${APP_DIR:-/root/gbo}"

cd "$APP_DIR"

echo "=== iBorcuha Deploy v1.1.0 ==="

# 1) Проверка обязательных переменных окружения
if [ ! -f .env ]; then
  echo "ОШИБКА: файл .env отсутствует в $APP_DIR"
  echo "Создайте его по шаблону .env.example (см. DEPLOY_PRODUCTION.md)"
  exit 1
fi

# Загружаем .env для проверки
set -a
. ./.env
set +a

for VAR in DATABASE_URL JWT_SECRET ENCRYPTION_KEY; do
  if [ -z "$(eval echo \$$VAR)" ]; then
    echo "ОШИБКА: в .env не задана переменная $VAR"
    echo "См. DEPLOY_PRODUCTION.md — шаг 1"
    exit 1
  fi
done

echo "1. Бэкап БД перед выкатом..."
mkdir -p /root/backups
BACKUP_FILE="/root/backups/iborcuha-$(date +%Y%m%d-%H%M%S).sql"
if command -v pg_dump >/dev/null 2>&1; then
  pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null && \
    echo "   Бэкап: $BACKUP_FILE" || \
    echo "   ПРЕДУПРЕЖДЕНИЕ: бэкап не создан (pg_dump ошибка). Продолжаем."
else
  echo "   ПРЕДУПРЕЖДЕНИЕ: pg_dump не найден. Бэкап пропущен."
fi

echo "2. Загрузка изменений из $BRANCH..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "3. Установка зависимостей..."
rm -rf node_modules
npm install --include=dev

echo "4. Сборка фронтенда..."
npm run build

echo "5. Миграция паролей (AES-256-GCM, идемпотентно)..."
node scripts/migrate-passwords.js || {
  echo "   ПРЕДУПРЕЖДЕНИЕ: миграция завершилась с ошибкой. Проверьте логи."
  echo "   Логин продолжит работать со старыми паролями (обратная совместимость)."
}

echo "6. Перезапуск сервера..."
pm2 restart iborcuha 2>/dev/null || pm2 start ecosystem.config.cjs
pm2 save

echo "7. Smoke-тест..."
sleep 2
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "$HEALTH" = "200" ]; then
  echo "   /api/health: OK (200)"
else
  echo "   ПРЕДУПРЕЖДЕНИЕ: /api/health вернул HTTP $HEALTH"
  echo "   Проверьте: pm2 logs iborcuha --lines 40"
fi

echo ""
echo "=== Деплой завершён ==="
echo "Проверка аудита:  psql \$DATABASE_URL -c \"SELECT * FROM audit_log ORDER BY id DESC LIMIT 5;\""
echo "Логи:             pm2 logs iborcuha"
echo "Статус:           pm2 status"
