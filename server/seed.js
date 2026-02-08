import bcrypt from 'bcryptjs'
import pool from './db.js'

export async function seedDatabase() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM users')
  if (parseInt(rows[0].count) > 0) {
    console.log('Database already seeded, skipping')
    return
  }

  console.log('Seeding database...')
  const hash = (pw) => bcrypt.hashSync(pw, 10)
  const now = new Date().toISOString()
  const inMonth = new Date(Date.now() + 30 * 86400000).toISOString()
  const expired = new Date(Date.now() - 5 * 86400000).toISOString()

  // Users
  await pool.query(`
    INSERT INTO users (id, name, phone, password_hash, role, club_name) VALUES
    ('u1', 'Администратор', '+7 900 000-00-00', $1, 'superadmin', 'iBorcuha HQ'),
    ('u2', 'Рустам Хабилов', '+7 900 111-11-11', $2, 'trainer', 'Ахмат Fight Club'),
    ('u3', 'Камил Гаджиев', '+7 900 222-22-22', $3, 'trainer', 'Eagle MMA')
  `, [hash('admin123'), hash('trainer123'), hash('trainer123')])

  // Groups
  await pool.query(`
    INSERT INTO groups (id, trainer_id, name, schedule, subscription_cost) VALUES
    ('g1', 'u2', 'Утро 09:00', 'Пн, Ср, Пт — 09:00', 5000),
    ('g2', 'u2', 'Вечер 19:00', 'Пн, Ср, Пт — 19:00', 6000),
    ('g3', 'u3', 'Основная', 'Вт, Чт, Сб — 18:00', 5500)
  `)

  // Students
  const studentHash = hash('student123')
  await pool.query(`
    INSERT INTO students (id, trainer_id, group_id, name, phone, password_hash, weight, belt, birth_date, subscription_expires_at, status, created_at) VALUES
    ('s1', 'u2', 'g1', 'Алихан Магомедов', '+7 900 301-01-01', $1, 77, 'Синий', '2000-03-15', $2, NULL, $4),
    ('s2', 'u2', 'g1', 'Тимур Валиев', '+7 900 302-02-02', $1, 84, 'Фиолетовый', '1998-07-22', $3, 'injury', $4),
    ('s3', 'u2', 'g2', 'Заур Рахманов', '+7 900 303-03-03', $1, 93, 'Белый', '2002-11-01', $2, NULL, $4),
    ('s4', 'u3', 'g3', 'Магомед Исмаилов', '+7 900 304-04-04', $1, 93, 'Коричневый', '1995-01-10', $2, NULL, $4),
    ('s5', 'u3', 'g3', 'Ислам Махачев', '+7 900 305-05-05', $1, 70, 'Черный', '1991-09-27', $3, 'sick', $4)
  `, [studentHash, inMonth, expired, now])

  // Transactions
  await pool.query(`
    INSERT INTO transactions (id, trainer_id, type, amount, category, description, student_id, date) VALUES
    ('t1', 'u2', 'income', 5000, 'Абонемент', 'Оплата — Алихан Магомедов', 's1', $1),
    ('t2', 'u2', 'expense', 15000, 'Аренда', 'Аренда зала — январь', NULL, $1),
    ('t3', 'u3', 'income', 5500, 'Абонемент', 'Оплата — Магомед Исмаилов', 's4', $1)
  `, [now])

  // Tournaments
  await pool.query(`
    INSERT INTO tournaments (id, title, date, location, description, created_by) VALUES
    ('tour1', 'ADCC Moscow Open 2026', '2026-04-15', 'Москва, СК "Лужники"', 'Открытый турнир по грэпплингу по правилам ADCC. Весовые категории: 66, 77, 88, 99, +99 кг.', 'u1'),
    ('tour2', 'BJJ Pro Championship', '2026-05-20', 'Санкт-Петербург, Юбилейный', 'Профессиональный чемпионат по бразильскому джиу-джитсу. Gi и No-Gi дивизионы.', 'u1')
  `)

  // News
  await pool.query(`
    INSERT INTO news (id, trainer_id, group_id, title, content, date) VALUES
    ('n1', 'u2', 'g1', 'Смена расписания', 'С 1 марта тренировки по понедельникам переносятся на 10:00.', $1),
    ('n2', 'u3', 'g3', 'Открытый мат', 'В субботу проводим открытую тренировку. Можно приглашать друзей!', $1)
  `, [now])

  // Author info
  await pool.query(`
    INSERT INTO author_info (id, name, instagram, website, description, phone) VALUES
    (1, 'Шамсудинов Рамазан Магомедович', 'ramazan.spb', 'web-kultura.ru', 'Разработка веб-приложений и цифровых решений для спорта и бизнеса.', '8-988-444-44-36')
  `)

  console.log('Database seeded successfully')
}
