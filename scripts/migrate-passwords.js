#!/usr/bin/env node
/**
 * iBorcuha Password Migration Script (v1.0.x → v1.1.0)
 *
 * Шифрует колонки plain_password в таблицах users, students, pending_registrations
 * с использованием AES-256-GCM. После v1.1.0 код ожидает зашифрованные значения,
 * и показ пароля суперадмину вызывает decrypt() — без миграции показ не сломается
 * (функция возвращает исходную строку при невалидном формате), но новые пароли
 * сохраняются зашифрованными. Этот скрипт приводит БД к единому формату.
 *
 * ИСПОЛЬЗОВАНИЕ:
 *   1. Убедитесь что в .env заданы DATABASE_URL и ENCRYPTION_KEY
 *   2. Сделайте бэкап БД: pg_dump ... > backup.sql
 *   3. Запустите: node scripts/migrate-passwords.js
 *   4. (Dry-run для проверки:) node scripts/migrate-passwords.js --dry-run
 *
 * БЕЗОПАСНО ДЛЯ ПОВТОРНОГО ЗАПУСКА: скрипт пропускает уже зашифрованные записи.
 */

import 'dotenv/config'
import pool from '../server/db.js'
import { encrypt } from '../server/middleware/crypto.js'

const DRY_RUN = process.argv.includes('--dry-run')

// Формат зашифрованной строки: base64(iv):base64(authTag):base64(ciphertext)
// Длина IV = 16 байт → 24 base64 символа. Длина authTag = 16 байт → 24 base64 символа.
function isAlreadyEncrypted(value) {
  if (!value || typeof value !== 'string') return false
  const parts = value.split(':')
  if (parts.length !== 3) return false
  // Валидная base64 без пробелов для всех трёх частей
  const b64 = /^[A-Za-z0-9+/]+=*$/
  if (parts[0].length !== 24 || !b64.test(parts[0])) return false
  if (parts[1].length !== 24 || !b64.test(parts[1])) return false
  if (!b64.test(parts[2])) return false
  return true
}

async function migrateTable(table, idColumn = 'id') {
  const { rows } = await pool.query(
    `SELECT ${idColumn} AS id, plain_password FROM ${table} WHERE plain_password IS NOT NULL AND plain_password != ''`
  )

  let migrated = 0
  let skipped = 0

  for (const row of rows) {
    if (isAlreadyEncrypted(row.plain_password)) {
      skipped++
      continue
    }
    const encrypted = encrypt(row.plain_password)
    if (!DRY_RUN) {
      await pool.query(
        `UPDATE ${table} SET plain_password = $1 WHERE ${idColumn} = $2`,
        [encrypted, row.id]
      )
    }
    migrated++
  }

  console.log(`  ${table}: мигрировано ${migrated}, пропущено (уже зашифровано) ${skipped}`)
  return { migrated, skipped }
}

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('ОШИБКА: DATABASE_URL не задана. Проверьте .env')
    process.exit(1)
  }
  if (!process.env.ENCRYPTION_KEY && !process.env.JWT_SECRET) {
    console.error('ОШИБКА: ENCRYPTION_KEY (или JWT_SECRET) не задана. Проверьте .env')
    process.exit(1)
  }

  console.log('='.repeat(60))
  console.log('iBorcuha: миграция паролей v1.0.x → v1.1.0 (AES-256-GCM)')
  console.log('='.repeat(60))
  if (DRY_RUN) console.log('РЕЖИМ: DRY-RUN (изменения НЕ сохраняются)')
  else console.log('РЕЖИМ: PRODUCTION (изменения будут сохранены)')
  console.log()

  try {
    console.log('Миграция таблиц:')
    const results = {
      users: await migrateTable('users'),
      students: await migrateTable('students'),
      pending_registrations: await migrateTable('pending_registrations'),
    }

    const total = Object.values(results).reduce((a, r) => a + r.migrated, 0)
    const totalSkipped = Object.values(results).reduce((a, r) => a + r.skipped, 0)

    console.log()
    console.log('='.repeat(60))
    console.log(`ИТОГО: мигрировано ${total}, пропущено ${totalSkipped}`)
    console.log('='.repeat(60))

    if (DRY_RUN) {
      console.log('Это был DRY-RUN. Запустите без --dry-run для применения.')
    } else if (total > 0) {
      console.log('✓ Миграция завершена успешно.')
    } else {
      console.log('✓ Ничего не нужно было мигрировать (все пароли уже зашифрованы).')
    }
  } catch (err) {
    console.error('ОШИБКА миграции:', err.message)
    console.error('Откатите изменения через бэкап БД.')
    process.exit(1)
  } finally {
    await pool.end()
  }
}

run()
