import bcrypt from 'bcryptjs'
import pool from './db.js'

const DEMO_TRAINER_ID = 'demo-trainer-1'
const DEMO_STUDENT_PREFIX = 'demo-s'
const DEMO_GROUP_PREFIX = 'demo-g'

const hash = (pw) => bcrypt.hashSync(pw, 10)

async function clearDemoData() {
  // Delete in order to respect FK constraints
  await pool.query(`DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE is_demo = true)`)
  await pool.query(`DELETE FROM tournament_registrations WHERE student_id IN (SELECT id FROM students WHERE is_demo = true)`)
  await pool.query(`DELETE FROM news WHERE trainer_id = $1`, [DEMO_TRAINER_ID])
  await pool.query(`DELETE FROM transactions WHERE trainer_id = $1`, [DEMO_TRAINER_ID])
  await pool.query(`DELETE FROM internal_tournaments WHERE trainer_id = $1`, [DEMO_TRAINER_ID])
  await pool.query(`DELETE FROM students WHERE trainer_id = $1`, [DEMO_TRAINER_ID])
  await pool.query(`DELETE FROM groups WHERE trainer_id = $1`, [DEMO_TRAINER_ID])
  await pool.query(`DELETE FROM users WHERE id = $1`, [DEMO_TRAINER_ID])
}

async function seedDemoData() {
  const now = new Date().toISOString()
  const inMonth = new Date(Date.now() + 30 * 86400000).toISOString()
  const expired = new Date(Date.now() - 5 * 86400000).toISOString()

  // Demo trainer
  await pool.query(
    `INSERT INTO users (id, name, phone, password_hash, role, club_name, sport_type, city, is_demo, plain_password)
     VALUES ($1, 'Демо Тренер', '89999999999', $2, 'trainer', 'Demo Fight Club', 'bjj', 'Москва', true, 'demo123')
     ON CONFLICT (id) DO NOTHING`,
    [DEMO_TRAINER_ID, hash('demo123')]
  )

  // Demo groups
  await pool.query(`
    INSERT INTO groups (id, trainer_id, name, schedule, subscription_cost, attendance_enabled) VALUES
    ('${DEMO_GROUP_PREFIX}1', '${DEMO_TRAINER_ID}', 'Утро BJJ', 'Пн, Ср, Пт — 09:00', 5000, true),
    ('${DEMO_GROUP_PREFIX}2', '${DEMO_TRAINER_ID}', 'Вечер No-Gi', 'Вт, Чт — 19:00', 6000, false)
    ON CONFLICT DO NOTHING
  `)

  // Demo students
  const sPw = hash('demo123')
  await pool.query(`
    INSERT INTO students (id, trainer_id, group_id, name, phone, password_hash, weight, belt, birth_date, subscription_expires_at, status, training_start_date, is_demo, plain_password, created_at) VALUES
    ('${DEMO_STUDENT_PREFIX}1', '${DEMO_TRAINER_ID}', '${DEMO_GROUP_PREFIX}1', 'Иван Петров', '89990000001', $1, 77, 'Синий', '2000-03-15', $2, NULL, '2024-01-15', true, 'demo123', $4),
    ('${DEMO_STUDENT_PREFIX}2', '${DEMO_TRAINER_ID}', '${DEMO_GROUP_PREFIX}1', 'Алексей Сидоров', '89990000002', $1, 84, 'Белый', '1998-07-22', $3, NULL, '2025-06-01', true, 'demo123', $4),
    ('${DEMO_STUDENT_PREFIX}3', '${DEMO_TRAINER_ID}', '${DEMO_GROUP_PREFIX}1', 'Максим Козлов', '89990000003', $1, 68, 'Фиолетовый', '2001-11-01', $2, 'injury', '2023-09-10', true, 'demo123', $4),
    ('${DEMO_STUDENT_PREFIX}4', '${DEMO_TRAINER_ID}', '${DEMO_GROUP_PREFIX}2', 'Дмитрий Волков', '89990000004', $1, 93, 'Синий', '1999-05-20', $2, NULL, '2024-03-01', true, 'demo123', $4),
    ('${DEMO_STUDENT_PREFIX}5', '${DEMO_TRAINER_ID}', '${DEMO_GROUP_PREFIX}2', 'Артём Кузнецов', '89990000005', $1, 70, 'Белый', '2003-08-12', $3, 'sick', '2025-09-15', true, 'demo123', $4)
    ON CONFLICT DO NOTHING
  `, [sPw, inMonth, expired, now])

  // Demo transactions
  await pool.query(`
    INSERT INTO transactions (id, trainer_id, type, amount, category, description, student_id, date) VALUES
    ('demo-t1', '${DEMO_TRAINER_ID}', 'income', 5000, 'Абонемент', 'Оплата — Иван Петров', '${DEMO_STUDENT_PREFIX}1', $1),
    ('demo-t2', '${DEMO_TRAINER_ID}', 'income', 6000, 'Абонемент', 'Оплата — Дмитрий Волков', '${DEMO_STUDENT_PREFIX}4', $1),
    ('demo-t3', '${DEMO_TRAINER_ID}', 'expense', 15000, 'Аренда', 'Аренда зала — февраль', NULL, $1),
    ('demo-t4', '${DEMO_TRAINER_ID}', 'income', 5000, 'Абонемент', 'Оплата — Максим Козлов', '${DEMO_STUDENT_PREFIX}3', $1)
    ON CONFLICT DO NOTHING
  `, [now])

  // Demo news
  await pool.query(`
    INSERT INTO news (id, trainer_id, group_id, title, content, date) VALUES
    ('demo-n1', '${DEMO_TRAINER_ID}', '${DEMO_GROUP_PREFIX}1', 'Открытая тренировка', 'В субботу в 12:00 приглашаем всех на открытый мат!', $1),
    ('demo-n2', '${DEMO_TRAINER_ID}', NULL, 'Новый год — новые цели!', 'Ставьте цели и двигайтесь к ним. Всем удачных тренировок!', $1)
    ON CONFLICT DO NOTHING
  `, [now])

  // Demo attendance (last 5 days for group 1)
  const today = new Date()
  for (let d = 1; d <= 5; d++) {
    const date = new Date(today)
    date.setDate(date.getDate() - d)
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()
    // Only Mon, Wed, Fri for group 1
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
      for (let si = 1; si <= 3; si++) {
        const present = !(si === 3 && d === 1) // s3 absent on most recent day
        await pool.query(
          `INSERT INTO attendance (id, group_id, student_id, date, present)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
          [`demo-att-${d}-${si}`, `${DEMO_GROUP_PREFIX}1`, `${DEMO_STUDENT_PREFIX}${si}`, dateStr, present]
        )
      }
    }
  }
}

export async function resetDemoData() {
  console.log('Resetting demo data...')
  try {
    await clearDemoData()
    await seedDemoData()
    console.log('Demo data reset successfully')
  } catch (err) {
    console.error('Demo data reset failed:', err)
  }
}

// Check if we need to reset (once per day)
let lastResetDate = null

export async function checkDemoReset() {
  const today = new Date().toISOString().split('T')[0]
  if (lastResetDate === today) return

  // Check if demo trainer exists
  const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [DEMO_TRAINER_ID])
  if (rows.length === 0) {
    // First time — seed demo data
    await seedDemoData()
  } else {
    // Reset daily
    await clearDemoData()
    await seedDemoData()
  }
  lastResetDate = today
}
